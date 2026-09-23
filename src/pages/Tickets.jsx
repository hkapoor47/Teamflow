import { useEffect, useState } from "react";
import { useProjects } from "../context/ProjectContext.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

function Tickets() {
  const { requestClaim, refreshTasks } = useProjects();

  const [tickets, setTickets] = useState([]);
  const [claimingTicketId, setClaimingTicketId] = useState(null);

  useEffect(() => {
    const savedTickets = JSON.parse(
      localStorage.getItem("teamflow_tickets") || "[]"
    );

    setTickets(savedTickets);
  }, []);

  const updateTickets = (updatedTickets) => {
    setTickets(updatedTickets);

    localStorage.setItem(
      "teamflow_tickets",
      JSON.stringify(updatedTickets)
    );
  };

  // ============================
  // CLAIM TICKET
  // ============================

  const claimTicket = async (ticketId) => {
    const ticket = tickets.find(
      (item) => item.id === ticketId
    );

    const taskId = ticket?.taskId || ticket?.backendTaskId;

    if (!taskId) {
      alert(
        "This ticket is not linked to a backend task."
      );
      return;
    }

    try {
      setClaimingTicketId(ticketId);

      await requestClaim(taskId);

      const updatedTickets = tickets.map((item) =>
        item.id === ticketId
          ? {
              ...item,
              status: "Claimed",
              assignedTo: "You",
            }
          : item
      );

      updateTickets(updatedTickets);
      await refreshTasks();
    } catch (error) {
      console.error("Claim ticket error:", error);
      alert(error.message || "Failed to claim ticket.");
    } finally {
      setClaimingTicketId(null);
    }
  };

  // ============================
  // START WORK
  // ============================

  const startWork = (ticketId) => {
    const updatedTickets = tickets.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status: "In Progress",
          }
        : ticket
    );

    updateTickets(updatedTickets);
  };

  // ============================
  // MARK AS FIXED
  // ============================

  const markFixed = (ticketId) => {
    const updatedTickets = tickets.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status: "QA Retest",
          }
        : ticket
    );

    updateTickets(updatedTickets);
  };

  // ============================
  // QA RETEST
  // ============================

  const qaRetest = (ticketId, passed) => {
    const updatedTickets = tickets.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status: passed ? "Closed" : "Reopened",
            qaStatus: passed ? "Passed" : "Failed",
          }
        : ticket
    );

    updateTickets(updatedTickets);
  };

  return (
    <DashboardLayout>

      <div className="teamflow-page">

        {/* =================================
            HEADER
        ================================= */}

        <section className="teamflow-heading">

          <p className="welcome-label">
            PROJECT ISSUES
          </p>

          <h2>
            Tickets and blockers.
          </h2>

          <p className="welcome-description">
            Manage issues discovered during QA testing
            and track them until they are resolved.
          </p>

        </section>


        {/* =================================
            SUMMARY
        ================================= */}

        <section className="ticket-summary">

          <div className="ticket-summary-card">
            <span>All Tickets</span>
            <strong>{tickets.length}</strong>
          </div>

          <div className="ticket-summary-card">
            <span>Open</span>

            <strong>
              {
                tickets.filter(
                  (ticket) => ticket.status === "Open"
                ).length
              }
            </strong>
          </div>

          <div className="ticket-summary-card">
            <span>In Progress</span>

            <strong>
              {
                tickets.filter(
                  (ticket) =>
                    ticket.status === "In Progress"
                ).length
              }
            </strong>
          </div>

          <div className="ticket-summary-card">
            <span>QA Retest</span>

            <strong>
              {
                tickets.filter(
                  (ticket) =>
                    ticket.status === "QA Retest"
                ).length
              }
            </strong>
          </div>

        </section>


        {/* =================================
            TICKETS
        ================================= */}

        <section className="panel">

          <div className="panel-heading">

            <div>

              <p className="welcome-label">
                TICKETS
              </p>

              <h3>
                Project Issues
              </h3>

              <p>
                Issues reported during project QA.
              </p>

            </div>

          </div>


          {tickets.length === 0 ? (

            <div className="empty-state">

              <span>✦</span>

              <strong>
                No tickets yet
              </strong>

              <p>
                Tickets will appear here when QA
                finds an issue in a completed project.
              </p>

            </div>

          ) : (

            <div className="ticket-list">

              {tickets.map((ticket) => (

                <div
                  className="ticket-card"
                  key={ticket.id}
                >

                  {/* ============================
                      TICKET INFORMATION
                  ============================ */}

                  <div className="ticket-information">

                    <div className="ticket-top-row">

                      <span className="ticket-id">
                        {ticket.id}
                      </span>

                      <span
                        className={`ticket-status ticket-status-${ticket.status
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {ticket.status}
                      </span>

                    </div>


                    <h3>
                      {ticket.title}
                    </h3>


                    <p>
                      {ticket.description}
                    </p>


                    <div className="ticket-details">

                      <span>
                        Project:
                        {" "}
                        {ticket.projectName}
                      </span>

                      <span>
                        Priority:
                        {" "}
                        {ticket.priority}
                      </span>

                      <span>
                        Deadline:
                        {" "}
                        {ticket.deadline}
                      </span>

                      <span>
                        Assigned:
                        {" "}
                        {ticket.assignedTo || "Nobody"}
                      </span>

                    </div>

                  </div>


                  {/* ============================
                      ACTIONS
                  ============================ */}

                  <div className="ticket-actions">

                    {/* OPEN */}

                    {ticket.status === "Open" && (

                      <button
                        className="ticket-action-primary"
                        onClick={() =>
                          claimTicket(ticket.id)
                        }
                        disabled={
                          claimingTicketId === ticket.id
                        }
                      >
                        {claimingTicketId === ticket.id
                          ? "Claiming..."
                          : "Claim Ticket"}
                      </button>

                    )}


                    {/* CLAIMED */}

                    {ticket.status === "Claimed" &&
                      ticket.assignedTo === "You" && (

                        <button
                          className="ticket-action-primary"
                          onClick={() =>
                            startWork(ticket.id)
                          }
                        >
                          Start Work
                        </button>

                    )}


                    {/* IN PROGRESS */}

                    {ticket.status === "In Progress" &&
                      ticket.assignedTo === "You" && (

                        <button
                          className="ticket-action-primary"
                          onClick={() =>
                            markFixed(ticket.id)
                          }
                        >
                          Mark as Fixed
                        </button>

                    )}


                    {/* QA RETEST */}

                    {ticket.status === "QA Retest" && (

                      <div className="retest-actions">

                        <button
                          className="ticket-action-primary"
                          onClick={() =>
                            qaRetest(ticket.id, true)
                          }
                        >
                          ✓ QA Passed
                        </button>

                        <button
                          className="ticket-action-danger"
                          onClick={() =>
                            qaRetest(ticket.id, false)
                          }
                        >
                          ✕ QA Failed
                        </button>

                      </div>

                    )}


                    {/* CLOSED */}

                    {ticket.status === "Closed" && (

                      <span className="ticket-closed">
                        ✓ Resolved
                      </span>

                    )}


                    {/* REOPENED */}

                    {ticket.status === "Reopened" && (

                      <button
                        className="ticket-action-primary"
                        onClick={() =>
                          startWork(ticket.id)
                        }
                      >
                        Fix Again
                      </button>

                    )}

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>

    </DashboardLayout>
  );
}

export default Tickets;