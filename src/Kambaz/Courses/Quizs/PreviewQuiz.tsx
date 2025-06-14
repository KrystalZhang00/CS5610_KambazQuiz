import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Button, Card, Form, Badge, Alert } from "react-bootstrap";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { updateQuizAttemptAnswers, clearError } from "./quizAttemptsReducer";
import { createQuizAttemptAsync, submitQuizAttemptAsync, fetchQuizAttemptsAsync } from "./quizAttemptsReducer";
import type { AppDispatch } from "../../store";

interface Question {
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
  quizId?: string;
}

interface Quiz {
  _id: string;
  title: string;
  course: string;
  description?: string;
  points?: number;
  timeLimit?: number;
  attempts?: number;
  questions: Question[];
  shuffleAnswers?: boolean;
  questionCount?: number;
  published: boolean;
  dueDate: string;
  availableFrom: string;
  availableUntil: string;
  showCorrectAnswers?: string;
}

interface QuizAttempt {
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

export default function PreviewQuiz() {
  const { cid, qid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { quizs, questions } = useSelector((state: any) => state.quizsReducer);
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const { quizAttempts, loading, error } = useSelector((state: any) => state.quizAttemptsReducer);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<{score: number, totalPoints: number, correctAnswers: number}>({ score: 0, totalPoints: 0, correctAnswers: 0 });
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  
  // Add flag to prevent infinite API calls
  const hasFetchedAttempts = useRef(false);

  const isFaculty = currentUser?.role === "FACULTY" || currentUser?.role === "ADMIN";
  const isStudent = currentUser?.role === "STUDENT";

  useEffect(() => {
    const foundQuiz = quizs.find((q: Quiz) => q._id === qid);
    if (foundQuiz) {
      setQuiz({
        ...foundQuiz,
        questionCount: foundQuiz.questions.length
      });

      if (isStudent && !hasFetchedAttempts.current) {
        // Fetch attempts from backend only once
        hasFetchedAttempts.current = true;
        dispatch(fetchQuizAttemptsAsync({ quizId: qid!, userId: currentUser._id }));
      }
    }
  }, [qid, quizs, questions, isStudent, currentUser, dispatch]);

  // Separate useEffect for processing attempts after they're fetched
  useEffect(() => {
    if (!quiz || !isStudent || !hasFetchedAttempts.current) return;

    const searchParams = new URLSearchParams(location.search);
    const viewAttemptId = searchParams.get('viewAttempt');

    if (viewAttemptId) {
      const attemptToView = quizAttempts.find((a: QuizAttempt) => 
        a._id === viewAttemptId && a.quiz === qid && a.user === currentUser._id
      );

      if (attemptToView) {
        setAttempt(attemptToView);
        setIsSubmitted(true);
        const answerMap: {[key: string]: string} = {};
        attemptToView.answers.forEach((a: {questionId: string, userAnswer: string, isCorrect: boolean}) => {
          answerMap[a.questionId] = a.userAnswer;
        });
        setAnswers(answerMap);
        setResults({
          score: attemptToView.score,
          totalPoints: attemptToView.totalPoints,
          correctAnswers: attemptToView.answers.filter((a: {questionId: string, userAnswer: string, isCorrect: boolean}) => a.isCorrect).length
        });
        setQuizStarted(true);
        return;
      }
    }

    const completedUserAttempts = quizAttempts.filter((a: QuizAttempt) => 
      a.quiz === qid && a.user === currentUser._id && a.endTime
    );

    if (completedUserAttempts.length >= (quiz.attempts || 1)) {
      setErrorMessage(`You have used all your ${quiz.attempts} attempts.`);
      if (completedUserAttempts.length > 0) {
        const lastAttempt = completedUserAttempts[completedUserAttempts.length - 1];
        setAttempt(lastAttempt);
        setIsSubmitted(true);
        const answerMap: {[key: string]: string} = {};
        lastAttempt.answers.forEach((a: {questionId: string, userAnswer: string, isCorrect: boolean}) => {
          answerMap[a.questionId] = a.userAnswer;
        });
        setAnswers(answerMap);
        setResults({
          score: lastAttempt.score,
          totalPoints: lastAttempt.totalPoints,
          correctAnswers: lastAttempt.answers.filter((a: {questionId: string, userAnswer: string, isCorrect: boolean}) => a.isCorrect).length
        });
      }
      return;
    }

    const incompleteAttempts = quizAttempts.filter((a: QuizAttempt) => 
      a.quiz === qid && a.user === currentUser._id && !a.endTime
    );

    if (incompleteAttempts.length > 0) {
      setAttempt(incompleteAttempts[0]);
      if (incompleteAttempts[0].answers && incompleteAttempts[0].answers.length > 0) {
        const answerMap: {[key: string]: string} = {};
        incompleteAttempts[0].answers.forEach((a: {questionId: string, userAnswer: string, isCorrect: boolean}) => {
          answerMap[a.questionId] = a.userAnswer;
        });
        setAnswers(answerMap);
      }

      if (quiz.timeLimit && quiz.timeLimit > 0) {
        const startTime = new Date(incompleteAttempts[0].startTime).getTime();
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const totalSeconds = quiz.timeLimit * 60;
        const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
        
        if (remainingSeconds > 0) {
          setTimeLeft(remainingSeconds);
        } else {
          handleSubmit();
        }
      }
      
      setQuizStarted(true);
    }
  }, [quiz, isStudent, quizAttempts, qid, currentUser, location]);

  // Faculty preview setup
  useEffect(() => {
    if (quiz && isFaculty) {
      setQuizStarted(true);
      if (quiz.timeLimit && quiz.timeLimit > 0) {
        setTimeLeft(quiz.timeLimit * 60);
      }
    }
  }, [quiz, isFaculty]);

  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;
    
    if (timer) {
      clearInterval(timer);
    }
    
    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(intervalId);
          handleSubmit();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    
    setTimer(intervalId);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timeLeft, isSubmitted]);

