import { useState } from "react";
import { Button, Card, ListGroup, Badge, Modal, Form } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaQuestionCircle } from "react-icons/fa";
import QuestionEditor from "./QuestionEditor";

interface Question {
  _id?: string;
  type: "multiple_choice" | "true_false" | "fill_in_blank";
  title: string;
  points: number;
  question: string;
  choices?: { id: string; text: string }[];
  correctOption?: string;
  correctAnswer?: boolean;
  possibleAnswers?: string[];
}

interface QuestionsListProps {
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
}

export default function QuestionsList({ questions, onAddQuestion, onEditQuestion, onDeleteQuestion }: QuestionsListProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [questionType, setQuestionType] = useState<Question["type"]>("multiple_choice");

  const totalPoints = questions.reduce((sum: number, q: Question) => sum + q.points, 0);

  const handleAddQuestion = () => {
    setEditingQuestion(undefined);
    setShowEditor(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionType(question.type);
    setShowEditor(true);
  };

  const handleSaveQuestion = (question: Question) => {
    if (question._id && editingQuestion) {
      onEditQuestion({ ...question, type: editingQuestion.type });
    } else {
      const newQuestion = {
        ...question,
        type: questionType,
        _id: new Date().getTime().toString(),
      };
      onAddQuestion(newQuestion);
    }
    setShowEditor(false);
    setEditingQuestion(undefined);
  };

  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (questionToDelete) {
      onDeleteQuestion(questionToDelete._id!);
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
          case "multiple_choice":
      return "Multiple Choice";
    case "true_false":
      return "True/False";
    case "fill_in_blank":
      return "Fill in the Blank";
      default:
        return type;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "primary";
      case "true_false":
        return "success";
      case "fill_in_blank":
        return "warning";
      default:
        return "secondary";
    }
  };

  if (showEditor) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>{editingQuestion ? "Edit Question" : "Add New Question"}</h4>
          {!editingQuestion && (
            <Form.Select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as Question["type"])}
              className="w-auto"
            >
                                      <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                        <option value="fill_in_blank">Fill in the Blank</option>
            </Form.Select>
          )}
        </div>
        <QuestionEditor
          question={editingQuestion}
          type={questionType}
          onSave={handleSaveQuestion}
          onCancel={() => {
            setShowEditor(false);
            setEditingQuestion(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4>Questions</h4>
          <p className="text-muted mb-0">
            Total Points: <strong>{totalPoints}</strong> | Total Questions: <strong>{questions.length}</strong>
          </p>
        </div>
        <Button variant="primary" onClick={handleAddQuestion}>
          <FaPlus className="me-2" />
          New Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <FaQuestionCircle className="text-muted mb-3" size={48} />
            <h5 className="text-muted">No Questions Yet</h5>
            <p className="text-muted">Click "New Question" to add your first question to this quiz.</p>
            <Button variant="primary" onClick={handleAddQuestion}>
              <FaPlus className="me-2" />
              Add First Question
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <ListGroup>
          {questions.map((question: Question, index: number) => (
            <ListGroup.Item key={question._id} className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-2">
                  <Badge bg={getQuestionTypeColor(question.type)} className="me-2">
                    {getQuestionTypeLabel(question.type)}
                  </Badge>
                  <Badge bg="secondary" className="me-2">
                    {question.points} pts
                  </Badge>
                  <span className="text-muted">Question {index + 1}</span>
                </div>
                <h6 className="mb-2">{question.title}</h6>
                <div className="text-muted small">
                  {question.question.length > 100 
                    ? `${question.question.substring(0, 100)}...` 
                    : question.question}
                </div>
                                        {question.type === "multiple_choice" && question.choices && (
                  <div className="mt-2">
                    <small className="text-muted">
                      {question.choices.length} choices
                    </small>
                  </div>
                )}
                {question.type === "fill_in_blank" && question.possibleAnswers && (
                  <div className="mt-2">
                    <small className="text-muted">
                      {question.possibleAnswers.length} possible answers
                    </small>
                  </div>
                )}
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleEditQuestion(question)}
                >
                  <FaEdit />
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteQuestion(question)}
                >
                  <FaTrash />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the question "{questionToDelete?.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
} 