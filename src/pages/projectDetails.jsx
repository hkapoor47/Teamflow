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
  const [selectedQaTaskId, setSelectedQaTaskId] = useState(null);
  const [qaUpdatingId, setQaUpdatingId] = useState(null);
  const [qaDeletingId, setQaDeletingId] = useState(null);
  const [qaRetestingId, setQaRetestingId] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [claimingTicketId, setClaimingTicketId] = useState(null);
  const [completingTicketId, setCompletingTicketId] = useState(null);

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



  useEffect(() => {
    if (backendProjectId && qaExpanded) {
      loadQaTests();
      loadQaTickets();
    }
  }, [backendProjectId, qaExpanded]);

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



  // A task is fully complete only after development is completed AND
  // all of its QA tests have passed. The backend stores this as qa_status.
  const completedTasks = projectTasks.filter((task) => {
    const status = String(task.status || task.task_status || "").toUpperCase();
    const qaStatus = String(task.qa_status || "").toUpperCase();

    return (
      ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(status) &&
      qaStatus === "PASSED"
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
     TASK-LEVEL QA WORKSPACE
     QA belongs to a completed development task.
  ===================================================== */

  const normalizeQaStatus = (status) =>
    String(status || "PENDING").trim().toUpperCase();

  const qaTestId = (test) =>
    test?.id ?? test?.qa_test_id ?? test?.qaTestId ?? null;

  const getTestTaskId = (test) =>
    test?.task_id ?? test?.taskId ?? null;

  const getTicketId = (ticket) =>
    ticket?.id ?? ticket?.ticket_id ?? ticket?.ticketId ?? null;

  const getTicketQaTestId = (ticket) =>
    ticket?.qa_test_id ??
    ticket?.qaTestId ??
    ticket?.test_case_id ??
    ticket?.testCaseId ??
    null;

  const getTicketClaimedBy = (ticket) =>
    ticket?.claimed_by ??
    ticket?.claimedBy ??
    ticket?.assigned_to ??
    ticket?.assignedTo ??
    null;

  const getTicketClaimedName = (ticket) =>
    ticket?.claimed_by_name ||
    ticket?.claimedByName ||
    ticket?.assigned_to_name ||
    ticket?.assignedToName ||
    ticket?.claimant_name ||
    ticket?.claimantName ||
    null;

  const selectedQaTask = projectTasks.find(
    (task) => String(task.id) === String(selectedQaTaskId)
  );

  const loadQaTickets = async () => {
    if (!backendProjectId) return;

    try {
      setTicketLoading(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required. Please login again.");

      const response = await fetch(
        `${API_BASE_URL}/projects/${backendProjectId}/tickets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        throw new Error(
          data.message || data.error || "Failed to load QA tickets"
        );
      }

      const tickets =
        data.tickets ||
        data.qaTickets ||
        data.data ||
        (Array.isArray(data) ? data : []);

      setQaTickets(Array.isArray(tickets) ? tickets : []);
    } catch (error) {
      console.error("Failed to load QA tickets:", error);
      // Do not overwrite a working QA screen when the optional ticket GET
      // endpoint is unavailable.
      setQaTickets([]);
    } finally {
      setTicketLoading(false);
    }
  };

  const loadQaTests = async () => {
    if (!backendProjectId) return;

    try {
      setQaLoading(true);
      setQaError("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/projects/${backendProjectId}/qa-tests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        throw new Error(data.message || "Failed to load QA tests");
      }

      const tests =
        data.testCases ||
        data.qaTests ||
        data.data ||
        (Array.isArray(data) ? data : []);

      setQaTests(Array.isArray(tests) ? tests : []);
    } catch (error) {
      console.error("Failed to load QA tests:", error);
      setQaError(error.message || "Failed to load QA tests.");
    } finally {
      setQaLoading(false);
    }
  };

  const refreshQaWorkspace = async () => {
    await Promise.all([loadQaTests(), loadQaTickets()]);
    await fetchProjectTasks(backendProjectId);
  };

  const startQaTesting = (taskId) => {
    setSelectedQaTaskId(taskId);
    setQaExpanded(true);
    setQaMessage("");
    setQaError("");

    window.setTimeout(() => {
      document
        .getElementById("task-qa-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  /* =====================================================
     TASK-LEVEL QA

     The task itself is the QA item shown to the user.
     We do NOT ask the user to create another QA task/test case.

     The existing qa_tests API is still used as a backend adapter because
     the ticket API expects qa_test_id and the QA API owns tasks.qa_status.
     A QA test row is created silently the first time a task is tested.
  ===================================================== */

  const ensureQaTestForTask = async (task) => {
    if (!task?.id || !backendProjectId) {
      throw new Error("A valid task and project are required for QA.");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    // The UI is task-based. The qa_tests row is only a hidden backend
    // record required by the existing QA/ticket APIs. Always fetch fresh
    // records so a stale QA id cannot cause a 404 on PATCH.
    const getResponse = await fetch(
      `${API_BASE_URL}/projects/${backendProjectId}/qa-tests`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const getText = await getResponse.text();
    let getData = {};
    try {
      getData = getText ? JSON.parse(getText) : {};
    } catch {
      throw new Error(`QA lookup API returned an invalid response (${getResponse.status}).`);
    }

    if (!getResponse.ok) {
      throw new Error(
        getData.message || getData.error ||
        `Failed to load QA records (${getResponse.status})`
      );
    }

    const freshTests =
      getData.testCases || getData.qaTests || getData.data ||
      (Array.isArray(getData) ? getData : []);

    const existing = Array.isArray(freshTests)
      ? freshTests.find(
          (test) => String(getTestTaskId(test)) === String(task.id)
        )
      : null;

    if (existing?.id) {
      setQaTests(Array.isArray(freshTests) ? freshTests : []);
      return existing;
    }

    // First QA attempt for this task: create the hidden backend record.
    const createResponse = await fetch(
      `${API_BASE_URL}/projects/${backendProjectId}/qa-tests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_id: Number(task.id),
          name: task.title || task.name || `QA for task #${task.id}`,
          description:
            task.description ||
            `Verify that the completed task "${task.title || task.name || `#${task.id}`}" works as expected.`,
        }),
      }
    );

    const createText = await createResponse.text();
    let createData = {};
    try {
      createData = createText ? JSON.parse(createText) : {};
    } catch {
      throw new Error(`QA setup API returned an invalid response (${createResponse.status}).`);
    }

    if (!createResponse.ok) {
      throw new Error(
        createData.message || createData.error ||
        `Failed to initialize QA (${createResponse.status})`
      );
    }

    const created =
      createData.testCase || createData.qaTest || createData.data || createData;

    if (!created?.id) {
      throw new Error("QA setup succeeded but no QA record ID was returned.");
    }

    setQaTests((current) => [
      ...current.filter(
        (item) => String(qaTestId(item)) !== String(created.id)
      ),
      created,
    ]);

    return created;
  };

  const updateTaskQaStatus = async (task, status) => {
    if (!task?.id) {
      setQaError("This task does not have a valid ID.");
      return;
    }

    try {
      setQaUpdatingId(task.id);
      setQaError("");
      setQaMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      // Find/create the backend QA record silently, while the UI remains task-based.
      const qaTest = await ensureQaTestForTask(task);
      const id = qaTestId(qaTest);

      const response = await fetch(`${API_BASE_URL}/qa-tests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `QA update API returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Failed to update QA (${response.status})`
        );
      }

      const updated = data.testCase || data.qaTest || data.data || data;

      setQaTests((current) =>
        current.map((item) =>
          String(qaTestId(item)) === String(id)
            ? { ...item, ...(updated || {}), status }
            : item
        )
      );

      if (status === "PASSED") {
        setQaMessage(`QA passed for task: ${task.title || task.name || `#${task.id}`}`);
        setSelectedQaTaskId(null);
        await Promise.all([
          loadQaTests(),
          loadQaTickets(),
          fetchProjectTasks(backendProjectId),
        ]);
        return;
      }

      setQaMessage("QA failed. Create a fix ticket for this task.");
      setSelectedQaTest({ ...qaTest, ...(updated || {}), status: "FAILED" });
      setTicketTitle(task.title || task.name || "QA issue");
      setTicketDescription(
        `Issue found while testing the completed task: ${task.title || task.name || `#${task.id}`}.`
      );
      setTicketPriority("Medium");
      setTicketDeadline("");
      setShowQaTicketModal(true);

      await Promise.all([
        loadQaTests(),
        loadQaTickets(),
        fetchProjectTasks(backendProjectId),
      ]);
    } catch (error) {
      console.error("Failed to update task QA:", error);
      setQaError(error.message || "Failed to update QA status.");
    } finally {
      setQaUpdatingId(null);
    }
  };

  const deleteQaTest = async (testId) => {
    try {
      setQaDeletingId(testId);
      setQaError("");
      setQaMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      const response = await fetch(`${API_BASE_URL}/qa-tests/${testId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete QA task");
      }

      setQaTests((current) =>
        current.filter((item) => String(qaTestId(item)) !== String(testId))
      );

      setQaMessage("QA task deleted.");
      await fetchProjectTasks(backendProjectId);
    } catch (error) {
      console.error("Failed to delete QA task:", error);
      setQaError(error.message || "Failed to delete QA task.");
    } finally {
      setQaDeletingId(null);
    }
  };

  const createQaTicketInline = async (event) => {
    event.preventDefault();

    const testId = qaTestId(selectedQaTest);

    if (!testId) {
      setQaError("Select a QA test before creating a ticket.");
      return;
    }

    if (!ticketTitle.trim() || !ticketDescription.trim() || !ticketDeadline) {
      setQaError("Ticket title, description and fix deadline are required.");
      return;
    }

    try {
      setTicketCreating(true);
      setQaError("");
      setQaMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/projects/${backendProjectId}/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            qa_test_id: Number(testId),
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
        throw new Error(
          `Ticket API returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to create ticket (${response.status})`
        );
      }

      setShowQaTicketModal(false);
      setSelectedQaTest(null);
      setTicketTitle("");
      setTicketDescription("");
      setTicketPriority("Medium");
      setTicketDeadline("");
      setQaMessage("QA ticket created successfully.");

      await loadQaTickets();
      await loadQaTests();
    } catch (error) {
      console.error("Failed to create QA ticket:", error);
      setQaError(error.message || "Failed to create QA ticket.");
    } finally {
      setTicketCreating(false);
    }
  };

  const handleClaimQaTicket = async (ticket) => {
    const ticketId = getTicketId(ticket);

    if (!ticketId) {
      setQaError("This ticket does not have a valid ticket ID.");
      return;
    }

    try {
      setClaimingTicketId(ticketId);
      setQaError("");
      setQaMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      // The backend must enforce that the caller belongs to this project.
      const response = await fetch(
        `${API_BASE_URL}/tickets/${ticketId}/claim`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Claim ticket API returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to claim ticket (${response.status})`
        );
      }

      const claimed = data.ticket || data.data || data;

      setQaTickets((current) =>
        current.map((item) =>
          String(getTicketId(item)) === String(ticketId)
            ? {
                ...item,
                ...(claimed || {}),
                claimed_by: claimed?.claimed_by ?? currentUserId,
                claimed_by_name:
                  claimed?.claimed_by_name ||
                  claimed?.claimedByName ||
                  claimed?.assigned_to_name ||
                  claimed?.assignedToName ||
                  "You",
                status: claimed?.status || "CLAIMED",
              }
            : item
        )
      );

      setQaMessage("Ticket claimed successfully.");
      await loadQaTickets();
    } catch (error) {
      console.error("Failed to claim QA ticket:", error);
      setQaError(error.message || "Failed to claim QA ticket.");
    } finally {
      setClaimingTicketId(null);
    }
  };

  const handleCompleteQaTicket = async (ticket) => {
    const ticketId = getTicketId(ticket);

    if (!ticketId) {
      setQaError("This ticket does not have a valid ticket ID.");
      return;
    }

    if (
      String(getTicketClaimedBy(ticket) || "") !==
      String(currentUserId || "")
    ) {
      setQaError("Only the member who claimed this ticket can complete it.");
      return;
    }

    try {
      setCompletingTicketId(ticketId);
      setQaError("");
      setQaMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      // Ticket completion sends the fixed item back to QA.
      const response = await fetch(
        `${API_BASE_URL}/tickets/${ticketId}/complete`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Complete ticket API returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to complete ticket (${response.status})`
        );
      }

      const testId = getTicketQaTestId(ticket);

      // Put the failed QA test back into PENDING so it can be re-tested.
      if (testId) {
        const qaResponse = await fetch(
          `${API_BASE_URL}/qa-tests/${testId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "PENDING" }),
          }
        );

        if (!qaResponse.ok) {
          const qaText = await qaResponse.text();
          let qaData = {};
          try {
            qaData = qaText ? JSON.parse(qaText) : {};
          } catch {}
          throw new Error(
            qaData.message || "Ticket completed but QA could not be reopened."
          );
        }
      }

      setQaMessage("Fix completed. The QA test is pending re-test.");
      await refreshQaWorkspace();
    } catch (error) {
      console.error("Failed to complete QA ticket:", error);
      setQaError(error.message || "Failed to complete QA ticket.");
    } finally {
      setCompletingTicketId(null);
    }
  };

  const isDevelopmentCompleted = (task) => {
    const status = String(task?.status || task?.task_status || "")
      .trim()
      .toUpperCase();
    return ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(status);
  };

  const activeQaTasks = projectTasks.filter((task) => {
    if (!isDevelopmentCompleted(task)) return false;

    const qaStatus = normalizeQaStatus(task.qa_status || "PENDING");
    if (qaStatus === "PASSED") return false;

    const test = qaTests.find(
      (item) => String(getTestTaskId(item)) === String(task.id)
    );

    const activeTicket = test
      ? qaTickets.find(
          (ticket) =>
            String(getTicketQaTestId(ticket)) === String(qaTestId(test)) &&
            ![
              "COMPLETED",
              "COMPLETE",
              "DONE",
              "CLOSED",
              "RESOLVED",
            ].includes(normalizeQaStatus(ticket.status))
        )
      : null;

    return !activeTicket;
  });

  const ticketsByTest = (testId) =>
    qaTickets.filter(
      (ticket) =>
        getTicketQaTestId(ticket) != null &&
        String(getTicketQaTestId(ticket)) === String(testId)
    );

  const qaTestsForTask = (taskId) =>
    qaTests.filter(
      (test) => String(getTestTaskId(test)) === String(taskId)
    );

  const taskQaPassed = (taskId) => {
    const tests = qaTestsForTask(taskId);
    return tests.length > 0 && tests.every(
      (test) => normalizeQaStatus(test.status) === "PASSED"
    );
  };

  const fullyCompletedTask = (task) => {
    const status = String(task.status || task.task_status || "").toUpperCase();
    const qaStatus = String(task.qa_status || "").toUpperCase();

    return (
      ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(status) &&
      qaStatus === "PASSED"
    );
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

      const updatedTask = data.task || data.data || null;

      setProjectTasks((current) =>
        current.map((task) =>
          String(task.id) === String(taskId)
            ? {
                ...task,
                ...(updatedTask || {}),
                status: "COMPLETED",
                qa_status: "PENDING",
              }
            : task
        )
      );

      // Completing development should immediately open QA for this task.
      startQaTesting(taskId);

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



                      const rawTaskStatus =
                        task.status ||
                        task.task_status ||
                        "TODO";

                      const taskQaStatus = normalizeQaStatus(
                        task.qa_status || "PENDING"
                      );

                      const taskStatus =
                        ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(
                          String(rawTaskStatus).trim().toUpperCase()
                        ) && taskQaStatus !== "PASSED"
                          ? "PENDING"
                          : rawTaskStatus;



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
                            {(() => {
                              // IMPORTANT: taskStatus is the DISPLAY status.
                              // A development-completed task is intentionally
                              // displayed as PENDING until QA passes, so we must
                              // check rawTaskStatus here instead of taskStatus.
                              const normalizedRawTaskStatus = String(
                                rawTaskStatus || ""
                              ).trim().toUpperCase();

                              const developmentCompleted = [
                                "COMPLETED",
                                "COMPLETE",
                                "DONE",
                                "CLOSED",
                              ].includes(normalizedRawTaskStatus);

                              const fullyDone = fullyCompletedTask(task);

                              if (fullyDone) {
                                return (
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
                                );
                              }

                              if (developmentCompleted) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => startQaTesting(task.id)}
                                    style={{
                                      border: "1px solid rgba(20,184,166,.35)",
                                      borderRadius: "8px",
                                      padding: "8px 13px",
                                      background: "rgba(20,184,166,.12)",
                                      color: "#5eead4",
                                      fontWeight: 700,
                                      fontSize: "12px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    QA Pending
                                  </button>
                                );
                              }

                              if (
                                String(task.claimed_by ?? task.claimedBy ?? "") ===
                                  String(currentUserId ?? "") &&
                                currentUserId != null
                              ) {
                                return (
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
                                      cursor:
                                        completingTaskId === task.id
                                          ? "not-allowed"
                                          : "pointer",
                                      opacity:
                                        completingTaskId === task.id ? 0.7 : 1,
                                    }}
                                  >
                                    {completingTaskId === task.id
                                      ? "Completing..."
                                      : "Complete"}
                                  </button>
                                );
                              }

                              if (task.claimed_by || task.claimedBy) {
                                return (
                                  <span
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "12px",
                                    }}
                                  >
                                    Claimed
                                  </span>
                                );
                              }

                              if (!assigneeId) {
                                return (
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
                                      cursor:
                                        claimingTaskId === task.id
                                          ? "not-allowed"
                                          : "pointer",
                                      opacity:
                                        claimingTaskId === task.id ? 0.7 : 1,
                                    }}
                                  >
                                    {claimingTaskId === task.id
                                      ? "Claiming..."
                                      : "Claim Task"}
                                  </button>
                                );
                              }

                              return (
                                <span
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "12px",
                                  }}
                                >
                                  Assigned
                                </span>
                              );
                            })()}
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
            TASK-LEVEL QA TESTING
            The completed development task itself is the QA test case.
            No separate "Create QA Task" UI is shown.
        ===================================================== */}
        {qaExpanded && (
          <section
            id="task-qa-workspace"
            className="panel"
            style={{ marginTop: "24px" }}
          >
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
                  Each completed task is tested directly. There is no separate QA sub-task.
                </p>
              </div>

              <button
                type="button"
                className="view-button"
                onClick={() => setQaExpanded(false)}
              >
                Hide QA
              </button>
            </div>

            {qaError && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,.10)",
                  color: "#fca5a5",
                }}
              >
                {qaError}
              </div>
            )}

            {qaMessage && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "rgba(20,184,166,.10)",
                  color: "#5eead4",
                }}
              >
                {qaMessage}
              </div>
            )}

            {selectedQaTask && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  border: "1px solid rgba(20,184,166,.22)",
                  background: "rgba(20,184,166,.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span
                    style={{
                      color: "#5eead4",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: ".08em",
                    }}
                  >
                    TESTING TASK
                  </span>
                  <strong style={{ display: "block", marginTop: "3px" }}>
                    {selectedQaTask.title || selectedQaTask.name}
                  </strong>
                </div>
                <button
                  type="button"
                  className="view-button"
                  onClick={() => setSelectedQaTaskId(null)}
                  style={{ padding: "7px 10px", fontSize: "11px" }}
                >
                  Change task
                </button>
              </div>
            )}

            <div style={{ marginTop: "22px" }}>
              <div className="panel-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3>Tasks awaiting QA</h3>
                  <p>
                    The task is the test case. PASS completes QA; FAIL creates a fix ticket.
                  </p>
                </div>
              </div>

              {qaLoading ? (
                <div style={{ padding: "24px 0", color: "#94a3b8" }}>
                  Loading QA...
                </div>
              ) : activeQaTasks.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    border: "1px dashed rgba(148,163,184,.25)",
                    borderRadius: "10px",
                    color: "#94a3b8",
                  }}
                >
                  No completed tasks are currently waiting for QA.
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>QA status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeQaTasks.map((task) => {
                        const status = normalizeQaStatus(task.qa_status || "PENDING");
                        const updating = String(qaUpdatingId) === String(task.id);
                        const selected = String(selectedQaTaskId) === String(task.id);

                        return (
                          <tr key={task.id}>
                            <td>
                              <strong>{task.title || task.name || `Task #${task.id}`}</strong>
                              {task.claimed_by_name && (
                                <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "3px" }}>
                                  Completed by {task.claimed_by_name}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`task-status ${status.toLowerCase()}`}>
                                {status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  onClick={() => updateTaskQaStatus(task, "PASSED")}
                                  disabled={updating}
                                  style={{
                                    border: "none",
                                    borderRadius: "7px",
                                    padding: "7px 10px",
                                    background: "#16a34a",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                    cursor: updating ? "not-allowed" : "pointer",
                                    opacity: updating ? 0.6 : 1,
                                  }}
                                >
                                  {updating ? "Saving..." : "PASS"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateTaskQaStatus(task, "FAILED")}
                                  disabled={updating}
                                  style={{
                                    border: "none",
                                    borderRadius: "7px",
                                    padding: "7px 10px",
                                    background: "#dc2626",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                    cursor: updating ? "not-allowed" : "pointer",
                                    opacity: updating ? 0.6 : 1,
                                  }}
                                >
                                  FAIL
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const existingTest = qaTests.find(
                                      (test) =>
                                        String(getTestTaskId(test)) === String(task.id)
                                    );
                                    if (existingTest?.id) {
                                      deleteQaTest(existingTest.id);
                                    } else {
                                      setQaError("No QA record exists for this task yet.");
                                    }
                                  }}
                                  disabled={updating || qaDeletingId === task.id}
                                  style={{
                                    border: "1px solid rgba(239,68,68,.45)",
                                    borderRadius: "7px",
                                    padding: "7px 10px",
                                    background: "rgba(239,68,68,.08)",
                                    color: "#fca5a5",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                    cursor: updating ? "not-allowed" : "pointer",
                                    opacity: updating ? 0.6 : 1,
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* QA TICKETS */}
            <div style={{ marginTop: "30px" }}>
              <div className="panel-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3>QA Testing Tickets</h3>
                  <p>
                    Failed tasks move here. A project member can claim the ticket, fix it and return the task to QA.
                  </p>
                </div>
              </div>

              {ticketLoading ? (
                <div style={{ padding: "24px 0", color: "#94a3b8" }}>
                  Loading QA tickets...
                </div>
              ) : qaTickets.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    border: "1px dashed rgba(148,163,184,.25)",
                    borderRadius: "10px",
                    color: "#94a3b8",
                  }}
                >
                  No QA tickets yet.
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Task</th>
                        <th>Priority</th>
                        <th>Fix deadline</th>
                        <th>Status</th>
                        <th>Claimed by</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qaTickets.map((ticket, index) => {
                        const ticketId = getTicketId(ticket);
                        const linkedTest = qaTests.find(
                          (test) =>
                            getTicketQaTestId(ticket) != null &&
                            String(getTicketQaTestId(ticket)) === String(qaTestId(test))
                        );
                        const linkedTask = linkedTest
                          ? projectTasks.find(
                              (task) => String(task.id) === String(getTestTaskId(linkedTest))
                            )
                          : null;

                        const ticketStatus = normalizeQaStatus(ticket.status || "OPEN");
                        const claimedBy = getTicketClaimedBy(ticket);
                        const claimedName = getTicketClaimedName(ticket);
                        const claimedByMe =
                          claimedBy != null &&
                          String(claimedBy) === String(currentUserId);
                        const resolved = [
                          "COMPLETED",
                          "COMPLETE",
                          "DONE",
                          "CLOSED",
                          "RESOLVED",
                        ].includes(ticketStatus);

                        return (
                          <tr key={ticketId || index}>
                            <td>
                              <strong>{ticket.title || `Ticket #${ticketId}`}</strong>
                              <div style={{ color: "#64748b", fontSize: "11px", marginTop: "3px" }}>
                                #{ticketId}
                              </div>
                            </td>
                            <td>
                              <strong>
                                {linkedTask?.title || linkedTask?.name || ticket.task_title || "Task"}
                              </strong>
                            </td>
                            <td>{ticket.priority || "Medium"}</td>
                            <td>{ticket.due_date || ticket.deadline || "Not set"}</td>
                            <td>
                              <span className={`task-status ${ticketStatus.toLowerCase()}`}>
                                {ticketStatus}
                              </span>
                            </td>
                            <td>
                              {claimedName ? (
                                <div className="table-member">
                                  <div className="member-avatar">
                                    {String(claimedName).charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <strong>{claimedName}</strong>
                                    <span>Claimed</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="unassigned">Unclaimed</span>
                              )}
                            </td>
                            <td>
                              {resolved ? (
                                <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "12px" }}>
                                  Resolved — QA again
                                </span>
                              ) : !claimedBy ? (
                                <button
                                  type="button"
                                  onClick={() => handleClaimQaTicket(ticket)}
                                  disabled={claimingTicketId === ticketId}
                                  style={{
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    background: "#14b8a6",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    cursor: claimingTicketId === ticketId ? "not-allowed" : "pointer",
                                  }}
                                >
                                  {claimingTicketId === ticketId ? "Claiming..." : "Claim Ticket"}
                                </button>
                              ) : claimedByMe ? (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteQaTicket(ticket)}
                                  disabled={completingTicketId === ticketId}
                                  style={{
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    background: "#14b8a6",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    cursor: completingTicketId === ticketId ? "not-allowed" : "pointer",
                                  }}
                                >
                                  {completingTicketId === ticketId ? "Completing..." : "Complete"}
                                </button>
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                                  Claimed by {claimedName || "another member"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* QA TICKET MODAL */}
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
                  <h2>Create QA ticket</h2>
                  <p>
                    This ticket will be linked to the failed QA test and appear
                    in QA Testing Tickets.
                  </p>
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
                      onChange={(event) =>
                        setTicketTitle(event.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input
                      required
                      value={ticketDescription}
                      onChange={(event) =>
                        setTicketDescription(event.target.value)
                      }
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
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fix deadline</label>
                    <input
                      type="date"
                      required
                      value={ticketDeadline}
                      onChange={(event) =>
                        setTicketDeadline(event.target.value)
                      }
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
                    {ticketCreating ? "Creating..." : "Create Ticket"}
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