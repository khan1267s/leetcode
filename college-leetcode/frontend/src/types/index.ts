export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  college?: string;
  batch?: string;
  linkedinProfile?: string;
  company?: string;
  solvedProblems: Array<{
    problem: string;
    solvedAt: Date;
  }>;
  createdAt: Date;
}

export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  testCases?: TestCase[];
  starterCode: {
    c: string;
    cpp: string;
  };
  hints?: string[];
  companies: Company[];
  tags: string[];
  submissionCount: number;
  acceptedCount: number;
  acceptanceRate?: number;
  createdAt: Date;
  updatedAt: Date;
  solved?: boolean;
}

export interface TestCase {
  _id?: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Submission {
  _id: string;
  user: string | User;
  problem: string | Problem;
  code: string;
  language: 'c' | 'cpp';
  status: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error';
  runtime: number;
  memory: number;
  testCasesPassed: number;
  totalTestCases: number;
  errorMessage?: string;
  compilerOutput?: string;
  testResults?: TestResult[];
  submittedAt: Date;
  judgedAt?: Date;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  runtime: number;
  memory: number;
}

export interface Company {
  _id: string;
  name: string;
  logo: string;
  description?: string;
  website?: string;
  preparationTips: PreparationTip[];
  placedStudents: PlacedStudent[];
  problems: string[] | Problem[];
  interviewProcess?: {
    rounds: Array<{
      name: string;
      description: string;
      type: 'technical' | 'hr' | 'group_discussion' | 'coding' | 'system_design';
    }>;
    duration: string;
    difficulty: string;
  };
  tags: string[];
  placedStudentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreparationTip {
  author: string | User;
  content: string;
  resources: Resource[];
  createdAt: Date;
}

export interface Resource {
  _id?: string;
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'video' | 'document';
}

export interface PlacedStudent {
  user: string | User;
  batch: string;
  role: string;
  package?: string;
  experience?: string;
  addedAt: Date;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  total: number;
}