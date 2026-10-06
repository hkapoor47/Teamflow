import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useProjects } from "../context/ProjectContext.jsx";

function Notifications() {
  const { claimRequests, tasks, members } = useProjects();

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const currentUserId =
    currentUser?.id ??
    currentUser?.userId ??
    currentUser?.user_id;

  const currentUserRole = String(
    currentUser?.role || ""
  ).toLowerCase();

  const isManager =
    currentUserRole === "manager" ||
    currentUserRole === "project_manager";

  /*
   * Deadline is considered "approaching" when it is
   * within the next 3 days.
   */
  const now = new Date();

  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(
    threeDaysFromNow.getDate() + 3
  );

  const deadlineNotifications = tasks
    .filter((task) => {
      const status = String(
        task.status ||
          task.task_status ||
          ""
      ).toUpperCase();

      // Don't notify for completed tasks
      if (
        ["COMPLETED", "COMPLETE", "DONE", "CLOSED"].includes(
          status
        )
      ) {
        return false;
      }

      const dueDate =
        task.due_date ??
        task.dueDate ??
        task.deadline ??
        null;

      if (!dueDate) return false;

      const deadline = new Date(dueDate);

      if (Number.isNaN(deadline.getTime())) {
        return false;
      }

      /*
       * Only future deadlines within 3 days.
       */
      if (
        deadline <= now ||
        deadline > threeDaysFromNow
      ) {
        return false;
      }

      const assignedTo =
        task.assigned_to ??
        task.assigneeId ??
        task.assignee_id;

      /*
       * USER:
       * Only see their own assigned tasks.
       *
       * MANAGER:
       * See tasks belonging to their projects.
       *
       * For now, the manager relationship is determined
       * from project manager information already present
       * on the task/project data.
       */
      if (!isManager) {
        return (
          Number(assignedTo) ===
          Number(currentUserId)
        );
      }

      return true;
    })
    .map((task) => {
      const dueDate =
        task.due_date ??
        task.dueDate ??
        task.deadline;

      const deadline = new Date(dueDate);

      const diffMs =
        deadline.getTime() - now.getTime();

      const diffHours =
        Math.ceil(diffMs / (1000 * 60 * 60));

      let message;

      if (diffHours <= 24) {
        message = "Deadline is approaching today.";
      } else {
        const days = Math.ceil(
          diffHours / 24
        );

        message = `Deadline in ${days} day${
          days === 1 ? "" : "s"
        }.`;
      }

      return {
        id: `deadline-${task.id}`,
        taskId: task.id,
        title:
          task.title ||
          task.name ||
          "Untitled task",
        message,
        dueDate: deadline,
      };
    });

  return (
    <DashboardLayout>
      <div className="teamflow-page">

        <section className="teamflow-heading">
          <p className="welcome-label">
            NOTIFICATIONS
          </p>

          <h2>
            {isManager
              ? "Manager updates."
              : "Your updates."}
          </h2>

          <p className="welcome-description">
            Deadlines and task updates that need
            your attention.
          </p>
        </section>

        {/* DEADLINE NOTIFICATIONS */}
        <section className="panel notification-list">

          {deadlineNotifications.length > 0 && (
            <>
              {deadlineNotifications.map(
                (notification) => (
                  <div
                    className="notification-item"
                    key={notification.id}
                  >
                    <span>⏰</span>

                    <div>
                      <strong>
                        Deadline approaching
                      </strong>

                      <p>
                        <b>
                          {notification.title}
                        </b>{" "}
                        — {notification.message}
                      </p>

                      <small>
                        Due:{" "}
                        {notification.dueDate.toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                )
              )}
            </>
          )}

          {/* CLAIM REQUESTS */}
          {claimRequests.length > 0 &&
            claimRequests.map((request) => {
              const task = tasks.find(
                (item) =>
                  Number(item.id) ===
                  Number(request.taskId)
              );

              const member = members.find(
                (item) =>
                  Number(item.id) ===
                  Number(request.memberId)
              );

              return (
                <div
                  className="notification-item"
                  key={`claim-${request.id}`}
                >
                  <span>✦</span>

                  <div>
                    <strong>
                      {member?.name || "A user"} requested a task
                    </strong>

                    <p>
                      They want to claim "
                      {task?.title || "this task"}
                      ". Status:{" "}
                      {request.status}.
                    </p>
                  </div>
                </div>
              );
            })}

          {/* EMPTY STATE */}
          {deadlineNotifications.length === 0 &&
            claimRequests.length === 0 && (
              <div className="empty-state">
                <span>✓</span>

                <strong>
                  No new notifications
                </strong>

                <p>
                  Deadline alerts and task claim
                  requests will appear here.
                </p>
              </div>
            )}

        </section>
      </div>
    </DashboardLayout>
  );
}

export default Notifications;