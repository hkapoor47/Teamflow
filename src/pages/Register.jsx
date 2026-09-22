import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

const Register = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = e.target.name.value;
    const email = e.target["register-email"].value;
    const password = e.target["register-password"].value;
    const confirmPassword = e.target["confirm-password"].value;

    // Check passwords before sending request
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "http://65.0.11.153:5001/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Register response:", data);

      if (!response.ok) {
        alert(data.message || "Registration failed.");
        return;
      }

      // Save token if backend returns one
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Save user information if backend returns it
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      alert(data.message || "Account created successfully!");

      // Registration successful → Dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Register API error:", error);
      alert("Unable to connect to the backend server.");
    }
  };

  return (
    <div className="auth-page">

      {/* Left Branding Section */}
      <div className="auth-brand">
        <div className="auth-brand-content">

          <div className="auth-logo">
            <div className="auth-logo-icon">T</div>

            <div>
              <h2>TeamFlow</h2>
              <span>AI</span>
            </div>
          </div>

          <div className="auth-brand-text">

            <p className="auth-tagline">
              BUILD. TRACK. DELIVER.
            </p>

            <h1>
              Your team's work,
              <span> all in one place.</span>
            </h1>

            <p>
              Create projects, assign work, track progress,
              and keep everyone accountable from one workspace.
            </p>

          </div>

          <div className="auth-feature-list">

            <div>
              <span>✓</span>
              Organize projects
            </div>

            <div>
              <span>✓</span>
              Assign & track tasks
            </div>

            <div>
              <span>✓</span>
              Stay ahead of deadlines
            </div>

          </div>

        </div>
      </div>

      {/* Register Section */}
      <div className="auth-form-section">

        <div className="auth-form-container">

          <div className="auth-mobile-logo">
            <div className="auth-logo-icon">T</div>
            <h2>TeamFlow</h2>
            <span>AI</span>
          </div>

          <div className="auth-heading">

            <p>GET STARTED</p>

            <h1>Create your account</h1>

            <span>
              Start managing your team more effectively.
            </span>

          </div>

          <form onSubmit={handleSubmit}>

            {/* Name */}
            <div className="auth-input-group">

              <label htmlFor="name">
                Full name
              </label>

              <div className="auth-input-wrapper">

                <User size={18} />

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Harshita Kapoor"
                  required
                />

              </div>

            </div>

            {/* Email */}
            <div className="auth-input-group">

              <label htmlFor="register-email">
                Email address
              </label>

              <div className="auth-input-wrapper">

                <Mail size={18} />

                <input
                  id="register-email"
                  name="register-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />

              </div>

            </div>

            {/* Password */}
            <div className="auth-input-group">

              <label htmlFor="register-password">
                Password
              </label>

              <div className="auth-input-wrapper">

                <Lock size={18} />

                <input
                  id="register-password"
                  name="register-password"
                  type="password"
                  placeholder="Create a password"
                  minLength={6}
                  required
                />

              </div>

            </div>

            {/* Confirm Password */}
            <div className="auth-input-group">

              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <div className="auth-input-wrapper">

                <Lock size={18} />

                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  minLength={6}
                  required
                />

              </div>

            </div>

            {/* Terms */}
            <div className="terms-checkbox">

              <label>

                <input
                  type="checkbox"
                  required
                />

                <span>
                  I agree to the Terms of Service and Privacy Policy.
                </span>

              </label>

            </div>

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-button"
            >
              Create Account
              <ArrowRight size={18} />
            </button>

          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>

          <p className="auth-demo-note">
            Secure registration • TeamFlow
          </p>

        </div>

      </div>

    </div>
  );
};

export default Register;