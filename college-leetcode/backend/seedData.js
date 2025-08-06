const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load models
const User = require('./models/User');
const Problem = require('./models/Problem');
const Company = require('./models/Company');

// Load environment variables
dotenv.config();

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'john@college.edu',
    password: 'student123',
    role: 'student',
    college: 'ABC Engineering College',
    batch: '2024',
    linkedinProfile: 'https://linkedin.com/in/johndoe',
    company: 'Google'
  },
  {
    name: 'Jane Smith',
    email: 'jane@college.edu',
    password: 'student123',
    role: 'student',
    college: 'XYZ Institute of Technology',
    batch: '2023',
    linkedinProfile: 'https://linkedin.com/in/janesmith',
    company: 'Microsoft'
  }
];

const sampleProblems = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'Easy',
    category: 'Array',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
    sampleInput: 'nums = [2,7,11,15], target = 9',
    sampleOutput: '[0,1]',
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: true },
      { input: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true }
    ],
    hints: ['Try using a hash map to store seen values', 'Think about the complement of each number'],
    tags: ['Array', 'Hash Table']
  },
  {
    title: 'Reverse Linked List',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    difficulty: 'Easy',
    category: 'Linked List',
    constraints: 'The number of nodes in the list is in the range [0, 5000].\n-5000 <= Node.val <= 5000',
    sampleInput: 'head = [1,2,3,4,5]',
    sampleOutput: '[5,4,3,2,1]',
    testCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1', isHidden: false },
      { input: '2\n1 2', expectedOutput: '2 1', isHidden: true },
      { input: '0', expectedOutput: '', isHidden: true }
    ],
    hints: ['Try iterative approach with three pointers', 'Can also be solved recursively'],
    tags: ['Linked List', 'Recursion']
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    difficulty: 'Easy',
    category: 'Stack',
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\'\.',
    sampleInput: 's = "()"',
    sampleOutput: 'true',
    testCases: [
      { input: '()', expectedOutput: 'true', isHidden: false },
      { input: '()[]{}', expectedOutput: 'true', isHidden: false },
      { input: '(]', expectedOutput: 'false', isHidden: true },
      { input: '([)]', expectedOutput: 'false', isHidden: true }
    ],
    hints: ['Use a stack to keep track of opening brackets', 'Match each closing bracket with the most recent opening bracket'],
    tags: ['Stack', 'String']
  }
];

const sampleCompanies = [
  {
    name: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    description: 'Leading technology company known for search, cloud computing, and software products.',
    website: 'https://www.google.com',
    interviewProcess: {
      rounds: [
        { name: 'Online Assessment', description: 'Coding problems on HackerRank', type: 'coding' },
        { name: 'Technical Round 1', description: 'Data structures and algorithms', type: 'technical' },
        { name: 'Technical Round 2', description: 'System design and coding', type: 'technical' },
        { name: 'Behavioral Round', description: 'Googleyness and leadership', type: 'hr' }
      ],
      duration: '2-3 weeks',
      difficulty: 'Hard'
    },
    tags: ['Product', 'FAANG']
  },
  {
    name: 'Microsoft',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
    description: 'Global technology corporation developing software, hardware, and cloud services.',
    website: 'https://www.microsoft.com',
    interviewProcess: {
      rounds: [
        { name: 'Online Coding Round', description: 'Codility assessment', type: 'coding' },
        { name: 'Technical Interview 1', description: 'Problem solving and coding', type: 'technical' },
        { name: 'Technical Interview 2', description: 'Advanced algorithms', type: 'technical' },
        { name: 'AA Round', description: 'As Appropriate round with senior manager', type: 'technical' }
      ],
      duration: '3-4 weeks',
      difficulty: 'Medium'
    },
    tags: ['Product', 'Cloud']
  },
  {
    name: 'Infosys',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg',
    description: 'Indian multinational IT services and consulting company.',
    website: 'https://www.infosys.com',
    interviewProcess: {
      rounds: [
        { name: 'Online Test', description: 'Aptitude and coding questions', type: 'coding' },
        { name: 'Technical Interview', description: 'Basic programming concepts', type: 'technical' },
        { name: 'HR Interview', description: 'Behavioral questions', type: 'hr' }
      ],
      duration: '1-2 weeks',
      difficulty: 'Easy'
    },
    tags: ['Service', 'Mass Recruiter']
  },
  {
    name: 'TCS',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg',
    description: 'Indian multinational IT services and consulting company, part of Tata Group.',
    website: 'https://www.tcs.com',
    interviewProcess: {
      rounds: [
        { name: 'TCS NQT', description: 'National Qualifier Test', type: 'coding' },
        { name: 'Technical Interview', description: 'Programming and project discussion', type: 'technical' },
        { name: 'HR Interview', description: 'Final behavioral round', type: 'hr' }
      ],
      duration: '2-3 weeks',
      difficulty: 'Easy'
    },
    tags: ['Service', 'Mass Recruiter']
  }
];

// Seed function
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Problem.deleteMany({});
    await Company.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.name}`);
    }

    // Create companies
    const createdCompanies = [];
    for (const companyData of sampleCompanies) {
      const company = new Company(companyData);
      
      // Add placed students (John to Google, Jane to Microsoft)
      if (company.name === 'Google') {
        company.placedStudents.push({
          user: createdUsers[1]._id,
          batch: '2024',
          role: 'Software Engineer',
          package: '₹45 LPA',
          experience: 'Focus on DSA and system design. Practice daily on LeetCode.'
        });
      } else if (company.name === 'Microsoft') {
        company.placedStudents.push({
          user: createdUsers[2]._id,
          batch: '2023',
          role: 'Software Development Engineer',
          package: '₹42 LPA',
          experience: 'Strong CS fundamentals are key. Practice on GeeksforGeeks.'
        });
      }
      
      await company.save();
      createdCompanies.push(company);
      console.log(`Created company: ${company.name}`);
    }

    // Create problems and associate with companies
    for (const problemData of sampleProblems) {
      const problem = new Problem({
        ...problemData,
        createdBy: createdUsers[0]._id, // Admin user
        companies: createdCompanies.slice(0, 2).map(c => c._id) // Associate with Google and Microsoft
      });
      
      await problem.save();
      
      // Update companies with problem references
      for (const company of createdCompanies.slice(0, 2)) {
        company.problems.push(problem._id);
        await company.save();
      }
      
      console.log(`Created problem: ${problem.title}`);
    }

    // Add preparation tips
    const googleCompany = createdCompanies.find(c => c.name === 'Google');
    if (googleCompany) {
      googleCompany.preparationTips.push({
        author: createdUsers[1]._id,
        content: 'Focus on algorithms and data structures. Practice at least 2 problems daily. System design is crucial for senior roles.',
        resources: [
          {
            title: 'Google Interview Preparation Guide',
            url: 'https://example.com/google-prep.pdf',
            type: 'pdf'
          },
          {
            title: 'System Design Interview Tips',
            url: 'https://example.com/system-design',
            type: 'link'
          }
        ]
      });
      await googleCompany.save();
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@college.edu / admin123');
    console.log('Student: john@college.edu / student123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();