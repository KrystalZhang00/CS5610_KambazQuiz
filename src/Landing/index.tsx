import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Container, Form, Button, Alert, Tab, Tabs } from "react-bootstrap";
import { setCurrentUser } from "../Kambaz/Account/reducer";
import * as authClient from "../Kambaz/Account/client";

export default function Landing() {
  const [activeTab, setActiveTab] = useState("signin");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Sign in state
  const [credentials, setCredentials] = useState<any>({ username: "", password: "" });
  const [signinError, setSigninError] = useState("");
  const [signinLoading, setSigninLoading] = useState(false);

  // Sign up state
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
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const signin = async () => {
    setSigninError("");
    setSigninLoading(true);
    
    if (!credentials.username || !credentials.password) {
      setSigninError("Please enter username and password");
      setSigninLoading(false);
      return;
    }
    
    try {
      console.log("Sign in attempt, credentials:", credentials);
      
      const foundUser = await authClient.signin({
        username: credentials.username,
        password: credentials.password
      });
      
      console.log("Sign in successful, user:", foundUser);
      dispatch(setCurrentUser(foundUser));
      navigate("/Kambaz/Dashboard");
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      setSigninError(error.message || "Sign in failed");
    } finally {
      setSigninLoading(false);
    }
  };

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);

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
      setSignupError(error.message || "Registration failed");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
      <div className="p-4 bg-light rounded shadow-sm" style={{ maxWidth: "500px", width: "100%" }}>
        <h1 className="text-center mb-4 text-primary">Welcome to Kambaz</h1>
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || "signin")}
          className="nav-justified mb-4"
        >
          {/* Sign in tab */}
          <Tab eventKey="signin" title="Sign In">
            <div id="wd-signin-screen" className="mt-3">
              {signinError && <Alert variant="danger">{signinError}</Alert>}
              
              <Form>
                <Form.Control 
                  value={credentials.username || ""}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="mb-2" 
                  placeholder="Username" 
                  id="wd-username"
                  disabled={signinLoading}
                />
                <Form.Control 
                  value={credentials.password || ""}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="mb-2" 
                  placeholder="Password" 
                  type="password" 
                  id="wd-password"
                  disabled={signinLoading}
                />
                <Button 
                  onClick={signin} 
                  id="wd-signin-btn" 
                  className="w-100 mb-2"
                  disabled={signinLoading}
                >
                  {signinLoading ? "Signing in..." : "Sign In"}
                </Button>
              </Form>
              
              <hr />
              <div className="mt-3">
                <small className="text-muted">
                  <strong>Test Accounts:</strong><br />
                  <strong>FACULTY:</strong> iron_man / stark123, ring_bearer / shire123<br />
                  <strong>STUDENT:</strong> dark_knight / wayne123, thor_odinson / mjolnir123<br />
                  <strong>TA:</strong> black_widow / romanoff123, strider / aragorn123<br />
                  <strong>ADMIN:</strong> ada / 123
                </small>
              </div>
            </div>
          </Tab>

          {/* Sign up tab */}
          <Tab eventKey="signup" title="Sign Up">
            <div id="wd-signup-screen" className="mt-3">
              {signupError && <Alert variant="danger">{signupError}</Alert>}
              
              <Form onSubmit={signup}>
                <Form.Control 
                  value={user.username}
                  onChange={(e) => setUser({ ...user, username: e.target.value })}
                  placeholder="Username *" 
                  className="mb-2"
                  required
                  disabled={signupLoading}
                />
                <Form.Control 
                  value={user.password}
                  onChange={(e) => setUser({ ...user, password: e.target.value })}
                  placeholder="Password *" 
                  type="password" 
                  className="mb-2"
                  required
                  disabled={signupLoading}
                />
                <Form.Control 
                  value={user.verifyPassword}
                  onChange={(e) => setUser({ ...user, verifyPassword: e.target.value })}
                  placeholder="Verify Password *"
                  type="password" 
                  className="mb-2"
                  required
                  disabled={signupLoading}
                />
                <Form.Control 
                  value={user.firstName}
                  onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                  placeholder="First Name *" 
                  className="mb-2"
                  required
                  disabled={signupLoading}
                />
                <Form.Control 
                  value={user.lastName}
                  onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                  placeholder="Last Name *" 
                  className="mb-2"
                  required
                  disabled={signupLoading}
                />
                <Form.Control 
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  placeholder="Email *" 
                  type="email"
                  className="mb-2"
                  required
                  disabled={signupLoading}
                />
                <Form.Control 
                  value={user.dob}
                  onChange={(e) => setUser({ ...user, dob: e.target.value })}
                  placeholder="Date of Birth" 
                  type="date"
                  className="mb-2"
                  disabled={signupLoading}
                />
                <Form.Select 
                  value={user.role}
                  onChange={(e) => setUser({ ...user, role: e.target.value })}
                  className="mb-3"
                  disabled={signupLoading}
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="TA">Teaching Assistant</option>
                  <option value="ADMIN">Admin</option>
                </Form.Select>
                
                <Button 
                  type="submit" 
                  className="w-100 mb-2"
                  disabled={signupLoading}
                >
                  {signupLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </Form>
            </div>
          </Tab>
        </Tabs>
      </div>
    </Container>
  );
}
