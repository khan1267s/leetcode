const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['c', 'cpp'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error'],
    default: 'pending'
  },
  runtime: {
    type: Number, // in milliseconds
    default: 0
  },
  memory: {
    type: Number, // in KB
    default: 0
  },
  testCasesPassed: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  errorMessage: String,
  compilerOutput: String,
  testResults: [{
    testCaseId: String,
    passed: Boolean,
    input: String,
    expectedOutput: String,
    actualOutput: String,
    runtime: Number,
    memory: Number
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  judgedAt: Date
});

// Index for faster queries
submissionSchema.index({ user: 1, problem: 1, submittedAt: -1 });
submissionSchema.index({ problem: 1, status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);