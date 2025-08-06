const express = require('express');
const { body, validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const Company = require('../models/Company');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalCompanies,
      recentSubmissions,
      userGrowth
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Problem.countDocuments(),
      Submission.countDocuments(),
      Company.countDocuments(),
      Submission.find()
        .populate('user', 'name email')
        .populate('problem', 'title')
        .sort('-submittedAt')
        .limit(10),
      User.aggregate([
        {
          $match: { role: 'student' }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    res.json({
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalCompanies,
      recentSubmissions,
      userGrowth
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Problem Management

// Create new problem
router.post('/problems', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty'),
  body('category').notEmpty().withMessage('Category is required'),
  body('constraints').notEmpty().withMessage('Constraints are required'),
  body('sampleInput').notEmpty().withMessage('Sample input is required'),
  body('sampleOutput').notEmpty().withMessage('Sample output is required'),
  body('testCases').isArray({ min: 1 }).withMessage('At least one test case is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const problemData = {
      ...req.body,
      createdBy: req.user._id
    };

    const problem = new Problem(problemData);
    await problem.save();

    // If companies are specified, update them
    if (req.body.companies && req.body.companies.length > 0) {
      await Company.updateMany(
        { _id: { $in: req.body.companies } },
        { $push: { problems: problem._id } }
      );
    }

    res.status(201).json({
      message: 'Problem created successfully',
      problem
    });

  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({ message: 'Error creating problem' });
  }
});

// Update problem
router.put('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'difficulty', 'category',
      'constraints', 'sampleInput', 'sampleOutput',
      'testCases', 'starterCode', 'solution', 'hints', 'tags'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        problem[field] = req.body[field];
      }
    });

    await problem.save();

    res.json({
      message: 'Problem updated successfully',
      problem
    });

  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ message: 'Error updating problem' });
  }
});

// Delete problem
router.delete('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Remove problem from companies
    await Company.updateMany(
      { problems: problem._id },
      { $pull: { problems: problem._id } }
    );

    // Delete associated submissions
    await Submission.deleteMany({ problem: problem._id });

    // Remove from users' solved problems
    await User.updateMany(
      { 'solvedProblems.problem': problem._id },
      { $pull: { solvedProblems: { problem: problem._id } } }
    );

    await problem.deleteOne();

    res.json({ message: 'Problem deleted successfully' });

  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ message: 'Error deleting problem' });
  }
});

// Upload test cases in bulk
router.post('/problems/:id/testcases', upload.single('testcases'), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Test cases file is required' });
    }

    // Parse the uploaded file (assuming JSON format)
    const fs = require('fs').promises;
    const fileContent = await fs.readFile(req.file.path, 'utf-8');
    const testCases = JSON.parse(fileContent);

    if (!Array.isArray(testCases)) {
      return res.status(400).json({ message: 'Test cases must be an array' });
    }

    // Add test cases to the problem
    problem.testCases.push(...testCases);
    await problem.save();

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      message: 'Test cases uploaded successfully',
      addedCount: testCases.length
    });

  } catch (error) {
    console.error('Upload test cases error:', error);
    res.status(500).json({ message: 'Error uploading test cases' });
  }
});

// Company Management

// Create new company
router.post('/companies', upload.single('logo'), [
  body('name').notEmpty().withMessage('Company name is required'),
  body('description').optional(),
  body('website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const companyData = {
      name: req.body.name,
      description: req.body.description,
      website: req.body.website,
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    };

    if (req.file) {
      companyData.logo = `/uploads/logos/${req.file.filename}`;
    } else {
      return res.status(400).json({ message: 'Company logo is required' });
    }

    const company = new Company(companyData);
    await company.save();

    res.status(201).json({
      message: 'Company created successfully',
      company
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ message: 'Error creating company' });
  }
});

// Update company
router.put('/companies/:id', upload.single('logo'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Update fields
    if (req.body.name) company.name = req.body.name;
    if (req.body.description) company.description = req.body.description;
    if (req.body.website) company.website = req.body.website;
    if (req.body.tags) company.tags = JSON.parse(req.body.tags);
    if (req.body.interviewProcess) company.interviewProcess = JSON.parse(req.body.interviewProcess);

    if (req.file) {
      company.logo = `/uploads/logos/${req.file.filename}`;
    }

    await company.save();

    res.json({
      message: 'Company updated successfully',
      company
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Error updating company' });
  }
});

// Add placed student to company
router.post('/companies/:id/students', [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('batch').notEmpty().withMessage('Batch is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('package').optional(),
  body('experience').optional()
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

    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if student already added
    const alreadyAdded = company.placedStudents.some(
      student => student.user.toString() === req.body.userId
    );

    if (alreadyAdded) {
      return res.status(400).json({ message: 'Student already added to this company' });
    }

    // Add student to company
    company.placedStudents.push({
      user: req.body.userId,
      batch: req.body.batch,
      role: req.body.role,
      package: req.body.package,
      experience: req.body.experience
    });

    // Update user's company
    user.company = company.name;
    await user.save();

    await company.save();

    res.json({
      message: 'Student added to company successfully',
      company
    });

  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Error adding student to company' });
  }
});

// User Management

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, batch, college, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (batch) filter.batch = batch;
    if (college) filter.college = { $regex: college, $options: 'i' };

    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalUsers = await User.countDocuments(filter);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user submissions
router.get('/users/:id/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.params.id })
      .populate('problem', 'title difficulty')
      .sort('-submittedAt')
      .limit(50);

    const stats = await Submission.aggregate([
      { $match: { user: req.params.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ submissions, stats });

  } catch (error) {
    console.error('Get user submissions error:', error);
    res.status(500).json({ message: 'Error fetching user submissions' });
  }
});

// Update user role
router.patch('/users/:id/role', [
  body('role').isIn(['student', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

module.exports = router;