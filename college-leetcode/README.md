# College LeetCode Platform

A comprehensive coding practice platform designed specifically for college students preparing for technical interviews. Similar to LeetCode but tailored for campus placements with company-specific preparation features.

## 🚀 Features

### Core Features
- **Online Code Editor & Compiler**
  - Support for C and C++ programming languages
  - Real-time code execution with sandboxed environment
  - Syntax highlighting with Monaco Editor
  - Run code against sample test cases
  - Submit solutions for evaluation

- **Question Bank**
  - Categorized coding problems (Easy, Medium, Hard)
  - Problem descriptions with constraints
  - Sample and hidden test cases
  - Hints for problem-solving
  - Track solved problems

- **Admin Dashboard**
  - Secure admin authentication
  - Add/edit/delete problems
  - Upload test cases in bulk
  - Monitor user submissions
  - User management

### Company-Wise Preparation (Unique Feature!)
- **Company Profiles**
  - Display company logos and information
  - Previous years' interview questions
  - Interview process details

- **Placed Students Network**
  - View profiles of seniors placed in companies
  - LinkedIn profiles of placed students
  - Batch and role information
  - Placement packages (if shared)

- **Preparation Resources**
  - Tips and experiences shared by placed students
  - Downloadable resources (PDFs, documents)
  - Company-specific preparation strategies

### User Features
- Student authentication (signup/login)
- Profile management
- Track submission history
- Monitor progress and statistics
- View acceptance rates

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for database
- **JWT** for authentication
- **Docker** for code execution sandboxing
- **Judge0 API** as fallback compiler
- **Multer** for file uploads

### Frontend
- **React** with TypeScript
- **Material-UI** for components
- **Monaco Editor** for code editing
- **React Query** for data fetching
- **React Hook Form** for forms
- **Vite** for fast development

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Docker (optional, for code execution)
- Judge0 API key (optional, as fallback)

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd college-leetcode
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (already created, update values)
# Update the following in .env:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (change to a secure random string)
# - JUDGE0_API_KEY (if using Judge0)

# Start MongoDB (if running locally)
mongod

# Run the backend server
npm run dev
```

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Default Admin Setup

To create an admin account:
1. Sign up as a regular user
2. Access MongoDB and update the user's role to 'admin'
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## 📁 Project Structure

```
college-leetcode/
├── backend/
│   ├── controllers/     # Route controllers
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── middleware/     # Auth, upload middleware
│   ├── services/       # Code execution service
│   ├── utils/          # Utility functions
│   └── server.js       # Express server
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── contexts/   # React contexts
│   │   ├── types/      # TypeScript types
│   │   └── App.tsx     # Main app component
│   └── package.json
└── README.md
```

## 🚀 Key Features Implementation

### Code Execution
- Uses Docker containers for secure code execution
- Fallback to Judge0 API if Docker is unavailable
- Supports C and C++ compilation
- Memory and time limits enforced

### Company Preparation
- Companies can have multiple placed students
- Students can share preparation tips
- Resources can be uploaded and shared
- Interview process tracking

### Problem Management
- Support for multiple test cases
- Hidden test cases for evaluation
- Starter code templates
- Solution tracking

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Sandboxed code execution
- Input validation and sanitization

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update profile

### Problems
- `GET /api/problems` - List problems with filters
- `GET /api/problems/:id` - Get problem details
- `POST /api/submissions/run` - Run code
- `POST /api/submissions/submit` - Submit solution

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Company details
- `POST /api/companies/:id/tips` - Add preparation tip

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `POST /api/admin/problems` - Create problem
- `POST /api/admin/companies` - Create company

## 🎯 Future Enhancements

- Support for more programming languages
- Real-time collaboration features
- Contest/competition mode
- Video solution explanations
- AI-powered hint system
- Mobile app development
- Email notifications
- Social features (follow, compete)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Contact

For any queries or suggestions, please reach out to the development team.

---

**Note**: This platform is designed for educational purposes to help college students prepare for technical interviews. Make sure to comply with your institution's policies when deploying.