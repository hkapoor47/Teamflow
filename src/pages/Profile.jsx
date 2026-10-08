import { useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout.jsx";
import useUserProfile from "../context/useUserProfile.js";


const DEPARTMENTS = [
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


const SUGGESTED_SKILLS = [
  "React",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Express",
  "Python",
  "Machine Learning",
  "Deep Learning",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Git",
  "Figma",
];


function getUserName() {
  const storedUser =
    localStorage.getItem("user");

  if (!storedUser) {
    return "Team Member";
  }

  try {
    const user =
      JSON.parse(storedUser);

    return (
      user?.name ||
      user?.username ||
      user?.email ||
      "Team Member"
    );
  } catch {
    return "Team Member";
  }
}


function getInitials(name) {
  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .map(
      (word) => word[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


export default function Profile() {
  const {
    department,
    skills,
    history,

    loadingSkills,
    skillError,

    addSkill,
    removeSkill,
  } = useUserProfile();


  const [newSkill, setNewSkill] =
    useState("");

  const [skillActionLoading, setSkillActionLoading] =
    useState(false);


  const userName =
    getUserName();

  const initials =
    getInitials(userName);


  /* =====================================================
     DEPARTMENT FROM REGISTRATION
  ===================================================== */

  const registeredDepartment = (() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return department || "";
      }

      const user = JSON.parse(storedUser);

      return user?.department || department || "";
    } catch {
      return department || "";
    }
  })();


  /* =====================================================
     ADD SKILL
  ===================================================== */

  const handleAddSkill = async () => {
    const cleanSkill =
      newSkill.trim();

    if (!cleanSkill) {
      return;
    }

    try {
      setSkillActionLoading(true);

      await addSkill(cleanSkill);

      setNewSkill("");
    } catch (error) {
      console.error(
        "Profile add skill error:",
        error
      );
    } finally {
      setSkillActionLoading(false);
    }
  };


  /* =====================================================
     DELETE SKILL
  ===================================================== */

  const handleRemoveSkill = async (
    skillId
  ) => {
    try {
      setSkillActionLoading(true);

      await removeSkill(skillId);
    } catch (error) {
      console.error(
        "Profile remove skill error:",
        error
      );
    } finally {
      setSkillActionLoading(false);
    }
  };


  /* =====================================================
     ENTER KEY
  ===================================================== */

  const handleSkillKeyDown = (
    event
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();

      handleAddSkill();
    }
  };


  return (
    <DashboardLayout>

      <div className="profile-page">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="profile-header">

          <div>

            <p className="profile-eyebrow">
              MY PROFILE
            </p>

            <h1>
              Professional Profile
            </h1>

            {/* <p>
              Manage your department
              and skills so TeamFlow
              can recommend relevant
              work to you.
            </p> */}

          </div>

        </div>


        {/* =================================================
            USER CARD
        ================================================= */}

        <section className="profile-main-card">

          <div className="profile-avatar">
            {initials}
          </div>


          <div className="profile-user-info">

            <h2>
              {userName}
            </h2>

            <p>
              {registeredDepartment ||
                "Department not selected"}
            </p>

          </div>


          <div className="profile-status">

            <span className="profile-status-dot" />

            Active Team Member

          </div>

        </section>


        {/* =================================================
            STATS
        ================================================= */}

        <section className="profile-stats-grid">


          <div className="profile-stat-card">

            <span>
              Skills
            </span>

            <strong>
              {skills.length}
            </strong>

          </div>


          <div className="profile-stat-card">

            <span>
              History Records
            </span>

            <strong>
              {history.length}
            </strong>

          </div>


          <div className="profile-stat-card">

            <span>
              Department
            </span>

            <strong>
              {registeredDepartment
                ? "Set"
                : "Not Set"}
            </strong>

          </div>


        </section>


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="profile-content-grid">


          {/* =================================================
              LEFT
          ================================================= */}

          <div>


            {/* =============================================
                DEPARTMENT
            ============================================= */}

            <section className="profile-section">

              <div className="profile-section-header">

                <h2>
                  Department
                </h2>

                

              </div>


              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: "48px",
                  padding: "0 16px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  borderRadius: "10px",
                  background: "rgba(15, 23, 42, 0.55)",
                  color: "#e2e8f0",
                  cursor: "default",
                  boxSizing: "border-box",
                  width: "100%",
                }}
              >
                {registeredDepartment ||
                  "Department not set"}
              </div>

            </section>


            {/* =============================================
                SKILLS
            ============================================= */}

            <section className="profile-section">

              <div className="profile-section-header">

                <h2>
                  Skills
                </h2>

               

              </div>


              <div className="profile-input-row">

                <input
                  type="text"
                  placeholder="e.g. React, Python, AWS..."
                  value={newSkill}
                  onChange={(event) =>
                    setNewSkill(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleSkillKeyDown
                  }
                  disabled={
                    skillActionLoading
                  }
                />


                <button
                  type="button"
                  className="profile-add-button"
                  onClick={
                    handleAddSkill
                  }
                  disabled={
                    skillActionLoading
                  }
                >
                  {skillActionLoading
                    ? "Saving..."
                    : "Add Skill"}
                </button>

              </div>


              {/* ERROR */}

              {skillError && (
                <p
                  style={{
                    margin:
                      "8px 0 0",
                    color:
                      "#ff7f8a",
                    fontSize:
                      "11px",
                  }}
                >
                  {skillError}
                </p>
              )}


              {/* LOADING */}

              {loadingSkills ? (

                <p
                  style={{
                    margin:
                      "12px 0 0",
                    color:
                      "#8195ae",
                    fontSize:
                      "11px",
                  }}
                >
                  Loading your skills...
                </p>

              ) : (

                <>


                  {/* =======================================
                      CURRENT SKILLS
                  ======================================= */}

                  {skills.length > 0 && (

                    <div className="profile-tags">

                      {skills.map(
                        (skill) => (

                          <div
                            className="profile-tag"
                            key={skill?.id ?? skill?._id ?? skill?.skill_id ?? String(skill)}
                          >

                            <span>
                              {
                                skill.skill_name
                              }
                            </span>


                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveSkill(
                                  skill?.id ?? skill?._id ?? skill?.skill_id
                                )
                              }
                              disabled={
                                skillActionLoading
                              }
                              aria-label={`Remove ${skill?.skill_name || skill?.name || skill?.skill || (typeof skill === "string" ? skill : "Skill")}`}
                            >
                              ×
                            </button>

                          </div>

                        )
                      )}

                    </div>

                  )}


                  {/* =======================================
                      SUGGESTED SKILLS
                  ======================================= */}

                  <div className="profile-suggestions">

                    <span>
                      Quick add:
                    </span>


                    {SUGGESTED_SKILLS
                      .filter(
                        (suggestedSkill) =>
                          !skills.some(
                            (skill) =>
                              String(
                                skill?.skill_name || skill?.name || skill?.skill ||
                                  (typeof skill === "string" ? skill : "")
                              )
                                .toLowerCase() ===
                              suggestedSkill.toLowerCase()
                          )
                      )
                      .slice(0, 8)
                      .map(
                        (skill) => (

                          <button
                            type="button"
                            key={skill}
                            onClick={() =>
                              addSkill(
                                skill
                              )
                            }
                            disabled={
                              skillActionLoading
                            }
                          >
                            + {skill}
                          </button>

                        )
                      )}

                  </div>

                </>

              )}

            </section>

          </div>


          {/* =================================================
              RIGHT
          ================================================= */}

          <div>


            {/* =============================================
                WORK HISTORY
            ============================================= */}

            <section
              className="profile-section"
              style={{
                minHeight: "395px",
                boxSizing: "border-box",
              }}
            >

              <div className="profile-section-header">

                <h2>
                  Work History
                </h2>

                <p>
                  Your previous project
                  and task activity will
                  be maintained here for
                  future recommendations.
                </p>

              </div>


              {history.length === 0 ? (

                <div className="profile-empty-history">

                  <div className="profile-empty-icon">
                    ◷
                  </div>

                  <h3>
                    No work history yet
                  </h3>

                  <p>
                    As you claim,
                    complete and work
                    on tasks, TeamFlow
                    will build your
                    professional history
                    here.
                  </p>

                </div>

              ) : (

                <div className="profile-history-list">

                  {history.map(
                    (item, index) => (

                      <div
                        className="profile-history-item"
                        key={
                          item.id ||
                          index
                        }
                      >

                        <div className="profile-history-marker" />


                        <div>

                          <h3>
                            {item.title ||
                              item.taskTitle ||
                              "Task activity"}
                          </h3>

                          <p>
                            {item.projectName ||
                              "TeamFlow Project"}
                          </p>

                          <small>
                            {item.status ||
                              "Completed"}
                          </small>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </section>
       
          </div>

        </div>
      </div>

    </DashboardLayout>
  );
}