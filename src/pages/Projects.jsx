import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout.jsx";



const API_BASE_URL = "http://65.0.11.153:5001/api";



function Projects() {

  const navigate = useNavigate();



  const [projects, setProjects] = useState([]);

  const [showModal, setShowModal] = useState(false);



  const [projectName, setProjectName] = useState("");

  const [description, setDescription] = useState("");

  const [deadline, setDeadline] = useState("");



  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");

  const loadRecommendedProjects = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setRecommendationsError("Please login again to get recommendations."); return; }
    setRecommendationsLoading(true); setRecommendationsError("");
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/my-tasks`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 404 ? "Recommendation API not found (404). Deploy the updated backend recommendation route and restart the backend." : (data.message || `Could not load project recommendations (${response.status}).`));
      const tasks = Array.isArray(data.recommendations) ? data.recommendations : [];
      const scores = new Map();
      tasks.forEach((task, index) => {
        if (task.projectId == null) return;
        const id = String(task.projectId);
        const entry = scores.get(id) || { score: 0, tasks: [] };
        entry.score += Number(task.successProbability ?? 0) || (tasks.length - index);
        entry.tasks.push(task.title); scores.set(id, entry);
      });
      const ranked = projects.filter(project => scores.has(String(project.id)))
        .map(project => ({ ...project, recommendationScore: scores.get(String(project.id)).score, recommendedTaskTitles: scores.get(String(project.id)).tasks }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, 5);
      setRecommendedProjects(ranked);
      if (!ranked.length) setRecommendationsError("No projects currently contain unassigned tasks recommended for your profile.");
    } catch (err) { setRecommendedProjects([]); setRecommendationsError(err.message || "Could not load project recommendations."); }
    finally { setRecommendationsLoading(false); }
  };



  // --------------------------------------------------

  // FETCH ALL PROJECTS

  // --------------------------------------------------



  const fetchProjects = async () => {

    try {

      setLoading(true);

      setError("");



      const token = localStorage.getItem("token");



      if (!token) {

        setError(

          "Authentication required. Please login again."

        );

        return [];

      }



      const response = await fetch(

        `${API_BASE_URL}/projects`,

        {

          method: "GET",

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );



      const data = await response.json();



      console.log("PROJECTS RESPONSE:", data);



      if (!response.ok) {

        throw new Error(

          data.message || "Failed to fetch projects"

        );

      }



      const projectList = data.projects || [];



      setProjects(projectList);



      return projectList;

    } catch (err) {

      console.error("Fetch projects error:", err);



      setError(

        err.message || "Unable to load projects."

      );



      return [];

    } finally {

      setLoading(false);

    }

  };



  // --------------------------------------------------

  // LOAD PROJECTS WHEN PAGE OPENS

  // --------------------------------------------------



  useEffect(() => {

    fetchProjects();

  }, []);



  // --------------------------------------------------

  // CLOSE CREATE PROJECT MODAL

  // --------------------------------------------------



  const closeModal = () => {

    setShowModal(false);



    setProjectName("");

    setDescription("");

    setDeadline("");

    setError("");

  };



  // --------------------------------------------------

  // CREATE PROJECT

  // --------------------------------------------------



  const submit = async (event) => {

    event.preventDefault();



    if (

      !projectName.trim() ||

      !description.trim() ||

      !deadline

    ) {

      return;

    }



    try {

      setCreating(true);

      setError("");



      const token = localStorage.getItem("token");



      if (!token) {

        setError(

          "Authentication required. Please login again."

        );

        return;

      }



      const response = await fetch(

        `${API_BASE_URL}/projects`,

        {

          method: "POST",



          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },



          body: JSON.stringify({

            name: projectName.trim(),

            description: description.trim(),

            deadline,

          }),

        }

      );



      const data = await response.json();



      console.log(

        "CREATE PROJECT RESPONSE:",

        data

      );



      if (!response.ok) {

        throw new Error(

          data.message || "Failed to create project"

        );

      }



      // Fetch latest projects from database

      await fetchProjects();



      // Close modal and stay on All Projects

      closeModal();

    } catch (err) {

      console.error(

        "Create project error:",

        err

      );



      setError(

        err.message ||

          "Unable to create project."

      );

    } finally {

      setCreating(false);

    }

  };



  // --------------------------------------------------

  // RENDER

  // --------------------------------------------------



  return (

    <DashboardLayout>

      <div className="teamflow-page projects-page">
          <style>{`
            .recommendation-project-card { position: relative; overflow: hidden; }
            .recommendation-project-card::before { content: ""; position: absolute; inset: 0 auto auto 0; width: 100%; height: 3px; background: linear-gradient(90deg, #2dd4bf, rgba(45,212,191,0)); opacity: .9; }
            .recommendation-project-card:hover { transform: translateY(-3px); border-color: rgba(45,212,191,.42) !important; box-shadow: 0 16px 30px rgba(0,0,0,.2) !important; }
            .recommendation-project-card:focus-within { outline: 2px solid rgba(45,212,191,.55); outline-offset: 2px; }
            @media (max-width: 600px) { .recommendation-project-card { padding: 14px !important; } }
          `}</style>



        {/* PAGE HEADER */}



        <section className="projects-page-header teamflow-heading" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1>All projects</h1>
          </div>
          <div className="projects-header-actions" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
            <button
              type="button"
              onClick={loadRecommendedProjects}
              disabled={recommendationsLoading}
              aria-busy={recommendationsLoading}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                minHeight: 44, padding: "0 16px", borderRadius: 12,
                border: "1px solid rgba(45, 212, 191, .42)",
                background: recommendationsLoading ? "rgba(20, 184, 166, .08)" : "rgba(20, 184, 166, .13)",
                color: "var(--text-primary, #e8f3ff)", fontWeight: 650, cursor: recommendationsLoading ? "wait" : "pointer",
                whiteSpace: "nowrap", transition: "background .18s ease, border-color .18s ease", opacity: recommendationsLoading ? .8 : 1
              }}
            >
              <span aria-hidden="true">{recommendationsLoading ? "◌" : "✦"}</span>
              {recommendationsLoading ? "Finding matches…" : "Recommended for me"}
            </button>
            <button
              type="button"
              className="create-project-button"
              onClick={() => { setError(""); setShowModal(true); }}
            >
              <span>+</span> Create project
            </button>
          </div>
        </section>



        {recommendationsError && (
          <div className="project-error" role="status" style={{ marginBottom: 12 }}>
            {recommendationsError}
          </div>
        )}

        {recommendationsLoading && (
          <section
            className="panel"
            aria-live="polite"
            style={{
              marginBottom: 18,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "1px solid rgba(45, 212, 191, .28)",
              background: "linear-gradient(135deg, rgba(20,184,166,.10), rgba(15,23,42,.18))",
              borderRadius: 18,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 22, color: "#2dd4bf" }}>✦</span>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>Finding your best project matches</strong>
              <span style={{ fontSize: 13, opacity: .75 }}>Checking recommended tasks against your profile and work history…</span>
            </div>
          </section>
        )}

        {recommendedProjects.length > 0 && (
          <section
            className="panel"
            aria-label="Recommended projects"
            style={{
              marginBottom: 22,
              padding: "clamp(16px, 2.2vw, 24px)",
              borderRadius: 20,
              border: "1px solid rgba(45, 212, 191, .25)",
              background: "linear-gradient(145deg, rgba(20,184,166,.08), rgba(15,23,42,.20) 48%, rgba(30,41,59,.45))",
              boxShadow: "0 14px 34px rgba(0,0,0,.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#5eead4", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
                  <span aria-hidden="true">✦</span> Personalised matches
                </div>
                <h3 style={{ margin: "0 0 7px", fontSize: "clamp(19px, 2vw, 24px)" }}>Projects recommended for you</h3>
                <p style={{ margin: 0, maxWidth: 620, lineHeight: 1.55, opacity: .78 }}>
                  Projects with open tasks that best match your skills and work history.
                </p>
              </div>
              <span style={{ flexShrink: 0, border: "1px solid rgba(45,212,191,.3)", background: "rgba(20,184,166,.10)", color: "#5eead4", borderRadius: 999, padding: "7px 11px", fontSize: 12, fontWeight: 750 }}>
                {recommendedProjects.length} {recommendedProjects.length === 1 ? "match" : "matches"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 14 }}>
              {recommendedProjects.map((project, index) => {
                const taskTitles = Array.isArray(project.recommendedTaskTitles) ? project.recommendedTaskTitles.filter(Boolean) : [];
                const dueDate = project.deadline ? new Date(project.deadline) : null;
                const validDueDate = dueDate && !Number.isNaN(dueDate.getTime());
                return (
                  <article
                    key={project.id}
                    className="recommendation-project-card"
                    style={{
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      padding: 17,
                      borderRadius: 16,
                      border: "1px solid rgba(148,163,184,.18)",
                      background: "linear-gradient(160deg, rgba(30,41,59,.78), rgba(15,23,42,.72))",
                      boxShadow: "0 7px 18px rgba(0,0,0,.10)",
                      transition: "transform .18s ease, border-color .18s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                      <div aria-hidden="true" style={{ width: 44, height: 44, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 13, color: "#ccfbf1", fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg, #0f766e, #14b8a6)", boxShadow: "0 5px 14px rgba(20,184,166,.16)" }}>
                        {(project.name || "P").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 750, color: "#5eead4" }}>MATCH {String(index + 1).padStart(2, "0")}</span>
                          {project.status && <span style={{ fontSize: 10, fontWeight: 750, letterSpacing: ".04em", borderRadius: 999, padding: "4px 7px", background: "rgba(34,197,94,.10)", color: "#86efac" }}>{project.status}</span>}
                        </div>
                        <h4 style={{ margin: 0, fontSize: 16, lineHeight: 1.35, overflowWrap: "anywhere" }}>{project.name || `Project #${project.id}`}</h4>
                        <div style={{ marginTop: 5, fontSize: 12, opacity: .65 }}>Project #{project.id}</div>
                      </div>
                    </div>

                    <div style={{ flex: 1, borderRadius: 12, padding: 12, background: "rgba(2,6,23,.25)", border: "1px solid rgba(148,163,184,.10)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9, fontSize: 12, fontWeight: 750 }}>
                        <span aria-hidden="true" style={{ color: "#5eead4" }}>▤</span> Recommended open tasks
                      </div>
                      {taskTitles.length ? (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                          {taskTitles.slice(0, 3).map((title, taskIndex) => (
                            <li key={`${project.id}-${taskIndex}-${title}`} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: 1.4, color: "var(--text-primary, #e8f3ff)" }}>
                              <span aria-hidden="true" style={{ color: "#2dd4bf", marginTop: 1 }}>•</span>
                              <span style={{ overflowWrap: "anywhere" }}>{title}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ margin: 0, fontSize: 13, opacity: .7 }}>Open this project to explore its tasks.</p>
                      )}
                      {taskTitles.length > 3 && <p style={{ margin: "9px 0 0", fontSize: 11, opacity: .65 }}>+{taskTitles.length - 3} more recommended {taskTitles.length - 3 === 1 ? "task" : "tasks"}</p>}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, opacity: .72 }}>
                        <span aria-hidden="true">◷</span> {validDueDate ? `Due ${dueDate.toLocaleDateString()}` : "No deadline set"}
                      </span>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 40, padding: "0 14px", borderRadius: 10, whiteSpace: "nowrap" }}
                      >
                        Open project <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {error && !showModal && (

          <div className="project-error">

            {error}

          </div>

        )}



        {/* PROJECT LIST */}



        {loading ? (



          <div className="empty-state">

            <strong>

              Loading projects...

            </strong>



            <p>

              Getting the latest projects

              from the server.

            </p>

          </div>



        ) : projects.length === 0 ? (



          <div className="empty-state">

            <strong>

              No projects yet

            </strong>



            <p>

              Create your first project

              to get started.

            </p>

          </div>



        ) : (



          <div className="projects-grid">



            {projects.map((project) => {



              const description =

                project.description ||

                "No project description";



              const status =

                project.status ||

                "ACTIVE";



              return (



                <button

                  className="project-card"

                  key={project.id}

                  onClick={() =>

                    navigate(

                      `/projects/${project.id}`

                    )

                  }

                >



                  {/* PROJECT HEADER */}



                  <div className="project-card-header">



                    <div className="project-avatar">

                      {project.name

                        ?.charAt(0)

                        ?.toUpperCase() || "P"}

                    </div>



                    <div className="project-title">



                      <h3>

                        {project.name}

                      </h3>



                      {/* <p>

                        {description}

                      </p> */}



                    </div>



                    <span

                      className={`project-status ${

                        status === "At Risk"

                          ? "risk"

                          : ""

                      }`}

                    >

                      {status}

                    </span>



                  </div>



                  {/* PROJECT DESCRIPTION */}



                  <div className="project-card-progress">



                    <div className="progress-label">



                      {/* <span>

                        Project description

                      </span> */}



                    </div>



                    <p>

                      {description}

                    </p>



                  </div>



                  {/* PROJECT FOOTER */}



                  <div className="project-card-footer">



                    <span>

                      Project #{project.id}

                    </span>



                    <span>

                      Due{" "}

                      {project.deadline

                        ? new Date(

                            project.deadline

                          ).toLocaleDateString()

                        : "Not set"}

                    </span>



                  </div>



                </button>

              );

            })}



          </div>

        )}



        {/* CREATE PROJECT MODAL */}



        {showModal && createPortal(



          <div

            className="project-modal-overlay"

            onMouseDown={(event) => {



              if (

                event.target ===

                event.currentTarget

              ) {

                closeModal();

              }



            }}

          >



            <div

              className="create-project-modal"

              onMouseDown={(event) =>

                event.stopPropagation()

              }

            >



              {/* MODAL HEADER */}



              <div className="modal-header">



                <div>



                  <h2>

                    Create new project

                  </h2>



                  <p>

                    Add the project description

                    and deadline.

                  </p>



                </div>



                <button

                  type="button"

                  className="modal-close"

                  onClick={closeModal}

                  disabled={creating}

                >

                  ×

                </button>



              </div>



              {/* MODAL ERROR */}



              {error && (

                <div className="project-error">

                  {error}

                </div>

              )}



              <form onSubmit={submit}>



                <div className="project-form-grid">



                  {/* PROJECT NAME */}



                  <div className="form-group">



                    <label>

                      Project name

                    </label>



                    <input

                      required

                      value={projectName}

                      onChange={(event) =>

                        setProjectName(

                          event.target.value

                        )

                      }

                      placeholder="e.g. Customer portal"

                      disabled={creating}

                    />



                  </div>



                  {/* PROJECT DESCRIPTION */}



                  <div className="form-group">



                    <label>

                      Project description

                    </label>



                    <textarea

                      required

                      value={description}

                      onChange={(event) =>

                        setDescription(

                          event.target.value

                        )

                      }

                      placeholder="Describe what this project is about"

                      disabled={creating}

                    />



                  </div>



                  {/* DEADLINE */}



                  <div className="form-group">



                    <label>

                      Deadline

                    </label>



                    <input

                      required

                      type="date"

                      value={deadline}

                      onChange={(event) =>

                        setDeadline(

                          event.target.value

                        )

                      }

                      disabled={creating}

                    />



                  </div>



                </div>



                {/* MODAL FOOTER */}



                <div className="modal-footer">



                  <button

                    type="button"

                    className="cancel-project-button"

                    onClick={closeModal}

                    disabled={creating}

                  >

                    Cancel

                  </button>



                  <button

                    type="submit"

                    className="create-project-submit"

                    disabled={creating}

                  >

                    {creating

                      ? "Creating..."

                      : "Create project"}

                  </button>



                </div>



              </form>



            </div>



          </div>



        , document.body)}



      </div>

    </DashboardLayout>

  );

}



export default Projects;