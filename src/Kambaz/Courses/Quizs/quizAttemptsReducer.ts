import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { quizAttempts } from "../../Database";
import * as quizAttemptsAPI from "./quizAttemptsAPI";

const initialState = {
  quizAttempts: quizAttempts,
  loading: false,
  error: null as string | null,
};

// Async thunks for API calls
export const createQuizAttemptAsync = createAsyncThunk(
  'quizAttempts/create',
  async ({ quizId, attemptData }: { quizId: string; attemptData: quizAttemptsAPI.CreateAttemptRequest }) => {
    const response = await quizAttemptsAPI.createQuizAttempt(quizId, attemptData);
    return response;
  }
);

export const submitQuizAttemptAsync = createAsyncThunk(
  'quizAttempts/submit',
  async ({ attemptId, submitData }: { attemptId: string; submitData: quizAttemptsAPI.SubmitAttemptRequest }) => {
    const response = await quizAttemptsAPI.submitQuizAttempt(attemptId, submitData);
    return response;
  }
);

export const fetchQuizAttemptsAsync = createAsyncThunk(
  'quizAttempts/fetch',
  async ({ quizId, userId }: { quizId: string; userId?: string }) => {
    const response = await quizAttemptsAPI.fetchQuizAttempts(quizId, userId);
    return response;
  }
);

const quizAttemptsSlice = createSlice({
  name: "quizAttempts",
  initialState,
  reducers: {
    // Keep local state management for UI responsiveness
    addQuizAttempt: (state, { payload: attempt }) => {
      const newAttempt = {
        _id: attempt._id || new Date().getTime().toString(),
        quiz: attempt.quiz,
        user: attempt.user,
        startTime: attempt.startTime || new Date().toISOString(),
        endTime: attempt.endTime || null,
        score: attempt.score || 0,
        totalPoints: attempt.totalPoints || 0,
        answers: attempt.answers || [],
        attemptNumber: attempt.attemptNumber || 1
      };
      state.quizAttempts = [...state.quizAttempts, newAttempt] as any;
    },
    updateQuizAttempt: (state, { payload: attempt }) => {
      state.quizAttempts = state.quizAttempts.map((a: any) =>
        a._id === attempt._id ? attempt : a
      ) as any;
    },
    deleteQuizAttempt: (state, { payload: attemptId }) => {
      state.quizAttempts = state.quizAttempts.filter((a: any) => a._id !== attemptId);
    },
    // Keep for local answer updates during quiz taking
    updateQuizAttemptAnswers: (state, { payload: { attemptId, questionId, userAnswer } }) => {
      state.quizAttempts = state.quizAttempts.map((a: any) => {
        if (a._id === attemptId) {
          const existingAnswerIndex = a.answers.findIndex((ans: any) => ans.questionId === questionId);
          
          if (existingAnswerIndex >= 0) {
            const updatedAnswers = [...a.answers];
            updatedAnswers[existingAnswerIndex] = {
              ...updatedAnswers[existingAnswerIndex],
              userAnswer
            };
            return { ...a, answers: updatedAnswers };
          } else {
            return {
              ...a,
              answers: [...a.answers, { questionId, userAnswer, isCorrect: false }]
            };
          }
        }
        return a;
      }) as any;
    },
    clearQuizAttemptsForUser: (state, { payload: { userId, quizId } }) => {
      state.quizAttempts = state.quizAttempts.filter((a: any) => 
        !(a.user === userId && a.quiz === quizId)
      );
    },
    clearAllQuizAttempts: (state) => {
      state.quizAttempts = [];
    },
    setQuizAttempts: (state, { payload: attempts }) => {
      state.quizAttempts = attempts;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create attempt
      .addCase(createQuizAttemptAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuizAttemptAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Add the backend-created attempt to local state
        state.quizAttempts = [...state.quizAttempts, action.payload] as any;
      })
      .addCase(createQuizAttemptAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create quiz attempt';
      })
      // Submit attempt
      .addCase(submitQuizAttemptAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitQuizAttemptAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Update the local attempt with backend-calculated results
        state.quizAttempts = state.quizAttempts.map((a: any) =>
          a._id === action.payload._id ? action.payload : a
        ) as any;
      })
      .addCase(submitQuizAttemptAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit quiz attempt';
      })
      // Fetch attempts
      .addCase(fetchQuizAttemptsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizAttemptsAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Replace local attempts with backend data for this quiz
        const fetchedAttempts = action.payload;
        if (fetchedAttempts.length > 0) {
          const quizId = fetchedAttempts[0].quiz;
          // Remove existing attempts for this quiz and add fetched ones
          const otherAttempts = state.quizAttempts.filter((a: any) => a.quiz !== quizId);
          state.quizAttempts = [...otherAttempts, ...fetchedAttempts] as any;
        }
      })
      .addCase(fetchQuizAttemptsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch quiz attempts';
      });
  },
});

export const {
  addQuizAttempt,
  updateQuizAttempt,
  deleteQuizAttempt,
  updateQuizAttemptAnswers,
  clearQuizAttemptsForUser,
  clearAllQuizAttempts,
  setQuizAttempts,
  clearError
} = quizAttemptsSlice.actions;

export default quizAttemptsSlice.reducer;