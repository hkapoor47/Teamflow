import { useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

function Tasks() {
  const {
    projects,
    tasks,
    members,
    createTask,
    updateTaskProgress,
    requestClaim,
  } = useProjects();

  const [projectFilter, setProjectFilter] = useState("all");
  const [notice, setNotice] = useState("");

  const [showCreateTask, setShowCreateTask] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    projectId: projects[0]?.id || "",
    assigneeId: "",
    dueDate: "",
  });

  // --------------------------------------------------
  // FILTER TASKS
  // --------------------------------------------------

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          projectFilter === "all" ||
            task.projectId === projectFilter
      ),
    [tasks, projectFilter]
  );

  // --------------------------------------------------
  // FIND PROJECT
  // --------------------------------------------------

  const getProject = (id) =>
    projects.find((project) => project.id === id);

  // --------------------------------------------------
  // FIND MEMBER
  // --------------------------------------------------

  const getMember = (id) =>
    members.find((member) => member.id === id);

  // --------------------------------------------------
  // CLAIM TASK
  // --------------------------------------------------

  const claim = (taskId) => {
    requestClaim(taskId, "rahul");

    setNotice("Task claimed successfully.");

    setTimeout(() => {
      setNotice("");
    }, 2500);
  };

  // --------------------------------------------------
  // CREATE TASK
  // --------------------------------------------------

  const handleCreateTask = (event) => {
    event.preventDefault();

    if (!newTask.title.trim()) {
      setNotice("Please enter a task title.");
      return;
    }

    if (!newTask.projectId) {
      setNotice("Please select a project.");
      return;
    }

    createTask({
      projectId: newTask.projectId,
      title: newTask.title,
      assigneeId: newTask.assigneeId || null,
      dueDate: newTask.dueDate || "Not set",
    });

    setNewTask({
      title: "",
      projectId: projects[0]?.id || "",
      assigneeId: "",
      dueDate: "",
    });

    setShowCreateTask(false);

    setNotice("Task created successfully.");

    setTimeout(() => {
      setNotice("");
    }, 3000);
  };

  // --------------------------------------------------
  // PROGRESS CHANGE
  // --------------------------------------------------

  const handleProgressChange = (taskId, progress) => {
    updateTaskProgress(taskId, Number(progress), "rahul");
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page tasks-page">

        {/* --------------------------------------------- */}
        {/* PAGE HEADING */}
        {/* --------------------------------------------- */}

        <section className="teamflow-heading">
          <p className="welcome-label">
            TASK WORKSPACE
          </p>

          <h2>
            All work, one clear queue.
          </h2>

          <p className="welcome-description">
            View assigned work or claim an open task that
            matches your skills.
          </p>
        </section>

        {/* --------------------------------------------- */}
        {/* FILTERS + CREATE TASK */}
        {/* --------------------------------------------- */}

        <div className="task-filters panel">

          <label>
            Project

            <select
              value={projectFilter}
              onChange={(event) =>
                setProjectFilter(event.target.value)
              }
            >
              <option value="all">
                All projects
              </option>

              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
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

        {/* --------------------------------------------- */}
        {/* NOTICE */}
        {/* --------------------------------------------- */}

        {notice && (
          <div className="claim-notice">
            {notice}
          </div>
        )}

        {/* --------------------------------------------- */}
        {/* CREATE TASK MODAL */}
        {/* --------------------------------------------- */}

        {showCreateTask && (
          <div className="modal-overlay">

            <div className="modal-card">

              <div className="modal-header">

                <div>
                  <p className="welcome-label">
                    NEW TASK
                  </p>

                  <h3>
                    Create a task
                  </h3>
                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setShowCreateTask(false)
                  }
                >
                  ×
                </button>

              </div>

              <form onSubmit={handleCreateTask}>

                {/* TASK TITLE */}

                <label>
                  Task title

                  <input
                    type="text"
                    placeholder="e.g. Build login page"
                    value={newTask.title}
                    onChange={(event) =>
                      setNewTask({
                        ...newTask,
                        title: event.target.value,
                      })
                    }
                  />
                </label>

                {/* PROJECT */}

                <label>
                  Project

                  <select
                    value={newTask.projectId}
                    onChange={(event) =>
                      setNewTask({
                        ...newTask,
                        projectId: event.target.value,
                      })
                    }
                  >
                    {projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* ASSIGN TASK */}

                <label>
                  Assign to

                  <select
                    value={newTask.assigneeId}
                    onChange={(event) =>
                      setNewTask({
                        ...newTask,
                        assigneeId: event.target.value,
                      })
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
                        {member.name} — {member.role}
                      </option>
                    ))}
                  </select>
                </label>

                {/* DUE DATE */}

                <label>
                  Due date

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
                </label>

                {/* MODAL BUTTONS */}

                <div className="modal-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowCreateTask(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Create task
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* --------------------------------------------- */}
        {/* TASK BOARD */}
        {/* --------------------------------------------- */}

        <section className="panel task-board">

          <div className="panel-header">

            <div>

              <h3>
                Task board
              </h3>

              <p>
                {visibleTasks.length} tasks match your
                filters.
              </p>

            </div>

          </div>

          <div className="task-table-wrap">

            <table className="task-table">

              <thead>

                <tr>
                  <th>
                    Task
                  </th>

                  <th>
                    Project
                  </th>

                  <th>
                     ASSIGNED TO
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Progress
                  </th>

                  <th />
                </tr>

              </thead>

              <tbody>

                {visibleTasks.map((task) => {

                  const member = getMember(
                    task.assigneeId
                  );

                  return (
                    <tr key={task.id}>

                      {/* -------------------------------- */}
                      {/* TASK */}
                      {/* -------------------------------- */}

                      <td>

                        <strong>
                          {task.title}
                        </strong>

                        <small>
                          Due {task.dueDate}
                        </small>

                      </td>

                      {/* -------------------------------- */}
                      {/* PROJECT */}
                      {/* -------------------------------- */}

                      <td>
                        {getProject(task.projectId)?.name}
                      </td>

                      {/* -------------------------------- */}
                      {/* ASSIGNED TO */}
                      {/* -------------------------------- */}

                      <td>

                        {member ? (

                          <span className="assignee">

                            <i>
                              {member.name.charAt(0)}
                            </i>

                            {member.name}

                          </span>

                        ) : (

                          <span className="unassigned">
                            Unassigned
                          </span>

                        )}

                      </td>

                      {/* -------------------------------- */}
                      {/* STATUS */}
                      {/* -------------------------------- */}

                      <td>

                        <span
                          className={`task-status ${task.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {task.status}
                        </span>

                      </td>

                      {/* -------------------------------- */}
                      {/* PROGRESS */}
                      {/* -------------------------------- */}

                      <td>

                        <div className="table-progress">

                          <div className="progress-background">

                            <div
                              className="progress-fill"
                              style={{
                                width: `${task.progress}%`,
                              }}
                            />

                          </div>

                          <span>
                            {task.progress}%
                          </span>

                        </div>
                      </td>

                      {/* -------------------------------- */}
                      {/* ACTION */}
                      {/* -------------------------------- */}

                      <td>

                        {!task.assigneeId && (

                          <button
                            className="claim-button"
                            onClick={() =>
                              claim(task.id)
                            }
                          >
                            Claim task
                          </button>

                        )}

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </section>

      </div>
    </DashboardLayout>
  );
}

export default Tasks;