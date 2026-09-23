import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ProjectContext = createContext(null);

const API_BASE_URL = "http://65.0.11.153:5001/api";

const CURRENT_USER_ID = "harshita";

/* =====================================================
   HELPERS
===================================================== */

const getToken = () => {
  return localStorage.getItem("token");
};

const normalizeTask = (task) => {
  return {
    ...task,

    // Backend field
    id: task.id,

    // Keep both formats so existing frontend pages
    // can continue working while we migrate them.
    projectId:
      task.project_id ??
      task.projectId ??
      null,

    title: task.title || "",

    assigneeId:
      task.assigned_to ??
      task.assigneeId ??
      task.assignee_id ??
      null,

    status: task.status || "TODO",

    progress:
      Number(task.progress) || 0,

    dueDate:
      task.due_date ??
      task.dueDate ??
      task.deadline ??
      null,

    claimedBy:
      task.claimed_by ??
      null,

    claimedByName:
      task.claimed_by_name ??
      null,

    projectName:
      task.project_name ??
      "",
  };
};

/* =====================================================
   PROVIDER
===================================================== */

export function ProjectProvider({ children }) {
  /*
   * IMPORTANT:
   *
   * There are NO seedProjects.
   * There are NO seedTasks.
   *
   * Data comes from the backend.
   */

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  /*
   * Members are temporarily empty because we do not yet
   * have the backend members API.
   *
   * Once you give me that API, this will also become
   * backend-driven.
   */

  const [members, setMembers] = useState([]);

  const [claimRequests, setClaimRequests] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [loadingTasks, setLoadingTasks] =
    useState(true);

  /* ===================================================
     FETCH PROJECTS
  =================================================== */

  const fetchProjects = async () => {
    try {
      const token = getToken();

      if (!token) {
        console.error(
          "No authentication token found."
        );

        setProjects([]);
        return;
      }

      setLoadingProjects(true);

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

      console.log(
        "PROJECT CONTEXT - PROJECTS:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch projects"
        );
      }

      const backendProjects = Array.isArray(
        data.projects
      )
        ? data.projects
        : [];

      setProjects(backendProjects);
    } catch (error) {
      console.error(
        "ProjectContext projects error:",
        error
      );

      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  /* ===================================================
     FETCH ALL TASKS
  =================================================== */

  const fetchTasks = async () => {
    try {
      const token = getToken();

      if (!token) {
        console.error(
          "No authentication token found."
        );

        setTasks([]);
        return;
      }

      setLoadingTasks(true);

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
        "PROJECT CONTEXT - ALL TASKS:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch tasks"
        );
      }

      const backendTasks = Array.isArray(
        data.tasks
      )
        ? data.tasks.map(normalizeTask)
        : [];

      setTasks(backendTasks);
    } catch (error) {
      console.error(
        "ProjectContext tasks error:",
        error
      );

      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  /* ===================================================
     INITIAL BACKEND LOAD
  =================================================== */

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  /* ===================================================
     PROJECT PROGRESS
  =================================================== */

  const projectProgress = (projectId) => {
    const projectTasks = tasks.filter(
      (task) =>
        Number(task.projectId) ===
        Number(projectId)
    );

    if (!projectTasks.length) {
      return 0;
    }

    const completedTasks =
      projectTasks.filter((task) => {
        const status = String(
          task.status || ""
        )
          .trim()
          .toLowerCase();

        return (
          status === "completed" ||
          status === "complete" ||
          status === "done" ||
          status === "closed"
        );
      }).length;

    return Math.round(
      (completedTasks /
        projectTasks.length) *
        100
    );
  };

  /* ===================================================
     REFRESH DATA
  =================================================== */

  const refreshProjects = async () => {
    await fetchProjects();
  };

  const refreshTasks = async () => {
    await fetchTasks();
  };

  const refreshData = async () => {
    await Promise.all([
      fetchProjects(),
      fetchTasks(),
    ]);
  };

  /* ===================================================
     CREATE PROJECT
     
     Backend:
       POST /api/projects
  =================================================== */

  const createProject = async ({
    name,
    requirements = "",
    deadline = "",
    description = "",
  }) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      const requestBody = {
        name: name.trim(),
        description:
          description?.trim() || null,
        deadline: deadline || null,
      };

      /*
       * Requirements is retained in the frontend
       * function signature for compatibility.
       *
       * If your backend later supports a requirements
       * field, we can add it here.
       */

      console.log(
        "CREATE PROJECT REQUEST:",
        requestBody
      );

      const response = await fetch(
        `${API_BASE_URL}/projects`,
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
        "CREATE PROJECT RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create project"
        );
      }

      /*
       * Refresh from backend.
       *
       * We DO NOT add a fake project to state.
       */

      await fetchProjects();

      return data.project || data;
    } catch (error) {
      console.error(
        "Create project error:",
        error
      );

      throw error;
    }
  };

  /* ===================================================
     CREATE TASK
     
     Backend:
       POST /api/projects/:projectId/tasks
  =================================================== */

  const createTask = async ({
    projectId,
    title,
    assigneeId = null,
    dueDate = null,
  }) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      if (!projectId) {
        throw new Error(
          "Project is required."
        );
      }

      if (!title?.trim()) {
        throw new Error(
          "Task title is required."
        );
      }

      const requestBody = {
        title: title.trim(),

        assigned_to: assigneeId
          ? Number(assigneeId)
          : null,

        due_date:
          dueDate || null,
      };

      console.log(
        "CREATE TASK REQUEST:",
        requestBody
      );

      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/tasks`,
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
          data.message ||
            "Failed to create task"
        );
      }

      /*
       * IMPORTANT:
       *
       * Do not manually add the task to state.
       * Fetch the real database data again.
       */

      await fetchTasks();

      return data.task || data;
    } catch (error) {
      console.error(
        "Create task error:",
        error
      );

      throw error;
    }
  };

  /* ===================================================
     ASSIGN TASK
     
     Backend assignment API has not been provided yet.
     
     Therefore we DO NOT fake an assignment locally.
  =================================================== */

  const assignTask = async (
    taskId,
    memberId
  ) => {
    console.warn(
      "assignTask backend API is not connected yet.",
      {
        taskId,
        memberId,
      }
    );

    /*
     * Do not modify local task data because that would
     * make the frontend disagree with the database.
     */
  };

  /* ===================================================
     CLAIM TASK
     
     Backend claim API has not been provided here.
     
     Do not fake claims locally.
  =================================================== */

  const requestClaim = async (
    taskId,
    memberId
  ) => {
    console.warn(
      "requestClaim backend API is not connected yet.",
      {
        taskId,
        memberId,
      }
    );
  };

  /* ===================================================
     APPROVE CLAIM
     
     Backend claim approval API has not been provided.
  =================================================== */

  const approveClaim = async (
    requestId
  ) => {
    console.warn(
      "approveClaim backend API is not connected yet.",
      {
        requestId,
      }
    );
  };

  /* ===================================================
     UPDATE TASK STATUS
     
     Backend status-update API has not been provided.
     
     Do not update local fake state.
  =================================================== */

  const updateTaskStatus = async (
    taskId,
    newStatus,
    userId = CURRENT_USER_ID
  ) => {
    console.warn(
      "updateTaskStatus backend API is not connected yet.",
      {
        taskId,
        newStatus,
        userId,
      }
    );
  };

  /* ===================================================
     UPDATE TASK PROGRESS
     
     Backend progress-update API has not been provided.
  =================================================== */

  const updateTaskProgress = async (
    taskId,
    progress,
    userId = CURRENT_USER_ID
  ) => {
    console.warn(
      "updateTaskProgress backend API is not connected yet.",
      {
        taskId,
        progress,
        userId,
      }
    );
  };

  /* ===================================================
     CONTEXT VALUE
  =================================================== */

  const value = useMemo(
    () => ({
      /*
       * REAL BACKEND DATA
       */

      projects,
      tasks,
      members,

      /*
       * Existing workflow data.
       * These will become backend-driven as their APIs
       * are connected.
       */

      claimRequests,
      activities,

      /*
       * Loading states
       */

      loadingProjects,
      loadingTasks,

      /*
       * Progress
       */

      projectProgress,

      /*
       * Refresh
       */

      refreshProjects,
      refreshTasks,
      refreshData,

      /*
       * Backend-connected creation
       */

      createProject,
      createTask,

      /*
       * Placeholder workflow functions.
       * They do NOT create fake frontend data.
       */

      assignTask,
      requestClaim,
      approveClaim,
      updateTaskStatus,
      updateTaskProgress,
    }),
    [
      projects,
      tasks,
      members,
      claimRequests,
      activities,
      loadingProjects,
      loadingTasks,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

/* =====================================================
   HOOK
===================================================== */

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error(
      "useProjects must be used inside ProjectProvider"
    );
  }

  return context;
}