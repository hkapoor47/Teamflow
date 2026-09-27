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

    setDepartment,
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

            <p>
              Manage your department
              and skills so TeamFlow
              can recommend relevant
              work to you.
            </p>

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
              {department ||
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
              {department
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

                <p>
                  Your primary working
                  domain. This will be
                  used to filter relevant
                  projects and tasks.
                </p>

              </div>


              <select
                value={department}
                onChange={(event) =>
                  setDepartment(
                    event.target.value
                  )
                }
                className="profile-select"
              >

                <option value="">
                  Select your department
                </option>

                {DEPARTMENTS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

            </section>


            {/* =============================================
                SKILLS
            ============================================= */}

            <section className="profile-section">

              <div className="profile-section-header">

                <h2>
                  Skills
                </h2>

                <p>
                  Add the technologies
                  and skills you can
                  work with.
                </p>

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
                            key={skill.id}
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
                                  skill.id
                                )
                              }
                              disabled={
                                skillActionLoading
                              }
                              aria-label={`Remove ${skill.skill_name}`}
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
                      Suggested:
                    </span>


                    {SUGGESTED_SKILLS
                      .filter(
                        (suggestedSkill) =>
                          !skills.some(
                            (skill) =>
                              String(
                                skill?.skill_name ||
                                  ""
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

            <section className="profile-section">

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


            {/* =============================================
                RECOMMENDATION PROFILE
            ============================================= */}

            <section className="profile-section">

              <div className="profile-section-header">

                <h2>
                  Recommendation Profile
                </h2>

                <p>
                  These attributes will
                  help TeamFlow understand
                  what type of work fits
                  your profile.
                </p>

              </div>


              <div className="profile-tags">


                {department && (

                  <div className="profile-tag">

                    <span>
                      {department}
                    </span>

                  </div>

                )}


                {skills
                  .slice(0, 6)
                  .map(
                    (skill) => (

                      <div
                        className="profile-tag"
                        key={
                          `profile-${skill.id}`
                        }
                      >

                        <span>
                          {
                            skill.skill_name
                          }
                        </span>

                      </div>

                    )
                  )}


                {!department &&
                  skills.length === 0 && (

                    <p
                      style={{
                        color:
                          "#71859f",
                        fontSize:
                          "12px",
                        margin: 0,
                      }}
                    >
                      Complete your
                      profile to improve
                      future task
                      recommendations.
                    </p>

                  )}

              </div>

            </section>

          </div>

        </div>


        {/* =================================================
            RECOMMENDATION BANNER
        ================================================= */}

        <section className="profile-recommendation-card">


          <div>

            <span className="profile-recommendation-label">
              COMING NEXT
            </span>

            <h2>
              Personalized Task
              Recommendations
            </h2>

            <p>
              TeamFlow will use your
              department, skills and
              work history to find
              tasks that are relevant
              to you.
            </p>

          </div>


          <div className="profile-recommendation-flow">

            <span>
              Department
            </span>

            <b>
              +
            </b>

            <span>
              Skills
            </span>

            <b>
              +
            </b>

            <span>
              History
            </span>

            <b>
              →
            </b>

            <strong>
              Recommendations
            </strong>

          </div>


        </section>


      </div>

    </DashboardLayout>
  );
}