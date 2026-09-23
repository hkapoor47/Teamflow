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

  const [projectFilter, setProjectFilter] =
    useState("all");

  const [notice, setNotice] = useState("");

  const [showCreateTask, setShowCreateTask] =
    useState(false);

  const [creatingTask, setCreatingTask] =
    useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    projectId: projects[0]?.id || "",
    assigneeId: "",
    dueDate: "",
  });

  /* ==================================================
     FILTER TASKS
  ================================================== */

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          projectFilter === "all" ||
          Number(task.projectId) ===
            Number(projectFilter)
      ),
    [tasks, projectFilter]
  );

  /* ==================================================
     FIND PROJECT
  ================================================== */

  const getProject = (id) =>
    projects.find(
      (project) =>
        Number(project.id) === Number(id)
    );

  /* ==================================================
     FIND MEMBER
  ================================================== */

  const getMember = (id) =>
    members.find(
      (member) =>
        Number(member.id) === Number(id)
    );

  /* ==================================================
     CLAIM TASK
  ================================================== */

  const claim = async (taskId) => {
    try {
      await requestClaim(taskId);

      setNotice(
        "Task claimed successfully."
      );

      setTimeout(() => {
        setNotice("");
      }, 2500);
    } catch (error) {
      setNotice(
        error.message ||
          "Failed to claim task."
      );

      setTimeout(() => {
        setNotice("");
      }, 3000);
    }
  };

  /* ==================================================
     CREATE TASK
  ================================================== */

  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!newTask.title.trim()) {
      setNotice(
        "Please enter a task title."
      );
      return;
    }

    if (!newTask.projectId) {
      setNotice(
        "Please select a project."
      );
      return;
    }

    try {
      setCreatingTask(true);

      await createTask({
        projectId: newTask.projectId,
        title: newTask.title,
        assigneeId:
          newTask.assigneeId || null,
        dueDate:
          newTask.dueDate || null,
      });

      setNewTask({
        title: "",
        projectId:
          projects[0]?.id || "",
        assigneeId: "",
        dueDate: "",
      });

      setShowCreateTask(false);

      setNotice(
        "Task created successfully."
      );

      setTimeout(() => {
        setNotice("");
      }, 3000);
    } catch (error) {
      setNotice(
        error.message ||
          "Failed to create task."
      );

      setTimeout(() => {
        setNotice("");
      }, 3000);
    } finally {
      setCreatingTask(false);
    }
  };

  /* ==================================================
     PROGRESS CHANGE
  ================================================== */

  const handleProgressChange = (
    taskId,
    progress
  ) => {
    updateTaskProgress(
      taskId,
      Number(progress)
    );
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page tasks-page">

        {/* PAGE HEADING */}

        <section className="teamflow-heading">
          <p className="welcome-label">
            TASK WORKSPACE
          </p>

          <h2>
            All work, one clear queue.
          </h2>

          <p className="welcome-description">
            View assigned work or claim an open
            task that matches your skills.
          </p>
        </section>

        {/* FILTERS */}

        <div className="task-filters panel">
          <label>
            Project

            <select
              value={projectFilter}
              onChange={(event) =>
                setProjectFilter(
                  event.target.value
                )
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
            onClick={() =>
              setShowCreateTask(true)
            }
          >
            + Create task
          </button>
        </div>

        {/* NOTICE */}

        {notice && (
          <div className="claim-notice">
            {notice}
          </div>
        )}

        {/* CREATE TASK MODAL */}

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
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setShowCreateTask(false)
                  }
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleCreateTask}
              >
                <div className="project-form-grid">

                  {/* TASK NAME */}

                  <div className="form-group">
                    <label>
                      Task name
                    </label>

                    <input
                      required
                      value={newTask.title}
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          title:
                            event.target.value,
                        })
                      }
                      placeholder="e.g. Build login page"
                    />
                  </div>

                  {/* PROJECT */}

                  <div className="form-group">
                    <label>
                      Project
                    </label>

                    <select
                      value={
                        newTask.projectId
                      }
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          projectId:
                            event.target.value,
                        })
                      }
                    >
                      {projects.map(
                        (project) => (
                          <option
                            key={project.id}
                            value={project.id}
                          >
                            {project.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* ASSIGN */}

                  <div className="form-group">
                    <label>
                      Assign to
                    </label>

                    <select
                      value={
                        newTask.assigneeId
                      }
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          assigneeId:
                            event.target.value,
                        })
                      }
                    >
                      <option value="">
                        Leave unassigned
                      </option>

                      {members.map(
                        (member) => (
                          <option
                            key={member.id}
                            value={member.id}
                          >
                            {member.name} —{" "}
                            {member.role}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* DEADLINE */}

                  <div className="form-group">
                    <label>
                      Deadline
                    </label>

                    <input
                      type="date"
                      value={
                        newTask.dueDate
                      }
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          dueDate:
                            event.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="cancel-project-button"
                    onClick={() =>
                      setShowCreateTask(false)
                    }
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

        {/* TASK BOARD */}

        <section className="panel task-board">

          <div className="panel-header">
            <div>
              <h3>
                Task board
              </h3>

              <p>
                {visibleTasks.length} tasks
                match your filters.
              </p>
            </div>
          </div>

          <div className="task-table-wrap">

            <table className="task-table">

              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>ASSIGNED TO</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th />
                </tr>
              </thead>

              <tbody>

                {visibleTasks.map(
                  (task) => {
                    const member =
                      getMember(
                        task.assigneeId
                      );

                    return (
                      <tr key={task.id}>

                        {/* TASK */}

                        <td>
                          <strong>
                            {task.title}
                          </strong>

                          <small>
                            Due{" "}
                            {task.dueDate
                              ? new Date(
                                  task.dueDate
                                ).toLocaleDateString()
                              : "Not set"}
                          </small>
                        </td>

                        {/* PROJECT */}

                        <td>
                          {getProject(
                            task.projectId
                          )?.name ||
                            task.projectName ||
                            "Unknown project"}
                        </td>

                        {/* ASSIGNED TO */}

                        <td>

                          {member ? (
                            <span className="assignee">
                              <i>
                                {member.name
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </i>

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
                            <span className="unassigned">
                              Unassigned
                            </span>
                          )}

                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`task-status ${String(
                              task.status || "TODO"
                            )
                              .toLowerCase()
                              .replaceAll(
                                " ",
                                "-"
                              )}`}
                          >
                            {task.status ||
                              "TODO"}
                          </span>
                        </td>

                        {/* PROGRESS */}

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

                        {/* ACTION */}

                        <td>

                          {task.claimedBy ? (
                            <span className="claimed-label">
                              Claimed
                              {task.claimedByName
                                ? ` by ${task.claimedByName}`
                                : ""}
                            </span>
                          ) : (
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
                  }
                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>
    </DashboardLayout>
  );
}

export default Tasks;