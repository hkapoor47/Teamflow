import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

const API_BASE_URL = "http://65.0.11.153:5001/api";

const normalizeStatus = (value) =>
  String(value || "OPEN").trim().toUpperCase();

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimingTicketId, setClaimingTicketId] = useState(null);
  const [completingTicketId, setCompletingTicketId] = useState(null);

  const loadTickets = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication required. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid ticket API response.");
      }

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to fetch tickets (${response.status})`
        );
      }

      const apiTickets =
        data.tickets ||
        data.data ||
        (Array.isArray(data) ? data : []);

      setTickets(Array.isArray(apiTickets) ? apiTickets : []);
    } catch (err) {
      console.error("Load tickets error:", err);
      setError(err.message || "Failed to load tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const getId = (ticket) =>
    ticket?.id ?? ticket?.ticket_id ?? ticket?.ticketId;

  const getClaimedBy = (ticket) =>
    ticket?.claimed_by ?? ticket?.claimedBy ?? null;

  const getClaimedName = (ticket) =>
    ticket?.claimed_by_name ??
    ticket?.claimedByName ??
    ticket?.claimer_name ??
    null;

  const claimTicket = async (ticketId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    try {
      setClaimingTicketId(ticketId);
      setError("");

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
      } catch {}

      if (!response.ok) {
        throw new Error(data.message || "Failed to claim ticket.");
      }

      await loadTickets();
    } catch (err) {
      console.error("Claim ticket error:", err);
      setError(err.message || "Failed to claim ticket.");
    } finally {
      setClaimingTicketId(null);
    }
  };

  const completeTicket = async (ticketId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    try {
      setCompletingTicketId(ticketId);
      setError("");

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
      } catch {}

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete ticket.");
      }

      await loadTickets();
    } catch (err) {
      console.error("Complete ticket error:", err);
      setError(err.message || "Failed to complete ticket.");
    } finally {
      setCompletingTicketId(null);
    }
  };

  const openCount = tickets.filter((ticket) =>
    ["OPEN", "PENDING"].includes(normalizeStatus(ticket.status))
  ).length;

  const inProgressCount = tickets.filter((ticket) =>
    ["CLAIMED", "IN PROGRESS", "IN_PROGRESS"].includes(
      normalizeStatus(ticket.status)
    )
  ).length;

  const completedCount = tickets.filter((ticket) =>
    ["COMPLETED", "COMPLETE", "DONE", "CLOSED", "RESOLVED"].includes(
      normalizeStatus(ticket.status)
    )
  ).length;

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page">
        <section className="teamflow-heading">
          <p className="welcome-label">PROJECT ISSUES</p>
          <h2>All tickets.</h2>
          <p className="welcome-description">
            Every ticket created across the workspace is visible here.
          </p>
        </section>

        <section className="ticket-summary">
          <div className="ticket-summary-card">
            <span>All Tickets</span>
            <strong>{tickets.length}</strong>
          </div>
          <div className="ticket-summary-card">
            <span>Open</span>
            <strong>{openCount}</strong>
          </div>
          <div className="ticket-summary-card">
            <span>In Progress</span>
            <strong>{inProgressCount}</strong>
          </div>
          <div className="ticket-summary-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </section>

        {error && <div className="claim-notice">{error}</div>}

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="welcome-label">TICKETS</p>
              <h3>All Project Issues</h3>
              <p>Claim an unassigned ticket or complete one you own.</p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <strong>Loading tickets...</strong>
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <span>✦</span>
              <strong>No tickets yet</strong>
              <p>Tickets created from QA failures will appear here.</p>
            </div>
          ) : (
            <div className="ticket-list">
              {tickets.map((ticket) => {
                const id = getId(ticket);
                const claimedBy = getClaimedBy(ticket);
                const status = normalizeStatus(ticket.status);
                const isCompleted = [
                  "COMPLETED",
                  "COMPLETE",
                  "DONE",
                  "CLOSED",
                  "RESOLVED",
                ].includes(status);

                return (
                  <div className="ticket-card" key={id}>
                    <div className="ticket-information">
                      <div className="ticket-top-row">
                        <span className="ticket-id">#{id}</span>
                        <span
                          className={`ticket-status ticket-status-${status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {status}
                        </span>
                      </div>

                      <h3>{ticket.title || `Ticket #${id}`}</h3>

                      <p>
                        {ticket.description || "No description provided."}
                      </p>

                      <div className="ticket-details">
                        <span>
                          Project:{" "}
                          {ticket.project_name ||
                            ticket.projectName ||
                            ticket.project_title ||
                            "—"}
                        </span>
                        <span>
                          Priority: {ticket.priority || "Medium"}
                        </span>
                        <span>
                          Deadline:{" "}
                          {ticket.due_date || ticket.deadline
                            ? new Date(
                                ticket.due_date || ticket.deadline
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                        <span>
                          Claimed:{" "}
                          {claimedBy
                            ? getClaimedName(ticket) || "Assigned"
                            : "Unclaimed"}
                        </span>
                      </div>
                    </div>

                    <div className="ticket-actions">
                      {!claimedBy && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => claimTicket(id)}
                          disabled={claimingTicketId === id}
                        >
                          {claimingTicketId === id
                            ? "Claiming..."
                            : "Claim Ticket"}
                        </button>
                      )}

                      {claimedBy && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => completeTicket(id)}
                          disabled={completingTicketId === id}
                        >
                          {completingTicketId === id
                            ? "Completing..."
                            : "Complete"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Tickets;
