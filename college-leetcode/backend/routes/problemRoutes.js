const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all problems with filters and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      difficulty,
      category,
      search,
      company,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = {};
    
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (company) {
      filter.companies = company;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const problems = await Problem.find(filter)
      .populate('companies', 'name logo')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-solution -testCases');

    const totalProblems = await Problem.countDocuments(filter);

    // If user is authenticated, get their submission status
    let problemsWithStatus = problems;
    if (req.user) {
      const userSubmissions = await Submission.find({
        user: req.user._id,
        problem: { $in: problems.map(p => p._id) },
        status: 'accepted'
      }).distinct('problem');

      problemsWithStatus = problems.map(problem => ({
        ...problem.toObject(),
        solved: userSubmissions.includes(problem._id.toString())
      }));
    }

    res.json({
      problems: problemsWithStatus,
      currentPage: page,
      totalPages: Math.ceil(totalProblems / limit),
      totalProblems
    });

  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ message: 'Error fetching problems' });
  }
});

// Get single problem by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('companies', 'name logo')
      .populate('createdBy', 'name');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Get user's submissions for this problem
    const submissions = await Submission.find({
      user: req.user._id,
      problem: problem._id
    }).sort('-submittedAt').limit(10);

    // Remove hidden test cases from response
    const problemResponse = problem.toObject();
    problemResponse.testCases = problemResponse.testCases.filter(tc => !tc.isHidden);

    res.json({
      problem: problemResponse,
      submissions,
      solved: submissions.some(s => s.status === 'accepted')
    });

  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ message: 'Error fetching problem' });
  }
});

// Get problem categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Problem.distinct('category');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get problem statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalProblems = await Problem.countDocuments();
    const solvedProblems = req.user.solvedProblems.length;
    
    const difficultyCounts = await Problem.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    const userSolvedByDifficulty = await Problem.aggregate([
      {
        $match: {
          _id: { $in: req.user.solvedProblems.map(sp => sp.problem) }
        }
      },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalProblems,
      solvedProblems,
      difficultyCounts,
      userSolvedByDifficulty,
      solvingRate: totalProblems > 0 ? (solvedProblems / totalProblems * 100).toFixed(2) : 0
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;