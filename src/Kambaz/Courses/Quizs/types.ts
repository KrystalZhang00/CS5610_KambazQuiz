// Shared Quiz types based on project design document

export interface Question {
  _id: string;
  type: "multiple_choice" | "true_false" | "fill_in_blank";
  title: string;
  question: string;
  points: number;
  choices?: {
    id: string;
    text: string;
  }[];
  correctOption?: string;
  correctAnswer?: boolean;
  possibleAnswers?: string[];
}

export interface Quiz {
  _id: string;
  title: string;
  course: string;
  description?: string;
  points?: number;
  dueDate?: string;
  availableFrom?: string;
  availableUntil?: string;
  published?: boolean;
  questions: Question[];
  
  // Quiz configuration fields from design document
  quizType?: string; // "Graded Quiz" (default), "Practice Quiz", "Graded Survey", "Ungraded Survey"
  assignmentGroup?: string; // "Quizzes" (default), "Exams", "Assignments", "Project"
  shuffleAnswers?: boolean; // Yes (default) / No
  timeLimit?: number; // 20 Minutes (default)
  multipleAttempts?: boolean; // No (default) / Yes
  attempts?: number; // 1 (default). If Multiple Attempts is Yes, then can configure how many times
  showCorrectAnswers?: string; // If and when correct answers are shown to students
  accessCode?: string; // Passcode students need to type to access the quiz. Default is blank
  oneQuestionAtTime?: boolean; // Yes (default) / No
  webcamRequired?: boolean; // No (default) / Yes
  lockQuestionsAfterAnswering?: boolean; // No (default) / Yes
}

export interface QuizAttempt {
  _id: string;
  quiz: string;
  user: string;
  startTime: string;
  endTime?: string;
  score: number;
  totalPoints: number;
  answers: {
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
  }[];
  attemptNumber: number;
}

// Default values based on design document
export const DEFAULT_QUIZ_VALUES = {
  quizType: "Graded Quiz",
  assignmentGroup: "Quizzes",
  shuffleAnswers: true, // Yes by default
  timeLimit: 20, // 20 Minutes (default)
  multipleAttempts: false, // No by default
  attempts: 1, // 1 (default)
  showCorrectAnswers: "Immediately",
  accessCode: "", // Default is blank
  oneQuestionAtTime: true, // Yes by default
  webcamRequired: false, // No by default
  lockQuestionsAfterAnswering: false, // No by default
  published: false,
  points: 100
}; 