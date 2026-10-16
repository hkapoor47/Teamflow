import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const getTaskAssigneeId = (task) => {
  const value = task?.assigneeId ?? task?.assignee_id ?? task?.assigned_to ?? task?.assignedTo ?? null;
  return value === "" ? null : value;
};

const getTaskClaimedById = (task) => {
  const value = task?.claimedBy ?? task?.claimed_by ?? task?.claimedById ?? task?.claimed_by_id ?? null;
  return value === "" ? null : value;
};

const getQaTestId = (test) =>
  test?.id ?? test?.qa_test_id ?? test?.qaTestId ?? null;

const getTicketId = (ticket) =>
  ticket?.id ?? ticket?.ticket_id ?? ticket?.ticketId ?? null;

const getTicketQaTestId = (ticket) =>
  ticket?.qa_test_id ??
  ticket?.qaTestId ??
  ticket?.test_case_id ??
  ticket?.testCaseId ??
  null;

const isTicketActive = (ticket) =>
  ![
    "COMPLETED",
    "COMPLETE",
    "DONE",
    "CLOSED",
    "RESOLVED",
  ].includes(normalizeStatus(ticket?.status || "OPEN"));

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
  const [assigneeRecommendations, setAssigneeRecommendations] = useState([]);
  const [assigneeRecommendationLoading, setAssigneeRecommendationLoading] = useState(false);
  const [assigneeRecommendationError, setAssigneeRecommendationError] = useState("");
  const [myTaskRecommendations, setMyTaskRecommendations] = useState([]);
  const [myRecommendationsLoading, setMyRecommendationsLoading] = useState(false);
  const [myRecommendationsError, setMyRecommendationsError] = useState("");

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
  const [activeTicketByTaskId, setActiveTicketByTaskId] = useState({});

  // Manager permission is project-specific: created_by is the project manager.
  const isProjectManager = (project) =>
    currentUserId != null &&
    Number(project?.created_by) === Number(currentUserId);

  // Everyone may create an individual task; project tasks remain manager-only.
  const canCreateAnyTask = true;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.userId ?? payload.user_id ?? payload.id ?? payload.sub ?? null);
    } catch (error) {
      console.error("Failed to read current user from token:", error);
      setCurrentUserId(null);
    }
  }, []);

  // Keep task-board actions in sync with active QA fix tickets.
  // A task with an active ticket must not offer QA Testing until the fix ticket
  // is completed. Map tickets back to tasks through the linked QA test.
  useEffect(() => {
    let cancelled = false;

    const loadActiveTicketsForBoard = async () => {
      const token = getToken();
      if (!token || !Array.isArray(projects) || !projects.length) {
        if (!cancelled) setActiveTicketByTaskId({});
        return;
      }

      const activeByTask = {};

      await Promise.all(projects.map(async (project) => {
        if (project?.id == null) return;

        try {
          const headers = { Authorization: `Bearer ${token}` };
          const [ticketsResponse, qaResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/projects/${project.id}/tickets`, { headers }),
            fetch(`${API_BASE_URL}/projects/${project.id}/qa-tests`, { headers }),
          ]);

          if (!ticketsResponse.ok || !qaResponse.ok) return;

          const [ticketsData, qaData] = await Promise.all([
            ticketsResponse.json().catch(() => ({})),
            qaResponse.json().catch(() => ({})),
          ]);

          const ticketsValue = ticketsData.tickets || ticketsData.qaTickets || ticketsData.data || ticketsData;
          const qaValue = qaData.testCases || qaData.qaTests || qaData.data || qaData;
          const tickets = Array.isArray(ticketsValue) ? ticketsValue : [];
          const qaTests = Array.isArray(qaValue) ? qaValue : [];

          const taskIdByQaId = new Map();
          qaTests.forEach((test) => {
            const qaId = getQaTestId(test);
            const taskId = test?.task_id ?? test?.taskId;
            if (qaId != null && taskId != null) taskIdByQaId.set(String(qaId), String(taskId));
          });

          tickets.forEach((ticket) => {
            if (!isTicketActive(ticket)) return;

            const qaId = getTicketQaTestId(ticket);
            const linkedTaskId =
              (qaId != null ? taskIdByQaId.get(String(qaId)) : null) ??
              (ticket.task_id != null ? String(ticket.task_id) : null);

            if (linkedTaskId != null && !activeByTask[linkedTaskId]) {
              activeByTask[linkedTaskId] = ticket;
            }
          });
        } catch (error) {
          console.warn(`Could not load active tickets for project ${project.id}:`, error);
        }
      }));

      if (!cancelled) setActiveTicketByTaskId(activeByTask);
    };

    loadActiveTicketsForBoard();
    return () => { cancelled = true; };
  }, [projects, tasks]);

  useEffect(() => {
    if (!showCreateTask) return;

    const managedProject = projects.find(isProjectManager);
    setNewTask((current) => ({
      ...current,
      projectId: current.projectId === "none"
        ? "none"
        : current.projectId && isProjectManager(projects.find((p) => String(p.id) === String(current.projectId)))
          ? current.projectId
          : String(managedProject?.id || "none"),
    }));
  }, [showCreateTask]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      const projectId = getTaskProjectId(task);
      const assigneeId = getTaskAssigneeId(task);
      const claimedById = getTaskClaimedById(task);
      const responsibleUserId = claimedById ?? assigneeId;
      const status = normalizeStatus(task?.status);
      const qaStatus = getTaskQaStatus(task);
      const isFullyCompleted =
        ["COMPLETED", "COMPLETE", "DONE", "CLOSED", "RESOLVED"].includes(status) &&
        qaStatus === "PASSED";
      const hasActiveTicket = Boolean(activeTicketByTaskId[String(task.id)]);

      // Individual tasks (no project) stay visible in the shared task queue,
      // even if someone was originally assigned. Project tasks are shown only
      // when unassigned, owned by the current user, or waiting on an active fix ticket.
      const isUnclaimed = assigneeId == null && claimedById == null;
      const isMine =
        responsibleUserId != null &&
        currentUserId != null &&
        String(responsibleUserId) === String(currentUserId);
      const isIndividualTask = projectId == null;
      if (isFullyCompleted) return false;
      if (!isIndividualTask && !hasActiveTicket && !isUnclaimed && !isMine) return false;

      if (projectFilter === "all") return true;
      if (projectFilter === "none") return isIndividualTask;
      return String(projectId) === String(projectFilter);
    });
  }, [tasks, projectFilter, currentUserId, activeTicketByTaskId]);

  const getProject = (id) =>
    projects.find((project) => String(project.id) === String(id));

  const getMember = (id) =>
    members.find((member) => String(member.id) === String(id));

  const loadAssigneeRecommendations = async () => {
    const title = newTask.title.trim();
    if (!title) {
      setAssigneeRecommendations([]);
      setAssigneeRecommendationError("Enter a task title to get recommendations.");
      return;
    }

    setAssigneeRecommendationLoading(true);
    setAssigneeRecommendationError("");
    try {
      const token = getToken();
      let recommendations = [];
      // The same trained model supports previewing project and project-less individual tasks.
      if (token) {
        const query = new URLSearchParams({
          title,
          description: newTask.description || "",
          priority: newTask.priority || "MEDIUM",
          ...(newTask.dueDate ? { dueDate: newTask.dueDate } : {}),
          ...(newTask.projectId && newTask.projectId !== "none" ? { projectId: String(newTask.projectId) } : {}),
        });
        const response = await fetch(`${API_BASE_URL}/recommendations/preview?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          recommendations = data.recommendations || data.data?.recommendations || data.data || [];
          if (!Array.isArray(recommendations)) recommendations = [];
        }
      }

      // Project-less tasks can be drafted before they exist in the database, so use profile/skill/history matching here.
      if (!recommendations.length) {
        const words = [...new Set(title.toLowerCase().match(/[a-z0-9+#.]+/g) || [])];
        recommendations = members
          .filter((member) => member?.id != null && String(member.id) !== String(currentUserId))
          .map((member) => {
            const skills = [
              ...(Array.isArray(member.skills) ? member.skills : []),
              ...(Array.isArray(member.skillNames) ? member.skillNames : []),
              ...(Array.isArray(member.skill_names) ? member.skill_names : []),
            ].map((skill) => typeof skill === "object" ? (skill.skill_name || skill.name || "") : String(skill));
            const skillText = skills.join(" ").toLowerCase();
            const history = tasks.filter((task) =>
              String(task.assigned_to ?? task.assigneeId ?? task.assignee_id ?? task.claimed_by ?? task.claimedBy ?? "") === String(member.id)
            );
            const historyText = history.map((task) => `${task.title || task.name || ""} ${task.description || ""}`).join(" ").toLowerCase();
            const skillMatches = words.filter((word) => skillText.includes(word));
            const historyMatches = words.filter((word) => historyText.includes(word));
            const score = Math.min(98, 35 + skillMatches.length * 12 + historyMatches.length * 8 + Math.min(history.length, 5) * 2);
            return {
              employeeId: member.id,
              name: member.name || member.username || member.email || `User ${member.id}`,
              recommendationScore: score,
              reasons: skillMatches.length ? [`Skill match: ${skillMatches.slice(0, 3).join(", ")}`] : historyMatches.length ? ["Similar previous work"] : ["Available team member"],
            };
          })
          .sort((a, b) => b.recommendationScore - a.recommendationScore);
      }

      const deduped = new Map();
      const seenNames = [];
      const normalizeName = (value) => String(value || "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
      const samePersonName = (left, right) => {
        const a = normalizeName(left);
        const b = normalizeName(right);
        if (!a || !b) return false;
        if (a === b) return true;
        const shorter = a.length <= b.length ? a : b;
        const longer = a.length > b.length ? a : b;
        return shorter.length >= 5 && longer.startsWith(shorter);
      };
      recommendations.forEach((item) => {
        const id = item.employeeId ?? item.userId ?? item.user_id ?? item.id;
        if (id == null || String(id) === String(currentUserId) || deduped.has(String(id))) return;
        const member = getMember(id);
        const displayName = member?.name || member?.username || item.employeeName || item.userName || item.name || `User ${id}`;
        if (seenNames.some((name) => samePersonName(name, displayName))) return;
        seenNames.push(displayName);
        deduped.set(String(id), {
          ...item,
          employeeId: id,
          name: displayName,
          recommendationScore: Number(item.recommendationScore ?? item.successProbability ?? item.score ?? 0),
        });
      });
      setAssigneeRecommendations([...deduped.values()].sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, 3));
      if (!deduped.size) setAssigneeRecommendationError("No suitable team members found. Add skills to profiles for better matching.");
    } catch (error) {
      console.error("Assignee recommendation failed:", error);
      setAssigneeRecommendationError("Could not load recommendations. You can still assign from the dropdown.");
    } finally {
      setAssigneeRecommendationLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadMyRecommendations = async () => {
      const token = getToken();
      if (!token) return;
      setMyRecommendationsLoading(true);
      setMyRecommendationsError("");
      try {
        const response = await fetch(`${API_BASE_URL}/recommendations/my-tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Could not load task recommendations.");
        if (!cancelled) setMyTaskRecommendations(Array.isArray(data.recommendations) ? data.recommendations.slice(0, 3) : []);
      } catch (error) {
        if (!cancelled) setMyRecommendationsError(error.message || "Could not load recommendations.");
      } finally {
        if (!cancelled) setMyRecommendationsLoading(false);
      }
    };
    loadMyRecommendations();
    return () => { cancelled = true; };
  }, [tasks.length, currentUserId]);

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(window.__teamflowNoticeTimer);
    window.__teamflowNoticeTimer = window.setTimeout(
      () => setNotice(""),
      3000
    );
  };

  // Some older ProjectContext versions define completeTask but do not expose
  // it in the context value. Use the context function when available, otherwise
  // call the same backend endpoint directly to avoid "A is not a function".
  const completeTaskSafely = async (taskId) => {
    if (typeof completeTask === "function") {
      return completeTask(taskId);
    }

    const token = getToken();
    if (!token) throw new Error("Please login again.");

    const response = await fetch(`${API_BASE_URL}/projects/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || "Failed to complete task.");
    }
    if (typeof refreshTasks === "function") await refreshTasks();
    return data;
  };

  const claim = async (taskId) => {
    try {
      await requestClaim(taskId);
      setMyTaskRecommendations((current) => current.filter((item) => String(item.taskId) !== String(taskId)));
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

    const isIndividualTask = !newTask.projectId || newTask.projectId === "none";

    try {
      setCreatingTask(true);

      if (!isIndividualTask) {
        const selectedProject = projects.find((project) => String(project.id) === String(newTask.projectId));
        if (!isProjectManager(selectedProject)) {
          throw new Error("Only the project manager can create tasks in this project.");
        }
      }

      await createTask({
        projectId: isIndividualTask ? null : newTask.projectId,
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
      setAssigneeRecommendations([]);
      setAssigneeRecommendationError("");
      notify(isIndividualTask ? "Individual task created successfully." : "Project task created successfully.");
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

  const loadTicketsForQaTask = async (task, qaTestId = null) => {
    const token = getToken();
    if (!token || !task) return [];

    const projectId = getTaskProjectId(task);

    // The current ticket backend is project-scoped.
    if (projectId == null) {
      setCreatedTickets([]);
      return [];
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/tickets`,
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
        throw new Error(
          `Ticket API returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to load tickets (${response.status})`
        );
      }

      const tickets = data.tickets || data.qaTickets || data.data || data;
      const list = Array.isArray(tickets) ? tickets : [];

      // Show the tickets belonging to the selected QA test. If no QA test
      // id is available yet, fall back to tickets linked to this task.
      const matching = list.filter((ticket) => {
        if (!isTicketActive(ticket)) return false;

        const ticketQaId = getTicketQaTestId(ticket);

        if (qaTestId != null && ticketQaId != null) {
          return String(ticketQaId) === String(qaTestId);
        }

        // Some older ticket rows may not expose qa_test_id in the response.
        // Keep them only when the backend response contains the task id.
        return (
          ticket.task_id != null &&
          String(ticket.task_id) === String(task.id)
        );
      });

      setCreatedTickets(matching);
      setCreatedTicket(matching[0] || null);
      return matching;
    } catch (error) {
      console.error("Failed to load QA tickets:", error);
      setCreatedTickets([]);
      setCreatedTicket(null);
      return [];
    }
  };

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

        // Existing ticket must be visible when QA Testing is opened.
        await loadTicketsForQaTask(task, getQaTestId(matching));
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

        // Load any ticket that already exists for this QA test.
        await loadTicketsForQaTask(task, getQaTestId(created));
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
      // If an active ticket already exists, the task is already in the
      // ticket/fix stage. Do not allow another FAIL or duplicate ticket.
      const existingTickets = await loadTicketsForQaTask(
        qaTask,
        getQaTestId(qaTest)
      );

      if (existingTickets.length > 0) {
        setShowTicketModal(false);
        setQaError("");
        notify("An active ticket already exists. Complete the fix before re-testing.");
        return;
      }

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

    if (!token) {
      setQaError("Authentication required. Please login again.");
      return;
    }

    // The current backend ticket API is project-scoped.
    // Do not create a fake LOCAL ticket for standalone tasks.
    if (projectId == null) {
      setQaError("Ticket creation for standalone tasks is not available in the current backend API.");
      return;
    }

    try {
      setTicketCreating(true);
      setQaError("");

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

      if (!response.ok) {
        throw new Error(data.message || data.error || `Failed to create ticket (${response.status})`);
      }

      const ticket = data.ticket || data.data || data;
      if (!ticket?.id) throw new Error("Ticket API did not return a ticket ID.");

      // Persist the server ticket as the source of truth.
      await loadTicketsForQaTask(qaTask, qaTest?.id || null);

      setShowTicketModal(false);
      setQaError("");
      setQaTest((current) =>
        current ? { ...current, status: "FAILED" } : current
      );
      setCreatedTicket(ticket);
      notify("Ticket created successfully. Task moved to QA Tickets.");
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
    if (!ticketToClaim?.id) return;

    const token = getToken();
    if (!token) {
      setQaError("Authentication required. Please login again.");
      return;
    }

    setTicketActionLoading(true);
    setQaError("");
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketToClaim.id}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!response.ok) throw new Error(data.message || "Failed to claim ticket.");

      const claimed = data.ticket || data.data || data;
      setCreatedTicket(claimed);
      setCreatedTickets((current) => current.map((ticket) => String(ticket.id) === String(ticketToClaim.id) ? claimed : ticket));
      notify("Ticket claimed. Complete is now available to you.");
    } catch (error) {
      console.error("Claim ticket error:", error);
      setQaError(error.message || "Failed to claim ticket.");
    } finally {
      setTicketActionLoading(false);
    }
  };

  const completeCreatedTicket = async (ticketToComplete = createdTicket) => {
    if (!ticketToComplete?.id) return;

    const claimedBy = getClaimedTicketUserId(ticketToComplete);
    if (claimedBy != null && currentUserId != null && String(claimedBy) !== String(currentUserId)) {
      setQaError("Only the person who claimed this ticket can complete it.");
      return;
    }

    const token = getToken();
    if (!token) {
      setQaError("Authentication required. Please login again.");
      return;
    }

    setTicketActionLoading(true);
    setQaError("");
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketToComplete.id}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!response.ok) throw new Error(data.message || "Failed to complete ticket.");

      setCreatedTicket(null);
      setCreatedTickets((current) =>
        current.filter(
          (ticket) => String(getTicketId(ticket)) !== String(ticketToComplete.id)
        )
      );

      // Refresh the task list. The backend ticket-complete route is expected
      // to reset the linked QA state so the task becomes QA PENDING again.
      await refreshTasks();

      // Re-open QA on the same task after the fix so it can be re-tested.
      if (qaTask) {
        await loadQaForTask(qaTask);
      }

      notify("Fix completed. QA Testing is open again for re-test.");
    } catch (error) {
      console.error("Complete ticket error:", error);
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
          {/* <p className="welcome-description">
            Create project work or individual tasks, then claim, complete and QA them.
          </p> */}
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

          {canCreateAnyTask && (
            <button
              className="primary-button"
              onClick={() => setShowCreateTask(true)}
            >
              + Create task
            </button>
          )}
        </div>

        {notice && <div className="claim-notice">{notice}</div>}

        {showCreateTask && createPortal(
          <div className="modal-overlay task-create-overlay">
            <div className="modal-card task-create-modal-card">
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
                      onChange={(event) => {
                        setNewTask({ ...newTask, title: event.target.value });
                        setAssigneeRecommendations([]);
                        setAssigneeRecommendationError("");
                      }}
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
                      onChange={(event) => {
                        setNewTask({ ...newTask, projectId: event.target.value, assigneeId: "" });
                        setAssigneeRecommendations([]);
                        setAssigneeRecommendationError("");
                      }}
                    >
                      <option value="none">Individual task — No project</option>
                      {projects.filter(isProjectManager).map((project) => (
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
                      {members.filter((member) => String(member.id) !== String(currentUserId)).map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} — {member.role}
                        </option>
                      ))}
                    </select>
                    <div className="task-assignee-ai">
                      <div className="task-assignee-ai-heading">
                        <div>
                          <strong>AI assignee suggestions</strong>
                          <span>Best-fit teammates based on skills and work history</span>
                        </div>
                        <button type="button" onClick={loadAssigneeRecommendations} disabled={assigneeRecommendationLoading || !newTask.title.trim()}>
                          {assigneeRecommendationLoading ? "Finding…" : "✨ Recommend"}
                        </button>
                      </div>
                      {assigneeRecommendationError && <p className="task-ai-message">{assigneeRecommendationError}</p>}
                      {assigneeRecommendations.map((item, index) => {
                        const id = item.employeeId ?? item.id;
                        const selected = String(newTask.assigneeId) === String(id);
                        return (
                          <button key={id} type="button" className={`task-assignee-ai-row${selected ? " is-selected" : ""}`} onClick={() => setNewTask({ ...newTask, assigneeId: String(id) })}>
                            <span className="task-ai-rank">{index + 1}</span>
                            <span className="task-ai-person"><strong>{item.name}</strong><small>{(item.reasons || []).slice(0, 1).join("") || "Recommended for this task"}</small></span>
                            <strong className="task-ai-score">{Number(item.recommendationScore || 0).toFixed(0)}%</strong>
                          </button>
                        );
                      })}
                    </div>
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
          </div>, document.body)}

        <section className="panel task-board">
          <div className="panel-header">
            <div>
              <h3>Task board</h3>
              <p>{visibleTasks.length} tasks match your filters.</p>
            </div>
          </div>

          <div className="task-table-wrap task-board-table-wrap">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleTasks.map((task) => {
                  const projectId = getTaskProjectId(task);
                  const project = getProject(projectId);
                  const member = getMember(getTaskAssigneeId(task));
                  const qaStatus = getTaskQaStatus(task);
                  const developmentCompleted =
                    ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(
                      normalizeStatus(task.status)
                    );
                  const fullyDone =
                    developmentCompleted && qaStatus === "PASSED";
                  const activeTicket = activeTicketByTaskId[String(task.id)] || null;
                  const activeTicketClaimedBy =
                    activeTicket?.claimed_by ?? activeTicket?.claimedBy ?? null;
                  const activeTicketClaimedName =
                    activeTicket?.claimed_by_name ??
                    activeTicket?.claimedByName ??
                    activeTicket?.assigned_to_name ??
                    activeTicket?.assignedToName ??
                    activeTicket?.claimant_name ??
                    activeTicket?.claimantName ??
                    null;
                  const activeTicketMember =
                    activeTicketClaimedBy != null ? getMember(activeTicketClaimedBy) : null;
                  const activeTicketDisplayName =
                    activeTicketClaimedName ||
                    activeTicketMember?.name ||
                    activeTicketMember?.username ||
                    null;
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
                        {activeTicket ? (
                          activeTicketClaimedBy != null ? (
                            activeTicketDisplayName ? (
                              <span className="assignee" title="Fix ticket claimant">
                                <i>{activeTicketDisplayName.charAt(0).toUpperCase()}</i>
                                {activeTicketDisplayName}
                              </span>
                            ) : (
                              <span className="assignee" title="Fix ticket has been claimed">
                                <i>✓</i> Claimed
                              </span>
                            )
                          ) : (
                            <span className="unassigned">Unassigned</span>
                          )
                        ) : member ? (
                          <span className="assignee">
                            <i>{member.name?.charAt(0)?.toUpperCase()}</i>
                            {member.name}
                          </span>
                        ) : task.claimedByName ? (
                          <span className="assignee">
                            <i>{task.claimedByName?.charAt(0)?.toUpperCase()}</i>
                            {task.claimedByName}
                          </span>
                        ) : (
                          <span className="unassigned">Unassigned</span>
                        )}
                      </td>

                      <td>
                        {fullyDone ? (
                          <span className="task-status">DONE</span>
                        ) : developmentCompleted ? (
                          <button
                            type="button"
                            className="task-status task-status-button"
                            onClick={() => loadQaForTask(task)}
                            title={activeTicket ? "Open QA workspace to view the active fix ticket" : "Open QA testing"}
                            style={{ cursor: "pointer", border: 0, font: "inherit" }}
                          >
                            QA PENDING
                          </button>
                        ) : (
                          <span className="task-status">
                            {normalizeStatus(task.status) || "TODO"}
                          </span>
                        )}
                      </td>

                      <td>
                        {fullyDone ? (
                          <span className="task-status">Completed</span>
                        ) : activeTicket ? (
                          activeTicketClaimedBy != null ? (
                            <span className="task-status" title="This fix ticket has already been claimed">
                              Claimed
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => loadQaForTask(task)}
                              title="Open the active fix ticket to claim it"
                            >
                              Claim Ticket
                            </button>
                          )
                        ) : developmentCompleted ? (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => loadQaForTask(task)}
                          >
                            QA Testing
                          </button>
                        ) : (
                          (() => {
                            const assigneeId = getTaskAssigneeId(task);
                            const claimedById = getTaskClaimedById(task);
                            const responsibleUserId = claimedById ?? assigneeId;
                            const isAssignedToCurrentUser =
                              responsibleUserId != null &&
                              currentUserId != null &&
                              String(responsibleUserId) === String(currentUserId);

                            if (isAssignedToCurrentUser) {
                              return (
                                <button
                                  type="button"
                                  className="primary-button"
                                  onClick={async () => {
                                    try {
                                      await completeTaskSafely(task.id);
                                      notify("Task completed and moved to QA.");
                                    } catch (error) {
                                      notify(error.message || "Failed to complete task.");
                                    }
                                  }}
                                >
                                  Complete
                                </button>
                              );
                            }

                            if (responsibleUserId != null) {
                              return (
                                <span className="task-status">
                                  {claimedById != null ? "Claimed" : "Assigned"}
                                </span>
                              );
                            }

                            return (
                              <button
                                type="button"
                                className="primary-button"
                                onClick={() => claim(task.id)}
                              >
                                Claim Task
                              </button>
                            );
                          })()
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!visibleTasks.length && (
                  <tr>
                    <td colSpan="5" style={{ padding: "30px", textAlign: "center" }}>
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
                    {/* <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                      FAIL creates a fix ticket. Once the ticket is created, this task stays in QA Tickets until the fix is completed.
                    </div> */}

                    {createdTickets.length > 0 ? (
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(245,158,11,.28)",
                          background: "rgba(245,158,11,.08)",
                          color: "#fbbf24",
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        Fix ticket active — complete it before re-testing.
                      </div>
                    ) : (
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
                      </div>
                    )}
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
                {/* <p style={{ marginTop: "6px" }}>
                  Active QA fix tickets are shown here. Complete a ticket to send its task back to QA for re-testing.
                </p> */}
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

        {/* QA ticket modal is portaled to body to center against the browser viewport. */}
        {showTicketModal && createPortal(
          <div
            className="modal-overlay qa-ticket-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !ticketCreating) {
                setShowTicketModal(false);
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100dvh",
              zIndex: 2147483000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              margin: 0,
              boxSizing: "border-box",
              overflowY: "auto",
              background: "rgba(4, 10, 24, 0.76)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div
              className="modal-card qa-ticket-modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="qa-ticket-modal-title"
              style={{
                position: "relative",
                inset: "auto",
                transform: "none",
                width: "min(720px, calc(100vw - 48px))",
                maxWidth: "720px",
                maxHeight: "calc(100dvh - 48px)",
                height: "auto",
                margin: "auto",
                boxSizing: "border-box",
                overflowY: "auto",
                flex: "0 0 auto",
              }}
            >
              <div className="modal-header">
                <div>
                  <p className="welcome-label">QA ISSUE</p>
                  <h3 id="qa-ticket-modal-title">Create Ticket</h3>
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
          </div>,
          document.body
        )}

      </div>
    </DashboardLayout>
  );
}

export default Tasks;

































