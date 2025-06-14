import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // 默认使用 localStorage
import modulesReducer from "./Courses/Modules/reducer";
import assignmentsReducer from "./Courses/Assignments/reducer";
import quizsReducer from "./Courses/Quizs/reducer";
import coursesReducer from "./Courses/reducer";
import enrollmentsReducer from "./Account/enrollmentsReducer";
import accountReducer from "./Account/reducer";
import quizAttemptsReducer from "./Courses/Quizs/quizAttemptsReducer";

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['quizsReducer', 'enrollmentsReducer', 'quizAttemptsReducer', 'coursesReducer'], 
};

const rootReducer = combineReducers({
  modulesReducer,
  assignmentsReducer,
  quizsReducer,
  coursesReducer,
  enrollmentsReducer,
  accountReducer,
  quizAttemptsReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export default store;