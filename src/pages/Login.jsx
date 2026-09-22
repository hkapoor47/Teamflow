import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch(
        "http://65.0.11.153:5001/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        alert(data.message || "Invalid email or password");
        return;
      }

      // Store token if backend returns one
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Store user information if backend returns it
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Login successful → Dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Login API error:", error);
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
              TEAM PRODUCTIVITY, SIMPLIFIED.
            </p>

            <h1>
              Keep your team
              <span> moving forward.</span>
            </h1>

            <p>
              Manage projects, track progress, monitor deadlines,
              and get intelligent insights about your team.
            </p>
          </div>

          <div className="auth-feature-list">
            <div>
              <span>✓</span>
              Track team progress
            </div>

            <div>
              <span>✓</span>
              Manage tasks & deadlines
            </div>

            <div>
              <span>✓</span>
              AI-powered insights
            </div>
          </div>

        </div>
      </div>

      {/* Login Section */}
      <div className="auth-form-section">

        <div className="auth-form-container">

          <div className="auth-mobile-logo">
            <div className="auth-logo-icon">T</div>
            <h2>TeamFlow</h2>
            <span>AI</span>
          </div>

          <div className="auth-heading">
            <p>WELCOME BACK</p>

            <h1>Sign in to your account</h1>

            <span>
              Enter your details to continue to TeamFlow.
            </span>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="auth-input-group">

              <label htmlFor="email">
                Email address
              </label>

              <div className="auth-input-wrapper">
                <Mail size={18} />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

            </div>

            {/* Password */}
            <div className="auth-input-group">

              <div className="password-label">
                <label htmlFor="password">
                  Password
                </label>

                <a href="#">
                  Forgot password?
                </a>
              </div>

              <div className="auth-input-wrapper">
                <Lock size={18} />

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </div>

            </div>

            {/* Remember */}
            <div className="remember-me">

              <label>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

            </div>

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-button"
            >
              Sign In
              <ArrowRight size={18} />
            </button>

          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>

          <p className="auth-demo-note">
            Secure login • TeamFlow
          </p>

        </div>

      </div>

    </div>
  );
};

export default Login;