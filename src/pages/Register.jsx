import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {

  User,

  Mail,

  Lock,

  Building2,


  ArrowRight,

} from "lucide-react";



const Register = () => {

  const navigate = useNavigate();

  const DEPARTMENT_OPTIONS = [
    "Web Development",
    "Mobile Development",
    "AI / Machine Learning",
    "Data Science",
    "DevOps / Cloud",
    "Cyber Security",
    "UI / UX Design",
    "Finance",
    "Marketing",
    "Other",
  ];

  const [departmentChoice, setDepartmentChoice] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");




  const handleSubmit = async (e) => {

    e.preventDefault();



    const name = e.target.name.value.trim();

    const email = e.target["register-email"].value.trim();

    const password = e.target["register-password"].value;

    const confirmPassword =

      e.target["confirm-password"].value;



    const department =
      departmentChoice === "Other"
        ? customDepartment.trim()
        : departmentChoice.trim();

// -----------------------------

    // PASSWORD CHECK

    // -----------------------------



    if (password !== confirmPassword) {

      alert("Passwords do not match.");

      return;

    }



    // -----------------------------

    // DEPARTMENT CHECK

    // -----------------------------



    if (!department) {

      alert("Please select or enter your department.");

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

            department,

            skills,

          }),

        }

      );



      const data = await response.json();



      console.log("Register response:", data);



      if (!response.ok) {

        alert(

          data.message ||

          "Registration failed."

        );

        return;

      }



      // -----------------------------

      // SAVE TOKEN

      // -----------------------------



      if (data.token) {

        localStorage.setItem(

          "token",

          data.token

        );

      }



      // -----------------------------

      // SAVE USER

      // -----------------------------



      if (data.user) {

        localStorage.setItem(

          "user",

          JSON.stringify(data.user)

        );

      }



      alert(

        data.message ||

        "Account created successfully!"

      );



      // -----------------------------

      // GO TO DASHBOARD

      // -----------------------------



      navigate("/dashboard");



    } catch (error) {

      console.error(

        "Register API error:",

        error

      );



      alert(

        "Unable to connect to the backend server."

      );

    }

  };



  return (

    <div className="auth-page">



      {/* =========================

          LEFT BRANDING SECTION

      ========================== */}



      <div className="auth-brand">



        <div className="auth-brand-content">



          <div className="auth-logo">



            <div className="auth-logo-icon">

              T

            </div>



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

              Create projects, assign work,

              track progress, and keep everyone

              accountable from one workspace.

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





      {/* =========================

          REGISTER SECTION

      ========================== */}



      <div className="auth-form-section">



        <div className="auth-form-container">



          {/* Mobile Logo */}



          <div className="auth-mobile-logo">



            <div className="auth-logo-icon">

              T

            </div>



            <h2>TeamFlow</h2>



            <span>AI</span>



          </div>





          {/* Heading */}



          <div className="auth-heading">



            <p>GET STARTED</p>



            <h1>

              Create your account

            </h1>



            <span>

              Start managing your team

              more effectively.

            </span>



          </div>





          {/* =========================

              FORM

          ========================== */}



          <form onSubmit={handleSubmit}>



            {/* NAME */}



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





            {/* EMAIL */}



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

                  placeholder="you\@example.com"

                  required

                />



              </div>



            </div>





            {/* PASSWORD */}



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

                  minLength={8}

                  required

                />



              </div>



            </div>





            {/* CONFIRM PASSWORD */}



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

                  minLength={8}

                  required

                />



              </div>



            </div>





            {/* =========================
                DEPARTMENT
            ========================== */}

            <div className="auth-input-group">

              <label htmlFor="department">
                Department
              </label>

              <div className="auth-input-wrapper">

                <Building2 size={18} />

                <select
                  id="department"
                  name="department"
                  value={departmentChoice}
                  onChange={(e) =>
                    setDepartmentChoice(e.target.value)
                  }
                  required
                >
                  <option value="" disabled>
                    Select your department
                  </option>

                  {DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}

                </select>

              </div>

              {departmentChoice === "Other" && (
                <div
                  className="auth-input-wrapper"
                  style={{ marginTop: "10px" }}
                >

                  <Building2 size={18} />

                  <input
                    id="custom-department"
                    name="custom-department"
                    type="text"
                    value={customDepartment}
                    onChange={(e) =>
                      setCustomDepartment(e.target.value)
                    }
                    placeholder="Enter your department"
                    required
                  />

                </div>
              )}

            </div>


            {/* TERMS */}



            <div className="terms-checkbox">



              <label>



                <input

                  type="checkbox"

                  required

                />



                <span>

                  I agree to the Terms of Service

                  and Privacy Policy.

                </span>



              </label>



            </div>





            {/* SUBMIT */}



            <button

              type="submit"

              className="auth-submit-button"

            >

              Create Account



              <ArrowRight size={18} />



            </button>



          </form>





          {/* DIVIDER */}



          <div className="auth-divider">



            <span>OR</span>



          </div>





          {/* LOGIN */}



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