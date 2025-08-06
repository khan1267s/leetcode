const express = require('express');
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all companies
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const companies = await Company.find(filter)
      .sort('name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('name logo description tags placedStudents');

    const totalCompanies = await Company.countDocuments(filter);

    // Add student count for each company
    const companiesWithStats = companies.map(company => ({
      ...company.toObject(),
      placedStudentCount: company.placedStudents.length
    }));

    res.json({
      companies: companiesWithStats,
      currentPage: page,
      totalPages: Math.ceil(totalCompanies / limit),
      totalCompanies
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

// Get single company details
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate({
        path: 'placedStudents.user',
        select: 'name batch linkedinProfile'
      })
      .populate({
        path: 'problems',
        select: 'title difficulty category'
      })
      .populate({
        path: 'preparationTips.author',
        select: 'name batch'
      });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Error fetching company details' });
  }
});

// Add preparation tip for a company (for placed students)
router.post('/:id/tips', auth, [
  body('content').notEmpty().withMessage('Content is required'),
  body('resources').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if user is placed in this company
    const isPlacedStudent = company.placedStudents.some(
      student => student.user.toString() === req.user._id.toString()
    );

    if (!isPlacedStudent && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Only students placed in this company can add tips' 
      });
    }

    const { content, resources = [] } = req.body;

    company.preparationTips.push({
      author: req.user._id,
      content,
      resources
    });

    await company.save();

    res.status(201).json({
      message: 'Preparation tip added successfully',
      company
    });

  } catch (error) {
    console.error('Add tip error:', error);
    res.status(500).json({ message: 'Error adding preparation tip' });
  }
});

// Get problems asked by a company
router.get('/:id/problems', async (req, res) => {
  try {
    const { difficulty, category, page = 1, limit = 20 } = req.query;

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const filter = {
      _id: { $in: company.problems }
    };

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (category) {
      filter.category = category;
    }

    const problems = await Problem.find(filter)
      .select('-solution -testCases')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalProblems = await Problem.countDocuments(filter);

    res.json({
      problems,
      currentPage: page,
      totalPages: Math.ceil(totalProblems / limit),
      totalProblems
    });

  } catch (error) {
    console.error('Get company problems error:', error);
    res.status(500).json({ message: 'Error fetching company problems' });
  }
});

// Get placed students of a company
router.get('/:id/students', async (req, res) => {
  try {
    const { batch, page = 1, limit = 20 } = req.query;

    const company = await Company.findById(req.params.id)
      .populate({
        path: 'placedStudents.user',
        select: 'name batch linkedinProfile college'
      });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    let students = company.placedStudents;

    // Filter by batch if specified
    if (batch) {
      students = students.filter(student => student.batch === batch);
    }

    // Pagination
    const totalStudents = students.length;
    const paginatedStudents = students.slice((page - 1) * limit, page * limit);

    res.json({
      students: paginatedStudents,
      currentPage: page,
      totalPages: Math.ceil(totalStudents / limit),
      totalStudents
    });

  } catch (error) {
    console.error('Get placed students error:', error);
    res.status(500).json({ message: 'Error fetching placed students' });
  }
});

// Download resources for a company
router.get('/:id/resources/:resourceId/download', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Find the resource in preparation tips
    let resource = null;
    for (const tip of company.preparationTips) {
      resource = tip.resources.find(r => r._id.toString() === req.params.resourceId);
      if (resource) break;
    }

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // If it's a file URL, redirect to it
    if (resource.url) {
      res.redirect(resource.url);
    } else {
      res.status(404).json({ message: 'Resource URL not found' });
    }

  } catch (error) {
    console.error('Download resource error:', error);
    res.status(500).json({ message: 'Error downloading resource' });
  }
});

module.exports = router;