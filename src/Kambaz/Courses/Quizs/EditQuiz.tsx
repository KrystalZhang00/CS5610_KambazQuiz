import React, { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Row, Col, Tabs, Tab } from "react-bootstrap";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updateQuiz, addQuiz } from "./reducer";
import QuestionsList from "./QuestionsList";
import { API_BASE_URL } from '../../../config';
import type { Quiz } from './types';
import { DEFAULT_QUIZ_VALUES } from './types';

export default function EditQuiz() {
  const { cid, qid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const { quizs } = useSelector((state: any) => state.quizsReducer);
  const [quiz, setQuiz] = useState<Quiz>({
    _id: "",
    title: "",
    course: cid || "",
    description: "",
    questions: [],
    ...DEFAULT_QUIZ_VALUES
  });
  const [saveMessage] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  // Check if this is a new quiz
  const foundQuiz = quizs.find((q: Quiz) => q._id === qid);
  const isNewQuiz = !foundQuiz;

  // Check if current user has edit permissions (FACULTY or ADMIN)
  const canEdit = currentUser?.role === "FACULTY" || currentUser?.role === "ADMIN";

  useEffect(() => {
    if (!isNewQuiz && foundQuiz) {
      setQuiz({
        ...DEFAULT_QUIZ_VALUES,
        ...foundQuiz
      });
    } else if (isNewQuiz) {
      setQuiz({
        _id: new Date().getTime().toString(),
        title: "New Quiz",
        course: cid || "",
        description: "",
        questions: [],
        ...DEFAULT_QUIZ_VALUES
      });
    }
  }, [qid, isNewQuiz, foundQuiz, cid]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qid) {
      // Update quiz via backend API
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${qid}?role=${currentUser?.role}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quiz, userRole: currentUser?.role }),
      });
      if (response.ok) {
        const updatedQuiz = await response.json();
        // Update Redux store with the latest data from backend
        dispatch(updateQuiz(updatedQuiz));
        // Update local component state with backend response
        setQuiz(updatedQuiz);
        navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}`);
      } else {
        alert('Failed to update quiz');
      }
    } else {
      // Create new quiz via backend API
      const response = await fetch(`${API_BASE_URL}/api/courses/${cid}/quizzes?role=${currentUser?.role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quiz, userRole: currentUser?.role }),
      });
      if (response.ok) {
        const newQuiz = await response.json();
        // Add new quiz to Redux store
        dispatch(addQuiz(newQuiz));
        // Navigate to the new quiz's details page
        navigate(`/Kambaz/Courses/${cid}/Quizs/${newQuiz._id}`);
      } else {
        alert('Failed to create quiz');
      }
    }
  };

  const handleSaveAndPublish = async () => {
    const publishedQuiz = { ...quiz, published: true };
    if (qid) {
      // Update quiz via backend API
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${qid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishedQuiz),
      });
      if (response.ok) {
        const updatedQuiz = await response.json();
        // Update Redux store with the latest data from backend
        dispatch(updateQuiz(updatedQuiz));
        // Update local component state with backend response
        setQuiz(updatedQuiz);
        navigate(`/Kambaz/Courses/${cid}/Quizs`);
      } else {
        alert('Failed to update quiz');
      }
    } else {
      // Create new published quiz via backend API
      const response = await fetch(`${API_BASE_URL}/api/courses/${cid}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishedQuiz),
      });
      if (response.ok) {
        navigate(`/Kambaz/Courses/${cid}/Quizs`);
      } else {
        alert('Failed to create quiz');
      }
    }
  };

  const handleCancel = () => {
    navigate(`/Kambaz/Courses/${cid}/Quizs`);
  };

  // Handler to add a question
  const handleAddQuestion = (newQuestion: any) => {
    setQuiz((prevQuiz: Quiz) => ({
      ...prevQuiz,
      questions: [...(prevQuiz.questions || []), newQuestion]
    }));
  };

  // Handler to edit a question
  const handleEditQuestion = (updatedQuestion: any) => {
    setQuiz((prevQuiz: Quiz) => ({
      ...prevQuiz,
      questions: (prevQuiz.questions || []).map((q: any) => 
        q._id === updatedQuestion._id ? updatedQuestion : q
      )
    }));
  };

  // Handler to delete a question
  const handleDeleteQuestion = (questionId: string) => {
    setQuiz((prevQuiz: Quiz) => ({
      ...prevQuiz,
      questions: (prevQuiz.questions || []).filter((q: any) => q._id !== questionId)
    }));
  };

  if (!canEdit) {
    return <Navigate to={`/Kambaz/Courses/${cid}/Quizs`} replace />;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{isNewQuiz ? "New Quiz" : "Edit Quiz"}</h2>
        <div>
          <Button variant="outline-secondary" className="me-2" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="outline-primary" className="me-2" onClick={handleSubmit}>
            Save
          </Button>
          <Button variant="primary" onClick={handleSaveAndPublish}>
            Save & Publish
          </Button>
        </div>
      </div>

      {saveMessage && (
        <Alert variant="success" className="mb-3">
          {saveMessage}
        </Alert>
      )}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || "details")} className="mb-3">
        <Tab eventKey="details" title="Details">
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Quiz Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={quiz.title}
                        onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label>Quiz Instructions</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={quiz.description || ""}
                        onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Quiz Type</Form.Label>
                      <Form.Select
                        value={quiz.quizType}
                        onChange={(e) => setQuiz({ ...quiz, quizType: e.target.value })}
                      >
                        <option value="Graded Quiz">Graded Quiz</option>
                        <option value="Practice Quiz">Practice Quiz</option>
                        <option value="Graded Survey">Graded Survey</option>
                        <option value="Ungraded Survey">Ungraded Survey</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Assignment Group</Form.Label>
                      <Form.Select
                        value={quiz.assignmentGroup}
                        onChange={(e) => setQuiz({ ...quiz, assignmentGroup: e.target.value })}
                      >
                        <option value="Quizzes">Quizzes</option>
                        <option value="Exams">Exams</option>
                        <option value="Assignments">Assignments</option>
                        <option value="Project">Project</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Check
                        type="switch"
                        id="time-limit-switch"
                        label="Time Limit"
                        checked={quiz.timeLimit !== undefined && quiz.timeLimit > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setQuiz({ ...quiz, timeLimit: 20 });
                          } else {
                            setQuiz({ ...quiz, timeLimit: 0 });
                          }
                        }}
                      />
                      {quiz.timeLimit !== undefined && quiz.timeLimit > 0 && (
                        <Form.Control
                          type="number"
                          min="1"
                          value={quiz.timeLimit}
                          onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) || 20 })}
                          className="mt-2"
                          placeholder="Minutes"
                        />
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Points</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={quiz.points || 100}
                        onChange={(e) => setQuiz({ ...quiz, points: parseInt(e.target.value) || 100 })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Check
                        type="switch"
                        id="multiple-attempts-switch"
                        label="Allow Multiple Attempts"
                        checked={quiz.multipleAttempts}
                        onChange={(e) => setQuiz({ ...quiz, multipleAttempts: e.target.checked })}
                      />
                      {quiz.multipleAttempts && (
                        <Form.Control
                          type="number"
                          min="1"
                          value={quiz.attempts || 1}
                          onChange={(e) => setQuiz({ ...quiz, attempts: parseInt(e.target.value) || 1 })}
                          className="mt-2"
                          placeholder="Number of attempts"
                        />
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Show Correct Answers</Form.Label>
                      <Form.Select
                        value={quiz.showCorrectAnswers}
                        onChange={(e) => setQuiz({ ...quiz, showCorrectAnswers: e.target.value })}
                      >
                        <option value="Immediately">Immediately</option>
                        <option value="Never">Never</option>
                        <option value="After Due Date">After Due Date</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label>Access Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={quiz.accessCode || ""}
                        onChange={(e) => setQuiz({ ...quiz, accessCode: e.target.value })}
                        placeholder="Leave blank for no access code"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Due Date</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={quiz.dueDate || ""}
                        onChange={(e) => setQuiz({ ...quiz, dueDate: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Available From</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={quiz.availableFrom || ""}
                        onChange={(e) => setQuiz({ ...quiz, availableFrom: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Available Until</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={quiz.availableUntil || ""}
                        onChange={(e) => setQuiz({ ...quiz, availableUntil: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Check
                      type="switch"
                      id="one-question-switch"
                      label="One Question at a Time"
                      checked={quiz.oneQuestionAtTime}
                      onChange={(e) => setQuiz({ ...quiz, oneQuestionAtTime: e.target.checked })}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="switch"
                      id="shuffle-answers-switch"
                      label="Shuffle Answers"
                      checked={quiz.shuffleAnswers}
                      onChange={(e) => setQuiz({ ...quiz, shuffleAnswers: e.target.checked })}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="switch"
                      id="lock-questions-switch"
                      label="Lock Questions After Answering"
                      checked={quiz.lockQuestionsAfterAnswering}
                      onChange={(e) => setQuiz({ ...quiz, lockQuestionsAfterAnswering: e.target.checked })}
                    />
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Check
                      type="switch"
                      id="webcam-required-switch"
                      label="Webcam Required"
                      checked={quiz.webcamRequired}
                      onChange={(e) => setQuiz({ ...quiz, webcamRequired: e.target.checked })}
                    />
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="questions" title="Questions">
          <QuestionsList
            questions={quiz.questions || []}
            onAddQuestion={handleAddQuestion}
            onEditQuestion={handleEditQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </Tab>
      </Tabs>
    </div>
  );
}