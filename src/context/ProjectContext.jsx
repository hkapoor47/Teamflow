import { createContext, useContext, useMemo, useState } from "react";

const ProjectContext = createContext(null);

const CURRENT_USER_ID = "harshita";

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
    description: "A faster, clearer marketing site for the next product launch.",
    requirements:
      "Modern responsive experience, accessible components and improved conversion journey.",
    deadline: "2026-09-15",
    status: "On Track",
    creatorId: CURRENT_USER_ID,
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
    creatorId: CURRENT_USER_ID,
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
    creatorId: CURRENT_USER_ID,
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
  const [activities, setActivities] = useState([]);

  const projectProgress = (projectId) => {
    return average(
      tasks.filter((task) => task.projectId === projectId)
    );
  };

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

  // --------------------------------
  // CREATE PROJECT
  // --------------------------------

  const createProject = ({
    name,
    requirements,
    deadline,
  }) => {
    const id = `${name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${Date.now()}`;

    const project = {
      id,
      name: name.trim(),

      // Kept internally so existing project pages don't break.
      description: "",

      requirements: requirements.trim(),

      deadline: deadline || "Not set",

      status: "Planning",

      // Person creating this project
      creatorId: CURRENT_USER_ID,

      // Initially nobody is part of the project.
      // Members get added when tasks are assigned/approved.
      memberIds: [],
    };

    setProjects((current) => [...current, project]);

    addActivity({
      projectId: id,
      userId: CURRENT_USER_ID,
      action: "PROJECT_CREATED",
      details: `Created project "${project.name}"`,
    });

    return project;
  };

  // --------------------------------
  // CREATE TASK
  // --------------------------------

  const createTask = ({
    projectId,
    title,
    assigneeId = null,
    dueDate = "Not set",
  }) => {
    const taskId = `task-${Date.now()}-${Math.random()}`;

    const task = {
      id: taskId,
      projectId,
      title: title.trim(),
      assigneeId: assigneeId || null,
      status: assigneeId ? "To Do" : "Unassigned",
      progress: 0,
      dueDate: dueDate || "Not set",
    };

    setTasks((current) => [...current, task]);

    // If creator assigns the task directly,
    // automatically add that person to project team.
    if (assigneeId) {
      setProjects((current) =>
        current.map((project) =>
          project.id === projectId &&
          !project.memberIds.includes(assigneeId)
            ? {
                ...project,
                memberIds: [...project.memberIds, assigneeId],
              }
            : project
        )
      );
    }

    addActivity({
      taskId,
      projectId,
      userId: CURRENT_USER_ID,
      action: "TASK_CREATED",
      details: assigneeId
        ? `Created and assigned "${task.title}"`
        : `Created unassigned task "${task.title}"`,
    });

    return task;
  };

  // --------------------------------
  // ASSIGN TASK
  // --------------------------------

  const assignTask = (taskId, memberId) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) return;

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

    // Add member to project team automatically
    setProjects((current) =>
      current.map((project) =>
        project.id === task.projectId &&
        !project.memberIds.includes(memberId)
          ? {
              ...project,
              memberIds: [...project.memberIds, memberId],
            }
          : project
      )
    );

    addActivity({
      taskId,
      projectId: task.projectId,
      userId: CURRENT_USER_ID,
      action: "TASK_ASSIGNED",
      details: `Assigned "${task.title}"`,
    });
  };

  // --------------------------------
  // CLAIM TASK
  // --------------------------------

  const requestClaim = (taskId, memberId) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.assigneeId) return;

    const alreadyPending = claimRequests.some(
      (request) =>
        request.taskId === taskId &&
        request.status === "Pending"
    );

    if (alreadyPending) return;

    const project = projects.find(
      (item) => item.id === task.projectId
    );

    const request = {
      id: `claim-${Date.now()}`,
      taskId,
      memberId,
      projectId: task.projectId,

      // This is the person who created the project.
      managerId: project?.creatorId || CURRENT_USER_ID,

      status: "Pending",

      // Later backend can use this information to send email.
      notificationStatus: "Email pending backend integration",
    };

    setClaimRequests((current) => [request, ...current]);

    addActivity({
      taskId,
      projectId: task.projectId,
      userId: memberId,
      action: "TASK_CLAIM_REQUESTED",
      details: `Requested to claim "${task.title}"`,
    });
  };

  // --------------------------------
  // APPROVE CLAIM
  // --------------------------------

  const approveClaim = (requestId) => {
    const request = claimRequests.find(
      (item) => item.id === requestId
    );

    if (!request) return;

    const task = tasks.find(
      (item) => item.id === request.taskId
    );

    if (!task) return;

    // Assign task
    setTasks((current) =>
      current.map((item) =>
        item.id === request.taskId
          ? {
              ...item,
              assigneeId: request.memberId,
              status: "To Do",
            }
          : item
      )
    );

    // IMPORTANT:
    // Member becomes part of the project after claim approval.
    setProjects((current) =>
      current.map((project) =>
        project.id === request.projectId &&
        !project.memberIds.includes(request.memberId)
          ? {
              ...project,
              memberIds: [
                ...project.memberIds,
                request.memberId,
              ],
            }
          : project
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

    addActivity({
      taskId: request.taskId,
      projectId: request.projectId,
      userId: request.memberId,
      action: "TASK_CLAIM_APPROVED",
      details: `Claim approved for "${task.title}"`,
    });
  };

  // --------------------------------
  // TASK STATUS
  // --------------------------------

  const updateTaskStatus = (
    taskId,
    newStatus,
    userId = CURRENT_USER_ID
  ) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) return;

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
      userId,
      action: "TASK_STATUS_UPDATED",
      details: `Changed "${task.title}" to ${newStatus}`,
    });
  };

  // --------------------------------
  // TASK PROGRESS
  // --------------------------------

  const updateTaskProgress = (
    taskId,
    progress,
    userId = CURRENT_USER_ID
  ) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) return;

    const safeProgress = Math.max(
      0,
      Math.min(100, Number(progress))
    );

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
      userId,
      action: "TASK_PROGRESS_UPDATED",
      details: `Updated "${task.title}" to ${safeProgress}%`,
    });
  };

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
      assignTask,

      requestClaim,
      approveClaim,

      updateTaskStatus,
      updateTaskProgress,
    }),
    [projects, tasks, claimRequests, activities]
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