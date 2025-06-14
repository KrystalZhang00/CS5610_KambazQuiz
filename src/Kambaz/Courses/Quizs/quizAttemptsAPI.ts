import { API_BASE_URL } from '../../../config';

export interface QuizAttemptResponse {
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

export interface CreateAttemptRequest {
  user: string;
  startTime: string;
  attemptNumber: number;
}

export interface SubmitAttemptRequest {
  answers: {
    questionId: string;
    userAnswer: string;
  }[];
  submitTime?: string;
}

// Create a new quiz attempt
export const createQuizAttempt = async (
  quizId: string, 
  attemptData: CreateAttemptRequest
): Promise<QuizAttemptResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/attempts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attemptData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create quiz attempt');
  }

  return response.json();
};

// Submit quiz attempt with answers
export const submitQuizAttempt = async (
  attemptId: string,
  submitData: SubmitAttemptRequest
): Promise<QuizAttemptResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/quiz-attempts/${attemptId}/submit`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submitData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit quiz attempt');
  }

  return response.json();
};

// Fetch quiz attempts for a specific quiz and user
export const fetchQuizAttempts = async (
  quizId: string,
  userId?: string
): Promise<QuizAttemptResponse[]> => {
  const url = new URL(`${API_BASE_URL}/api/quizzes/${quizId}/attempts`);
  if (userId) {
    url.searchParams.append('user', userId);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch quiz attempts');
  }

  return response.json();
}; 