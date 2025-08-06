const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false
  }
});

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  constraints: {
    type: String,
    required: true
  },
  sampleInput: {
    type: String,
    required: true
  },
  sampleOutput: {
    type: String,
    required: true
  },
  testCases: [testCaseSchema],
  starterCode: {
    c: {
      type: String,
      default: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}'
    },
    cpp: {
      type: String,
      default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}'
    }
  },
  solution: {
    c: String,
    cpp: String
  },
  hints: [String],
  companies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  tags: [String],
  submissionCount: {
    type: Number,
    default: 0
  },
  acceptedCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
problemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for acceptance rate
problemSchema.virtual('acceptanceRate').get(function() {
  if (this.submissionCount === 0) return 0;
  return Math.round((this.acceptedCount / this.submissionCount) * 100);
});

module.exports = mongoose.model('Problem', problemSchema);