/**
 * DeskFlow - Support Ticket System
 * Main Kanban Board Page
 *
 * Author: Tanushree Pal
 * Roll No: 0827AL231132
 * Email: tanushreepal230408@acropolis.in
 * DOB: 06/10/2005
 */

"use client";

import { useState, useEffect, useCallback } from "react";

const COLUMNS = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

const FORWARD_TRANSITIONS = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: "closed",
};

const BACKWARD_TRANSITIONS = {
  in_progress: "open",
  resolved: "in_progress",
  closed: "resolved",
};

function formatAge(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export default function Home() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState("");
  const [filterBreached, setFilterBreached] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    customer_email: "",
    priority: "medium",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterPriority) params.set("priority", filterPriority);
      if (filterBreached) params.set("breached", "true");
      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  }, [filterPriority, filterBreached]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTickets(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchTickets, fetchStats]);

  const handleTransition = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? updated : t))
        );
        fetchStats();
        showToast(`Ticket moved to ${newStatus.replace("_", " ")}`);
      } else {
        const err = await res.json();
        showToast(err.error || "Transition failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const handleDelete = async (ticketId) => {
    if (!confirm("Delete this ticket permanently?")) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
        fetchStats();
        showToast("Ticket deleted");
      } else {
        showToast("Delete failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.subject.trim()) errors.subject = "Subject is required";
    if (!formData.description.trim())
      errors.description = "Description is required";
    if (!formData.customer_email.trim()) {
      errors.customer_email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      errors.customer_email = "Invalid email format";
    }
    if (!PRIORITIES.includes(formData.priority))
      errors.priority = "Select a valid priority";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newTicket = await res.json();
        setTickets((prev) => [newTicket, ...prev]);
        fetchStats();
        setShowModal(false);
        setFormData({
          subject: "",
          description: "",
          customer_email: "",
          priority: "medium",
        });
        setFormErrors({});
        showToast("Ticket created successfully");
      } else {
        const err = await res.json();
        if (err.details) {
          const fieldErrors = {};
          err.details.forEach((d) => {
            if (d.includes("subject")) fieldErrors.subject = d;
            else if (d.includes("description")) fieldErrors.description = d;
            else if (d.includes("email")) fieldErrors.customer_email = d;
            else if (d.includes("priority")) fieldErrors.priority = d;
          });
          setFormErrors(fieldErrors);
        }
        showToast(err.error || "Creation failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <h1>DeskFlow</h1>
          <div className="dot" />
        </div>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          Support Ticket System
        </span>
      </header>

      {/* Stats Strip */}
      {stats && (
        <div className="stats-strip">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.byStatus?.open || 0}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {stats.byStatus?.in_progress || 0}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.byStatus?.resolved || 0}</div>
            <div className="stat-label">Resolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.byStatus?.closed || 0}</div>
            <div className="stat-label">Closed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.byPriority?.urgent || 0}</div>
            <div className="stat-label">Urgent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.byPriority?.high || 0}</div>
            <div className="stat-label">High</div>
          </div>
          <div className="stat-card breach">
            <div className="stat-value">{stats.slaBreachedOpen || 0}</div>
            <div className="stat-label">SLA Breached</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <button
          className={filterBreached ? "active" : ""}
          onClick={() => setFilterBreached(!filterBreached)}
        >
          🚩 SLA Breached Only
        </button>
        <button className="btn-create" onClick={() => setShowModal(true)}>
          + New Ticket
        </button>
      </div>

      {/* Kanban Board */}
      <div className="board">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.key);
          return (
            <div className="column" key={col.key}>
              <div className="column-header">
                <h2>{col.label}</h2>
                <span className="count">{colTickets.length}</span>
              </div>
              <div className="column-body">
                {colTickets.length === 0 ? (
                  <div className="empty-col">No tickets</div>
                ) : (
                  colTickets.map((ticket) => (
                    <div
                      className={`ticket-card${ticket.slaBreached ? " sla-breached" : ""}`}
                      key={ticket.id}
                    >
                      <div className="ticket-subject">{ticket.subject}</div>
                      <div className="ticket-email">
                        {ticket.customer_email}
                      </div>
                      <div className="ticket-meta">
                        <span
                          className={`badge badge-${ticket.priority}`}
                        >
                          {ticket.priority}
                        </span>
                        <span className="age-text">
                          {formatAge(ticket.ageMinutes)}
                        </span>
                        {ticket.slaBreached && (
                          <span className="sla-flag">SLA Breached</span>
                        )}
                      </div>
                      <div className="ticket-actions">
                        {FORWARD_TRANSITIONS[ticket.status] && (
                          <button
                            onClick={() =>
                              handleTransition(
                                ticket.id,
                                FORWARD_TRANSITIONS[ticket.status]
                              )
                            }
                          >
                            → {FORWARD_TRANSITIONS[ticket.status].replace("_", " ")}
                          </button>
                        )}
                        {BACKWARD_TRANSITIONS[ticket.status] && (
                          <button
                            onClick={() =>
                              handleTransition(
                                ticket.id,
                                BACKWARD_TRANSITIONS[ticket.status]
                              )
                            }
                          >
                            ← {BACKWARD_TRANSITIONS[ticket.status].replace("_", " ")}
                          </button>
                        )}
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(ticket.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="candidate-badge">
          <span>Tanushree Pal</span>
          <span className="sep">|</span>
          <span>0827AL231132</span>
          <span className="sep">|</span>
          <span>tanushreepal230408@acropolis.in</span>
        </div>
      </footer>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Ticket</h2>
            <form onSubmit={handleCreate}>
              <div className={`form-group${formErrors.subject ? " has-error" : ""}`}>
                <label htmlFor="subject">Subject</label>
                <input
                  id="subject"
                  type="text"
                  placeholder="Brief issue summary"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
                {formErrors.subject && (
                  <div className="field-error">{formErrors.subject}</div>
                )}
              </div>
              <div className={`form-group${formErrors.description ? " has-error" : ""}`}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Detailed description of the issue"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                {formErrors.description && (
                  <div className="field-error">{formErrors.description}</div>
                )}
              </div>
              <div className={`form-group${formErrors.customer_email ? " has-error" : ""}`}>
                <label htmlFor="customer_email">Customer Email</label>
                <input
                  id="customer_email"
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_email: e.target.value,
                    })
                  }
                />
                {formErrors.customer_email && (
                  <div className="field-error">{formErrors.customer_email}</div>
                )}
              </div>
              <div className={`form-group${formErrors.priority ? " has-error" : ""}`}>
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
                {formErrors.priority && (
                  <div className="field-error">{formErrors.priority}</div>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setFormErrors({});
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
