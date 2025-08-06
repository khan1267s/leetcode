const express = require('express');
const { body, validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const codeExecutor = require('../services/codeExecutor');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Submit code for a problem
router.post('/submit', auth, [
  body('problemId').isMongoId().withMessage('Valid problem ID required'),
  body('code').notEmpty().withMessage('Code is required'),
  body('language').isIn(['c', 'cpp']).withMessage('Language must be c or cpp')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { problemId, code, language } = req.body;

    // Get problem details
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Create submission
    const submission = new Submission({
      user: req.user._id,
      problem: problemId,
      code,
      language,
      totalTestCases: problem.testCases.length
    });

    await submission.save();

    // Execute code asynchronously
    executeSubmission(submission, problem);

    res.status(202).json({
      message: 'Submission received and is being processed',
      submissionId: submission._id
    });

  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ message: 'Error submitting code' });
  }
});

// Run code without submitting (test run)
router.post('/run', auth, [
  body('problemId').isMongoId().withMessage('Valid problem ID required'),
  body('code').notEmpty().withMessage('Code is required'),
  body('language').isIn(['c', 'cpp']).withMessage('Language must be c or cpp')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { problemId, code, language } = req.body;

    // Get problem details
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Run code with sample test case only
    const sampleTestCase = {
      input: problem.sampleInput,
      expectedOutput: problem.sampleOutput
    };

    const result = await runTestCase(code, language, sampleTestCase);

    res.json({
      success: result.passed,
      output: result.actualOutput,
      expectedOutput: result.expectedOutput,
      error: result.error,
      runtime: result.runtime,
      memory: result.memory
    });

  } catch (error) {
    console.error('Run error:', error);
    res.status(500).json({ message: 'Error running code' });
  }
});

// Get submission status
router.get('/status/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('problem', 'title');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ submission });

  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Error fetching submission' });
  }
});

// Get user's submissions
router.get('/my-submissions', auth, async (req, res) => {
  try {
    const { problemId, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };
    if (problemId) {
      filter.problem = problemId;
    }

    const submissions = await Submission.find(filter)
      .populate('problem', 'title difficulty')
      .sort('-submittedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalSubmissions = await Submission.countDocuments(filter);

    res.json({
      submissions,
      currentPage: page,
      totalPages: Math.ceil(totalSubmissions / limit),
      totalSubmissions
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

// Helper function to execute submission
async function executeSubmission(submission, problem) {
  try {
    const testResults = [];
    let allPassed = true;
    let totalRuntime = 0;
    let maxMemory = 0;

    // Run all test cases
    for (const testCase of problem.testCases) {
      const result = await runTestCase(submission.code, submission.language, testCase);
      
      testResults.push({
        testCaseId: testCase._id,
        passed: result.passed,
        input: !testCase.isHidden ? testCase.input : undefined,
        expectedOutput: !testCase.isHidden ? testCase.expectedOutput : undefined,
        actualOutput: !testCase.isHidden ? result.actualOutput : undefined,
        runtime: result.runtime,
        memory: result.memory
      });

      if (!result.passed) {
        allPassed = false;
        if (!testCase.isHidden) {
          submission.errorMessage = result.error || 'Wrong Answer';
        }
      }

      totalRuntime += result.runtime || 0;
      maxMemory = Math.max(maxMemory, result.memory || 0);
    }

    // Update submission
    submission.status = allPassed ? 'accepted' : 'wrong_answer';
    submission.testResults = testResults;
    submission.testCasesPassed = testResults.filter(r => r.passed).length;
    submission.runtime = totalRuntime;
    submission.memory = maxMemory;
    submission.judgedAt = new Date();

    await submission.save();

    // Update problem statistics
    await Problem.findByIdAndUpdate(problem._id, {
      $inc: {
        submissionCount: 1,
        acceptedCount: allPassed ? 1 : 0
      }
    });

    // Update user's solved problems if accepted
    if (allPassed) {
      await User.findByIdAndUpdate(submission.user, {
        $addToSet: {
          solvedProblems: {
            problem: problem._id,
            solvedAt: new Date()
          }
        }
      });
    }

  } catch (error) {
    console.error('Execute submission error:', error);
    submission.status = 'runtime_error';
    submission.errorMessage = error.message;
    await submission.save();
  }
}

// Helper function to run a single test case
async function runTestCase(code, language, testCase) {
  try {
    // Use Docker-based execution if available, otherwise use Judge0
    const useDocker = process.env.USE_DOCKER !== 'false';
    
    let result;
    if (useDocker) {
      result = await codeExecutor.executeCode(code, language, testCase.input);
    } else {
      result = await codeExecutor.executeWithJudge0(code, language, testCase.input);
    }

    const actualOutput = result.output.trim();
    const expectedOutput = testCase.expectedOutput.trim();
    const passed = actualOutput === expectedOutput;

    return {
      passed,
      actualOutput,
      expectedOutput,
      error: result.error,
      runtime: result.runtime || 0,
      memory: result.memory || 0
    };

  } catch (error) {
    return {
      passed: false,
      actualOutput: '',
      expectedOutput: testCase.expectedOutput,
      error: error.message,
      runtime: 0,
      memory: 0
    };
  }
}

module.exports = router;