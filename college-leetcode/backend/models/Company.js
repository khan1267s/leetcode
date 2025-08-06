const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  logo: {
    type: String, // URL or file path
    required: true
  },
  description: String,
  website: String,
  preparationTips: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    resources: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['pdf', 'link', 'video', 'document']
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  placedStudents: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    batch: String,
    role: String,
    package: String,
    experience: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  interviewProcess: {
    rounds: [{
      name: String,
      description: String,
      type: {
        type: String,
        enum: ['technical', 'hr', 'group_discussion', 'coding', 'system_design']
      }
    }],
    duration: String,
    difficulty: String
  },
  tags: [String],
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
companySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Company', companySchema);