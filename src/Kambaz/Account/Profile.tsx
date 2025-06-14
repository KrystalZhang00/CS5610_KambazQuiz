import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentUser } from "./reducer";
import { FormControl, Button, Alert } from "react-bootstrap";
import * as authClient from "./client";

export default function Profile() {
  const [profile, setProfile] = useState<any>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state: any) => state.accountReducer);

  const fetchProfile = async () => {
    if (!currentUser) {
      navigate("/Kambaz/Account/Signin");
      return;
    }
    
    setLoading(true);
    try {
      const userProfile = await authClient.getProfile();
      setProfile(userProfile);
      // Update Redux state with fresh data
      dispatch(setCurrentUser(userProfile));
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      if (error.message.includes('Not authenticated')) {
        dispatch(setCurrentUser(null));
        navigate("/Kambaz/Account/Signin");
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setError("");
    setSuccess("");
    setUpdating(true);

    try {
      const updatedUser = await authClient.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        dob: profile.dob
      });

      setProfile(updatedUser);
      dispatch(setCurrentUser(updatedUser));
      setSuccess("Profile updated successfully!");
      
    } catch (error: any) {
      console.error("Profile update error:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const signout = async () => {
    try {
      await authClient.logout();
      dispatch(setCurrentUser(null));
      navigate("/Kambaz/Account/Signin");
    } catch (error: any) {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local state
      dispatch(setCurrentUser(null));
      navigate("/Kambaz/Account/Signin");
    }
  };

  useEffect(() => { 
    fetchProfile(); 
  }, []);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!currentUser) {
    return <div>Please sign in to view your profile.</div>;
  }

  return (
    <div id="wd-profile-screen">
      <h1>Profile</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <FormControl 
        value={profile.username || ""} 
        className="mb-2" 
        placeholder="Username"
        disabled={true} // Username cannot be changed
      />
      <FormControl 
        value={profile.firstName || ""} 
        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
        className="mb-2" 
        placeholder="First Name"
        disabled={updating}
      />
      <FormControl 
        value={profile.lastName || ""} 
        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
        className="mb-2" 
        placeholder="Last Name"
        disabled={updating}
      />
      <FormControl 
        value={profile.email || ""} 
        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
        className="mb-2" 
        placeholder="Email"
        type="email"
        disabled={updating}
      />
      <FormControl 
        value={profile.dob || ""} 
        onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
        className="mb-2" 
        placeholder="Date of Birth"
        type="date"
        disabled={updating}
      />
      <FormControl 
        value={profile.role || ""} 
        className="mb-2" 
        placeholder="Role"
        disabled={true} // Role cannot be changed
      />
      <FormControl 
        value={profile.loginId || ""} 
        className="mb-2" 
        placeholder="Login ID"
        disabled={true} // Login ID cannot be changed
      />
      <FormControl 
        value={profile.section || ""} 
        className="mb-2" 
        placeholder="Section"
        disabled={true} // Section cannot be changed
      />
      
      <Button 
        onClick={updateProfile} 
        className="w-100 mb-2"
        disabled={updating}
      >
        {updating ? "Updating..." : "Update Profile"}
      </Button>
      
      <Button 
        onClick={signout} 
        className="w-100"
        variant="danger"
      >
        Sign out
      </Button>
      
      <div className="mt-3">
        <small className="text-muted">
          <strong>Account Info:</strong><br />
          Last Activity: {profile.lastActivity}<br />
          Total Activity: {profile.totalActivity}
        </small>
      </div>
    </div>
  );
}