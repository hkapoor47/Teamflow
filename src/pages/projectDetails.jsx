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
  const [taskDependency, setTaskDependency] = useState("");

  // Same userId that the backend gets from the JWT.
  const [currentUserId, setCurrentUserId] = useState(null);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [claimingTaskId, setClaimingTaskId] = useState(null);

  // =====================================================
  // TASK-LEVEL QA WORKSPACE
  // QA is performed immediately after an individual task is completed.
  // =====================================================
  const [qaTests, setQaTests] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaCreatingTaskId, setQaCreatingTaskId] = useState(null);
  const [qaOpenTaskId, setQaOpenTaskId] = useState(null);
  const [qaName, setQaName] = useState("");
  const [qaDescription, setQaDescription] = useState("");
  const [qaMessage, setQaMessage] = useState("");
  const [qaError, setQaError] = useState("");
  const [qaUpdatingId, setQaUpdatingId] = useState(null);

  const [selectedQaTest, setSelectedQaTest] = useState(null);
  const [qaTickets, setQaTickets] = useState([]);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketDeadline, setTicketDeadline] = useState("");
  const [ticketCreating, setTicketCreating] = useState(false);



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
    setTaskDependency("");

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
        depends_on_task_id: taskDependency ? Number(taskDependency) : null,

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
     COMPLETE TASK -> MOVE TO QA
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
      await loadQaTests();
      setQaOpenTaskId(taskId);
    } catch (error) {
      console.error("Failed to complete task:", error);
      alert(error.message || "Failed to complete task.");
    } finally {
      setCompletingTaskId(null);
    }
  };

  /* =====================================================
     TASK-LEVEL QA HELPERS
  ===================================================== */

  const normalizeQaStatus = (status) =>
    String(status || "PENDING").trim().toUpperCase();

  const qaTestId = (test) =>
    test?.id ?? test?.qa_test_id ?? test?.qaTestId;

  const getQaTaskId = (test) =>
    test?.task_id ?? test?.taskId ?? null;

  const testsForTask = (taskId) =>
    qaTests.filter(
      (test) =>
        getQaTaskId(test) != null &&
        String(getQaTaskId(test)) === String(taskId)
    );

  const taskQaStatus = (taskId, task) => {
    const explicit = normalizeQaStatus(task?.qa_status);
    if (explicit && explicit !== "NOT_STARTED") return explicit;

    const tests = testsForTask(taskId);
    if (!tests.length) return "NOT_STARTED";
    if (tests.some((test) => normalizeQaStatus(test.status) === "FAILED")) {
      return "FAILED";
    }
    if (tests.every((test) => normalizeQaStatus(test.status) === "PASSED")) {
      return "PASSED";
    }
    return "PENDING";
  };

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
          method: "GET",
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
    if (backendProjectId) {
      loadQaTests();
    }
  }, [backendProjectId]);

  const openQaForTask = (taskId) => {
    setQaOpenTaskId(taskId);
    setQaMessage("");
    setQaError("");
    setQaName("");
    setQaDescription("");

    // Keep QA collapsed by default. Starting QA only opens the
    // project-level QA workspace below the task table.
    window.setTimeout(() => {
      document.getElementById("project-qa-workspace")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const createQaTestForTask = async (event, taskId) => {
    event.preventDefault();

    if (!qaName.trim() || !qaDescription.trim()) {
      setQaError("Test name and description are required.");
      return;
    }

    try {
      setQaCreatingTaskId(taskId);
      setQaError("");
      setQaMessage("");

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
            task_id: Number(taskId),
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
      if (created?.id) {
        setQaTests((current) => [...current, created]);
      }

      setQaName("");
      setQaDescription("");
      setQaMessage("QA test case created.");
      await loadQaTests();
    } catch (error) {
      console.error("Failed to create QA test:", error);
      setQaError(error.message || "Failed to create QA test.");
    } finally {
      setQaCreatingTaskId(null);
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
        `${API_BASE_URL}/qa-tests/${id}`,
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
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`QA API returned an invalid response (${response.status}).`);
      }

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

      await Promise.all([
        loadQaTests(),
        fetchProjectTasks(backendProjectId),
      ]);

      if (status === "PASSED") {
        setQaMessage("QA test passed.");
      } else {
        setQaMessage("QA test failed. Create a fix ticket before re-testing.");
        setSelectedQaTest({ ...test, ...(updated || {}), status });
        setTicketTitle(test.name || test.title || "QA issue");
        setTicketDescription(
          `Issue found while testing ${test.name || test.title || "this test case"}.`
        );
        setTicketPriority("Medium");
        setTicketDeadline("");
        setQaOpenTaskId(getQaTaskId(test) ?? qaOpenTaskId);
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

    const selectedTestId = qaTestId(selectedQaTest);
    if (!selectedTestId) {
      setQaError("The failed QA test could not be identified.");
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
            qa_test_id: selectedTestId,
            title: ticketTitle.trim(),
            description: ticketDescription.trim(),
            priority: ticketPriority,
            due_date: ticketDeadline,
          }),
        }
      );

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Ticket API returned an invalid response (${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to create ticket");
      }

      const createdTicket = data.ticket || data;
      if (createdTicket && (createdTicket.id || createdTicket.ticket_id)) {
        setQaTickets((current) => [createdTicket, ...current]);
      }

      setSelectedQaTest(null);
      setTicketTitle("");
      setTicketDescription("");
      setTicketPriority("Medium");
      setTicketDeadline("");
      setQaMessage("QA issue ticket created. The task remains blocked until the fix is re-tested and passed.");
      await loadQaTests();
    } catch (error) {
      console.error("Failed to create QA ticket:", error);
      setQaError(error.message || "Failed to create QA ticket.");
    } finally {
      setTicketCreating(false);
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

                        <>

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
                              (() => {
                                const qaStatus = taskQaStatus(task.id, task);
                                const qaPassed = qaStatus === "PASSED";
                                const qaFailed = qaStatus === "FAILED";

                                return (
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "7px 10px",
                                        borderRadius: "8px",
                                        background: qaPassed
                                          ? "rgba(34, 197, 94, 0.14)"
                                          : qaFailed
                                          ? "rgba(239, 68, 68, 0.14)"
                                          : "rgba(234, 179, 8, 0.14)",
                                        color: qaPassed
                                          ? "#4ade80"
                                          : qaFailed
                                          ? "#fca5a5"
                                          : "#facc15",
                                        fontWeight: 700,
                                        fontSize: "11px",
                                      }}
                                    >
                                      {qaPassed ? "QA Passed" : qaFailed ? "QA Failed" : "QA Pending"}
                                    </span>

                                    {!qaPassed && (
                                      <button
                                        type="button"
                                        onClick={() => openQaForTask(task.id)}
                                        style={{
                                          border: "1px solid rgba(94,219,211,.35)",
                                          borderRadius: "8px",
                                          padding: "7px 11px",
                                          background: "transparent",
                                          color: "#7de7df",
                                          fontWeight: 700,
                                          fontSize: "11px",
                                          cursor: "pointer",
                                        }}
                                      >
                                        {qaFailed ? "Review QA" : "Start QA"}
                                      </button>
                                    )}

                                    {qaPassed && (
                                      <span style={{ color: "#64748b", fontSize: "11px" }}>
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                );
                              })()
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

                        </>

                      );

                    })



                  )}



                </tbody>



              </table>



            </div>



          </section>



        </div>



        {/* =====================================================
            PROJECT QA WORKSPACE
            QA is handled here for every completed task.
        ===================================================== */}
        <section
          id="project-qa-workspace"
          style={{
            marginTop: "22px",
            border: "1px solid rgba(94, 219, 211, 0.18)",
            borderRadius: "16px",
            background: "rgba(15, 28, 43, 0.78)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 22px",
              borderBottom: "1px solid rgba(148,163,184,.10)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  color: "#5edbd3",
                  fontWeight: 800,
                }}
              >
                QUALITY ASSURANCE
              </div>
              <h3 style={{ margin: "5px 0 4px" }}>QA Testing</h3>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                Test completed tasks side by side. Failed tests can create tickets
                and remain blocked until they are fixed and re-tested.
              </p>
            </div>

            <div
              style={{
                padding: "8px 11px",
                borderRadius: "9px",
                background: "rgba(148,163,184,.08)",
                color: "#cbd5e1",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {qaTests.filter((test) => normalizeQaStatus(test.status) === "PASSED").length}
              {" / "}
              {qaTests.length} tests passed
            </div>
          </div>

          {qaOpenTaskId != null && (
            <div
              style={{
                margin: "18px 22px 0",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid rgba(94,219,211,.18)",
                background: "rgba(20, 184, 166, .06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "10px",
                      letterSpacing: ".08em",
                      color: "#5edbd3",
                      fontWeight: 800,
                    }}
                  >
                    START QA
                  </span>
                  <h4 style={{ margin: "4px 0 0" }}>
                    {projectTasks.find(
                      (task) => String(task.id) === String(qaOpenTaskId)
                    )?.title ||
                      projectTasks.find(
                        (task) => String(task.id) === String(qaOpenTaskId)
                      )?.name ||
                      `Task #${qaOpenTaskId}`}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQaOpenTaskId(null);
                    setQaName("");
                    setQaDescription("");
                  }}
                  style={{
                    border: "1px solid rgba(148,163,184,.22)",
                    borderRadius: "8px",
                    padding: "7px 11px",
                    background: "transparent",
                    color: "#94a3b8",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  Collapse
                </button>
              </div>

              <form
                onSubmit={(event) =>
                  createQaTestForTask(event, qaOpenTaskId)
                }
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.5fr auto",
                  gap: "10px",
                  alignItems: "end",
                }}
              >
                <div className="form-group">
                  <label>QA test name</label>
                  <input
                    value={qaName}
                    onChange={(event) => setQaName(event.target.value)}
                    placeholder="e.g. Password reset works"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>What should be verified?</label>
                  <input
                    value={qaDescription}
                    onChange={(event) => setQaDescription(event.target.value)}
                    placeholder="Verify the task works as expected"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="create-project-submit"
                  disabled={qaCreatingTaskId === qaOpenTaskId}
                  style={{ minHeight: "42px" }}
                >
                  {qaCreatingTaskId === qaOpenTaskId
                    ? "Creating..."
                    : "+ Create QA"}
                </button>
              </form>
            </div>
          )}

          <div style={{ padding: "18px 22px 22px" }}>
            {qaLoading ? (
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                Loading QA tests...
              </div>
            ) : projectTasks.filter(
                (task) =>
                  String(task.status || task.task_status || "")
                    .trim()
                    .toUpperCase() === "COMPLETED"
              ).length === 0 ? (
              <div
                style={{
                  padding: "18px",
                  borderRadius: "10px",
                  background: "rgba(148,163,184,.05)",
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                Complete a task to start its QA testing here.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {projectTasks
                  .filter(
                    (task) =>
                      String(task.status || task.task_status || "")
                        .trim()
                        .toUpperCase() === "COMPLETED"
                  )
                  .map((task) => {
                    const taskQa = testsForTask(task.id);
                    const status = taskQaStatus(task.id, task);
                    const isOpen =
                      String(qaOpenTaskId) === String(task.id);

                    return (
                      <div
                        key={`qa-task-${task.id}`}
                        style={{
                          border: "1px solid rgba(148,163,184,.10)",
                          borderRadius: "12px",
                          background: "rgba(148,163,184,.035)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "14px 15px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <strong>
                              {task.title || task.name || "Task"}
                            </strong>
                            <div
                              style={{
                                marginTop: "4px",
                                color: "#94a3b8",
                                fontSize: "12px",
                              }}
                            >
                              {taskQa.length} QA test
                              {taskQa.length === 1 ? "" : "s"}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                padding: "6px 9px",
                                borderRadius: "7px",
                                background:
                                  status === "PASSED"
                                    ? "rgba(34,197,94,.12)"
                                    : status === "FAILED"
                                    ? "rgba(239,68,68,.12)"
                                    : "rgba(234,179,8,.12)",
                                color:
                                  status === "PASSED"
                                    ? "#4ade80"
                                    : status === "FAILED"
                                    ? "#fca5a5"
                                    : "#facc15",
                                fontSize: "11px",
                                fontWeight: 800,
                              }}
                            >
                              {status === "NOT_STARTED"
                                ? "QA Pending"
                                : status === "PENDING"
                                ? "QA Pending"
                                : status === "FAILED"
                                ? "QA Failed"
                                : "QA Passed"}
                            </span>

                            {status !== "PASSED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  isOpen
                                    ? setQaOpenTaskId(null)
                                    : openQaForTask(task.id)
                                }
                                style={{
                                  border: "1px solid rgba(94,219,211,.35)",
                                  borderRadius: "8px",
                                  padding: "7px 11px",
                                  background: "transparent",
                                  color: "#7de7df",
                                  fontWeight: 700,
                                  fontSize: "11px",
                                  cursor: "pointer",
                                }}
                              >
                                {isOpen
                                  ? "Close"
                                  : status === "FAILED"
                                  ? "Review QA"
                                  : "Start QA"}
                              </button>
                            )}
                          </div>
                        </div>

                        {taskQa.length === 0 && (
                          <div
                            style={{
                              padding: "0 15px 14px",
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            No QA tests created yet.
                          </div>
                        )}

                        {taskQa.length > 0 && (
                          <div
                            style={{
                              padding: "0 15px 15px",
                              display: "grid",
                              gap: "8px",
                            }}
                          >
                            {taskQa.map((test) => {
                              const testStatus = normalizeQaStatus(test.status);
                              const updating =
                                String(qaUpdatingId) ===
                                String(qaTestId(test));

                              return (
                                <div
                                  key={qaTestId(test)}
                                  style={{
                                    padding: "12px 13px",
                                    borderRadius: "9px",
                                    background: "rgba(148,163,184,.045)",
                                    border: "1px solid rgba(148,163,184,.09)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <strong>
                                      {test.name || test.title || "QA test"}
                                    </strong>
                                    <div
                                      style={{
                                        marginTop: "4px",
                                        color: "#94a3b8",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {test.description ||
                                        "No description provided."}
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "7px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        padding: "6px 9px",
                                        borderRadius: "7px",
                                        background:
                                          testStatus === "PASSED"
                                            ? "rgba(34,197,94,.12)"
                                            : testStatus === "FAILED"
                                            ? "rgba(239,68,68,.12)"
                                            : "rgba(148,163,184,.10)",
                                        color:
                                          testStatus === "PASSED"
                                            ? "#4ade80"
                                            : testStatus === "FAILED"
                                            ? "#fca5a5"
                                            : "#cbd5e1",
                                        fontSize: "11px",
                                        fontWeight: 800,
                                      }}
                                    >
                                      {testStatus}
                                    </span>

                                    {testStatus !== "PASSED" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateQaStatus(test, "PASSED")
                                        }
                                        disabled={updating}
                                        style={{
                                          border: "none",
                                          borderRadius: "7px",
                                          padding: "7px 10px",
                                          background: "#16a34a",
                                          color: "white",
                                          fontWeight: 700,
                                          fontSize: "11px",
                                          cursor: updating
                                            ? "not-allowed"
                                            : "pointer",
                                        }}
                                      >
                                        PASS
                                      </button>
                                    )}

                                    {testStatus !== "FAILED" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateQaStatus(test, "FAILED")
                                        }
                                        disabled={updating}
                                        style={{
                                          border: "none",
                                          borderRadius: "7px",
                                          padding: "7px 10px",
                                          background: "#dc2626",
                                          color: "white",
                                          fontWeight: 700,
                                          fontSize: "11px",
                                          cursor: updating
                                            ? "not-allowed"
                                            : "pointer",
                                        }}
                                      >
                                        FAIL
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {selectedQaTest && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "17px",
                  borderRadius: "12px",
                  border: "1px solid rgba(239,68,68,.22)",
                  background: "rgba(239,68,68,.055)",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      letterSpacing: ".08em",
                      color: "#fca5a5",
                      fontWeight: 800,
                    }}
                  >
                    FAILED QA TEST
                  </div>
                  <h4 style={{ margin: "4px 0 3px" }}>
                    {selectedQaTest.name ||
                      selectedQaTest.title ||
                      "QA test"}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#94a3b8",
                      fontSize: "12px",
                    }}
                  >
                    Create a fix ticket. The QA test should be re-tested after
                    the issue is fixed.
                  </p>
                </div>

                <form
                  onSubmit={createQaTicketInline}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div className="form-group">
                    <label>Ticket Title</label>
                    <input
                      value={ticketTitle}
                      onChange={(event) =>
                        setTicketTitle(event.target.value)
                      }
                      placeholder="e.g. Password reset not working"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={ticketPriority}
                      onChange={(event) =>
                        setTicketPriority(event.target.value)
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Description</label>
                    <textarea
                      value={ticketDescription}
                      onChange={(event) =>
                        setTicketDescription(event.target.value)
                      }
                      placeholder="Describe the issue found during QA..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fix Deadline</label>
                    <input
                      type="date"
                      value={ticketDeadline}
                      onChange={(event) =>
                        setTicketDeadline(event.target.value)
                      }
                      required
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "end",
                      justifyContent: "flex-end",
                      gap: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedQaTest(null)}
                      style={{
                        border: "1px solid rgba(148,163,184,.22)",
                        borderRadius: "8px",
                        padding: "9px 13px",
                        background: "transparent",
                        color: "#94a3b8",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={ticketCreating}
                      className="create-project-submit"
                    >
                      {ticketCreating ? "Creating..." : "Create QA Ticket"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {qaTickets.length > 0 && (
              <div style={{ marginTop: "18px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: ".08em",
                    color: "#94a3b8",
                    fontWeight: 800,
                    marginBottom: "9px",
                  }}
                >
                  RECENT QA TICKETS
                </div>

                <div style={{ display: "grid", gap: "8px" }}>
                  {qaTickets.map((ticket) => (
                    <div
                      key={ticket.id || ticket.ticket_id}
                      style={{
                        padding: "12px 13px",
                        borderRadius: "9px",
                        border: "1px solid rgba(148,163,184,.09)",
                        background: "rgba(148,163,184,.035)",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <strong>
                          {ticket.title || "QA issue"}
                        </strong>
                        <div
                          style={{
                            marginTop: "3px",
                            color: "#94a3b8",
                            fontSize: "12px",
                          }}
                        >
                          {ticket.description || "No description"}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding: "6px 8px",
                            borderRadius: "7px",
                            background: "rgba(148,163,184,.08)",
                            color: "#cbd5e1",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {ticket.priority || "Medium"}
                        </span>
                        <span
                          style={{
                            padding: "6px 8px",
                            borderRadius: "7px",
                            background: "rgba(234,179,8,.10)",
                            color: "#facc15",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {ticket.status || "Open"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            QA NOTIFICATIONS
        ===================================================== */}
        {qaMessage && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(20, 184, 166, 0.10)",
              color: "#5eead4",
              fontSize: "13px",
            }}
          >
            {qaMessage}
          </div>
        )}

        {qaError && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.10)",
              color: "#fca5a5",
              fontSize: "13px",
            }}
          >
            {qaError}
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



                  {/* DEPENDENCY */}

                  <div className="form-group">
                    <label>Depends on task</label>
                    <select
                      value={taskDependency}
                      onChange={(event) => setTaskDependency(event.target.value)}
                    >
                      <option value="">No dependency</option>
                      {projectTasks.map((existingTask) => (
                        <option key={existingTask.id} value={existingTask.id}>
                          {existingTask.title || existingTask.name || `Task #${existingTask.id}`}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: "#7f95ad", display: "block", marginTop: "5px" }}>
                      If selected, this task unlocks only after the dependency passes QA.
                    </small>
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