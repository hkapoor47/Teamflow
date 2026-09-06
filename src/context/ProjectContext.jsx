import { createContext, useContext, useMemo, useState } from "react";

const ProjectContext = createContext(null);

const seedMembers = [
  {
    id: "rahul",
    name: "Rahul Sharma",
    email: "rahul@teamflow.dev",
    role: "Frontend Developer",
  },
  {
    id: "priya",
    name: "Priya Singh",
    email: "priya@teamflow.dev",
    role: "Backend Developer",
  },
  {
    id: "aman",
    name: "Aman Verma",
    email: "aman@teamflow.dev",
    role: "QA Engineer",
  },
  {
    id: "neha",
    name: "Neha Kapoor",
    email: "neha@teamflow.dev",
    role: "Product Designer",
  },
];

const seedProjects = [
  {
    id: "website-redesign",
    name: "Website Redesign",
    description:
      "A faster, clearer marketing site for the next product launch.",
    requirements:
      "Modern responsive experience, accessible components and improved conversion journey.",
    deadline: "2026-09-15",
    status: "On Track",
    memberIds: ["rahul", "neha", "aman"],
  },
  {
    id: "mobile-application",
    name: "Mobile Application",
    description:
      "Cross-platform mobile app for customers and field teams.",
    requirements:
      "Secure sign-in, offline support, real-time notifications and a simple mobile-first flow.",
    deadline: "2026-09-25",
    status: "On Track",
    memberIds: ["priya", "rahul", "aman"],
  },
  {
    id: "ai-dashboard",
    name: "AI Dashboard",
    description:
      "Decision dashboard with practical AI-powered reporting.",
    requirements:
      "Actionable metrics, permissions and exportable reports for leadership.",
    deadline: "2026-09-10",
    status: "At Risk",
    memberIds: ["priya", "neha"],
  },
];

const seedTasks = [
  {
    id: "t1",
    projectId: "website-redesign",
    title: "Design the homepage",
    assigneeId: "neha",
    status: "In Progress",
    progress: 75,
    dueDate: "2026-09-08",
  },

  {
    id: "t2",
    projectId: "website-redesign",
    title: "Build reusable page sections",
    assigneeId: "rahul",
    status: "In Progress",
    progress: 65,
    dueDate: "2026-09-10",
  },

  {
    id: "t3",
    projectId: "website-redesign",
    title: "Run accessibility review",
    assigneeId: "aman",
    status: "To Do",
    progress: 20,
    dueDate: "2026-09-12",
  },

  {
    id: "t4",
    projectId: "website-redesign",
    title: "Set up analytics events",
    assigneeId: null,
    status: "Unassigned",
    progress: 0,
    dueDate: "2026-09-13",
  },

  {
    id: "t5",
    projectId: "mobile-application",
    title: "Build authentication API",
    assigneeId: "priya",
    status: "Completed",
    progress: 100,
    dueDate: "2026-09-06",
    completedAt: "2026-09-05",
  },

  {
    id: "t6",
    projectId: "mobile-application",
    title: "Create mobile navigation",
    assigneeId: "rahul",
    status: "In Progress",
    progress: 55,
    dueDate: "2026-09-14",
  },

  {
    id: "t7",
    projectId: "mobile-application",
    title: "Test offline mode",
    assigneeId: null,
    status: "Unassigned",
    progress: 0,
    dueDate: "2026-09-18",
  },

  {
    id: "t8",
    projectId: "ai-dashboard",
    title: "Define executive metrics",
    assigneeId: "neha",
    status: "In Progress",
    progress: 45,
    dueDate: "2026-09-07",
  },

  {
    id: "t9",
    projectId: "ai-dashboard",
    title: "Create data service",
    assigneeId: "priya",
    status: "Blocked",
    progress: 30,
    dueDate: "2026-09-08",
  },

  {
    id: "t10",
    projectId: "ai-dashboard",
    title: "Validate report exports",
    assigneeId: null,
    status: "Unassigned",
    progress: 0,
    dueDate: "2026-09-09",
  },
];

