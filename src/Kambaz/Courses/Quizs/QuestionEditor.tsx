import { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Row, Col } from "react-bootstrap";
import { FaTrash, FaPlus } from "react-icons/fa";

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

interface QuestionEditorProps {
  question?: Question;
  type: "multiple_choice" | "true_false" | "fill_in_blank";
  onSave: (question: Question) => void;
  onCancel: () => void;
}

export default function QuestionEditor({ question, type, onSave, onCancel }: QuestionEditorProps) {
  const [formData, setFormData] = useState<Question>({
    type,
    title: "",
    points: 1,
    question: "",
    choices: [
      { id: "option1", text: "" },
      { id: "option2", text: "" }
    ],
    correctOption: "option1",
    correctAnswer: true,
    possibleAnswers: [""]
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (question) {
      const choices = question.choices || [
        { id: "option1", text: "" },
        { id: "option2", text: "" }
      ];
      // Ensure correctOption is set to a valid choice ID
      const correctOption = question.correctOption && choices.some(c => c.id === question.correctOption) 
        ? question.correctOption 
        : choices[0]?.id;
      
      setFormData({
        ...question,
        choices,
        correctOption,
        possibleAnswers: question.possibleAnswers || [""]
      });
    } else {
      setFormData(prev => ({
        ...prev,
        type
      }));
    }
  }, [question, type]);

  const handleFieldChange = (field: keyof Question, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...(formData.choices || [])];
    // Auto-generate ID based on text, but keep existing ID if text is just being updated
    const choiceId = newChoices[index].id || `option${index + 1}`;
    newChoices[index] = { 
      id: choiceId,
      text: value 
    };
    setFormData(prev => ({ ...prev, choices: newChoices }));
  };

  const handleCorrectOptionChange = (choiceId: string) => {
    setFormData(prev => ({ ...prev, correctOption: choiceId }));
  };

  const addChoice = () => {
    const newChoices = [...(formData.choices || [])];
    const newId = `option${newChoices.length + 1}`;
    newChoices.push({ id: newId, text: "" });
    setFormData(prev => ({ ...prev, choices: newChoices }));
  };

  const removeChoice = (index: number) => {
    const newChoices = formData.choices?.filter((_, i) => i !== index) || [];
    // If we removed the currently selected correct option, select the first remaining option
    const removedChoice = formData.choices?.[index];
    let newCorrectOption = formData.correctOption;
    if (removedChoice && formData.correctOption === removedChoice.id && newChoices.length > 0) {
      newCorrectOption = newChoices[0].id;
    }
    setFormData(prev => ({ 
      ...prev, 
      choices: newChoices,
      correctOption: newCorrectOption
    }));
  };

  const handlePossibleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...(formData.possibleAnswers || [])];
    newAnswers[index] = value;
    setFormData(prev => ({ ...prev, possibleAnswers: newAnswers }));
  };

  const addPossibleAnswer = () => {
    const newAnswers = [...(formData.possibleAnswers || [])];
    newAnswers.push("");
    setFormData(prev => ({ ...prev, possibleAnswers: newAnswers }));
  };

  const removePossibleAnswer = (index: number) => {
    const newAnswers = formData.possibleAnswers?.filter((_, i) => i !== index) || [];
    setFormData(prev => ({ ...prev, possibleAnswers: newAnswers }));
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) {
      newErrors.push("Question title is required");
    }

    if (!formData.question.trim()) {
      newErrors.push("Question text is required");
    }

    if (formData.points <= 0) {
      newErrors.push("Points must be greater than 0");
    }

    if (formData.type === "multiple_choice") {
      if (!formData.choices || formData.choices.length < 2) {
        newErrors.push("At least 2 choices are required for multiple choice questions");
      }
      if (!formData.correctOption) {
        newErrors.push("A correct option must be selected");
      }
      if (formData.correctOption && !formData.choices?.some(choice => choice.id === formData.correctOption)) {
        newErrors.push("The selected correct option does not match any choice");
      }
      if (formData.choices?.some(choice => !choice.text.trim())) {
        newErrors.push("All choices must have text");
      }
    }

    if (formData.type === "fill_in_blank") {
      if (!formData.possibleAnswers || formData.possibleAnswers.length === 0) {
        newErrors.push("At least one possible answer is required for fill in the blank questions");
      }
      if (formData.possibleAnswers?.some(answer => !answer.trim())) {
        newErrors.push("All possible answers must have text");
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const questionToSave: Question = {
      ...formData,
      _id: question?._id || new Date().getTime().toString(),
    };

    onSave(questionToSave);
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case "multiple_choice":
        return (
          <Card className="mb-3">
            <Card.Header>Choices</Card.Header>
            <Card.Body>
              {formData.choices?.map((choice, index) => (
                <Row key={index} className="mb-2 align-items-center">
                  <Col xs={1}>
                    <Form.Check
                      type="radio"
                      name="correctChoice"
                      checked={formData.correctOption === choice.id}
                      onChange={() => handleCorrectOptionChange(choice.id)}
                    />
                  </Col>
                  <Col xs={10}>
                    <Form.Control
                      type="text"
                      placeholder={`Choice ${index + 1} (e.g., Alice, Bruce, Ray, Leo)`}
                      value={choice.text}
                      onChange={(e) => handleChoiceChange(index, e.target.value)}
                    />
                  </Col>
                  <Col xs={1}>
                    {formData.choices && formData.choices.length > 2 && (
                      <Button variant="outline-danger" size="sm" onClick={() => removeChoice(index)}>
                        <FaTrash />
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
              <Button variant="outline-primary" size="sm" onClick={addChoice}>
                <FaPlus className="me-1" /> Add Choice
              </Button>
            </Card.Body>
          </Card>
        );

      case "true_false":
        return (
          <Card className="mb-3">
            <Card.Header>Correct Answer</Card.Header>
            <Card.Body>
              <Form.Check
                type="radio"
                label="True"
                name="correctAnswer"
                checked={formData.correctAnswer === true}
                onChange={() => handleFieldChange('correctAnswer', true)}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                label="False"
                name="correctAnswer"
                checked={formData.correctAnswer === false}
                onChange={() => handleFieldChange('correctAnswer', false)}
              />
            </Card.Body>
          </Card>
        );

      case "fill_in_blank":
        return (
          <Card className="mb-3">
            <Card.Header>Possible Correct Answers</Card.Header>
            <Card.Body>
              {formData.possibleAnswers?.map((answer, index) => (
                <Row key={index} className="mb-2 align-items-center">
                  <Col xs={11}>
                    <Form.Control
                      type="text"
                      placeholder={`Possible answer ${index + 1}`}
                      value={answer}
                      onChange={(e) => handlePossibleAnswerChange(index, e.target.value)}
                    />
                  </Col>
                  <Col xs={1}>
                    {formData.possibleAnswers && formData.possibleAnswers.length > 1 && (
                      <Button variant="outline-danger" size="sm" onClick={() => removePossibleAnswer(index)}>
                        <FaTrash />
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
              <Button variant="outline-primary" size="sm" onClick={addPossibleAnswer}>
                <FaPlus className="me-1" /> Add Answer
              </Button>
            </Card.Body>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Form onSubmit={handleSave}>
      {errors.length > 0 && (
        <Alert variant="danger" className="mb-3">
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Card className="mb-3">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Question Title</Form.Label>
            <Form.Control
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Enter question title"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Question Text</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.question}
              onChange={(e) => handleFieldChange('question', e.target.value)}
              placeholder="Enter your question"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Points</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={formData.points}
              onChange={(e) => handleFieldChange('points', parseInt(e.target.value) || 1)}
              required
            />
          </Form.Group>
        </Card.Body>
      </Card>

      {renderTypeSpecificFields()}

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {question ? "Update Question" : "Save Question"}
        </Button>
      </div>
    </Form>
  );
} 