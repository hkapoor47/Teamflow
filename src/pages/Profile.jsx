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

const SUGGESTED_INTERESTS = [
  "Web Development",
  "Frontend",
  "Backend",
  "AI / ML",
  "Data Science",
  "Cloud",
  "DevOps",
  "Cyber Security",
  "UI / UX",
  "Mobile Development",
];

function getUserName() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return "Team Member";
  }

  try {
    const user = JSON.parse(storedUser);

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
  if (!name) return "U";

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Profile() {
  const {
    department,
    skills,
    interests,
    history,
    setDepartment,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
  } = useUserProfile();

  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const userName = getUserName();
  const initials = getInitials(userName);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;

    addSkill(newSkill);
    setNewSkill("");
  };

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;

    addInterest(newInterest);
    setNewInterest("");
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddSkill();
    }
  };

  const handleInterestKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddInterest();
    }
  };

  return (
    <DashboardLayout>
      <div className="profile-page">
        {/* Header */}
        <div className="profile-header">
          <div>
            <p className="profile-eyebrow">MY PROFILE</p>

            <h1>Professional Profile</h1>

            <p>
              Manage your department, skills and interests so TeamFlow
              can recommend relevant work to you.
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <section className="profile-main-card">
          <div className="profile-avatar">
            {initials}
          </div>

          <div className="profile-user-info">
            <h2>{userName}</h2>

            <p>
              {department || "Department not selected"}
            </p>
          </div>

          <div className="profile-status">
            <span className="profile-status-dot" />
            Active Team Member
          </div>
        </section>

        {/* Department */}
        <section className="profile-section">
          <div className="profile-section-header">
            <div>
              <h2>Department</h2>

              <p>
                Your primary working domain. This will be used to
                filter relevant projects and tasks.
              </p>
            </div>
          </div>

          <select
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
            className="profile-select"
          >
            <option value="">
              Select your department
            </option>

            {DEPARTMENTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </section>

        {/* Skills */}
        <section className="profile-section">
          <div className="profile-section-header">
            <div>
              <h2>Skills</h2>

              <p>
                Add the technologies and skills you can work with.
              </p>
            </div>
          </div>

          <div className="profile-input-row">
            <input
              type="text"
              placeholder="e.g. React, Python, AWS..."
              value={newSkill}
              onChange={(event) =>
                setNewSkill(event.target.value)
              }
              onKeyDown={handleSkillKeyDown}
            />

            <button
              type="button"
              onClick={handleAddSkill}
              className="profile-add-button"
            >
              Add Skill
            </button>
          </div>

          {skills.length > 0 && (
            <div className="profile-tags">
              {skills.map((skill) => (
                <div
                  className="profile-tag"
                  key={skill}
                >
                  <span>{skill}</span>

                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="profile-suggestions">
            <span>Suggested:</span>

            {SUGGESTED_SKILLS
              .filter(
                (skill) =>
                  !skills.some(
                    (existingSkill) =>
                      existingSkill.toLowerCase() ===
                      skill.toLowerCase()
                  )
              )
              .slice(0, 8)
              .map((skill) => (
                <button
                  type="button"
                  key={skill}
                  onClick={() => addSkill(skill)}
                >
                  + {skill}
                </button>
              ))}
          </div>
        </section>

        {/* Interests */}
        <section className="profile-section">
          <div className="profile-section-header">
            <div>
              <h2>Interests</h2>

              <p>
                Tell TeamFlow what kind of projects and work you are
                interested in.
              </p>
            </div>
          </div>

          <div className="profile-input-row">
            <input
              type="text"
              placeholder="e.g. AI, Frontend, Cloud..."
              value={newInterest}
              onChange={(event) =>
                setNewInterest(event.target.value)
              }
              onKeyDown={handleInterestKeyDown}
            />

            <button
              type="button"
              onClick={handleAddInterest}
              className="profile-add-button"
            >
              Add Interest
            </button>
          </div>

          {interests.length > 0 && (
            <div className="profile-tags">
              {interests.map((interest) => (
                <div
                  className="profile-tag profile-interest-tag"
                  key={interest}
                >
                  <span>{interest}</span>

                  <button
                    type="button"
                    onClick={() =>
                      removeInterest(interest)
                    }
                    aria-label={`Remove ${interest}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="profile-suggestions">
            <span>Suggested:</span>

            {SUGGESTED_INTERESTS
              .filter(
                (interest) =>
                  !interests.some(
                    (existingInterest) =>
                      existingInterest.toLowerCase() ===
                      interest.toLowerCase()
                  )
              )
              .slice(0, 8)
              .map((interest) => (
                <button
                  type="button"
                  key={interest}
                  onClick={() =>
                    addInterest(interest)
                  }
                >
                  + {interest}
                </button>
              ))}
          </div>
        </section>

        {/* Statistics */}
        <section className="profile-stats-grid">
          <div className="profile-stat-card">
            <span>Skills</span>
            <strong>{skills.length}</strong>
          </div>

          <div className="profile-stat-card">
            <span>Interests</span>
            <strong>{interests.length}</strong>
          </div>

          <div className="profile-stat-card">
            <span>History Records</span>
            <strong>{history.length}</strong>
          </div>

          <div className="profile-stat-card">
            <span>Department</span>
            <strong>
              {department ? "Set" : "Not Set"}
            </strong>
          </div>
        </section>

        {/* History */}
        <section className="profile-section">
          <div className="profile-section-header">
            <div>
              <h2>Work History</h2>

              <p>
                Your previous project and task activity will be
                maintained here for future recommendations.
              </p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="profile-empty-history">
              <div className="profile-empty-icon">
                ◷
              </div>

              <h3>No work history yet</h3>

              <p>
                As you claim, complete and work on tasks, TeamFlow
                will build your professional history here.
              </p>
            </div>
          ) : (
            <div className="profile-history-list">
              {history.map((item, index) => (
                <div
                  className="profile-history-item"
                  key={item.id || index}
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
                      {item.status || "Completed"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recommendation Preview */}
        <section className="profile-recommendation-card">
          <div>
            <span className="profile-recommendation-label">
              COMING NEXT
            </span>

            <h2>Personalized Task Recommendations</h2>

            <p>
              TeamFlow will use your department, skills, interests
              and work history to find tasks that are relevant to
              you.
            </p>
          </div>

          <div className="profile-recommendation-flow">
            <span>Skills</span>
            <b>+</b>
            <span>Interests</span>
            <b>+</b>
            <span>History</span>
            <b>→</b>
            <strong>Recommendations</strong>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}