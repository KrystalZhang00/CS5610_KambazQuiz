import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setCurrentUser } from "./reducer";
import { useDispatch } from "react-redux";
import { FormControl, Button, Alert } from "react-bootstrap";
import * as authClient from "./client";

export default function Signin() {
  const [credentials, setCredentials] = useState<any>({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const signin = async () => {
    setError("");
    setLoading(true);
    
    if (!credentials.username || !credentials.password) {
      setError("Please enter username and password");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Sign in attempt, credentials:", credentials);
      
      const user = await authClient.signin({
        username: credentials.username,
        password: credentials.password
      });
      
      console.log("Sign in successful, user:", user);
      dispatch(setCurrentUser(user));
      navigate("/Kambaz/Dashboard");
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      setError(error.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div id="wd-signin-screen">
      <h1>Sign in</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <FormControl 
        value={credentials.username || ""}
        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
        className="mb-2" 
        placeholder="Username" 
        id="wd-username"
        disabled={loading}
      />
      <FormControl 
        value={credentials.password || ""}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        className="mb-2" 
        placeholder="Password" 
        type="password" 
        id="wd-password"
        disabled={loading}
      />
      <Button 
        onClick={signin} 
        id="wd-signin-btn" 
        className="w-100 mb-2"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      
      <div className="text-center">
        <Link id="wd-signup-link" to="/Kambaz/Account/Signup">
          Don't have an account? Sign up
        </Link>
      </div>
      
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
  );
}
