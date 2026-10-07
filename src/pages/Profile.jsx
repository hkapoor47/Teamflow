import { useEffect, useState } from "react";

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



const API_BASE_URL = "http://65.0.11.153:5001/api";

function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUserId() {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId ?? payload.id ?? payload.sub ?? null;
  } catch {
    return null;
  }
}

function getDateValue(item) {
  return item?.completed_at || item?.completedAt || item?.updated_at ||
    item?.updatedAt || item?.created_at || item?.createdAt ||
    item?.due_date || item?.deadline || null;
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

  const [activityHistory, setActivityHistory] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    let mounted = true;

    const loadActivity = async () => {
      const token = getToken();
      if (!token || currentUserId == null) {
        if (mounted) setActivityLoading(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [tasksResponse, projectsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/all-tasks`, { headers }),
          fetch(`${API_BASE_URL}/projects`, { headers }),
        ]);

        const tasksData = await tasksResponse.json();
        const projectsData = await projectsResponse.json();

        if (!tasksResponse.ok) throw new Error(tasksData?.message || "Failed to load tasks");
        if (!projectsResponse.ok) throw new Error(projectsData?.message || "Failed to load projects");

        const tasks = Array.isArray(tasksData?.tasks) ? tasksData.tasks : [];
        const projects = Array.isArray(projectsData?.projects) ? projectsData.projects : [];
        const projectMap = new Map(projects.map((project) => [String(project.id), project]));

        const taskActivity = tasks
          .filter((task) => {
            const assigned = task.assigned_to ?? task.assigneeId ?? task.assignee_id;
            const claimed = task.claimed_by ?? task.claimedBy;
            return String(assigned) === String(currentUserId) || String(claimed) === String(currentUserId);
          })
          .map((task) => {
            const project = projectMap.get(String(task.project_id ?? task.projectId));
            return {
              id: `task-${task.id}`,
              type: "Task",
              title: task.title || task.name || "Untitled task",
              projectName: task.project_name || task.projectName || project?.name || "TeamFlow Project",
              status: task.status || task.task_status || "In progress",
              date: getDateValue(task),
              deadline: task.due_date || task.dueDate || task.deadline || null,
            };
          });

        const projectActivity = projects
          .filter((project) => String(project.created_by ?? project.createdBy ?? project.manager_id) === String(currentUserId))
          .map((project) => ({
            id: `project-${project.id}`,
            type: "Project",
            title: project.name || "Untitled project",
            projectName: "Project created",
            status: project.status || "Active",
            date: getDateValue(project),
            deadline: project.deadline || null,
          }));

        const providerActivity = Array.isArray(history)
          ? history.map((item, index) => ({
              id: `history-${item.id ?? index}`,
              type: item.type || "Task",
              title: item.title || item.taskTitle || item.name || "Work activity",
              projectName: item.projectName || item.project_name || "TeamFlow Project",
              status: item.status || "Completed",
              date: getDateValue(item),
              deadline: item.deadline || item.due_date || null,
            }))
          : [];

        const merged = new Map();
        [...providerActivity, ...taskActivity, ...projectActivity].forEach((item) => {
          const key = `${item.type}-${item.title}-${item.projectName}`.toLowerCase();
          merged.set(key, item);
        });

        const sorted = [...merged.values()].sort((a, b) => {
          const ad = a.date ? new Date(a.date).getTime() : 0;
          const bd = b.date ? new Date(b.date).getTime() : 0;
          return bd - ad;
        });

        if (mounted) setActivityHistory(sorted);
      } catch (error) {
        console.error("Profile activity history error:", error);
        if (mounted) setActivityHistory(Array.isArray(history) ? history : []);
      } finally {
        if (mounted) setActivityLoading(false);
      }
    };

    loadActivity();
    return () => { mounted = false; };
  }, [currentUserId]);


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
                className="profile-select"
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: "48px",
                  cursor: "default",
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

                <h2>Work History</h2>

                <p>
                  Tasks and projects this team member has worked on, newest first.
                </p>

              </div>

              {activityLoading ? (
                <div className="profile-empty-history">
                  <h3>Loading work history...</h3>
                </div>
              ) : activityHistory.length === 0 ? (
                <div className="profile-empty-history">
                  <div className="profile-empty-icon">◷</div>
                  <h3>No work history yet</h3>
                  <p>Tasks and projects will appear here as work is assigned or completed.</p>
                </div>
              ) : (
                <div
                  className="profile-history-list"
                  style={{
                    maxHeight: "430px",
                    overflowY: "auto",
                    paddingRight: "8px",
                  }}
                >
                  {activityHistory.map((item, index) => (
                    <div
                      className="profile-history-item"
                      key={item.id || index}
                      style={{ marginBottom: "10px" }}
                    >
                      <div className="profile-history-marker" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: "7px", alignItems: "center", flexWrap: "wrap" }}>
                          <h3 style={{ marginBottom: 0 }}>
                            {item.title || "Work activity"}
                          </h3>
                          <span className="profile-history-type">{item.type || "Task"}</span>
                        </div>
                        <p>{item.projectName || "TeamFlow Project"}</p>
                        <small>
                          {item.status || "Completed"}
                          {item.date ? ` • ${new Date(item.date).toLocaleDateString("en-IN")}` : ""}
                          {item.deadline ? ` • Deadline: ${new Date(item.deadline).toLocaleDateString("en-IN")}` : ""}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </section>
          </div>

        </div>




      </div>

    </DashboardLayout>
  );
}