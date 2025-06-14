import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "./reducer";
import * as authClient from "./client";

export default function Signup() {
  const [user, setUser] = useState({
    username: "",
    password: "",
    verifyPassword: "",
    firstName: "",
    lastName: "",
    email: "",
    dob: "",
    role: "STUDENT"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Creating new user:", user);

      const newUser = await authClient.signup({
        username: user.username,
        password: user.password,
        verifyPassword: user.verifyPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dob: user.dob,
        role: user.role
      });

      console.log("Signup successful, user:", newUser);

      // Auto-login new user
      dispatch(setCurrentUser(newUser));
      
      alert("Registration successful!");
      navigate("/Kambaz/Dashboard");

    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="wd-signup-screen">
      <h1>Sign up</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={signup}>
        <Form.Control 
          value={user.username}
          onChange={(e) => setUser({ ...user, username: e.target.value })}
          placeholder="Username *" 
          className="wd-username mb-2"
          required
          disabled={loading}
        />
        <Form.Control 
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
          placeholder="Password *" 
          type="password" 
          className="wd-password mb-2"
          required
          disabled={loading}
        />
        <Form.Control 
          value={user.verifyPassword}
          onChange={(e) => setUser({ ...user, verifyPassword: e.target.value })}
          placeholder="Verify Password *"
          type="password" 
          className="wd-password-verify mb-2"
          required
          disabled={loading}
        />
        <Form.Control 
          value={user.firstName}
          onChange={(e) => setUser({ ...user, firstName: e.target.value })}
          placeholder="First Name *" 
          className="mb-2"
          required
          disabled={loading}
        />
        <Form.Control 
          value={user.lastName}
          onChange={(e) => setUser({ ...user, lastName: e.target.value })}
          placeholder="Last Name *" 
          className="mb-2"
          required
          disabled={loading}
        />
        <Form.Control 
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          placeholder="Email *" 
          type="email"
          className="mb-2"
          required
          disabled={loading}
        />
        <Form.Control 
          value={user.dob}
          onChange={(e) => setUser({ ...user, dob: e.target.value })}
          placeholder="Date of Birth" 
          type="date"
          className="mb-2"
          disabled={loading}
        />
        <Form.Select 
          value={user.role}
          onChange={(e) => setUser({ ...user, role: e.target.value })}
          className="mb-3"
          disabled={loading}
        >
          <option value="STUDENT">Student</option>
          <option value="FACULTY">Faculty</option>
          <option value="TA">Teaching Assistant</option>
          <option value="ADMIN">Admin</option>
        </Form.Select>
        
        <Button 
          type="submit" 
          className="w-100 mb-2"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Sign up"}
        </Button>
      </Form>
      
      <div className="text-center">
        <Link to="/Kambaz/Account/Signin">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
