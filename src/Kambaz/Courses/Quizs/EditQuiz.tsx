import { useState, useEffect } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Form, Button, Card, Badge, CloseButton, Alert, Row, Col, Tabs, Tab } from "react-bootstrap";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updateQuiz, addQuiz } from "./reducer";
import QuestionsList from "./QuestionsList";
import { API_BASE_URL } from '../../../config';

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
  questions: any[];
  timeLimit?: number;
  attempts?: number;
  quizType?: string;
  assignmentGroup?: string;
  shuffleAnswers?: boolean;
  multipleAttempts?: boolean;
  showCorrectAnswers?: string;
  accessCode?: string;
  oneQuestionAtTime?: boolean;
  webcamRequired?: boolean;
  lockQuestionsAfterAnswering?: boolean;
}

export default function EditQuiz() {
  const { cid, qid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const { quizs } = useSelector((state: any) => state.quizsReducer);
  const [assignees, setAssignees] = useState<string[]>(["Everyone"]);
  const [input, setInput] = useState("");
  const [quiz, setQuiz] = useState<Quiz>({
    _id: "",
    title: "",
    course: cid || "",
    description: "",
    points: 100,
    dueDate: "",
    availableFrom: "",
    availableUntil: "",
    published: false,
    questions: [],
    timeLimit: 0,
    attempts: 1,
    quizType: "practice_quiz",
    assignmentGroup: "quizzes",
    shuffleAnswers: false,
    multipleAttempts: false,
    showCorrectAnswers: "never",
    accessCode: "",
    oneQuestionAtTime: false,
    webcamRequired: false,
    lockQuestionsAfterAnswering: false
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
      setQuiz(foundQuiz);
    } else if (isNewQuiz) {
      setQuiz({
        _id: new Date().getTime().toString(),
        title: "New Quiz",
        course: cid || "",
        description: "",
        points: 100,
        dueDate: "",
        availableFrom: "",
        availableUntil: "",
        published: false,
        questions: [],
        timeLimit: 20,
        attempts: 1,
        quizType: "Graded Quiz",
        assignmentGroup: "Quizzes",
        shuffleAnswers: true,
        multipleAttempts: false,
        showCorrectAnswers: "Immediately",
        accessCode: "",
        oneQuestionAtTime: true,
        webcamRequired: false,
        lockQuestionsAfterAnswering: false
      });
    }
  }, [qid, isNewQuiz, foundQuiz, cid]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      if (!assignees.includes(input.trim())) {
        setAssignees([...assignees, input.trim()]);
      }
      setInput("");
    }
  };

  const handleRemove = (name: string) => {
    setAssignees(assignees.filter((a) => a !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qid) {
      // Update quiz via backend API
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${qid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz),
      });
      if (response.ok) {
        const updatedQuiz = await response.json();
        // Update Redux store with the latest data from backend
        dispatch(updateQuiz(updatedQuiz));
        navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}`);
      } else {
        alert('Failed to update quiz');
      }
    } else {
      // Create new quiz via backend API
      const response = await fetch(`${API_BASE_URL}/api/courses/${cid}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz),
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
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: [...(prevQuiz.questions || []), newQuestion]
    }));
  };

  // Handler to edit a question
  const handleEditQuestion = (updatedQuestion: any) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: (prevQuiz.questions || []).map(q => q._id === updatedQuestion._id ? updatedQuestion : q)
    }));
  };

  // Handler to delete a question
  const handleDeleteQuestion = (questionId: string) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: (prevQuiz.questions || []).filter(q => q._id !== questionId)
    }));
  };

  if (!canEdit) {
    return <Navigate to={`/Kambaz/Courses/${cid}/Quizs`} />;
  }

  if (!isNewQuiz && !quiz) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{isNewQuiz ? "Create New Quiz" : "Edit Quiz"}</h3>
        <div>
          <Button variant="secondary" className="me-2" onClick={handleCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Save</Button>
          <Button variant="success" className="ms-2" onClick={handleSaveAndPublish}>Save & Publish</Button>
        </div>
      </div>

      {saveMessage && (
        <Alert variant="success" className="mb-3">
          {saveMessage}
        </Alert>
      )}

      <Tabs 
        activeKey={activeTab} 
        onSelect={(k) => setActiveTab(k || "details")} 
        className="mb-3"
      >
        <Tab eventKey="details" title="Details">
          <Form onSubmit={handleSubmit}>
            <Card className="mb-4">
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Quiz Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={quiz.title}
                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={quiz.description || ""}
                    onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                    placeholder="Enter quiz description..."
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        checked={quiz.timeLimit !== undefined && quiz.timeLimit > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setQuiz({ ...quiz, timeLimit: 20 });
                          } else {
                            setQuiz({ ...quiz, timeLimit: 0 });
                          }
                        }}
                        label="Enable Time Limit"
                        className="mb-2"
                      />
                      {quiz.timeLimit !== undefined && quiz.timeLimit > 0 && (
                        <div>
                          <Form.Label>Time Limit (minutes)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={quiz.timeLimit}
                            onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) })}
                          />
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Points</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={quiz.points || 100}
                        onChange={(e) => setQuiz({ ...quiz, points: parseInt(e.target.value) })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Multiple Attempts</Form.Label>
                      <Form.Check
                        type="switch"
                        checked={quiz.multipleAttempts}
                        onChange={(e) => setQuiz({ ...quiz, multipleAttempts: e.target.checked })}
                        label="Allow multiple attempts"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    {quiz.multipleAttempts && (
                      <Form.Group className="mb-3">
                        <Form.Label>Number of Attempts</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={quiz.attempts || 1}
                          onChange={(e) => setQuiz({ ...quiz, attempts: parseInt(e.target.value) })}
                        />
                      </Form.Group>
                    )}
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Show Correct Answers</Form.Label>
                      <Form.Select
                        value={quiz.showCorrectAnswers}
                        onChange={(e) => setQuiz({ ...quiz, showCorrectAnswers: e.target.value })}
                      >
                        <option value="never">Never</option>
                        <option value="immediately">Immediately</option>
                        <option value="after_due_date">After Due Date</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Access Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={quiz.accessCode || ""}
                        onChange={(e) => setQuiz({ ...quiz, accessCode: e.target.value })}
                        placeholder="Optional"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Due Date</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={quiz.dueDate || ""}
                        onChange={(e) => setQuiz({ ...quiz, dueDate: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Available From</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={quiz.availableFrom || ""}
                        onChange={(e) => setQuiz({ ...quiz, availableFrom: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Available Until</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={quiz.availableUntil || ""}
                        onChange={(e) => setQuiz({ ...quiz, availableUntil: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        checked={quiz.oneQuestionAtTime}
                        onChange={(e) => setQuiz({ ...quiz, oneQuestionAtTime: e.target.checked })}
                        label="One Question at a Time"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        checked={quiz.shuffleAnswers}
                        onChange={(e) => setQuiz({ ...quiz, shuffleAnswers: e.target.checked })}
                        label="Shuffle Answers"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        checked={quiz.lockQuestionsAfterAnswering}
                        onChange={(e) => setQuiz({ ...quiz, lockQuestionsAfterAnswering: e.target.checked })}
                        label="Lock Questions After Answering"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>Assign</Card.Header>
              <Card.Body>
                <Form.Label className="mb-2">Assign to</Form.Label>
                <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
                  {assignees.map((name) => (
                    <Badge bg="secondary" key={name} className="d-flex align-items-center">
                      {name}
                      <CloseButton onClick={() => handleRemove(name)} className="ms-1" />
                    </Badge>
                  ))}
                  <Form.Control
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Add assignee and press Enter or ,"
                    className="border-0 shadow-none flex-grow-1"
                    style={{ minWidth: 120, maxWidth: 200 }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Form>
        </Tab>
        
        <Tab eventKey="questions" title="Questions">
          <QuestionsList
            questions={Array.isArray(quiz.questions) ? quiz.questions : []}
            onAddQuestion={handleAddQuestion}
            onEditQuestion={handleEditQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </Tab>
      </Tabs>
    </div>
  );
}