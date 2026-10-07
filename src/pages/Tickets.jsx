import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import {
  apiGet,
  API_BASE_URL,
  getCurrentUserId,
  getToken,
  getArray,
  normalizeStatus,
  formatDate,
} from "./workspaceApi.js";

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState("claimed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  const userId = getCurrentUserId();

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/tickets");
      setTickets(getArray(data, ["tickets", "data"]));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const mine = useMemo(() => {
    return tickets.filter((ticket) => {
      const createdBy = ticket.created_by ?? ticket.createdBy;
      const claimedBy = ticket.claimed_by ?? ticket.claimedBy;

      if (tab === "created") {
        return createdBy != null && String(createdBy) === String(userId);
      }

      if (tab === "claimed") {
        return claimedBy != null && String(claimedBy) === String(userId);
      }

      return (
        (createdBy != null && String(createdBy) === String(userId)) ||
        (claimedBy != null && String(claimedBy) === String(userId))
      );
    });
  }, [tickets, tab, userId]);

  const claimTicket = async (id) => {
    try {
      setActionId(id);
      const response = await fetch(`${API_BASE_URL}/tickets/${id}/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to claim ticket.");
      await loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const completeTicket = async (id) => {
    try {
      setActionId(id);
      const response = await fetch(`${API_BASE_URL}/tickets/${id}/complete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to complete ticket.");
      await loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="teamflow-page workspace-page">
        <section className="teamflow-heading">
          <p className="welcome-label">MY WORK</p>
          <h2>My tickets.</h2>
          <p className="welcome-description">
            Tickets you created, claimed or are currently responsible for.
          </p>
        </section>

        <div className="workspace-tabs">
          <button className={tab === "claimed" ? "active" : ""} onClick={() => setTab("claimed")}>Claimed by Me</button>
          <button className={tab === "created" ? "active" : ""} onClick={() => setTab("created")}>Created by Me</button>
          <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>All My Tickets</button>
        </div>

        {error && <div className="workspace-alert">{error}</div>}

        <section className="workspace-panel">
          <div className="workspace-panel-head">
            <div>
              <p className="welcome-label">TICKETS</p>
              <h3>{tab === "claimed" ? "Claimed by me" : tab === "created" ? "Created by me" : "All my tickets"}</h3>
            </div>
            <span className="workspace-count">{mine.length}</span>
          </div>

          {loading ? (
            <div className="workspace-empty">Loading tickets...</div>
          ) : mine.length === 0 ? (
            <div className="workspace-empty">
              <strong>No tickets here yet</strong>
              <p>Tickets matching this view will appear here.</p>
            </div>
          ) : (
            <div className="workspace-list">
              {mine.map((ticket) => {
                const id = ticket.id ?? ticket.ticket_id;
                const claimedBy = ticket.claimed_by ?? ticket.claimedBy;
                const mineClaim = claimedBy != null && String(claimedBy) === String(userId);
                const status = normalizeStatus(ticket.status) || "OPEN";

                return (
                  <article className="workspace-ticket" key={id}>
                    <div>
                      <div className="workspace-ticket-top">
                        <span>#{id}</span>
                        <b>{status}</b>
                      </div>
                      <h3>{ticket.title || `Ticket #${id}`}</h3>
                      <p>{ticket.description || "No description provided."}</p>
                      <div className="workspace-meta">
                        <span>Project: {ticket.project_name || ticket.projectName || "—"}</span>
                        <span>Priority: {ticket.priority || "Medium"}</span>
                        <span>Deadline: {formatDate(ticket.due_date || ticket.deadline)}</span>
                        <span>Claimed: {mineClaim ? "You" : "Another member"}</span>
                      </div>
                    </div>

                    <div className="workspace-actions">
                      {!claimedBy && (
                        <button onClick={() => claimTicket(id)} disabled={actionId === id}>
                          {actionId === id ? "Claiming..." : "Claim Ticket"}
                        </button>
                      )}
                      {mineClaim && !["COMPLETED", "DONE", "CLOSED", "RESOLVED"].includes(status) && (
                        <button onClick={() => completeTicket(id)} disabled={actionId === id}>
                          {actionId === id ? "Completing..." : "Complete"}
                        </button>
                      )}
                    </div>
                  </article>
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
