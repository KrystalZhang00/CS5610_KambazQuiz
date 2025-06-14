import { useState, useEffect } from "react";
import { FaPlus, FaCheckCircle, FaTrash, FaEdit, FaBan, FaEllipsisV, FaCopy } from "react-icons/fa";
import { BsQuestionCircle } from "react-icons/bs";
import { Button, Modal, Dropdown, Form } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { deleteQuiz, addQuiz, toggleQuizPublish, setQuizs } from "./reducer";
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
  questions?: any[];
  timeLimit?: number;
  attempts?: number;
}

export default function Quizs() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { quizs } = useSelector((state: any) => state.quizsReducer);
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const { courses } = useSelector((state: any) => state.coursesReducer || { courses: [] });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [quizToCopy, setQuizToCopy] = useState<Quiz | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "dueDate" | "availableDate">("availableDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!cid || !currentUser) return;
    // Fetch quizzes from backend API with role-based filtering
    const url = new URL(`${API_BASE_URL}/api/courses/${cid}/quizzes`);
    url.searchParams.append('role', currentUser.role);
    
    fetch(url.toString())
      .then(res => res.json())
      .then(data => {
        // No mapping to questionList, just use questions
        const quizzes = data.map((quiz: any) => ({
          ...quiz,
          questions: Array.isArray(quiz.questions) ? quiz.questions : [],
        }));
        dispatch(setQuizs(quizzes));
      })
      .catch(err => {
        console.error('Failed to fetch quizzes:', err);
        dispatch(setQuizs([]));
      });
  }, [cid, currentUser, dispatch]);

  // 获取当前课程的测验列表 (backend already filters by role)
  const courseQuizs = quizs.filter((quiz: Quiz) => quiz.course === cid);

  // 排序测验列表
  const sortedQuizs = [...courseQuizs].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortBy === "dueDate") {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    } else {
      const dateA = a.availableFrom ? new Date(a.availableFrom).getTime() : 0;
      const dateB = b.availableFrom ? new Date(b.availableFrom).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
  });

  const handleDeleteQuiz = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = async () => {
    if (quizToDelete) {
      try {
        // Delete quiz via backend API
        const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizToDelete._id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          // Only update local state after successful API call
          dispatch(deleteQuiz(quizToDelete._id));
          setShowDeleteModal(false);
          setQuizToDelete(null);
        } else {
          alert('Failed to delete quiz');
        }
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Failed to delete quiz');
      }
    }
  };

  const handlePublishToggle = async (quiz: Quiz) => {
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
  };

  const handleCopyQuiz = (quiz: Quiz) => {
    setQuizToCopy(quiz);
    setShowCopyModal(true);
  };

  const confirmCopyQuiz = () => {
    if (quizToCopy && selectedCourse) {
      const newQuiz = {
        ...quizToCopy,
        _id: new Date().getTime().toString(),
        course: selectedCourse,
        title: `${quizToCopy.title} (Copy)`,
        published: false
      };
      dispatch(addQuiz(newQuiz));
      setShowCopyModal(false);
      setQuizToCopy(null);
      setSelectedCourse("");
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${month} ${day} at ${time}`;
  };

  // 获取测验状态
  const getQuizStatus = (quiz: Quiz) => {
    const now = new Date();
    const dueDate = quiz.dueDate ? new Date(quiz.dueDate) : null;
    const availableFrom = quiz.availableFrom ? new Date(quiz.availableFrom) : null;
    const availableUntil = quiz.availableUntil ? new Date(quiz.availableUntil) : null;

    if (dueDate && now > dueDate) {
      return "Closed";
    }

    if (!quiz.published) {
      return "Not Published";
    }

    if (availableUntil && now > availableUntil) {
      return "Closed";
    }

    if (availableFrom && now < availableFrom) {
      return "Not available";
    }

    return "Available";
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <Form.Select 
            className="me-2" 
            style={{ width: "auto" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name">Sort by Name</option>
            <option value="dueDate">Sort by Due Date</option>
            <option value="availableDate">Sort by Available Date</option>
          </Form.Select>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
        {currentUser?.role === "FACULTY" && (
          <Button 
            variant="primary" 
            onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/new/edit`)}
          >
            <FaPlus className="me-2" />
            Quiz
          </Button>
        )}
      </div>

      {sortedQuizs.map((quiz: Quiz) => {
        const status = getQuizStatus(quiz);
        return (
          <div key={quiz._id} className="quiz-item mb-3 p-3 border rounded">
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <div className="d-flex align-items-center">
                  <div className="me-2">
                    <BsQuestionCircle className="text-success fs-4" />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold" style={{ cursor: 'pointer' }} onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${quiz._id}`)}>
                      {quiz.title}
                    </div>
                    <div className="small text-muted">
                      {status === "Closed" && <span>Closed</span>}
                      {status === "Not available" && quiz.availableFrom && (
                        <span>Not available until {formatDate(quiz.availableFrom)}</span>
                      )}
                      {status === "Available" && quiz.availableUntil && (
                        <span>Available until {formatDate(quiz.availableUntil)}</span>
                      )}
                      {" "}Due {formatDate(quiz.dueDate)}
                    </div>
                    <div className="small text-muted">
                      {quiz.points || 0} pts | {(quiz.questions?.length ?? 0)} Question{(quiz.questions?.length !== 1 ? 's' : '')}
                    </div>
                  </div>
                </div>
              </div>

              {currentUser?.role === "FACULTY" && (
                <div className="d-flex align-items-center ms-2">
                  <Dropdown className="me-2">
                    <Dropdown.Toggle variant="light" id={`dropdown-${quiz._id}`}> 
                      <FaEllipsisV />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${quiz._id}/edit`)}>
                        <FaEdit className="me-2" /> Edit
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleCopyQuiz(quiz)}>
                        <FaCopy className="me-2" /> Copy
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleDeleteQuiz(quiz)}>
                        <FaTrash className="me-2" /> Delete
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handlePublishToggle(quiz)}>
                        {quiz.published ? (
                          <><FaBan className="me-2" /> Unpublish</>
                        ) : (
                          <><FaCheckCircle className="me-2" /> Publish</>
                        )}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizs/${quiz._id}/preview`)}>
                        <FaCheckCircle className="me-2" /> Preview
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <span
                    className="fs-4 align-self-center"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', height: '38px', width: '38px', justifyContent: 'center', background: 'none', borderRadius: '0.375rem' }}
                    title={quiz.published ? "已发布，点击取消发布" : "未发布，点击发布"}
                    onClick={() => handlePublishToggle(quiz)}
                  >
                    {quiz.published ? "✅" : "🚫"}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {sortedQuizs.length === 0 && (
        <div className="text-center text-muted py-4">
          {currentUser?.role === "FACULTY" ? "No quizs yet. Click + Quiz to create your first quiz." : "No quizs available."}
        </div>
      )}


      <Modal show={showCopyModal} onHide={() => setShowCopyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Copy Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Course to Copy To</Form.Label>
              <Form.Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">Select a course...</option>
                {courses
                  .filter((course: any) => course._id !== cid)
                  .map((course: any) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCopyModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmCopyQuiz}
            disabled={!selectedCourse}
          >
            Copy Quiz
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this quiz? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteQuiz}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}