const average = (items) =>
  items.length
    ? Math.round(
        items.reduce((total, item) => total + item.progress, 0) /
          items.length
      )
    : 0;

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(seedProjects);
  const [tasks, setTasks] = useState(seedTasks);
  const [claimRequests, setClaimRequests] = useState([]);

  // Stores the work history/activity of users.
  const [activities, setActivities] = useState([]);

  const projectProgress = (projectId) => {
    return average(
      tasks.filter((task) => task.projectId === projectId)
    );
  };

  // --------------------------------------------------
  // ACTIVITY / HISTORY
  // --------------------------------------------------

  const addActivity = ({
    taskId = null,
    projectId = null,
    userId = null,
    action,
    details,
  }) => {
    const activity = {
      id: `activity-${Date.now()}-${Math.random()}`,
      taskId,
      projectId,
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    };

    setActivities((current) => [activity, ...current]);
  };

  // --------------------------------------------------
  // CREATE PROJECT
  // --------------------------------------------------

  const createProject = ({
    name,
    description,
    requirements,
    taskTitles,
  }) => {
    const id = `${name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${Date.now()}`;

    const project = {
      id,
      name: name.trim(),
      description: description.trim(),
      requirements: requirements.trim(),
      deadline: "Not set",
      status: "Planning",
      memberIds: [],
    };

    setProjects((current) => [...current, project]);

    const newTasks = taskTitles.map((title, index) => ({
      id: `${id}-task-${index}`,
      projectId: id,
      title,
      assigneeId: null,
      status: "Unassigned",
      progress: 0,
      dueDate: "Not set",
    }));

    setTasks((current) => [...current, ...newTasks]);

    // Record project creation.
    addActivity({
      projectId: id,
      action: "PROJECT_CREATED",
      details: `Project "${project.name}" was created`,
    });

    // Record task creation.
    newTasks.forEach((task) => {
      addActivity({
        taskId: task.id,
        projectId: id,
        action: "TASK_CREATED",
        details: `Task "${task.title}" was created`,
      });
    });

    return project;
  };

  // --------------------------------------------------
  // CREATE TASK
  // --------------------------------------------------

  const createTask = ({
    projectId,
    title,
    assigneeId = null,
    status,
    progress = 0,
    dueDate = "Not set",
  }) => {
    const taskId = `task-${Date.now()}-${Math.random()}`;

    const finalStatus =
      status || (assigneeId ? "To Do" : "Unassigned");

    const newTask = {
      id: taskId,
      projectId,
      title: title.trim(),
      assigneeId,
      status: finalStatus,
      progress,
      dueDate,
    };

    setTasks((current) => [...current, newTask]);

    // Record task creation.
    addActivity({
      taskId,
      projectId,
      action: "TASK_CREATED",
      details: `Task "${newTask.title}" was created`,
    });

    // If the task was created with an assignee,
    // record that assignment as well.
    if (assigneeId) {
      addActivity({
        taskId,
        projectId,
        userId: assigneeId,
        action: "TASK_ASSIGNED",
        details: `Task "${newTask.title}" was assigned`,
      });
    }

    return newTask;
  };

  // --------------------------------------------------
  // UPDATE TASK STATUS
  // --------------------------------------------------

  const updateTaskStatus = (taskId, newStatus, userId = null) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) return;

    const oldStatus = task.status;

    if (oldStatus === newStatus) return;

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: newStatus,
              progress:
                newStatus === "Completed"
                  ? 100
                  : item.progress,
            }
          : item
      )
    );

    addActivity({
      taskId,
      projectId: task.projectId,
      userId: userId || task.assigneeId,
      action: "STATUS_CHANGED",
      details: `Status changed from "${oldStatus}" to "${newStatus}"`,
    });

    // Automatically record completion.
    if (newStatus === "Completed") {
      addActivity({
        taskId,
        projectId: task.projectId,
        userId: userId || task.assigneeId,
        action: "TASK_COMPLETED",
        details: `Task "${task.title}" was completed`,
      });
    }
  };

  // --------------------------------------------------
  // UPDATE TASK PROGRESS
  // --------------------------------------------------

  const updateTaskProgress = (taskId, progress, userId = null) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) return;

    const safeProgress = Math.max(
      0,
      Math.min(100, Number(progress))
    );

    if (task.progress === safeProgress) return;

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? {
              ...item,
              progress: safeProgress,
              status:
                safeProgress === 100
                  ? "Completed"
                  : safeProgress > 0
                  ? "In Progress"
                  : item.status,
            }
          : item
      )
    );

    addActivity({
      taskId,
      projectId: task.projectId,
      userId: userId || task.assigneeId,
      action: "PROGRESS_UPDATED",
      details: `Progress changed from ${task.progress}% to ${safeProgress}%`,
    });

    if (safeProgress === 100 && task.progress !== 100) {
      addActivity({
        taskId,
        projectId: task.projectId,
        userId: userId || task.assigneeId,
        action: "TASK_COMPLETED",
        details: `Task "${task.title}" was completed`,
      });
    }
  };

  // --------------------------------------------------
  // ASSIGN TASK
  // --------------------------------------------------

  const assignTask = (taskId, memberId) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) return;

    const previousAssignee = task.assigneeId;

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? {
              ...item,
              assigneeId: memberId,
              status:
                item.status === "Unassigned"
                  ? "To Do"
                  : item.status,
            }
          : item
      )
    );

    if (previousAssignee && previousAssignee !== memberId) {
      addActivity({
        taskId,
        projectId: task.projectId,
        userId: memberId,
        action: "TASK_REASSIGNED",
        details: `Task was reassigned from ${previousAssignee} to ${memberId}`,
      });
    } else {
      addActivity({
        taskId,
        projectId: task.projectId,
        userId: memberId,
        action: "TASK_ASSIGNED",
        details: `Task "${task.title}" was assigned`,
      });
    }
  };

  // --------------------------------------------------
  // CLAIM TASK
  // --------------------------------------------------

 const requestClaim = (taskId, memberId) => {
  const task = tasks.find((item) => item.id === taskId);

  if (!task || task.assigneeId) {
    return;
  }

  setTasks((current) =>
    current.map((item) =>
      item.id === taskId
        ? {
            ...item,
            assigneeId: memberId,
            status: "To Do",
          }
        : item
    )
  );

  addActivity({
    taskId,
    projectId: task.projectId,
    userId: memberId,
    action: "TASK_CLAIMED",
    details: `Task "${task.title}" was claimed`,
  });

  /*
    FUTURE BACKEND:
    Send an email to the project manager
    when this task is claimed.
  */
};

  // --------------------------------------------------
  // APPROVE CLAIM
  // --------------------------------------------------

  const approveClaim = (requestId) => {
    const request = claimRequests.find(
      (item) => item.id === requestId
    );

    if (!request) return;

    const task = tasks.find(
      (item) => item.id === request.taskId
    );

    if (!task) return;

    setTasks((current) =>
      current.map((task) =>
        task.id === request.taskId
          ? {
              ...task,
              assigneeId: request.memberId,
              status: "To Do",
            }
          : task
      )
    );

    setClaimRequests((current) =>
      current.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: "Approved",
            }
          : item
      )
    );

    // Record approval.
    addActivity({
      taskId: request.taskId,
      projectId: task.projectId,
      userId: request.memberId,
      action: "CLAIM_APPROVED",
      details: `Claim request for "${task.title}" was approved`,
    });

    // Record assignment.
    addActivity({
      taskId: request.taskId,
      projectId: task.projectId,
      userId: request.memberId,
      action: "TASK_ASSIGNED",
      details: `Task "${task.title}" was assigned after claim approval`,
    });
  };

  // --------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------

  const value = useMemo(
    () => ({
      projects,
      tasks,
      members: seedMembers,
      claimRequests,
      activities,

      projectProgress,

      createProject,
      createTask,

      updateTaskStatus,
      updateTaskProgress,
      assignTask,

      requestClaim,
      approveClaim,
    }),
    [
      projects,
      tasks,
      claimRequests,
      activities,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error(
      "useProjects must be used inside ProjectProvider"
    );
  }

  return context;
}