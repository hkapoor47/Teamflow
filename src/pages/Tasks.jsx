import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

const API_BASE_URL = "http://65.0.11.153:5001/api";

const getToken = () => localStorage.getItem("token");

const normalizeStatus = (value) =>
  String(value || "").trim().toUpperCase();

const getTaskProjectId = (task) =>
  task?.projectId ?? task?.project_id ?? null;

const getTaskQaStatus = (task) =>
  normalizeStatus(task?.qa_status ?? task?.qaStatus ?? "NOT_STARTED");

const getQaTestId = (test) =>
  test?.id ?? test?.qa_test_id ?? test?.qaTestId ?? null;

function Tasks() {
  const {
    projects,
    tasks,
    members,
    createTask,
    requestClaim,
    completeTask,
    refreshTasks,
  } = useProjects();

  const [projectFilter, setProjectFilter] = useState("all");
  const [notice, setNotice] = useState("");

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "",
    assigneeId: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  // ---------------- QA ----------------
  const [qaTask, setQaTask] = useState(null);
  const [qaTest, setQaTest] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaUpdating, setQaUpdating] = useState(false);
  const [qaError, setQaError] = useState("");

  // ---------------- FAIL / TICKET ----------------
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketDeadline, setTicketDeadline] = useState("");
  const [ticketCreating, setTicketCreating] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [createdTickets, setCreatedTickets] = useState([]);
  const [ticketActionLoading, setTicketActionLoading] = useState(false);
  const qaSectionRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.userId ?? payload.id ?? payload.sub ?? null);
    } catch (error) {
      console.error("Failed to read current user from token:", error);
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    if (!showCreateTask) return;

    setNewTask((current) => ({
      ...current,
      projectId: current.projectId || "",
    }));
  }, [showCreateTask]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (projectFilter === "all") return true;

      if (projectFilter === "none") {
        return getTaskProjectId(task) == null;
      }

      return String(getTaskProjectId(task)) === String(projectFilter);
    });
  }, [tasks, projectFilter]);

  const getProject = (id) =>
    projects.find((project) => String(project.id) === String(id));

  const getMember = (id) =>
    members.find((member) => String(member.id) === String(id));

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(window.__teamflowNoticeTimer);
    window.__teamflowNoticeTimer = window.setTimeout(
      () => setNotice(""),
      3000
    );
  };

  const claim = async (taskId) => {
    try {
      await requestClaim(taskId);
      notify("Task claimed successfully.");
    } catch (error) {
      notify(error.message || "Failed to claim task.");
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!newTask.title.trim()) {
      notify("Please enter a task title.");
      return;
    }

    try {
      setCreatingTask(true);

      await createTask({
        projectId: newTask.projectId || null,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        assigneeId: newTask.assigneeId || null,
        dueDate: newTask.dueDate || null,
      });

      setNewTask({
        title: "",
        description: "",
        projectId: "",
        assigneeId: "",
        priority: "MEDIUM",
        dueDate: "",
      });

      setShowCreateTask(false);
      notify(
        newTask.projectId
          ? "Project task created successfully."
          : "Individual task created successfully."
      );
    } catch (error) {
      notify(error.message || "Failed to create task.");
    } finally {
      setCreatingTask(false);
    }
  };

  // =========================================================
  // TASK-LEVEL QA
  // The task itself is the QA item. A qa_tests row is only a
  // backend adapter because the existing ticket/QA APIs use it.
  // =========================================================

  const loadQaForTask = async (task) => {
    if (!task?.id) return;

    // Move the user directly to the QA workspace when QA Testing is clicked.
    requestAnimationFrame(() => {
      qaSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const token = getToken();
    if (!token) {
      setQaError("Authentication required. Please login again.");
      return;
    }

    try {
      setQaLoading(true);
      setQaError("");
      setQaTask(task);
      setQaTest(null);

      const projectId = getTaskProjectId(task);

      let response;

      if (projectId != null) {
        response = await fetch(
          `${API_BASE_URL}/projects/${projectId}/qa-tests`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/tasks/${task.id}/qa-tests`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `QA API returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to load QA (${response.status})`
        );
      }

      const allTests =
        data.testCases ||
        data.qaTests ||
        data.data ||
        (Array.isArray(data) ? data : []);

      const matching = Array.isArray(allTests)
        ? allTests.find(
            (test) =>
              String(test.task_id ?? test.taskId ?? "") ===
              String(task.id)
          )
        : null;

      if (matching) {
        setQaTest(matching);
      } else {
        // Create the hidden backend QA adapter silently.
        const createResponse =
          projectId != null
            ? await fetch(
                `${API_BASE_URL}/projects/${projectId}/qa-tests`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    task_id: Number(task.id),
                    name: task.title || `QA for task #${task.id}`,
                    description:
                      task.description ||
                      `Verify the completed task "${task.title}".`,
                  }),
                }
              )
            : await fetch(
                `${API_BASE_URL}/tasks/${task.id}/qa-tests`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    name: task.title || `QA for task #${task.id}`,
                    description:
                      task.description ||
                      `Verify the completed task "${task.title}".`,
                  }),
                }
              );

        const createText = await createResponse.text();
        let createData = {};
        try {
          createData = createText ? JSON.parse(createText) : {};
        } catch {
          throw new Error(
            `QA setup API returned an invalid response (${createResponse.status}).`
          );
        }

        if (!createResponse.ok) {
          throw new Error(
            createData.message ||
              createData.error ||
              `Failed to initialize QA (${createResponse.status})`
          );
        }

        const created =
          createData.testCase ||
          createData.qaTest ||
          createData.data ||
          createData;

        if (!created?.id) {
          throw new Error("QA was initialized but no QA ID was returned.");
        }

        setQaTest(created);
      }
    } catch (error) {
      console.error("Load QA error:", error);
      setQaError(error.message || "Failed to load QA.");
    } finally {
      setQaLoading(false);
    }
  };

  const closeQa = () => {
    setQaTask(null);
    setQaTest(null);
    setQaError("");
    setShowTicketModal(false);
  };

  const deleteQaTest = async () => {
    if (!qaTask) return;

    const token = getToken();
    if (!token || !qaTest?.id) {
      notify("QA test is not available to delete.");
      return;
    }

    try {
      setQaUpdating(true);
      setQaError("");

      const response = await fetch(`${API_BASE_URL}/qa-tests/${qaTest.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (!response.ok) {
        throw new Error(data.message || data.error || `Delete failed (${response.status})`);
      }

      notify("QA test deleted.");
      setQaTask(null);
      setQaTest(null);
      setCreatedTicket(null);
      await refreshTasks();
    } catch (error) {
      console.error("Delete QA error:", error);
      setQaError(error.message || "Failed to delete QA test.");
    } finally {
      setQaUpdating(false);
    }
  };

  const reopenQaAfterTicketCompletion = async () => {
    if (!qaTask) return;

    const token = getToken();
    if (token && qaTest?.id) {
      try {
        const response = await fetch(`${API_BASE_URL}/qa-tests/${qaTest.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "PENDING" }),
        });

        if (response.ok) {
          const text = await response.text();
          let data = {};
          try { data = text ? JSON.parse(text) : {}; } catch {}
          setQaTest(data.testCase || data.qaTest || data.data || { ...qaTest, status: "PENDING" });
        } else {
          setQaTest((current) => current ? { ...current, status: "PENDING" } : current);
        }
      } catch (error) {
        console.warn("Could not reset QA status after ticket completion:", error);
        setQaTest((current) => current ? { ...current, status: "PENDING" } : current);
      }
    } else {
      setQaTest((current) => current ? { ...current, status: "PENDING" } : current);
    }

    setCreatedTicket(null);
    setShowTicketModal(false);
    setQaError("");
    await refreshTasks();
    notify("Fix completed. QA Testing is open again for re-test.");
  };

  const updateQaStatus = async (status) => {
    if (!qaTask) return;

    // FAIL must always open the ticket form, even when the QA backend is
    // temporarily unavailable. The backend update is attempted afterwards.
    if (status === "FAILED") {
      setTicketTitle(qaTask.title || "QA issue");
      setTicketDescription(`Issue found while testing "${qaTask.title}".`);
      setTicketPriority("Medium");
      setTicketDeadline("");
      setCreatedTicket(null);
      setQaError("");
      setShowTicketModal(true);
      notify("QA failed. Create a fix ticket.");

      const token = getToken();
      if (!token || !qaTest?.id) return;

      try {
        setQaUpdating(true);
        const response = await fetch(`${API_BASE_URL}/qa-tests/${qaTest.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "FAILED" }),
        });

        if (response.ok) {
          const data = await response.json();
          setQaTest(data.testCase || data.qaTest || data.data || qaTest);
        } else {
          console.warn("QA FAIL backend update failed; keeping ticket form open.");
        }
      } catch (error) {
        console.warn("QA FAIL backend unavailable; keeping ticket form open:", error);
      } finally {
        setQaUpdating(false);
      }
      return;
    }

    const token = getToken();
    if (!token || !qaTest?.id) {
      notify("QA backend is unavailable. PASS cannot be saved yet.");
      return;
    }

    try {
      setQaUpdating(true);
      setQaError("");

      const response = await fetch(`${API_BASE_URL}/qa-tests/${qaTest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "PASSED" }),
      });

      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (!response.ok) {
        throw new Error(data.message || data.error || `QA update failed (${response.status})`);
      }

      setQaTest(data.testCase || data.qaTest || data.data || qaTest);
      notify("QA passed. Task is now fully completed.");
      await refreshTasks();
      closeQa();
    } catch (error) {
      console.error("QA status update error:", error);
      setQaError(error.message || "Failed to update QA status.");
    } finally {
      setQaUpdating(false);
    }
  };

  const createTicket = async (event) => {
    event.preventDefault();

    if (!qaTask?.id) {
      setQaError("No task is selected for this ticket.");
      return;
    }

    if (!ticketTitle.trim() || !ticketDescription.trim() || !ticketDeadline) {
      setQaError("Ticket title, description and fix deadline are required.");
      return;
    }

    const token = getToken();
    const projectId = getTaskProjectId(qaTask);

    try {
      setTicketCreating(true);
      setQaError("");

      let ticket = null;

      // Project tickets use the real backend endpoint.
      if (projectId != null && token) {
        try {
          const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tickets`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              qa_test_id: qaTest?.id ? Number(qaTest.id) : null,
              title: ticketTitle.trim(),
              description: ticketDescription.trim(),
              priority: ticketPriority,
              due_date: ticketDeadline,
            }),
          });

          const text = await response.text();
          let data = {};
          try { data = text ? JSON.parse(text) : {}; } catch {}

          if (response.ok) {
            ticket = data.ticket || data.data || data;
          } else {
            console.warn("Ticket backend failed; using local ticket display.");
          }
        } catch (error) {
          console.warn("Ticket backend unavailable; using local ticket display:", error);
        }
      }

      // Individual tasks have no project-scoped ticket endpoint yet, and this
      // fallback also guarantees that FAIL -> Create Ticket works during backend downtime.
      if (!ticket?.id) {
        ticket = {
          id: `LOCAL-${Date.now()}`,
          title: ticketTitle.trim(),
          description: ticketDescription.trim(),
          priority: ticketPriority,
          due_date: ticketDeadline,
          status: "OPEN",
          qa_test_id: qaTest?.id ?? null,
          task_id: qaTask.id,
          project_id: projectId,
          task_assignee_id: qaTask.assigneeId ?? qaTask.assigned_to ?? null,
          claimed_by: null,
          claimed_by_name: null,
          localOnly: true,
        };
      }

      setCreatedTicket(ticket);
      setCreatedTickets((current) => [...current, ticket]);
      setShowTicketModal(false);
      notify("Ticket created successfully.");
    } catch (error) {
      console.error("Create ticket error:", error);
      setQaError(error.message || "Failed to create ticket.");
    } finally {
      setTicketCreating(false);
    }
  };

  const getClaimedTicketUserId = (ticket) =>
    ticket?.claimed_by ?? ticket?.claimedBy ?? null;

  const getTicketAssigneeId = (ticket) =>
    ticket?.task_assignee_id ?? ticket?.taskAssigneeId ?? ticket?.assigned_to ?? ticket?.assignedTo ?? null;

  const getClaimedTicketName = (ticket) =>
    ticket?.claimed_by_name ?? ticket?.claimedByName ?? ticket?.assigned_to_name ?? ticket?.assignedToName ?? null;

  const formatTicketDate = (value) => {
    if (!value) return "Not set";
    const raw = String(value);
    const dateOnly = raw.slice(0, 10);
    const parsed = new Date(`${dateOnly}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const claimCreatedTicket = async (ticketToClaim = createdTicket) => {
    if (!ticketToClaim) return;

    const ticketAssigneeId = getTicketAssigneeId(ticketToClaim);
    if (ticketAssigneeId != null && String(ticketAssigneeId) !== String(currentUserId)) {
      setQaError("Only the person assigned to this task can claim its QA ticket.");
      return;
    }

    const token = getToken();
    const ticketId = ticketToClaim.id;

    setTicketActionLoading(true);
    setQaError("");

    try {
      let claimed = null;

      if (!ticketToClaim.localOnly && token && !String(ticketId).startsWith("LOCAL-")) {
        try {
          const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/claim`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const text = await response.text();
          let data = {};
          try { data = text ? JSON.parse(text) : {}; } catch {}
          if (response.ok) claimed = data.ticket || data.data || data;
        } catch (error) {
          console.warn("Ticket claim backend unavailable; claiming locally.", error);
        }
      }

      const updatedTicket = {
        ...ticketToClaim,
        ...(claimed || {}),
        claimed_by: claimed?.claimed_by ?? currentUserId,
        claimed_by_name: claimed?.claimed_by_name ?? "You",
        status: claimed?.status ?? "CLAIMED",
      };

      setCreatedTicket(updatedTicket);
      setCreatedTickets((current) =>
        current.map((ticket) =>
          String(ticket.id) === String(updatedTicket.id) ? updatedTicket : ticket
        )
      );
      notify("Ticket claimed. Complete is now available to you.");
    } finally {
      setTicketActionLoading(false);
    }
  };

  const completeCreatedTicket = async (ticketToComplete = createdTicket) => {
    if (!ticketToComplete) return;

    const claimedBy = getClaimedTicketUserId(ticketToComplete);
    if (claimedBy != null && currentUserId != null && String(claimedBy) !== String(currentUserId)) {
      setQaError("Only the person who claimed this ticket can complete it.");
      return;
    }

    const token = getToken();
    setTicketActionLoading(true);
    setQaError("");

    try {
      let completed = false;

      if (!ticketToComplete.localOnly && token && !String(ticketToComplete.id).startsWith("LOCAL-")) {
        try {
          const response = await fetch(`${API_BASE_URL}/tickets/${ticketToComplete.id}/complete`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          completed = response.ok;
        } catch (error) {
          console.warn("Ticket complete backend unavailable; completing locally.", error);
        }
      } else {
        completed = true;
      }

      if (completed || ticketToComplete.localOnly) {
        const completedTicket = { ...ticketToComplete, status: "COMPLETED" };
        setCreatedTicket(completedTicket);
        setCreatedTickets((current) =>
          current.map((ticket) =>
            String(ticket.id) === String(completedTicket.id) ? completedTicket : ticket
          )
        );
        await reopenQaAfterTicketCompletion();
      } else {
        throw new Error("Ticket could not be completed by the backend.");
      }
    } catch (error) {
      setQaError(error.message || "Failed to complete ticket.");
    } finally {
      setTicketActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page tasks-page">
        <section className="teamflow-heading">
          <p className="welcome-label">TASK WORKSPACE</p>
          <h2>All work, one clear queue.</h2>
          <p className="welcome-description">
            Create project work or individual tasks, then claim, complete and QA them.
          </p>
        </section>

        <div className="task-filters panel">
          <label>
            Project
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              <option value="all">All tasks</option>
              <option value="none">Individual — No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <button
            className="primary-button"
            onClick={() => setShowCreateTask(true)}
          >
            + Create task
          </button>
        </div>

        {notice && <div className="claim-notice">{notice}</div>}

        {showCreateTask && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <div>
                  <p className="welcome-label">NEW TASK</p>
                  <h3>Create a task</h3>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowCreateTask(false)}
                  disabled={creatingTask}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateTask}>
                <div className="project-form-grid">
                  <div className="form-group">
                    <label>Task name</label>
                    <input
                      required
                      value={newTask.title}
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          title: event.target.value,
                        })
                      }
                      placeholder="e.g. Prepare deployment docs"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          description: event.target.value,
                        })
                      }
                      placeholder="What needs to be done?"
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Project</label>
                    <select
                      value={newTask.projectId}
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          projectId: event.target.value,
                        })
                      }
                    >
                      <option value="">No Project — Individual Task</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Assign to</label>
                    <select
                      value={newTask.assigneeId}
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          assigneeId: event.target.value,
                        })
                      }
                    >
                      <option value="">Leave unassigned</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} — {member.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          priority: event.target.value,
                        })
                      }
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Deadline</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          dueDate: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-project-button"
                    onClick={() => setShowCreateTask(false)}
                    disabled={creatingTask}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="create-project-submit"
                    disabled={creatingTask}
                  >
                    {creatingTask ? "Creating..." : "Create task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="panel task-board">
          <div className="panel-header">
            <div>
              <h3>Task board</h3>
              <p>{visibleTasks.length} tasks match your filters.</p>
            </div>
          </div>

          <div
            className="task-table-wrap"
            style={{
              maxHeight: "520px",
              overflowY: "auto",
              overflowX: "auto",
            }}
          >
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleTasks.map((task) => {
                  const projectId = getTaskProjectId(task);
                  const project = getProject(projectId);
                  const member = getMember(task.assigneeId);
                  const qaStatus = getTaskQaStatus(task);
                  const developmentCompleted =
                    ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(
                      normalizeStatus(task.status)
                    );
                  const fullyDone =
                    developmentCompleted && qaStatus === "PASSED";

                  return (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        <small>
                          Due{" "}
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : "Not set"}
                        </small>
                      </td>

                      <td>
                        {project?.name ||
                          task.projectName ||
                          (projectId == null ? (
                            <span className="unassigned">No Project</span>
                          ) : (
                            "Unknown project"
                          ))}
                      </td>

                      <td>
                        {member ? (
                          <span className="assignee">
                            <i>{member.name?.charAt(0)?.toUpperCase()}</i>
                            {member.name}
                          </span>
                        ) : task.claimedByName ? (
                          <span className="assignee">
                            <i>
                              {task.claimedByName
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </i>
                            {task.claimedByName}
                          </span>
                        ) : (
                          <span className="unassigned">Unassigned</span>
                        )}
                      </td>

                      <td>
                        <span className="task-status">
                          {fullyDone
                            ? "DONE"
                            : developmentCompleted
                            ? "QA PENDING"
                            : normalizeStatus(task.status) || "TODO"}
                        </span>
                      </td>

                      <td>
                        <div className="progress-cell">
                          <div className="progress-track">
                            <span
                              style={{
                                width: `${
                                  fullyDone
                                    ? 100
                                    : Number(task.progress) || 0
                                }%`,
                              }}
                            />
                          </div>
                          <span>
                            {fullyDone
                              ? "100%"
                              : `${Number(task.progress) || 0}%`}
                          </span>
                        </div>
                      </td>

                      <td>
                        {fullyDone ? (
                          <span className="task-status">Completed</span>
                        ) : developmentCompleted ? (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => loadQaForTask(task)}
                          >
                            QA Testing
                          </button>
                        ) : task.claimedBy ? (
                          String(task.claimedBy) === String(currentUserId) ? (
                            <button
                              type="button"
                              className="primary-button"
                              onClick={async () => {
                                try {
                                  await completeTask(task.id);
                                  notify("Task completed and moved to QA.");
                                } catch (error) {
                                  notify(error.message || "Failed to complete task.");
                                }
                              }}
                            >
                              Complete
                            </button>
                          ) : (
                            <span className="task-status">Claimed</span>
                          )
                        ) : (
                          (!task.assigneeId || String(task.assigneeId) === String(currentUserId)) ? (
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => claim(task.id)}
                            >
                              Claim Task
                            </button>
                          ) : (
                            <span className="task-status">Assigned</span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!visibleTasks.length && (
                  <tr>
                    <td colSpan="6" style={{ padding: "30px", textAlign: "center" }}>
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* =========================================================
            TASK QA WORKSPACE
            Development complete -> QA Testing section appears below.
            PASS -> task completes. FAIL -> ticket modal opens.
        ========================================================= */}
        {qaTask && (
          <section
            ref={qaSectionRef}
            className="panel"
            style={{
              marginTop: "20px",
              border: "1px solid rgba(148,163,184,.2)",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <div
              className="panel-header"
              style={{
                paddingBottom: "14px",
                borderBottom: "1px solid rgba(148,163,184,.12)",
              }}
            >
              <div>
                <p className="welcome-label" style={{ marginBottom: "4px" }}>
                  QUALITY ASSURANCE
                </p>
                <h3 style={{ margin: 0 }}>QA Testing</h3>
                <p style={{ marginTop: "6px" }}>
                  Test the completed task: <strong>{qaTask.title}</strong>
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeQa}
                disabled={qaUpdating}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {qaError && (
                <div className="claim-notice" style={{ marginBottom: "15px" }}>
                  {qaError}
                </div>
              )}

              {qaLoading ? (
                <div style={{ padding: "25px", textAlign: "center" }}>Loading QA...</div>
              ) : (
                <>
                  <div
                    style={{
                      padding: "18px",
                      border: "1px solid rgba(148,163,184,.2)",
                      borderRadius: "12px",
                      marginBottom: "18px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", flexWrap: "wrap" }}>
                      <div>
                        <strong>{qaTask.title}</strong>
                        <div style={{ marginTop: "7px", color: "#94a3b8" }}>
                          {qaTask.description || "No task description available."}
                        </div>
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          minHeight: "34px",
                          padding: "7px 12px",
                          borderRadius: "999px",
                          border: "1px solid rgba(45, 212, 191, 0.28)",
                          background: "rgba(45, 212, 191, 0.08)",
                          color: "#5eead4",
                          fontSize: "12px",
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#f59e0b",
                            boxShadow: "0 0 0 3px rgba(245,158,11,.12)",
                          }}
                        />
                        QA STATUS: {normalizeStatus(qaTest?.status || qaTask.qa_status || "PENDING")}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                      PASS completes the task. FAIL creates a fix ticket and sends it back for re-testing after the fix.
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => updateQaStatus("PASSED")}
                        disabled={qaUpdating || !qaTest?.id}
                        style={{
                          background: "#16a34a",
                          color: "#fff",
                          border: 0,
                          borderRadius: "8px",
                          padding: "10px 18px",
                          fontWeight: 700,
                          cursor: "pointer",
                          opacity: qaUpdating || !qaTest?.id ? 0.6 : 1,
                        }}
                      >
                        {qaUpdating ? "Updating..." : "PASS"}
                      </button>

                      <button
                        type="button"
                        onClick={() => updateQaStatus("FAILED")}
                        disabled={qaUpdating}
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          border: 0,
                          borderRadius: "8px",
                          padding: "10px 18px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        FAIL
                      </button>

                      <button
                        type="button"
                        onClick={deleteQaTest}
                        disabled={qaUpdating || !qaTest?.id}
                        style={{
                          background: "transparent",
                          color: "#f87171",
                          border: "1px solid rgba(248,113,113,.45)",
                          borderRadius: "8px",
                          padding: "10px 18px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* =========================================================
            QA TICKET
            FAIL -> centered form modal -> created ticket block below.
        ========================================================= */}
        {createdTickets.length > 0 && (
          <section
            className="panel"
            style={{
              marginTop: "20px",
              border: "1px solid rgba(148,163,184,.2)",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <div
              className="panel-header"
              style={{
                paddingBottom: "14px",
                borderBottom: "1px solid rgba(148,163,184,.12)",
              }}
            >
              <div>
                <p className="welcome-label" style={{ marginBottom: "4px" }}>
                  QA TICKETS
                </p>
                <h3 style={{ margin: 0 }}>Created Tickets ({createdTickets.length})</h3>
                <p style={{ marginTop: "6px" }}>
                  All QA fix tickets remain visible here, including completed tickets.
                </p>
              </div>
            </div>

            <div style={{ padding: "20px", display: "grid", gap: "14px" }}>
              {createdTickets.map((ticket) => {
                const claimedUserId = getClaimedTicketUserId(ticket);
                const isClaimant = claimedUserId != null &&
                  currentUserId != null &&
                  String(claimedUserId) === String(currentUserId);
                const ticketStatus = normalizeStatus(ticket.status);

                return (
                  <div
                    key={ticket.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "24px",
                      padding: "18px 20px",
                      border: "1px solid rgba(148,163,184,.16)",
                      borderRadius: "12px",
                      background: "rgba(15,23,42,.34)",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <h4 style={{ margin: 0, fontSize: "16px" }}>{ticket.title}</h4>
                        <span className="task-status">{ticketStatus || "OPEN"}</span>
                      </div>
                      <p style={{ color: "#94a3b8", margin: "8px 0 14px", lineHeight: 1.5 }}>
                        {ticket.description}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: "18px",
                          flexWrap: "wrap",
                          color: "#94a3b8",
                          fontSize: "13px",
                        }}
                      >
                        <span>Priority: <strong style={{ color: "#e2e8f0" }}>{ticket.priority}</strong></span>
                        <span>Deadline: <strong style={{ color: "#e2e8f0" }}>{formatTicketDate(ticket.due_date)}</strong></span>
                        {claimedUserId && (
                          <span>Claimed by: <strong style={{ color: "#f8fafc" }}>{getClaimedTicketName(ticket) || "You"}</strong></span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "10px",
                        minWidth: "170px",
                      }}
                    >
                      {ticketStatus === "COMPLETED" ? (
                        <span className="task-status">Completed</span>
                      ) : claimedUserId ? (
                        isClaimant ? (
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                              setCreatedTicket(ticket);
                              completeCreatedTicket(ticket);
                            }}
                            disabled={ticketActionLoading}
                          >
                            {ticketActionLoading && String(createdTicket?.id) === String(ticket.id) ? "Completing..." : "Complete"}
                          </button>
                        ) : (
                          <span className="task-status">Claimed</span>
                        )
                      ) : getTicketAssigneeId(ticket) &&
                        String(getTicketAssigneeId(ticket)) !== String(currentUserId) ? (
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            textAlign: "right",
                            maxWidth: "190px",
                            lineHeight: 1.45,
                          }}
                        >
                          Assigned to another team member
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => {
                            setCreatedTicket(ticket);
                            claimCreatedTicket(ticket);
                          }}
                          disabled={ticketActionLoading}
                        >
                          {ticketActionLoading && String(createdTicket?.id) === String(ticket.id) ? "Claiming..." : "Claim Ticket"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Centered QA ticket form, matching the Create Task modal style. */}
        {showTicketModal && (
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-card" style={{ maxWidth: "720px", width: "calc(100% - 32px)" }}>
              <div className="modal-header">
                <div>
                  <p className="welcome-label">QA ISSUE</p>
                  <h3>Create Ticket</h3>
                  <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "13px" }}>
                    Report the issue found while testing <strong style={{ color: "#e2e8f0" }}>{qaTask?.title}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowTicketModal(false)}
                  disabled={ticketCreating}
                >
                  ×
                </button>
              </div>

              <form onSubmit={createTicket}>
                <div className="project-form-grid">
                  <div className="form-group">
                    <label>Ticket title</label>
                    <input
                      required
                      value={ticketTitle}
                      onChange={(event) => setTicketTitle(event.target.value)}
                      placeholder="e.g. Password reset not working"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      required
                      rows={4}
                      value={ticketDescription}
                      onChange={(event) => setTicketDescription(event.target.value)}
                      placeholder="Describe the issue found during QA testing"
                    />
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={ticketPriority}
                      onChange={(event) => setTicketPriority(event.target.value)}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fix deadline</label>
                    <input
                      required
                      type="date"
                      value={ticketDeadline}
                      onChange={(event) => setTicketDeadline(event.target.value)}
                    />
                  </div>
                </div>

                {qaError && (
                  <div className="claim-notice" style={{ marginTop: "12px" }}>
                    {qaError}
                  </div>
                )}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-project-button"
                    onClick={() => setShowTicketModal(false)}
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

      </div>
    </DashboardLayout>
  );
}

export default Tasks;
