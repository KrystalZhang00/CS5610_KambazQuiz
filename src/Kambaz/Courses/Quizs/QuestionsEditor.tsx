import { useState, useEffect } from "react";
import { Button, Card, Form, Alert, Badge, ListGroup } from "react-bootstrap";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updateQuiz } from "./reducer";

interface Option {
  id: string;
  text: string;
}

interface Question {
  _id: string;
  title: string;
  type: "multiple_choice" | "true_false" | "fill_in_blank";
  points: number;
  question: string;
  correctOption?: string;
  choices?: Option[];
  correctAnswer?: boolean;
  possibleAnswers?: string[];
}

interface Quiz {
  _id: string;
  title: string;
  course: string;
  questions?: Question[];
}

export default function QuestionsEditor() {
  const { cid, qid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { quizs } = useSelector((state: any) => state.quizsReducer);

  const [quiz, setQuiz] = useState<Quiz>({
    _id: qid || "",
    title: "",
    course: cid || "",
    questions: []
  });

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [questionType] = useState<"multiple_choice" | "true_false" | "fill_in_blank">("multiple_choice");

  useEffect(() => {
    const foundQuiz = quizs.find((q: Quiz) => q._id === qid);
    if (foundQuiz) {
      setQuiz(foundQuiz);
    }
  }, [qid, quizs]);

  const handleQuestionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as "multiple_choice" | "true_false" | "fill_in_blank";
    if (!editingQuestion) return;

    let updatedQuestion: Question = {
      ...editingQuestion,
      type
    };

    if (type === "multiple_choice") {
      updatedQuestion = {
        ...updatedQuestion,
        choices: [
          { id: "option1", text: "" },
          { id: "option2", text: "" }
        ],
        correctOption: "option1",
        correctAnswer: undefined,
        possibleAnswers: undefined
      };
    } else if (type === "true_false") {
      updatedQuestion = {
        ...updatedQuestion,
        choices: undefined,
        correctOption: undefined,
        correctAnswer: true,
        possibleAnswers: undefined
      };
    } else {
      updatedQuestion = {
        ...updatedQuestion,
        choices: undefined,
        correctOption: undefined,
        correctAnswer: undefined,
        possibleAnswers: [""]
      };
    }

    setEditingQuestion(updatedQuestion);
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      _id: new Date().getTime().toString(),
      type: questionType,
      title: "New Question",
      points: 10,
      question: "",
      choices: questionType === "multiple_choice" ? [
        { id: "option1", text: "" },
        { id: "option2", text: "" }
      ] : undefined,
      correctOption: questionType === "multiple_choice" ? "option1" : undefined,
      correctAnswer: questionType === "true_false" ? true : undefined,
      possibleAnswers: questionType === "fill_in_blank" ? [""] : undefined
    };
    setEditingQuestion(newQuestion);
  };

  const handleEditQuestion = (questionId: string) => {
    const question = quiz.questions?.find(q => q._id === questionId);
    if (question) {
      setEditingQuestion(question);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions?.filter(q => q._id !== questionId)
    });
    setEditingQuestion(null);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;

    if (!editingQuestion.title.trim()) {
      setErrorMessage("Please enter a question title");
      return;
    }

    if (!editingQuestion.question.trim()) {
      setErrorMessage("Please enter question text");
      return;
    }

    if (editingQuestion.type === "multiple_choice") {
      if (!editingQuestion.choices || editingQuestion.choices.length < 2) {
        setErrorMessage("Please add at least two options");
        return;
      }

      if (editingQuestion.choices.some(opt => !opt.text.trim())) {
        setErrorMessage("Please fill in all option texts");
        return;
      }

      if (!editingQuestion.correctOption) {
        setErrorMessage("Please select a correct option");
        return;
      }
    }

    if (editingQuestion.type === "fill_in_blank") {
      if (!editingQuestion.possibleAnswers || editingQuestion.possibleAnswers.length === 0) {
        setErrorMessage("Please add at least one possible answer");
        return;
      }

      if (editingQuestion.possibleAnswers.some(ans => !ans.trim())) {
        setErrorMessage("Please fill in all possible answers");
        return;
      }
    }

    setErrorMessage("");

    const updatedQuestionList = [...(quiz.questions || [])];
    const existingIndex = updatedQuestionList.findIndex(q => q._id === editingQuestion._id);

    if (existingIndex === -1) {
      updatedQuestionList.push(editingQuestion);
    } else {
      updatedQuestionList[existingIndex] = editingQuestion;
    }

    setQuiz({
      ...quiz,
      questions: updatedQuestionList
    });

    setEditingQuestion(null);
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestion(null);
    setErrorMessage("");
  };

  const handleAddOption = () => {
    if (!editingQuestion?.choices) return;

    const newOptionId = `option${editingQuestion.choices.length + 1}`;
    setEditingQuestion({
      ...editingQuestion,
      choices: [...editingQuestion.choices, { id: newOptionId, text: "" }]
    });
  };

  const handleRemoveOption = (optionId: string) => {
    if (!editingQuestion?.choices) return;

    if (editingQuestion.choices.length <= 2) {
      setErrorMessage("Multiple choice questions must have at least 2 options");
      return;
    }

    setEditingQuestion({
      ...editingQuestion,
      choices: editingQuestion.choices.filter(opt => opt.id !== optionId),
      correctOption: editingQuestion.correctOption === optionId ? editingQuestion.choices[0].id : editingQuestion.correctOption
    });
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    if (!editingQuestion?.choices) return;

    setEditingQuestion({
      ...editingQuestion,
      choices: editingQuestion.choices.map(opt =>
        opt.id === optionId ? { ...opt, text } : opt
      )
    });
  };

  const handleAddPossibleAnswer = () => {
    if (!editingQuestion?.possibleAnswers) return;

    setEditingQuestion({
      ...editingQuestion,
      possibleAnswers: [...editingQuestion.possibleAnswers, ""]
    });
  };

  const handleRemovePossibleAnswer = (index: number) => {
    if (!editingQuestion?.possibleAnswers) return;

    if (editingQuestion.possibleAnswers.length <= 1) {
      setErrorMessage("Fill in the blank questions must have at least one possible answer");
      return;
    }

    setEditingQuestion({
      ...editingQuestion,
      possibleAnswers: editingQuestion.possibleAnswers.filter((_, i) => i !== index)
    });
  };

  const handlePossibleAnswerChange = (index: number, text: string) => {
    if (!editingQuestion?.possibleAnswers) return;

    setEditingQuestion({
      ...editingQuestion,
      possibleAnswers: editingQuestion.possibleAnswers.map((ans, i) =>
        i === index ? text : ans
      )
    });
  };

  const handleSaveQuiz = () => {
    if (!quiz) return;

    const totalPoints = quiz.questions?.reduce((sum, q) => sum + q.points, 0) || 0;

    const updatedQuiz = {
      ...quiz,
      questions: quiz.questions?.length || 0,
      points: totalPoints
    };

    dispatch(updateQuiz(updatedQuiz));
    setSaveMessage("Quiz saved successfully!");
    setTimeout(() => {
      navigate(`/Kambaz/Courses/${cid}/Quizs/${qid}/edit`);
    }, 1500);
  };

  const handleSaveAndPublish = () => {
    if (!quiz) return;

    const totalPoints = quiz.questions?.reduce((sum, q) => sum + q.points, 0) || 0;

    const updatedQuiz = {
      ...quiz,
      questions: quiz.questions?.length || 0,
      points: totalPoints,
      published: true
    };

    dispatch(updateQuiz(updatedQuiz));
    setSaveMessage("Quiz saved and published successfully!");
    setTimeout(() => {
      navigate(`/Kambaz/Courses/${cid}/Quizs`);
    }, 1500);
  };

  const renderQuestionEditor = () => {
    if (!editingQuestion) return null;

    return (
      <Card className="mb-4">
        <Card.Header>
          <h5>Edit Question</h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Question Type</Form.Label>
              <Form.Select 
                value={editingQuestion.type} 
                onChange={handleQuestionTypeChange}
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="fill_in_blank">Fill in the Blank</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter title"
                value={editingQuestion.title}
                onChange={(e) => setEditingQuestion({...editingQuestion, title: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Points</Form.Label>
              <Form.Control 
                type="number"
                min="1"
                value={editingQuestion.points}
                onChange={(e) => setEditingQuestion({...editingQuestion, points: parseInt(e.target.value) || 0})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Question Text</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editingQuestion.question}
                onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                placeholder="Enter your question here..."
              />
            </Form.Group>

            {/* Multiple Choice Options */}
            {editingQuestion.type === "multiple_choice" && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label>Options</Form.Label>
                  <Button variant="outline-primary" size="sm" onClick={handleAddOption}>
                    <FaPlus className="me-1" /> Add Option
                  </Button>
                </div>

                {editingQuestion.choices?.map((option) => (
                  <div key={option.id} className="d-flex align-items-center mb-2">
                    <Form.Check
                      type="radio"
                      id={`correct-${option.id}`}
                      name="correctOption"
                      checked={editingQuestion.correctOption === option.id}
                      onChange={() => setEditingQuestion({...editingQuestion, correctOption: option.id})}
                      label="Correct"
                      className="me-2 w-25"
                    />
                    <Form.Control
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                      placeholder="Enter option text"
                      className="flex-grow-1 me-2"
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveOption(option.id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* True/False */}
            {editingQuestion.type === "true_false" && (
              <div className="mb-3">
                <Form.Label>Correct Answer</Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    id="true"
                    name="correctTrueFalse"
                    label="True"
                    checked={editingQuestion.correctAnswer === true}
                    onChange={() => setEditingQuestion({...editingQuestion, correctAnswer: true})}
                    className="mb-2"
                  />
                  <Form.Check
                    type="radio"
                    id="false"
                    name="correctTrueFalse"
                    label="False"
                    checked={editingQuestion.correctAnswer === false}
                    onChange={() => setEditingQuestion({...editingQuestion, correctAnswer: false})}
                  />
                </div>
              </div>
            )}

            {/* Fill in the Blank */}
            {editingQuestion.type === "fill_in_blank" && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label>Possible Answers</Form.Label>
                  <Button variant="outline-primary" size="sm" onClick={handleAddPossibleAnswer}>
                    <FaPlus className="me-1" /> Add Answer
                  </Button>
                </div>

                {editingQuestion.possibleAnswers?.map((answer, index) => (
                  <div key={index} className="d-flex align-items-center mb-2">
                    <Form.Control 
                      type="text"
                      value={answer}
                      onChange={(e) => handlePossibleAnswerChange(index, e.target.value)}
                      placeholder="Enter possible answer"
                      className="flex-grow-1 me-2"
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemovePossibleAnswer(index)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Form>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-end">
          <Button variant="secondary" className="me-2" onClick={handleCancelEditQuestion}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveQuestion}>
            Save Question
          </Button>
        </Card.Footer>
      </Card>
    );
  };

  const renderQuestionList = () => {
    if (!quiz.questions?.length) {
      return (
        <Alert variant="info">
          No questions yet. Click "Add Question" to create your first question.
        </Alert>
      );
    }

    return (
      <ListGroup className="mb-4">
        {quiz.questions.map((question) => (
          <ListGroup.Item 
            key={question._id}
            className="d-flex justify-content-between align-items-center"
          >
            <div>
              <h6 className="mb-1">{question.title}</h6>
              <div className="text-muted small">
                {question.type === "multiple_choice" ? "Multiple Choice" :
                 question.type === "true_false" ? "True/False" :
                 "Fill in the Blank"} • {question.points} points
              </div>
            </div>
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => handleEditQuestion(question._id)}
              >
                <FaEdit />
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDeleteQuestion(question._id)}
              >
                <FaTrash />
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Edit Quiz</h3>
        <div>
          <Link to={`/Kambaz/Courses/${cid}/Quizs`}>
            <Button variant="secondary" className="me-2">Cancel</Button>
          </Link>
          <Button variant="primary" className="me-2" onClick={handleSaveQuiz}>Save</Button>
          <Button variant="success" onClick={handleSaveAndPublish}>Save & Publish</Button>
        </div>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <Link 
            className="nav-link" 
            to={`/Kambaz/Courses/${cid}/Quizs/${qid}/edit`}
          >
            Details
          </Link>
        </li>
        <li className="nav-item">
          <Link 
            className="nav-link active" 
            to={`/Kambaz/Courses/${cid}/Quizs/${qid}/questions`}
          >
            Questions
          </Link>
        </li>
      </ul>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5>Questions <Badge bg="secondary">{quiz.questions?.length || 0}</Badge></h5>
          <div className="text-muted">
            Total Points: {quiz.questions?.reduce((sum, q) => sum + q.points, 0) || 0}
          </div>
        </div>
        <Button 
          variant="success"
          onClick={handleAddQuestion}
          disabled={!!editingQuestion}
        >
          <FaPlus className="me-1" /> Add Question
        </Button>
      </div>

      {errorMessage && (
        <Alert variant="danger" className="mb-3">
          {errorMessage}
        </Alert>
      )}

      {saveMessage && (
        <Alert variant="success" className="mb-3">
          {saveMessage}
        </Alert>
      )}

      {renderQuestionEditor()}
      {!editingQuestion && renderQuestionList()}
    </div>
  );
}