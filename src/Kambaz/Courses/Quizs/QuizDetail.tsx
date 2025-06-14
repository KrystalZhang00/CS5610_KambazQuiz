import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Card, Badge, Table, Row, Col } from "react-bootstrap";
import { FaEdit, FaCheckCircle, FaBan, FaEye } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { toggleQuizPublish } from "./reducer";
import { fetchQuizAttemptsAsync } from "./quizAttemptsReducer";
import type { AppDispatch } from "../../store";
import { API_BASE_URL } from '../../../config';

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
}

interface Quiz {
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
  timeLimit?: number;
  attempts?: number;
  shuffleAnswers?: boolean;
  quizType?: string;
  assignmentGroup?: string;
  multipleAttempts?: boolean;
  showCorrectAnswers?: string;
  accessCode?: string;
  oneQuestionAtTime?: boolean;
  webcamRequired?: boolean;
  lockQuestionsAfterAnswering?: boolean;
  viewResponses?: string;
  requireResponsiveLockDown?: boolean;
  requireQuizResults?: boolean;
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

export default function QuizDetail() {
  const { cid, qid } = useParams<{ cid: string; qid: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { quizs } = useSelector((state: any) => state.quizsReducer);
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const { quizAttempts } = useSelector((state: any) => state.quizAttemptsReducer);
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);
  
  // Check if current user has edit permissions (FACULTY or ADMIN)
  const canEdit = currentUser?.role === "FACULTY" || currentUser?.role === "ADMIN";
  const isStudent = currentUser?.role === "STUDENT";

  useEffect(() => {
    if (!qid) return;
    
    const foundQuiz = quizs.find((q: Quiz) => q._id === qid);
    if (foundQuiz) {
      // Initialize default properties if they don't exist
      const quizWithDefaults: Quiz = {
        ...foundQuiz,
        quizType: foundQuiz.quizType || "Graded Quiz",
        assignmentGroup: foundQuiz.assignmentGroup || "Quizzes",
        shuffleAnswers: foundQuiz.shuffleAnswers !== undefined ? foundQuiz.shuffleAnswers : true,
        timeLimit: foundQuiz.timeLimit || 30,
        multipleAttempts: foundQuiz.multipleAttempts !== undefined ? foundQuiz.multipleAttempts : false,
        attempts: foundQuiz.attempts || 1,
        showCorrectAnswers: foundQuiz.showCorrectAnswers || "Immediately",
        accessCode: foundQuiz.accessCode || "",
        oneQuestionAtTime: foundQuiz.oneQuestionAtTime !== undefined ? foundQuiz.oneQuestionAtTime : true,
        webcamRequired: foundQuiz.webcamRequired !== undefined ? foundQuiz.webcamRequired : false,
        lockQuestionsAfterAnswering: foundQuiz.lockQuestionsAfterAnswering !== undefined ? foundQuiz.lockQuestionsAfterAnswering : false,
        viewResponses: foundQuiz.viewResponses || "Always",
        requireResponsiveLockDown: foundQuiz.requireResponsiveLockDown !== undefined ? foundQuiz.requireResponsiveLockDown : false,
        requireQuizResults: foundQuiz.requireQuizResults !== undefined ? foundQuiz.requireQuizResults : false,
      };
      
      setQuiz(quizWithDefaults);
    }
  }, [qid, quizs]);

  // Separate useEffect for fetching quiz attempts (students only)
  useEffect(() => {
    if (!qid || !currentUser) return;
    
    // Only fetch attempts for students, not faculty
    if (currentUser.role === "STUDENT") {
      dispatch(fetchQuizAttemptsAsync({ quizId: qid, userId: currentUser._id }));
    }
  }, [qid, currentUser, dispatch]);

  // Separate useEffect for processing attempts after they're fetched
  useEffect(() => {
    if (!currentUser || !qid) return;
    
    // Find user attempts for this quiz
    const attempts = quizAttempts.filter(
      (a: QuizAttempt) => a.quiz === qid && a.user === currentUser._id
    );
    setUserAttempts(attempts);
    

  }, [currentUser, qid, quizAttempts]);

  const handlePublishToggle = async () => {
    if (quiz) {
      try {
        // Toggle publish status via backend API
        const updatedQuiz = { ...quiz, published: !quiz.published };
        const response = await fetch(`${API_BASE_URL}/api/quizzes/${quiz._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedQuiz),
        });
        
        if (response.ok) {
          // Only update local state after successful API call
          dispatch(toggleQuizPublish(quiz._id));
        } else {
          alert('Failed to update quiz publish status');
        }
      } catch (error) {
        console.error('Error updating quiz publish status:', error);
        alert('Failed to update quiz publish status');
      }
    }
  };

  const getTotalPoints = (): number => {
    if (!quiz) return 0;
    
    if (quiz.questions && quiz.questions.length > 0) {
      return quiz.questions.reduce((sum: number, q: Question) => sum + (q.points || 0), 0);
    }
    
    return quiz.points || 0;
  };

  // Check if the student can take the quiz
  const canTakeQuiz: boolean = (() => {
    if (!quiz || !isStudent) return false;
    
    // Check if the quiz is published
    if (!quiz.published) return false;
    
    // Check availability dates
    const now = new Date();
    const availableFrom = quiz.availableFrom ? new Date(quiz.availableFrom) : null;
    const availableUntil = quiz.availableUntil ? new Date(quiz.availableUntil) : null;
    
    if (availableFrom && now < availableFrom) return false;
    if (availableUntil && now > availableUntil) return false;
    
    // Check if user has any attempts left
    const completedAttempts = userAttempts.filter(a => a.endTime);
    
    // If multipleAttempts is false, only allow one attempt
    if (!quiz.multipleAttempts && completedAttempts.length > 0) return false;
    
    // If multipleAttempts is true, check if user has used all attempts
    const maxAttempts = quiz.attempts || 1;
    return completedAttempts.length < maxAttempts;
  })();

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  if (!quiz) {
    return <div className="text-center p-5">Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>
          {quiz.title} 
          {!quiz.published && <Badge bg="secondary" className="ms-2">Unpublished</Badge>}
        </h2>
        <div>
          {canEdit && (
            <>
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/preview`)}
              >
                <FaEye className="me-1" /> Preview
              </Button>
              <Button 
                variant="outline-secondary" 
                className="me-2"
                onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/edit`)}
              >
                <FaEdit className="me-1" /> Edit
              </Button>
            </>
          )}
          {/* Only show Take Quiz button here if there are no previous attempts */}
          {isStudent && canTakeQuiz && (
            <Button 
              variant="success"
              onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/preview`)}
            >
              {userAttempts.length === 0 ? "Take Quiz" : "Start New Attempt"}
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Q1 - {quiz.title}</h5>
          {canEdit && (
            <Button 
              variant={quiz.published ? "outline-danger" : "outline-success"}
              size="sm"
              onClick={handlePublishToggle}
            >
              {quiz.published ? (
                <>
                  <FaBan className="me-1" /> Unpublish
                </>
              ) : (
                <>
                  <FaCheckCircle className="me-1" /> Publish
                </>
              )}
            </Button>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          <Table className="mb-0" hover>
            <tbody>
              <tr>
                <td width="30%" className="ps-3 py-2">Quiz Type</td>
                <td width="70%" className="py-2">{quiz.quizType || "Graded Quiz"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Points</td>
                <td className="py-2">{getTotalPoints()}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Assignment Group</td>
                <td className="py-2">{quiz.assignmentGroup || "Quizzes"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Shuffle Answers</td>
                <td className="py-2">{quiz.shuffleAnswers ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Time Limit</td>
                <td className="py-2">{quiz.timeLimit || 30} Minutes</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Multiple Attempts</td>
                <td className="py-2">{quiz.multipleAttempts ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Allowed Attempts</td>
                <td className="py-2">{quiz.attempts || 1}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">View Responses</td>
                <td className="py-2">{quiz.viewResponses || "Always"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Show Correct Answers</td>
                <td className="py-2">{quiz.showCorrectAnswers || "Immediately"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Access Code</td>
                <td className="py-2">{quiz.accessCode || " "}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">One Question at a Time</td>
                <td className="py-2">{quiz.oneQuestionAtTime ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Require Responsive LockDown</td>
                <td className="py-2">{quiz.requireResponsiveLockDown ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Required to View Quiz Results</td>
                <td className="py-2">{quiz.requireQuizResults ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Webcam Required</td>
                <td className="py-2">{quiz.webcamRequired ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Lock Questions After Answering</td>
                <td className="py-2">{quiz.lockQuestionsAfterAnswering ? "Yes" : "No"}</td>
              </tr>
            </tbody>
          </Table>
          
          <Table className="mb-0 border-top" hover>
            <thead>
              <tr className="table-light">
                <th className="ps-3 py-2">Due</th>
                <th className="py-2">For</th>
                <th className="py-2">Available from</th>
                <th className="py-2">Until</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ps-3 py-2">{formatDate(quiz.dueDate)}</td>
                <td className="py-2">Everyone</td>
                <td className="py-2">{formatDate(quiz.availableFrom)}</td>
                <td className="py-2">{formatDate(quiz.availableUntil)}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {isStudent && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Your Quiz Status</h5>
              </Card.Header>
              <Card.Body>
                <h6>All Attempts</h6>
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAttempts
                      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                      .map((attempt) => (
                        <tr key={attempt._id}>
                          <td>{attempt.attemptNumber}</td>
                          <td>{new Date(attempt.startTime).toLocaleDateString()}</td>
                          <td>
                            {attempt.endTime ? 
                              `${attempt.score}/${attempt.totalPoints} (${Math.round((attempt.score / attempt.totalPoints) * 100)}%)` : 
                              "In progress"}
                          </td>
                          <td>
                            {attempt.endTime ? 
                              <Badge bg="success">Completed</Badge> : 
                              <Badge bg="warning">In progress</Badge>}
                          </td>
                          <td>
                            {attempt.endTime ? (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/preview?viewAttempt=${attempt._id}`)}
                              >
                                View Results
                              </Button>
                            ) : (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/preview`)}
                              >
                                Continue
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
                {/* Start New Attempt按钮只要canTakeQuiz为true就显示 */}
                {canTakeQuiz && (
                  <div className="d-grid mt-3">
                    <Button 
                      variant="success"
                      onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/preview`)}
                    >
                      Start New Attempt
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      <div className="d-flex justify-content-between">
        <Link to={`/Kambaz/Courses/${cid}/Quizs`}>
          <Button variant="secondary">Back to Quizzes</Button>
        </Link>
      </div>
    </div>
  );
}