import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout.jsx";

import { useProjects } from "../context/ProjectContext.jsx";



const API_BASE_URL = "http://65.0.11.153:5001/api";



function ProjectDetails() {

  const { projectId } = useParams();

  const navigate = useNavigate();



  const { projects, members } = useProjects();



  const numericProjectId = Number(projectId);



  const [apiProjects, setApiProjects] = useState([]);

  const [projectTasks, setProjectTasks] = useState([]);



  const [loadingProject, setLoadingProject] = useState(true);

  const [loadingTasks, setLoadingTasks] = useState(false);

  const [creatingTask, setCreatingTask] = useState(false);



  const [showTaskModal, setShowTaskModal] = useState(false);



  const [taskTitle, setTaskTitle] = useState("");

  const [taskAssignee, setTaskAssignee] = useState("");

  const [taskDeadline, setTaskDeadline] = useState("");

  // Same userId that the backend gets from the JWT.
  const [currentUserId, setCurrentUserId] = useState(null);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [claimingTaskId, setClaimingTaskId] = useState(null);

  // =====================================================
  // INLINE QA WORKSPACE
  // QA is handled directly on this project page.
  // =====================================================
  const [qaTests, setQaTests] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaCreating, setQaCreating] = useState(false);
  const [qaName, setQaName] = useState("");
  const [qaDescription, setQaDescription] = useState("");
  const [qaMessage, setQaMessage] = useState("");
  const [qaError, setQaError] = useState("");
  const [qaExpanded, setQaExpanded] = useState(false);
  const [qaUpdatingId, setQaUpdatingId] = useState(null);

  const [showQaTicketModal, setShowQaTicketModal] = useState(false);
  const [selectedQaTest, setSelectedQaTest] = useState(null);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketDeadline, setTicketDeadline] = useState("");
  const [ticketCreating, setTicketCreating] = useState(false);
  const [qaTickets, setQaTickets] = useState([]);



  /* =====================================================

     CURRENT USER
  ===================================================== */

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCurrentUserId(null);
        return;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.userId ?? payload.id ?? null);
    } catch (error) {
      console.error("Failed to read current user from token:", error);
      setCurrentUserId(null);
    }
  }, []);


  /* =====================================================

     FIND FRONTEND PROJECT

  ===================================================== */



  const contextProject = projects.find(

    (item) => Number(item.id) === numericProjectId

  );



  /* =====================================================

     FIND BACKEND PROJECT



     We first try the backend ID directly.

     If that does not match, we try matching by name.

  ===================================================== */



  const apiProjectById = apiProjects.find(

    (item) => Number(item.id) === numericProjectId

  );



  const apiProjectByName = apiProjects.find(

    (item) =>

      item.name?.trim().toLowerCase() ===

      contextProject?.name?.trim().toLowerCase()

  );



  const apiProject = apiProjectById || apiProjectByName || null;



  /* =====================================================

     BACKEND PROJECT ID



     This is the ID used for:

       POST /projects/:id/tasks

  ===================================================== */



  const backendProjectId = apiProject?.id ?? null;



  /* =====================================================

     PROJECT DATA



     Prefer backend project once it has loaded.

  ===================================================== */



  const project = apiProject || contextProject;



  /* =====================================================

     FETCH PROJECTS

  ===================================================== */



  useEffect(() => {

    const fetchProjects = async () => {

      try {

        const token = localStorage.getItem("token");



        if (!token) {

          console.error("No authentication token found.");

          setLoadingProject(false);

          return;

        }



        const response = await fetch(`${API_BASE_URL}/projects`, {

          method: "GET",

          headers: {

            Authorization: `Bearer ${token}`,

          },

        });



        const data = await response.json();



        console.log("PROJECT DETAILS - PROJECTS RESPONSE:", data);



        if (!response.ok) {

          throw new Error(

            data.message || "Failed to fetch projects"

          );

        }



        setApiProjects(data.projects || []);

      } catch (error) {

        console.error("Failed to load projects:", error);

      } finally {

        setLoadingProject(false);

      }

    };



    fetchProjects();

  }, []);



  /* =====================================================

     FETCH ALL TASKS



     IMPORTANT:

     There is NO need for:



       /projects/:id/tasksview



     Backend provides:



       GET /api/all-tasks



     We fetch all tasks and then filter them by

     project_id.

  ===================================================== */



  const fetchProjectTasks = async (backendId) => {

    if (!backendId) {

      console.log("Backend project ID is not available yet.");

      return;

    }



    try {

      const token = localStorage.getItem("token");



      if (!token) {

        console.error("No authentication token found.");

        return;

      }



      setLoadingTasks(true);



      console.log(

        "FETCHING ALL TASKS FOR PROJECT ID:",

        backendId

      );



      const response = await fetch(`${API_BASE_URL}/all-tasks`, {

        method: "GET",

        headers: {

          Authorization: `Bearer ${token}`,

        },

      });



      const data = await response.json();



      console.log("ALL TASKS RESPONSE:", data);



      if (!response.ok) {

        throw new Error(

          data.message || "Failed to fetch tasks"

        );

      }



      const allTasks = data.tasks || [];



      /* ================================================

         FILTER TASKS FOR CURRENT PROJECT

      ================================================= */



      const currentProjectTasks = allTasks.filter(

        (task) =>

          Number(task.project_id) === Number(backendId)

      );



      console.log(

        "CURRENT PROJECT TASKS:",

        currentProjectTasks

      );



      setProjectTasks(currentProjectTasks);

    } catch (error) {

      console.error("Failed to load project tasks:", error);

      setProjectTasks([]);

    } finally {

      setLoadingTasks(false);

    }

  };



  /* =====================================================

     LOAD TASKS AFTER BACKEND PROJECT IS FOUND

  ===================================================== */



  useEffect(() => {

    if (!backendProjectId) {

      return;

    }



    fetchProjectTasks(backendProjectId);

  }, [backendProjectId]);



  /* =====================================================

     LOADING

  ===================================================== */



  if (loadingProject && !project) {

    return (

      <DashboardLayout>

        <div className="teamflow-page">

          <h2>Loading project...</h2>

        </div>

      </DashboardLayout>

    );

  }



  /* =====================================================

     PROJECT NOT FOUND

  ===================================================== */



  if (!project) {

    return (

      <DashboardLayout>

        <div className="teamflow-page">

          <h2>Project not found</h2>



          <button

            className="view-button"

            onClick={() => navigate("/projects")}

          >

            ← Back to projects

          </button>

        </div>

      </DashboardLayout>

    );

  }



  /* =====================================================

     PROJECT MEMBERS

  ===================================================== */



  const assignedIds = [

    ...new Set(

      projectTasks

        .map(

          (task) =>

            task.assigned_to ??

            task.assigneeId ??

            task.assignee_id

        )

        .filter(

          (value) =>

            value !== null &&

            value !== undefined

        )

        .map(Number)

    ),

  ];



  const projectMembers = members.filter((member) =>

    assignedIds.includes(Number(member.id))

  );



  /* =====================================================

     PROJECT PROGRESS

  ===================================================== */



  const completedTasks = projectTasks.filter((task) => {

    const status = String(

      task.status ||

        task.task_status ||

        ""

    ).toLowerCase();



    return (

      status === "completed" ||

      status === "closed" ||

      status === "done"

    );

  }).length;



  const progress =

    projectTasks.length > 0

      ? Math.round(

          (completedTasks / projectTasks.length) * 100

        )

      : 0;



  /* =====================================================

     CLOSE TASK MODAL

  ===================================================== */



  const closeTaskModal = () => {

    setShowTaskModal(false);

    setTaskTitle("");

    setTaskAssignee("");

    setTaskDeadline("");

  };



  /* =====================================================

     CREATE TASK



     POST:

       /api/projects/:backendProjectId/tasks

  ===================================================== */



  const submitTask = async (event) => {

    event.preventDefault();



    if (!taskTitle.trim()) {

      return;

    }



    if (!backendProjectId) {

      alert(

        "Backend project ID could not be found. Please refresh the page."

      );

      return;

    }



    try {

      const token = localStorage.getItem("token");



      if (!token) {

        alert(

          "Authentication required. Please login again."

        );

        return;

      }



      setCreatingTask(true);



      const requestBody = {

        title: taskTitle.trim(),

        assigned_to: taskAssignee

          ? Number(taskAssignee)

          : null,

        due_date: taskDeadline || null,

      };



      console.log(

        "CREATE TASK REQUEST:",

        requestBody

      );



      console.log(

        "CREATE TASK BACKEND PROJECT ID:",

        backendProjectId

      );



      const response = await fetch(

        `${API_BASE_URL}/projects/${backendProjectId}/tasks`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify(requestBody),

        }

      );



      const data = await response.json();



      console.log(

        "CREATE TASK RESPONSE:",

        data

      );



      if (!response.ok) {

        throw new Error(

          data.message || "Failed to create task"

        );

      }



      /*

       * Task successfully created.

       *

       * Instead of relying only on the POST response,

       * fetch all tasks again and filter the current project.

       */



      closeTaskModal();



      await fetchProjectTasks(

        backendProjectId

      );

    } catch (error) {

      console.error(

        "Failed to create task:",

        error

      );



      alert(

        error.message ||

          "Failed to create task."

      );

    } finally {

      setCreatingTask(false);

    }

  };
  /* =====================================================
     CLAIM TASK

     Open/unassigned tasks can be claimed directly from this
     project page. The backend gets the user from the JWT.
  ===================================================== */

  const handleClaimTask = async (taskId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Authentication required. Please login again.");
        return;
      }

      setClaimingTaskId(taskId);

      const response = await fetch(
        `${API_BASE_URL}/projects/${taskId}/claim`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to claim task");
      }

      await fetchProjectTasks(backendProjectId);
    } catch (error) {
      console.error("Failed to claim task:", error);
      alert(error.message || "Failed to claim task.");
    } finally {
      setClaimingTaskId(null);
    }
  };

  /* =====================================================
     INLINE QA HELPERS
  ===================================================== */

  const normalizeQaStatus = (status) =>
    String(status || "pending").trim().toLowerCase();

  const qaTestId = (test) => test?.id ?? test?.qa_test_id ?? test?.qaTestId;

  const loadQaTests = async () => {
    if (!backendProjectId) return;

    try {
      setQaLoading(true);
      setQaError("");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required. Please login again.");

      const response = await fetch(
        `${API_BASE_URL}/projects/${backendProjectId}/qa-tests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load QA tests");
      }

      const tests = data.testCases || data.qaTests || data || [];
      setQaTests(Array.isArray(tests) ? tests : []);
    } catch (error) {
      console.error("Failed to load QA tests:", error);
      setQaError(error.message || "Failed to load QA tests.");
    } finally {
      setQaLoading(false);
    }
  };

  useEffect(() => {
    if (backendProjectId && qaExpanded && progress === 100) {
      loadQaTests();
    }
  }, [backendProjectId, qaExpanded, progress]);

  const startQaTesting = () => {
    setQaExpanded(true);
    setQaMessage("");
    setQaError("");
  };

  const createQaTestInline = async (event) => {
    event.preventDefault();

    if (!qaName.trim() || !qaDescription.trim()) {
      setQaError("Test name and description are required.");
      return;
    }

    try {
      setQaCreating(true);
      setQaError("");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required. Please login again.");

      const response = await fetch(
        `${API_BASE_URL}/projects/${backendProjectId}/qa-tests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: qaName.trim(),
            description: qaDescription.trim(),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create QA test");
      }

      const created = data.testCase || data.qaTest || data;
      if (created && typeof created === "object") {
        setQaTests((current) => [...current, created]);
      } else {
        await loadQaTests();
      }

      setQaName("");
      setQaDescription("");
      setQaMessage("QA test created successfully.");
    } catch (error) {
      console.error("Failed to create QA test:", error);
      setQaError(error.message || "Failed to create QA test.");
    } finally {
      setQaCreating(false);
    }
  };

  const updateQaStatus = async (test, status) => {
    const id = qaTestId(test);
    if (!id) {
      setQaError("This QA test does not have a valid ID.");
      return;
    }

    try {
      setQaUpdatingId(id);
      setQaError("");
      setQaMessage("");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required. Please login again.");

      const response = await fetch(
        `${API_BASE_URL}/projects/${backendProjectId}/qa-tests/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (!response.ok) {
        throw new Error(data.message || "Failed to update QA test");
      }

      const updated = data.testCase || data.qaTest || data;
      setQaTests((current) =>
        current.map((item) =>
          String(qaTestId(item)) === String(id)
            ? { ...item, ...(updated || {}), status }
            : item
        )
      );

      if (status === "failed") {
        setSelectedQaTest({ ...test, ...(updated || {}), status });
        setTicketTitle(test.name || test.title || "");
        setTicketDescription(
          `Issue found while testing ${test.name || test.title || "this test case"}.`
        );
        setTicketPriority("Medium");
        setTicketDeadline("");
        setShowQaTicketModal(true);
      } else {
        setQaMessage("QA test passed.");
      }
    } catch (error) {
      console.error("Failed to update QA test:", error);
      setQaError(error.message || "Failed to update QA test.");
    } finally {
      setQaUpdatingId(null);
    }
  };

  const createQaTicketInline = async (event) => {
    event.preventDefault();

    if (!ticketTitle.trim() || !ticketDescription.trim() || !ticketDeadline) {
      setQaError("Ticket title, description and fix deadline are required.");
      return;
    }

    try {
      setTicketCreating(true);
      setQaError("");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required. Please login again.");

      const response = await fetch(
        `${API_BASE_URL}/projects/${backendProjectId}/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            qa_test_id: qaTestId(selectedQaTest),
            title: ticketTitle.trim(),
            description: ticketDescription.trim(),
            priority: ticketPriority,
            due_date: ticketDeadline,
          }),
        }
      );

      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Failed to create ticket (${response.status})`
        );
      }

      const createdTicket = data.ticket || data.data || data;
      setQaTickets((current) => [...current, createdTicket]);
      setShowQaTicketModal(false);
      setSelectedQaTest(null);
      setTicketTitle("");
      setTicketDescription("");
      setTicketPriority("Medium");
      setTicketDeadline("");
      setQaMessage("QA issue ticket created successfully.");

      // Refresh the test list so the database remains the source of truth.
      await loadQaTests();
    } catch (error) {
      console.error("Failed to create QA ticket:", error);
      setQaError(error.message || "Failed to create QA ticket.");
    } finally {
      setTicketCreating(false);
    }
  };

  /* =====================================================

     COMPLETE TASK
  ===================================================== */

  const handleCompleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Authentication required. Please login again.");
        return;
      }

      setCompletingTaskId(taskId);

      const response = await fetch(
        `${API_BASE_URL}/projects/tasks/${taskId}/complete`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete task");
      }

      await fetchProjectTasks(backendProjectId);
    } catch (error) {
      console.error("Failed to complete task:", error);
      alert(error.message || "Failed to complete task.");
    } finally {
      setCompletingTaskId(null);
    }
  };





  return (

    <DashboardLayout>

      <div className="teamflow-page project-detail-page">



        {/* BACK */}



        <button

          className="back-button"

          onClick={() => navigate("/projects")}

        >

          ← All projects

        </button>



        {/* PROJECT HERO */}



        <section className="project-hero">

          <div>



            <p className="welcome-label">

              PROJECT WORKSPACE

            </p>



            <h2>{project.name}</h2>



            <p>

              {project.description ||

                "No project description provided."}

            </p>



            <span

              className={`project-status ${

                String(project.status)

                  .toLowerCase()

                  .includes("risk")

                  ? "risk"

                  : ""

              }`}

            >

              {project.status || "ACTIVE"}

            </span>



          </div>



          <div

            className="project-progress-circle"

            title={`${progress}% project progress`}

          >



            <svg viewBox="0 0 120 120">



              <circle

                className="progress-circle-track"

                cx="60"

                cy="60"

                r="48"

              />



              <circle

                className="progress-circle-value"

                cx="60"

                cy="60"

                r="48"

                style={{

                  strokeDashoffset:

                    301.59 -

                    (301.59 * progress) / 100,

                }}

              />



            </svg>



            <div className="progress-circle-text">

              <strong>{progress}%</strong>

              <span>Progress</span>

            </div>



          </div>

        </section>



        {/* PROJECT SUMMARY */}



        <section className="project-summary">



          <article>

            <small>Deadline</small>



            <strong>

              {project.deadline

                ? new Date(

                    project.deadline

                  ).toLocaleDateString()

                : "Not set"}

            </strong>

          </article>



          <article>

            <small>Team members</small>



            <strong>

              {projectMembers.length}

            </strong>

          </article>



          <article>

            <small>Total tasks</small>



            <strong>

              {projectTasks.length}

            </strong>

          </article>



        </section>



        {/* PROJECT WORK GRID */}



        <div className="project-work-grid">



          {/* PROJECT DESCRIPTION */}



          <section className="project-description-section">



            <article className="panel project-description-panel">



              <div className="panel-header">



                <div>



                  <h3>

                    Project description

                  </h3>



                  <p>

                    Description provided for this project.

                  </p>



                </div>



              </div>



              <div className="project-description-content">



                <h4>

                  {project.description ||

                    "No project description provided."}

                </h4>



              </div>



            </article>



          </section>



          {/* PROJECT TASKS */}



          <section className="panel project-task-panel">



            <div className="panel-header">



              <div>



                <h3>

                  Project tasks

                </h3>



                <p>

                  Create work, assign members or leave

                  tasks open for team members to claim.

                </p>



              </div>



              <button

                className="create-project-button"

                onClick={() =>

                  setShowTaskModal(true)

                }

              >

                <span>+</span>

                Create task

              </button>



            </div>



            <div className="table-container">



              <table>



                <thead>



                  <tr>

                    <th>Task</th>

                    <th>Assigned to</th>

                    <th>Status</th>

                    <th>Deadline</th>

                    <th>Progress</th>

                    <th>Action</th>

                  </tr>



                </thead>



                <tbody>



                  {loadingTasks ? (



                    <tr>



                      <td

                        colSpan="6"

                        style={{

                          textAlign: "center",

                          padding: "40px",

                        }}

                      >

                        Loading tasks...

                      </td>



                    </tr>



                  ) : projectTasks.length === 0 ? (



                    <tr>



                      <td

                        colSpan="6"

                        style={{

                          textAlign: "center",

                          padding: "40px",

                        }}

                      >

                        No tasks created yet.

                      </td>



                    </tr>



                  ) : (



                    projectTasks.map((task) => {



                      const assigneeId =

                        task.assigned_to ??

                        task.assigneeId ??

                        task.assignee_id;



                      const member =

                        members.find(

                          (item) =>

                            Number(item.id) ===

                            Number(assigneeId)

                        );



                      const taskStatus =

                        task.status ||

                        task.task_status ||

                        "TODO";



                      const taskDeadline =

                        task.due_date ??

                        task.dueDate ??

                        task.deadline ??

                        null;



                      /*

                       * Backend currently does not return

                       * individual task progress.

                       */



                      const taskProgress =

                        Number(task.progress) || 0;



                      return (



                        <tr key={task.id}>



                          {/* TASK */}



                          <td>



                            <strong>

                              {task.title ||

                                task.name ||

                                "Untitled task"}

                            </strong>



                          </td>



                          {/* ASSIGNED TO */}



                          <td>



                            {member ? (



                              <div className="table-member">



                                <div className="member-avatar">



                                  {member.name

                                    ?.charAt(0)

                                    ?.toUpperCase()}



                                </div>



                                <div>



                                  <strong>

                                    {member.name}

                                  </strong>



                                  <span>

                                    {member.role}

                                  </span>



                                </div>



                              </div>



                            ) : task.claimed_by_name  ||

                                task.claimedByName ? (



                              <div className="table-member">



                                <div className="member-avatar">



                                  {(task.claimed_by_name ||

                                     task.claimedByName ||

                                      ""

                                    )

                                    .charAt(0)

                                    ?.toUpperCase()}



                                </div>



                                <div>



                                  <strong>

                                    {task.claimed_by_name || task.claimedByName}

                                  </strong>



                                  <span>

                                    Claimed

                                  </span>



                                </div>



                              </div>



                            ) : (



                              <span className="unassigned">

                                Unassigned

                              </span>



                            )}



                          </td>



                          {/* STATUS */}



                          <td>



                            <span

                              className={`task-status ${String(

                                taskStatus

                              )

                                .toLowerCase()

                                .replaceAll(

                                  " ",

                                  "-"

                                )}`}

                            >

                              {taskStatus}

                            </span>



                          </td>



                          {/* DEADLINE */}



                          <td>



                            {taskDeadline

                              ? new Date(

                                  taskDeadline

                                ).toLocaleDateString()

                              : "Not set"}



                          </td>



                          {/* PROGRESS */}



                          <td>



                            <div className="table-progress">



                              <div className="progress-background">



                                <div

                                  className="progress-fill"

                                  style={{

                                    width: `${taskProgress}%`,

                                  }}

                                />



                              </div>



                              <span>

                                {taskProgress}%

                              </span>



                            </div>



                          </td>

                          {/* ACTION */}
                          <td>
                            {String(taskStatus).trim().toUpperCase() === "COMPLETED" ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "7px 12px",
                                  borderRadius: "8px",
                                  background: "rgba(34, 197, 94, 0.14)",
                                  color: "#22c55e",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                }}
                              >
                                Completed
                              </span>
                            ) : String(task.claimed_by ?? task.claimedBy ?? "") === String(currentUserId ?? "") && currentUserId != null ? (
                              <button
                                type="button"
                                onClick={() => handleCompleteTask(task.id)}
                                disabled={completingTaskId === task.id}
                                style={{
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "8px 14px",
                                  background: "#14b8a6",
                                  color: "white",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                  cursor: completingTaskId === task.id ? "not-allowed" : "pointer",
                                  opacity: completingTaskId === task.id ? 0.7 : 1,
                                }}
                              >
                                {completingTaskId === task.id ? "Completing..." : "Complete"}
                              </button>
                            ) : task.claimed_by || task.claimedBy ? (
                              <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                                Claimed
                              </span>
                            ) : !assigneeId ? (
                              <button
                                type="button"
                                onClick={() => handleClaimTask(task.id)}
                                disabled={claimingTaskId === task.id}
                                style={{
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "8px 14px",
                                  background: "#14b8a6",
                                  color: "white",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                  cursor: claimingTaskId === task.id ? "not-allowed" : "pointer",
                                  opacity: claimingTaskId === task.id ? 0.7 : 1,
                                }}
                              >
                                {claimingTaskId === task.id ? "Claiming..." : "Claim Task"}
                              </button>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                                Assigned
                              </span>
                            )}
                          </td>



                        </tr>



                      );

                    })



                  )}



                </tbody>



              </table>



            </div>



          </section>



        </div>



        {/* =====================================================
            INLINE QA TESTING
            QA stays on the project details page.
        ===================================================== */}
        <section className="panel" style={{ marginTop: "24px" }}>
          <div
            className="panel-header"
            style={{ alignItems: "center", gap: "20px" }}
          >
            <div>
              <p className="welcome-label" style={{ marginBottom: "6px" }}>
                QUALITY ASSURANCE
              </p>
              <h3 style={{ marginBottom: "6px" }}>QA Testing</h3>
              <p>
                Create test cases and pass or fail them without leaving this project.
              </p>
            </div>

            {!qaExpanded && (
              <button
                type="button"
                className="create-project-button"
                disabled={progress !== 100}
                onClick={startQaTesting}
                title={
                  progress !== 100
                    ? "Complete all project tasks before starting QA."
                    : "Start QA testing"
                }
                style={{ opacity: progress === 100 ? 1 : 0.55 }}
              >
                {progress === 100 ? "Start QA Testing" : "QA after 100%"}
              </button>
            )}
          </div>

          {progress !== 100 && (
            <div
              style={{
                marginTop: "14px",
                padding: "14px 16px",
                borderRadius: "10px",
                background: "rgba(148, 163, 184, 0.08)",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              QA testing becomes available after all project tasks are completed. Current project progress: <strong>{progress}%</strong>.
            </div>
          )}

          {qaExpanded && progress === 100 && (
            <div style={{ marginTop: "20px" }}>
              {qaError && (
                <div
                  style={{
                    marginBottom: "14px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.10)",
                    color: "#fca5a5",
                  }}
                >
                  {qaError}
                </div>
              )}

              {qaMessage && (
                <div
                  style={{
                    marginBottom: "14px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "rgba(20, 184, 166, 0.10)",
                    color: "#5eead4",
                  }}
                >
                  {qaMessage}
                </div>
              )}

              <form
                onSubmit={createQaTestInline}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.5fr auto",
                  gap: "12px",
                  alignItems: "end",
                  marginBottom: "20px",
                }}
              >
                <div className="form-group">
                  <label>Test case name</label>
                  <input
                    value={qaName}
                    onChange={(event) => setQaName(event.target.value)}
                    placeholder="e.g. Password reset functionality"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <input
                    value={qaDescription}
                    onChange={(event) => setQaDescription(event.target.value)}
                    placeholder="Verify that users can reset their password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="create-project-submit"
                  disabled={qaCreating}
                  style={{ minHeight: "42px" }}
                >
                  {qaCreating ? "Creating..." : "+ Create QA"}
                </button>
              </form>

              {qaLoading ? (
                <div style={{ padding: "30px 0", color: "#94a3b8" }}>
                  Loading QA test cases...
                </div>
              ) : qaTests.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    border: "1px dashed rgba(148,163,184,.25)",
                    borderRadius: "10px",
                    color: "#94a3b8",
                  }}
                >
                  No QA test cases yet. Create the first test above.
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Test case</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qaTests.map((test) => {
                        const status = normalizeQaStatus(test.status);
                        const id = qaTestId(test);
                        const updating = qaUpdatingId === id;

                        return (
                          <tr key={id || `${test.name}-${test.description}`}>
                            <td>
                              <strong>{test.name || test.title || "Untitled test"}</strong>
                            </td>
                            <td style={{ maxWidth: "420px" }}>
                              {test.description || "—"}
                            </td>
                            <td>
                              <span
                                className={`task-status ${status.replaceAll(" ", "-")}`}
                              >
                                {status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {status === "passed" ? (
                                <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "12px" }}>
                                  Passed
                                </span>
                              ) : status === "failed" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedQaTest(test);
                                    setTicketTitle(test.name || test.title || "");
                                    setTicketDescription(`Issue found while testing ${test.name || test.title || "this test case"}.`);
                                    setTicketPriority("Medium");
                                    setTicketDeadline("");
                                    setShowQaTicketModal(true);
                                  }}
                                  style={{
                                    border: "1px solid rgba(239,68,68,.35)",
                                    background: "transparent",
                                    color: "#fca5a5",
                                    borderRadius: "8px",
                                    padding: "7px 12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  Create Issue
                                </button>
                              ) : (
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    type="button"
                                    onClick={() => updateQaStatus(test, "passed")}
                                    disabled={updating}
                                    style={{
                                      border: "none",
                                      borderRadius: "8px",
                                      padding: "7px 12px",
                                      background: "#16a34a",
                                      color: "white",
                                      fontWeight: 700,
                                      cursor: updating ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    PASS
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateQaStatus(test, "failed")}
                                    disabled={updating}
                                    style={{
                                      border: "none",
                                      borderRadius: "8px",
                                      padding: "7px 12px",
                                      background: "#dc2626",
                                      color: "white",
                                      fontWeight: 700,
                                      cursor: updating ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    FAIL
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {qaTickets.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <div className="panel-header" style={{ marginBottom: "10px" }}>
                    <div>
                      <h3>QA Issues</h3>
                      <p>Issues created from failed QA test cases.</p>
                    </div>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Ticket</th>
                          <th>Priority</th>
                          <th>Fix deadline</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qaTickets.map((ticket, index) => (
                          <tr key={ticket?.id || index}>
                            <td><strong>{ticket?.title || "QA issue"}</strong></td>
                            <td>{ticket?.priority || "Medium"}</td>
                            <td>{ticket?.due_date || ticket?.deadline || "Not set"}</td>
                            <td>{ticket?.status || "Open"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* QA ISSUE MODAL */}
        {showQaTicketModal && (
          <div
            className="project-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowQaTicketModal(false);
              }
            }}
          >
            <div
              className="create-project-modal"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>Create QA issue</h2>
                  <p>Create a ticket for the failed QA test.</p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowQaTicketModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={createQaTicketInline}>
                <div className="project-form-grid">
                  <div className="form-group">
                    <label>Ticket title</label>
                    <input
                      required
                      value={ticketTitle}
                      onChange={(event) => setTicketTitle(event.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input
                      required
                      value={ticketDescription}
                      onChange={(event) => setTicketDescription(event.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={ticketPriority}
                      onChange={(event) => setTicketPriority(event.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fix deadline</label>
                    <input
                      type="date"
                      required
                      value={ticketDeadline}
                      onChange={(event) => setTicketDeadline(event.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-project-button"
                    onClick={() => setShowQaTicketModal(false)}
                    disabled={ticketCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="create-project-submit"
                    disabled={ticketCreating}
                  >
                    {ticketCreating ? "Creating..." : "Create ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATE TASK MODAL */}



        {showTaskModal && (



          <div

            className="project-modal-overlay"

            onMouseDown={(event) => {



              if (

                event.target ===

                event.currentTarget

              ) {

                closeTaskModal();

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

                    Create new task

                  </h2>



                  <p>

                    Add work to {project.name} and

                    optionally assign it to a member.

                  </p>



                </div>



                <button

                  type="button"

                  className="modal-close"

                  onClick={closeTaskModal}

                >

                  ×

                </button>



              </div>



              {/* FORM */}



              <form onSubmit={submitTask}>



                <div className="project-form-grid">



                  {/* TASK NAME */}



                  <div className="form-group">



                    <label>

                      Task name

                    </label>



                    <input

                      required

                      value={taskTitle}

                      onChange={(event) =>

                        setTaskTitle(

                          event.target.value

                        )

                      }

                      placeholder="e.g. Build login page"

                    />



                  </div>



                  {/* ASSIGN MEMBER */}



                  <div className="form-group">



                    <label>

                      Assign to

                    </label>



                    <select

                      value={taskAssignee}

                      onChange={(event) =>

                        setTaskAssignee(

                          event.target.value

                        )

                      }

                    >



                      <option value="">

                        Leave unassigned

                      </option>



                      {members.map((member) => (



                        <option

                          key={member.id}

                          value={member.id}

                        >

                          {member.name} —{" "}

                          {member.role}

                        </option>



                      ))}



                    </select>



                  </div>



                  {/* DEADLINE */}



                  <div className="form-group">



                    <label>

                      Deadline

                    </label>



                    <input

                      type="date"

                      value={taskDeadline}

                      onChange={(event) =>

                        setTaskDeadline(

                          event.target.value

                        )

                      }

                    />



                  </div>



                </div>



                {/* MODAL FOOTER */}



                <div className="modal-footer">



                  <button

                    type="button"

                    className="cancel-project-button"

                    onClick={closeTaskModal}

                    disabled={creatingTask}

                  >

                    Cancel

                  </button>



                  <button

                    type="submit"

                    className="create-project-submit"

                    disabled={creatingTask}

                  >

                    {creatingTask

                      ? "Creating..."

                      : "Create task"}

                  </button>



                </div>



              </form>



            </div>



          </div>



        )}



      </div>

    </DashboardLayout>

  );

}



export default ProjectDetails;