  // Clear any errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartQuiz = async () => {
    if (!quiz || !isStudent) return;
    
    // Check if quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
      setErrorMessage('This quiz has no questions and cannot be taken.');
      return;
    }
    
    const userAttempts = quizAttempts.filter((a: QuizAttempt) => 
      a.quiz === qid && a.user === currentUser._id
    );
    
    // Format current time as datetime-local (YYYY-MM-DDTHH:MM) to match quiz date format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    const attemptData = {
      user: currentUser._id,
      startTime: localTimeString,
      attemptNumber: userAttempts.length + 1
    };
    
    try {
      // Create attempt via API
      const resultAction = await dispatch(createQuizAttemptAsync({ 
        quizId: qid!, 
        attemptData 
      }));
      
      if (createQuizAttemptAsync.fulfilled.match(resultAction)) {
        setAttempt(resultAction.payload);
        
        if (quiz.timeLimit && quiz.timeLimit > 0) {
          setTimeLeft(quiz.timeLimit * 60);
        }
        
        setQuizStarted(true);
      }
    } catch (error) {
      console.error('Failed to start quiz:', error);
      setErrorMessage('Failed to start quiz. Please try again.');
    }
  };

  const handleNextQuestion = () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    // Update local UI state immediately
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Update Redux state for persistence across refreshes
    if (isStudent && !isSubmitted && attempt) {
      dispatch(updateQuizAttemptAnswers({
        attemptId: attempt._id,
        questionId,
        userAnswer: answer
      }));
    }
  };

  const handleSubmit = async () => {
    if (timer) clearInterval(timer);
    
    // Handle empty quiz case
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      setErrorMessage('Cannot submit quiz with no questions.');
      return;
    }

    // Faculty preview: Calculate results locally without API call
    if (isFaculty) {
      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;
      
      for (const question of quiz.questions) {
        totalPoints += question.points;
        
        const userAnswer = answers[question._id] || "";
        let isCorrect = false;
        
        if (question.type === "multiple_choice") {
          isCorrect = userAnswer === question.correctOption;
        } else if (question.type === "true_false") {
          isCorrect = (userAnswer === "true" && question.correctAnswer === true) || 
                     (userAnswer === "false" && question.correctAnswer === false);
        } else if (question.type === "fill_in_blank") {
          isCorrect = (question.possibleAnswers || []).some(
            answer => answer.toLowerCase() === userAnswer.toLowerCase()
          );
        }
        
        if (isCorrect) {
          correctCount++;
          earnedPoints += question.points;
        }
      }
      
      setResults({
        score: earnedPoints,
        totalPoints,
        correctAnswers: correctCount
      });
      
      setIsSubmitted(true);
      return;
    }

    // Student submission: Use API
    if (!attempt) {
      setErrorMessage('No active attempt found');
      return;
    }

    // Prepare raw answers for backend (no scoring calculation)
    const rawAnswers = Object.entries(answers).map(([questionId, userAnswer]) => ({
      questionId,
      userAnswer: userAnswer as string
    }));
    
    try {
      // Generate user's current local time for submission
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;

      // Submit to backend for calculation
      const resultAction = await dispatch(submitQuizAttemptAsync({
        attemptId: attempt._id,
        submitData: { 
          answers: rawAnswers,
          submitTime: localTimeString
        }
      }));
      
      if (submitQuizAttemptAsync.fulfilled.match(resultAction)) {
        const submittedAttempt = resultAction.payload;
        
        // Use backend-calculated results
        setResults({
          score: submittedAttempt.score,
          totalPoints: submittedAttempt.totalPoints,
          correctAnswers: submittedAttempt.answers.filter(a => a.isCorrect).length
        });
        
        setAttempt(submittedAttempt);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      setErrorMessage('Failed to submit quiz. Please try again.');
    }
  };



  const shouldShowCorrectAnswers = (): boolean => {
    if (!quiz) return false;
    
    // For students: Check if they have used all their attempts
    if (isStudent && currentUser) {
      const completedUserAttempts = quizAttempts.filter((a: QuizAttempt) => 
        a.quiz === qid && a.user === currentUser._id && a.endTime
      );
      const maxAttempts = quiz.attempts || 1;
      
      // If student has used all attempts, show correct answers regardless of quiz setting
      if (completedUserAttempts.length >= maxAttempts) {
        return true;
      }
    }
    
    // Otherwise, follow the quiz's showCorrectAnswers setting
    if (!quiz.showCorrectAnswers) return false;
    
    switch (quiz.showCorrectAnswers) {
      case "immediately":
      case "Immediately":
        return true;
      case "never":
      case "Never":
        return false;
      case "after_due_date":
      case "After Due Date":
        if (!quiz.dueDate) return false;
        const now = new Date();
        const dueDate = new Date(quiz.dueDate);
        return now > dueDate;
      default:
        return false;
    }
  };

  const renderQuestion = () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return (
        <Card className="mb-4">
          <Card.Body className="text-center">
            <h5>No Questions Available</h5>
            <p>This quiz does not contain any questions.</p>
          </Card.Body>
        </Card>
      );
    }

    const question = quiz.questions[currentQuestionIndex];
    if (!question) return null;

    const userAnswer = answers[question._id] || "";
    let isCorrect = false;

    if (isSubmitted) {
      if (isFaculty) {
        // Faculty can see correct answers immediately (for preview)
        if (question.type === "multiple_choice") {
          isCorrect = userAnswer === question.correctOption;
        } else if (question.type === "true_false") {
          isCorrect = (userAnswer === "true" && question.correctAnswer === true) || 
                     (userAnswer === "false" && question.correctAnswer === false);
        } else if (question.type === "fill_in_blank") {
          isCorrect = (question.possibleAnswers || []).some(
            answer => answer.toLowerCase() === userAnswer.toLowerCase()
          );
        }
      } else {
        // Students see backend-calculated results
        isCorrect = attempt?.answers.find(a => a.questionId === question._id)?.isCorrect || false;
      }
    }

    return (
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Question {currentQuestionIndex + 1}</h5>
            <div>
              {isSubmitted && (
                isCorrect ? 
                <FaCheckCircle className="text-success" /> : 
                <FaTimesCircle className="text-danger" />
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{question.title}</Form.Label>
              <div dangerouslySetInnerHTML={{ __html: question.question }} />
            </Form.Group>

            {question.type === "multiple_choice" && (
              <Form.Group>
                {question.choices?.map((choice, index) => (
                  <Form.Check
                    key={index}
                    type="radio"
                    id={`q${question._id}-${index}`}
                    label={choice.text}
                    name={`question-${question._id}`}
                    checked={userAnswer === choice.id}
                    onChange={() => handleAnswerChange(question._id, choice.id)}
                    disabled={isSubmitted}
                    className={isSubmitted && (isFaculty || shouldShowCorrectAnswers()) ? (
                      choice.id === question.correctOption ? "text-success fw-bold" : 
                      userAnswer === choice.id ? "text-danger" : ""
                    ) : ""}
                  />
                ))}
                {isSubmitted && (isFaculty || shouldShowCorrectAnswers()) && (
                  <div className="mt-3">
                    <div className="text-info">
                      <strong>Your answer: </strong> 
                      {userAnswer ? 
                        (question.choices?.find(c => c.id === userAnswer)?.text || `Unknown choice (${userAnswer})`) : 
                        "No answer provided"
                      }
                    </div>
                    <div className="text-success">
                      <strong>Correct answer: </strong> 
                      {question.correctOption ? 
                        (question.choices?.find(c => c.id === question.correctOption)?.text || `Unknown choice (${question.correctOption})`) : 
                        "No correct answer set"
                      }
                    </div>
                  </div>
                )}
              </Form.Group>
            )}

            {question.type === "true_false" && (
              <Form.Group>
                <Form.Check
                  type="radio"
                  id={`q${question._id}-true`}
                  label="True"
                  name={`question-${question._id}`}
                  checked={userAnswer === "true"}
                  onChange={() => handleAnswerChange(question._id, "true")}
                  disabled={isSubmitted}
                  className={isSubmitted && (isFaculty || shouldShowCorrectAnswers()) ? (
                    question.correctAnswer === true ? "text-success fw-bold" : 
                    userAnswer === "true" ? "text-danger" : ""
                  ) : ""}
                />
                <Form.Check
                  type="radio"
                  id={`q${question._id}-false`}
                  label="False"
                  name={`question-${question._id}`}
                  checked={userAnswer === "false"}
                  onChange={() => handleAnswerChange(question._id, "false")}
                  disabled={isSubmitted}
                  className={isSubmitted && (isFaculty || shouldShowCorrectAnswers()) ? (
                    question.correctAnswer === false ? "text-success fw-bold" : 
                    userAnswer === "false" ? "text-danger" : ""
                  ) : ""}
                />
                {isSubmitted && (isFaculty || shouldShowCorrectAnswers()) && (
                  <div className="mt-3">
                    <div className="text-success">
                      <strong>Your answer: </strong> {userAnswer || "No answer provided"}
                    </div>
                    <div className="text-success">
                      <strong>Correct answer: </strong> {question.correctAnswer ? "True" : "False"}
                    </div>
                  </div>
                )}
              </Form.Group>
            )}

            {question.type === "fill_in_blank" && (
              <Form.Group>
                <Form.Control
                  type="text"
                  value={userAnswer}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                  disabled={isSubmitted}
                  className={isSubmitted && (isFaculty || shouldShowCorrectAnswers()) ? (
                    isCorrect ? "border-success" : "border-danger"
                  ) : ""}
                />
                {isSubmitted && (isFaculty || shouldShowCorrectAnswers()) && (
                  <div className="mt-3">
                    <div className="text-success">
                      <strong>Your answer: </strong> {userAnswer || "No answer provided"}
                    </div>
                    <div className="text-success">
                      <strong>Correct answer(s): </strong> {question.possibleAnswers?.join(", ")}
                    </div>
                  </div>
                )}
              </Form.Group>
            )}

            {isSubmitted && isStudent && (
              <div className="mt-3">
                <Alert variant={isCorrect ? "success" : "danger"}>
                  {isCorrect ? "Correct!" : "Incorrect"}
                </Alert>
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>
    );
  };

  const renderNavigationButtons = () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;

    return (
      <div className="d-flex justify-content-between mt-3">
        <Button
          variant="outline-primary"
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <FaArrowLeft /> Previous
        </Button>
        
        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button
            variant="outline-primary"
            onClick={handleNextQuestion}
          >
            Next <FaArrowRight />
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={isSubmitted || loading}
          >
            {loading ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </div>
    );
  };

  const renderEditButton = () => {
    if (!isFaculty) return null;
    
    return (
      <Button
        variant="warning"
        className="ms-2"
        onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/edit`)}
      >
        Edit Quiz
      </Button>
    );
  };

  if (!quiz) {
    return <div className="text-center p-5">Loading...</div>;
  }

  // Show error messages
  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" onClick={() => dispatch(clearError())}>
              Dismiss
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container mt-4">
        <Alert variant="warning">{errorMessage}</Alert>
        {attempt && (
          <Card className="mt-4 mb-4">
            <Card.Header>
              <h4>Your Previous Attempt Results</h4>
            </Card.Header>
            <Card.Body>
              <h5>Score: {attempt.score} / {attempt.totalPoints}</h5>
              <p>Completed on: {new Date(attempt.endTime || "").toLocaleString()}</p>
              <p>Attempt: {attempt.attemptNumber} of {quiz.attempts}</p>
            </Card.Body>
          </Card>
        )}
        <div className="d-flex justify-content-center mb-4">
          {quiz.questions && quiz.questions.map((q, idx) => (
            <Button
              key={q._id}
              variant={idx === currentQuestionIndex ? "primary" : "outline-primary"}
              className="mx-1"
              onClick={() => setCurrentQuestionIndex(idx)}
              style={{ minWidth: 40, fontWeight: idx === currentQuestionIndex ? 'bold' : 'normal' }}
            >
              {idx + 1}
            </Button>
          ))}
        </div>
        {renderQuestion()}
        <div className="d-flex justify-content-between mt-4">
          <Button 
            variant="secondary" 
            onClick={handlePrevQuestion} 
            disabled={currentQuestionIndex === 0}
          >
            <FaArrowLeft className="me-1" /> Previous Question
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setCurrentQuestionIndex(0)}
          >
            Return to First Question
          </Button>
        </div>
        {isSubmitted && (
          <Card className="mt-4">
            <Card.Body>
              <h4>Quiz Results</h4>
              <p>Score: {results.score} out of {results.totalPoints}</p>
              <p>Correct Answers: {results.correctAnswers} out of {quiz.questionCount ?? 0}</p>
              {isStudent && (
                <div className="mt-3">
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs`)}
                  >
                    Back to Quizzes
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
        <div className="mt-3">
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs`)}
          >
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  if (isStudent && !quizStarted && !isSubmitted) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>{quiz.title}</h2>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs`)}
          >
            Back to Quizzes
          </Button>
        </div>
        
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>Quiz Information</Card.Title>
            <Card.Text>{quiz.description || "Answer all questions to the best of your ability."}</Card.Text>
            <div className="d-flex justify-content-between mb-3">
              <div><strong>Time limit:</strong> {quiz.timeLimit} minutes</div>
              <div><strong>Points:</strong> {quiz.points}</div>
              <div><strong>Questions:</strong> {quiz.questionCount}</div>
            </div>
            {quiz.dueDate && (
              <div className="mb-3">
                <strong>Due Date:</strong> {new Date(quiz.dueDate).toLocaleString()}
              </div>
            )}
            <div className="mb-3">
              <strong>Attempts allowed:</strong> {quiz.attempts || 1}
            </div>
            
            {((quiz.questionCount ?? 0) === 0 || !quiz.questions || quiz.questions.length === 0) && (
              <Alert variant="warning">
                <strong>Notice:</strong> This quiz has no questions and cannot be taken.
              </Alert>
            )}
            
            {attempt && attempt.endTime && (
              <div className="mb-4">
                <h5>Your Last Attempt Result:</h5>
                <div className="d-flex justify-content-between border p-3 rounded bg-light">
                  <div>
                    <div><strong>Score:</strong> {attempt.score} / {attempt.totalPoints}</div>
                    <div><strong>Completed on:</strong> {new Date(attempt.endTime).toLocaleString()}</div>
                    <div><strong>Attempt:</strong> {attempt.attemptNumber} of {quiz.attempts}</div>
                  </div>
                  <div>
                    <Button 
                      variant="info" 
                      onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/preview`)}
                    >
                      View Last Attempt
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {(quiz.questionCount ?? 0) > 0 && (
              <>
                <Alert variant="info">
                  <strong>Important Note:</strong> Clicking "Start Quiz" will start the timer, and your attempt will be recorded.
                  Please ensure you have enough time to complete the quiz before starting.
                </Alert>
                <div className="text-center">
                  {(!attempt || attempt.endTime) && (
                    <Button 
                      variant="success" 
                      size="lg"
                      onClick={handleStartQuiz}
                      disabled={loading}
                    >
                      {loading ? 'Starting...' : (attempt ? "Start New Attempt" : "Start Quiz")}
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          {quiz.title} 
          {isFaculty && <Badge bg="warning" className="ms-2">Preview Mode</Badge>}
        </h2>
        <div>
          {renderEditButton()}
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs`)}
            className="ms-2"
          >
            {isFaculty ? "Exit Preview" : "Back to Quiz List"}
          </Button>
        </div>
      </div>
      
      {!isSubmitted && quiz.questions && quiz.questions.length > 0 && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span>Time Remaining: {formatTime(timeLeft || 0)}</span>
          </div>
          <div className="progress" style={{ height: "16px" }}>
            <div
              className="progress-bar bg-info"
              role="progressbar"
              style={{ width: `${quiz && quiz.timeLimit ? (timeLeft || 0) / (quiz.timeLimit * 60) * 100 : 100}%` }}
            ></div>
          </div>
        </div>
      )}
      {renderQuestion()}
      {quiz.questions && quiz.questions.length > 0 && (
        <div className="d-flex justify-content-center mb-4">
          {quiz.questions.map((q, idx) => (
            <Button
              key={q._id}
              variant={idx === currentQuestionIndex ? "primary" : "outline-primary"}
              className="mx-1"
              onClick={() => setCurrentQuestionIndex(idx)}
              style={{ minWidth: 40, fontWeight: idx === currentQuestionIndex ? 'bold' : 'normal' }}
            >
              {idx + 1}
            </Button>
          ))}
        </div>
      )}
      {!isSubmitted && renderNavigationButtons()}
      {isSubmitted && (
        <Card className="mt-4">
          <Card.Body>
            <h4>Quiz Results</h4>
            <p>Score: {results.score} out of {results.totalPoints}</p>
            <p>Correct Answers: {results.correctAnswers} out of {quiz.questionCount ?? 0}</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}