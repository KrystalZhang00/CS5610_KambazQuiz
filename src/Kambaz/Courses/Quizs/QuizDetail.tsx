import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Card, Badge, Table, Row, Col } from "react-bootstrap";
import { FaEdit, FaCheckCircle, FaBan, FaEye } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { toggleQuizPublish, updateQuiz } from "./reducer";
import { fetchQuizAttemptsAsync } from "./quizAttemptsReducer";
import type { AppDispatch } from "../../store";
import { API_BASE_URL } from '../../../config';
import type { Quiz, QuizAttempt } from './types';
import { DEFAULT_QUIZ_VALUES } from './types';

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

  // Get the latest attempt (most recent by startTime)
  const latestAttempt = userAttempts.length > 0 ? 
    userAttempts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0] : null;
  
  // Get completed attempts count
  const completedAttempts = userAttempts.filter((a: QuizAttempt) => a.endTime);

  useEffect(() => {
    if (!qid) return;
    
    // First try to get from Redux store for immediate display
    const foundQuiz = quizs.find((q: Quiz) => q._id === qid);
    if (foundQuiz) {
      const quizWithDefaults: Quiz = {
        ...foundQuiz,
        ...DEFAULT_QUIZ_VALUES,
        ...foundQuiz, // Override defaults with actual values
      };
      setQuiz(quizWithDefaults);
    }
    
    // Always fetch fresh data from backend to ensure we have the latest
    fetch(`${API_BASE_URL}/api/quizzes/${qid}?role=${currentUser?.role}`)
      .then(res => res.json())
      .then(freshQuiz => {
        const quizWithDefaults: Quiz = {
          ...DEFAULT_QUIZ_VALUES,
          ...freshQuiz, // Override defaults with backend values
        };
        setQuiz(quizWithDefaults);
        // Update Redux store with fresh data WITH defaults applied
        dispatch(updateQuiz(quizWithDefaults));
      })
      .catch(err => {
        console.error('Failed to fetch fresh quiz data:', err);
        // If fetch fails, keep the Redux store data
      });
  }, [qid, currentUser?.role, dispatch]);

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
        const updatedQuiz = { ...quiz, published: !quiz.published, userRole: currentUser?.role };
        const response = await fetch(`${API_BASE_URL}/api/quizzes/${quiz._id}?role=${currentUser?.role}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedQuiz),
        });
        
              if (response.ok) {
        // Update both Redux and local component state after successful API call
        dispatch(toggleQuizPublish(quiz._id));
        setQuiz((prevQuiz: Quiz | null) => prevQuiz ? { ...prevQuiz, published: !prevQuiz.published } : null);
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
      return quiz.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0);
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
    
    // Check if user has any attempts left (using the completedAttempts already calculated above)
    
    // If multipleAttempts is false, only allow one attempt
    if (!quiz.multipleAttempts && completedAttempts.length > 0) return false;
    
    // If multipleAttempts is true, check if user has used all attempts
    const maxAttempts = quiz.attempts || 1;
    return completedAttempts.length < maxAttempts;
  })();

  // Check if student can start a new attempt (no in-progress attempts)
  const canStartNewAttempt = canTakeQuiz && (!latestAttempt || latestAttempt.endTime);

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "";
    // All dates are now in datetime-local format (YYYY-MM-DDTHH:MM)
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
          {/* Only show Take Quiz button here if student can start new attempt */}
          {isStudent && canStartNewAttempt && (
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
                <td width="70%" className="py-2">{quiz.quizType}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Points</td>
                <td className="py-2">{getTotalPoints()}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Assignment Group</td>
                <td className="py-2">{quiz.assignmentGroup}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Shuffle Answers</td>
                <td className="py-2">{quiz.shuffleAnswers ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Time Limit</td>
                <td className="py-2">{quiz.timeLimit} Minutes</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Multiple Attempts</td>
                <td className="py-2">{quiz.multipleAttempts ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Allowed Attempts</td>
                <td className="py-2">{quiz.attempts}</td>
              </tr>
              <tr>
                <td className="ps-3 py-2">Show Correct Answers</td>
                <td className="py-2">{quiz.showCorrectAnswers}</td>
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
                {latestAttempt ? (
                  <>
                    <h6>Latest Attempt</h6>
                    <div className="d-flex justify-content-between border p-3 rounded bg-light mb-3">
                      <div>
                        <div><strong>Attempt:</strong> {latestAttempt.attemptNumber} of {quiz.attempts}</div>
                        <div><strong>Date:</strong> {new Date(latestAttempt.startTime).toLocaleDateString()}</div>
                        <div><strong>Score:</strong> {latestAttempt.endTime ? 
                          `${latestAttempt.score}/${latestAttempt.totalPoints} (${Math.round((latestAttempt.score / latestAttempt.totalPoints) * 100)}%)` : 
                          "In progress"}
                        </div>
                        <div><strong>Status:</strong> {latestAttempt.endTime ? 
                          <Badge bg="success">Completed</Badge> : 
                          <Badge bg="warning">In progress</Badge>}
                        </div>
                      </div>
                      <div className="d-flex flex-column justify-content-center">
                        {latestAttempt.endTime ? (
                          <Button
                            variant="outline-primary"
                            onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/preview?viewAttempt=${latestAttempt._id}`)}
                          >
                            View Results
                          </Button>
                        ) : (
                          <Button
                            variant="outline-primary"
                            onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/preview`)}
                          >
                            Continue Quiz
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-muted small">
                      Total attempts completed: {completedAttempts.length} of {quiz.attempts}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">You haven't started this quiz yet.</p>
                  </div>
                )}
                
                {canStartNewAttempt && (
                  <div className="d-grid mt-3">
                    <Button 
                      variant="success"
                      onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/preview`)}
                    >
                      {completedAttempts.length === 0 ? "Start Quiz" : "Start New Attempt"}
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