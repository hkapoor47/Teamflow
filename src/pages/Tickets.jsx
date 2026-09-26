import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

const API_BASE_URL = "http://65.0.11.153:5001/api";

const normalizeStatus = (value) => String(value || "OPEN").trim().toUpperCase();

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimingTicketId, setClaimingTicketId] = useState(null);
  const [completingTicketId, setCompletingTicketId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.userId ?? payload.id ?? payload.sub ?? null);
    } catch (err) {
      console.error("Failed to read current user:", err);
    }
  }, []);

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
      try { data = text ? JSON.parse(text) : {}; } catch { throw new Error("Invalid ticket API response."); }
      if (!response.ok) throw new Error(data.message || `Failed to fetch tickets (${response.status})`);
      const apiTickets = data.tickets || data.data || (Array.isArray(data) ? data : []);
      setTickets(Array.isArray(apiTickets) ? apiTickets : []);
    } catch (err) {
      console.error("Load tickets error:", err);
      setError(err.message || "Failed to load tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const getId = (ticket) => ticket?.id ?? ticket?.ticket_id ?? ticket?.ticketId;
  const getClaimedBy = (ticket) => ticket?.claimed_by ?? ticket?.claimedBy ?? null;
  const getClaimedName = (ticket) => ticket?.claimed_by_name ?? ticket?.claimedByName ?? null;

  const claimTicket = async (ticketId) => {
    const token = localStorage.getItem("token");
    if (!token) return setError("Authentication required. Please login again.");
    try {
      setClaimingTicketId(ticketId);
      setError("");
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!response.ok) throw new Error(data.message || "Failed to claim ticket.");
      await loadTickets();
    } catch (err) {
      console.error("Claim ticket error:", err);
      setError(err.message || "Failed to claim ticket.");
    } finally { setClaimingTicketId(null); }
  };

  const completeTicket = async (ticketId) => {
    const token = localStorage.getItem("token");
    if (!token) return setError("Authentication required. Please login again.");
    try {
      setCompletingTicketId(ticketId);
      setError("");
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!response.ok) throw new Error(data.message || "Failed to complete ticket.");
      await loadTickets();
    } catch (err) {
      console.error("Complete ticket error:", err);
      setError(err.message || "Failed to complete ticket.");
    } finally { setCompletingTicketId(null); }
  };

  const activeTickets = tickets.filter((ticket) => !["COMPLETED","COMPLETE","DONE","CLOSED","RESOLVED"].includes(normalizeStatus(ticket.status)));
  const openCount = activeTickets.filter((t) => ["OPEN","PENDING"].includes(normalizeStatus(t.status))).length;
  const claimedCount = activeTickets.filter((t) => ["CLAIMED","IN PROGRESS","IN_PROGRESS"].includes(normalizeStatus(t.status))).length;

  return (
    <DashboardLayout>
      <div className="teamflow-page">
        <section className="teamflow-heading">
          <p className="welcome-label">PROJECT ISSUES</p>
          <h2>Tickets and blockers.</h2>
          <p className="welcome-description">Manage issues discovered during QA testing and track them until they are resolved.</p>
        </section>

        <section className="ticket-summary">
          <div className="ticket-summary-card"><span>Active Tickets</span><strong>{activeTickets.length}</strong></div>
          <div className="ticket-summary-card"><span>Open</span><strong>{openCount}</strong></div>
          <div className="ticket-summary-card"><span>Claimed / In Progress</span><strong>{claimedCount}</strong></div>
        </section>

        {error && <div className="claim-notice">{error}</div>}

        <section className="panel">
          <div className="panel-heading">
            <div><p className="welcome-label">TICKETS</p><h3>Project Issues</h3><p>Issues reported during project QA.</p></div>
          </div>

          {loading ? <div className="empty-state"><strong>Loading tickets...</strong></div> : activeTickets.length === 0 ? (
            <div className="empty-state"><span>✦</span><strong>No active tickets</strong><p>Tickets created from QA failures will appear here.</p></div>
          ) : (
            <div className="ticket-list">
              {activeTickets.map((ticket) => {
                const id = getId(ticket);
                const claimedBy = getClaimedBy(ticket);
                const claimedByMe = claimedBy != null && String(claimedBy) === String(currentUserId);
                const status = normalizeStatus(ticket.status);
                return (
                  <div className="ticket-card" key={id}>
                    <div className="ticket-information">
                      <div className="ticket-top-row">
                        <span className="ticket-id">#{id}</span>
                        <span className={`ticket-status ticket-status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>
                      </div>
                      <h3>{ticket.title || `Ticket #${id}`}</h3>
                      <p>{ticket.description || "No description provided."}</p>
                      <div className="ticket-details">
                        <span>Project: {ticket.project_name || ticket.projectName || "—"}</span>
                        <span>Priority: {ticket.priority || "Medium"}</span>
                        <span>Deadline: {ticket.due_date || ticket.deadline || "Not set"}</span>
                        <span>Assigned: {getClaimedName(ticket) || (claimedBy ? `User ${claimedBy}` : "Nobody")}</span>
                      </div>
                    </div>
                    <div className="ticket-actions">
                      {!claimedBy ? (
                        <button className="ticket-action-primary" onClick={() => claimTicket(id)} disabled={claimingTicketId === id}>
                          {claimingTicketId === id ? "Claiming..." : "Claim Ticket"}
                        </button>
                      ) : claimedByMe ? (
                        <button className="ticket-action-primary" onClick={() => completeTicket(id)} disabled={completingTicketId === id}>
                          {completingTicketId === id ? "Completing..." : "Complete"}
                        </button>
                      ) : <span className="ticket-closed">Claimed by {getClaimedName(ticket) || `User ${claimedBy}`}</span>}
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
