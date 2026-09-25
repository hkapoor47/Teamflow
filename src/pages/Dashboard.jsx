import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout.jsx";

import { useProjects } from "../context/ProjectContext.jsx";



const API_BASE_URL = "http://65.0.11.153:5001/api";



function Dashboard() {

  const navigate = useNavigate();



  // Project context is kept only for compatibility with the existing app.

  // Task data is now fetched directly from the backend.

  useProjects();



  const [projects, setProjects] = useState([]);

  const [loadingProjects, setLoadingProjects] = useState(true);

  const [projectError, setProjectError] = useState("");



  // --------------------------------------------------

  // BACKEND TASK DATA

  // --------------------------------------------------



  const [backendTasks, setBackendTasks] = useState([]);

  const [loadingTasks, setLoadingTasks] = useState(true);



  // --------------------------------------------------

  // FETCH PROJECTS FROM BACKEND

  // --------------------------------------------------



  useEffect(() => {

    const fetchProjects = async () => {

      try {

        setLoadingProjects(true);

        setProjectError("");



        const token = localStorage.getItem("token");



        if (!token) {

          throw new Error(

            "Authentication required. Please login again."

          );

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



        console.log("DASHBOARD PROJECTS:", data);



        if (!response.ok) {

          throw new Error(

            data.message || "Failed to fetch projects"

          );

        }



        setProjects(

          Array.isArray(data.projects)

            ? data.projects

            : []

        );

      } catch (error) {

        console.error(

          "Dashboard projects error:",

          error

        );



        setProjectError(

          error.message ||

            "Unable to load projects."

        );

      } finally {

        setLoadingProjects(false);

      }

    };



    fetchProjects();

  }, []);



  // --------------------------------------------------

  // FETCH ALL TASKS FROM BACKEND

  // --------------------------------------------------



  useEffect(() => {

    const fetchTasks = async () => {

      try {

        setLoadingTasks(true);



        const token = localStorage.getItem("token");



        if (!token) {

          throw new Error(

            "Authentication required. Please login again."

          );

        }



        const response = await fetch(

          `${API_BASE_URL}/all-tasks`,

          {

            method: "GET",

            headers: {

              Authorization: `Bearer ${token}`,

            },

          }

        );



        const data = await response.json();



        console.log(

          "DASHBOARD ALL TASKS:",

          data

        );



        if (!response.ok) {

          throw new Error(

            data.message ||

              "Failed to fetch tasks"

          );

        }



        const allTasks = Array.isArray(data.tasks)

          ? data.tasks

          : [];



        setBackendTasks(allTasks);



        console.log(

          "TASKS FROM DATABASE:",

          allTasks

        );



        console.log(

          "TOTAL TASKS:",

          allTasks.length

        );

      } catch (error) {

        console.error(

          "Dashboard tasks error:",

          error

        );



        setBackendTasks([]);

      } finally {

        setLoadingTasks(false);

      }

    };



    fetchTasks();

  }, []);



  // --------------------------------------------------

  // TOTAL TASKS

  // --------------------------------------------------



  const totalTasks = backendTasks.length;



  // --------------------------------------------------

  // ACTIVE / IN-PROGRESS TASKS

  // --------------------------------------------------



  const activeTasks = backendTasks.filter(

    (task) => {

      const status = String(

        task.status || ""

      )

        .trim()

        .toLowerCase();



      return (

        status === "in progress" ||

        status === "in_progress" ||

        status === "in-progress"

      );

    }

  ).length;



  // --------------------------------------------------

  // ACTIVE PROJECTS

  // --------------------------------------------------



  const activeProjects = projects.filter(

    (project) =>

      String(project.status || "")

        .toUpperCase() !== "COMPLETED"

  );



  // --------------------------------------------------

  // RENDER

  // --------------------------------------------------



  return (

    <DashboardLayout>

      <div className="teamflow-page dashboard">



        {/* --------------------------------------------- */}

        {/* PAGE HEADING */}

        {/* --------------------------------------------- */}



        <section className="welcome teamflow-heading">

          <div>



            <p className="welcome-label">

              TEAMFLOW WORKSPACE

            </p>



            <h2>

              Dashboard

            </h2>



            <p className="welcome-description">

              A clear view of delivery, deadlines and the

              people doing the work.

            </p>



          </div>

        </section>



        {/* --------------------------------------------- */}

        {/* OVERVIEW CARDS */}

        {/* --------------------------------------------- */}



        <section

          className="overview-grid dashboard-overview-grid"

          aria-label="Project overview"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "20px",
            width: "100%",
            marginBottom: "24px",
          }}
        >



          {/* TOTAL PROJECTS */}



          <button

            className="overview-card"

            style={{ width: "100%", minHeight: "150px", padding: "28px 30px", display: "flex", alignItems: "center", gap: "22px", textAlign: "left", boxSizing: "border-box" }}
            onClick={() =>

              navigate("/projects")

            }

          >



            <span className="overview-icon teal" style={{ width: "64px", height: "64px", minWidth: "64px", display: "grid", placeItems: "center", fontSize: "22px" }}>

              ▣

            </span>



            <span>



              <small>

                Total projects

              </small>



              <strong>

                {loadingProjects

                  ? "..."

                  : projects.length}

              </strong>



              <em>

                View every project

              </em>



            </span>



          </button>



          {/* TOTAL TASKS */}



          <button

            className="overview-card"

            style={{ width: "100%", minHeight: "150px", padding: "28px 30px", display: "flex", alignItems: "center", gap: "22px", textAlign: "left", boxSizing: "border-box" }}
            onClick={() =>

              navigate("/tasks")

            }

          >



            <span className="overview-icon blue" style={{ width: "64px", height: "64px", minWidth: "64px", display: "grid", placeItems: "center", fontSize: "24px" }}>

              ✓

            </span>



            <span>



              <small>

                Total tasks

              </small>



              <strong>

                {loadingTasks

                  ? "..."

                  : totalTasks}

              </strong>



              <em>

                {loadingTasks

                  ? "Loading..."

                  : `${activeTasks} in progress`}

              </em>



            </span>



          </button>
</section>



        {/* --------------------------------------------- */}

        {/* ACTIVE PROJECTS */}

        {/* --------------------------------------------- */}



        <section className="panel active-projects-panel">



          <div className="panel-header">



            <div>



              <h3>

                Active projects

              </h3>



              <p>

                Projects currently being worked on.

              </p>



            </div>



          </div>



          <div className="active-project-list dashboard-project-scroll">



            {/* LOADING */}



            {loadingProjects ? (



              <div className="empty-state">



                <strong>

                  Loading projects...

                </strong>



                <p>

                  Getting projects from the server.

                </p>



              </div>



            ) : projectError ? (



              /* ERROR */



              <div className="empty-state">



                <strong>

                  Unable to load projects

                </strong>



                <p>

                  {projectError}

                </p>



              </div>



            ) : activeProjects.length === 0 ? (



              /* EMPTY */



              <div className="empty-state">



                <span>

                  ✓

                </span>



                <strong>

                  No active projects

                </strong>



                <p>

                  All projects are currently completed.

                </p>



              </div>



            ) : (



              /* PROJECT LIST */



              activeProjects.map(

                (project) => {



                  return (

                    <button

                      className="active-project-row"

                      key={project.id}

                      onClick={() =>

                        navigate(

                          `/projects/${project.id}`

                        )

                      }

                    >



                      {/* PROJECT ICON */}



                      <span className="project-avatar">



                        {project.name

                          ?.charAt(0)

                          ?.toUpperCase() ||

                          "P"}



                      </span>



                      {/* PROJECT INFO */}



                      <span className="active-project-main">



                        <strong className="active-project-name">

                          {project.name}

                        </strong>



                        <small>



                          Status:{" "}

                          {project.status ||

                            "ACTIVE"}



                          {" · "}



                          Due{" "}



                          {project.deadline

                            ? new Date(

                                project.deadline

                              ).toLocaleDateString()

                            : "Not set"}



                        </small>



                      </span>



                      {/* PROJECT STATUS */}



                      <span className="progress-number">

                        {project.status ||

                          "ACTIVE"}

                      </span>



                    </button>

                  );

                }

              )



            )}



          </div>



        </section>



      </div>

    </DashboardLayout>

  );

}



export default Dashboard;
