import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  FileText,
  Headphones,
  Inbox,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  Plus,
  Search,
  Settings2,
  Sparkles,
  TicketCheck,
  X,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
const api = axios.create({ baseURL: `${API_URL}/` });
const TODAY_LABEL = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date()).toUpperCase();

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function App() {
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDashboard() {
      setLoading(true);
      setApiError("");
      try {
        const params = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (debouncedSearch) params.search = debouncedSearch;
        const [listResponse, summaryResponse] = await Promise.all([
          api.get("tickets/", { params, signal: controller.signal }),
          api.get("tickets/summary/", { signal: controller.signal }),
        ]);
        setTickets(listResponse.data);
        setSummary(summaryResponse.data);
      } catch (error) {
        if (!axios.isCancel(error)) {
          setApiError(
            error.response?.data?.detail ||
              "Could not load tickets. Check that the API and database are running.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadDashboard();
    return () => controller.abort();
  }, [statusFilter, debouncedSearch, refreshKey]);

  const stats = useMemo(
    () => [
      { label: "Total tickets", value: summary.total, icon: Inbox, tone: "green", detail: "Across all time" },
      { label: "Open", value: summary.open, icon: FileText, tone: "blue", detail: "Awaiting a reply" },
      { label: "In progress", value: summary.in_progress, icon: Activity, tone: "amber", detail: "Being worked on" },
      { label: "Resolved", value: summary.resolved, icon: TicketCheck, tone: "purple", detail: "Successfully closed" },
    ],
    [summary],
  );

  async function changeStatus(id, nextStatus) {
    setApiError("");
    try {
      await api.patch(`tickets/${id}/`, { status: nextStatus });
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Unable to update this ticket. Please try again.");
    }
  }

  async function createTicket(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setFormError("");
    try {
      await api.post("tickets/", {
        title: form.get("title"),
        description: form.get("description"),
        priority: form.get("priority"),
      });
      setModalOpen(false);
      setSearch("");
      setDebouncedSearch("");
      setStatusFilter("all");
      setRefreshKey((key) => key + 1);
    } catch (error) {
      const data = error.response?.data;
      const firstError = data && Object.values(data).flat()[0];
      setFormError(firstError || "Could not create the ticket. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Helpdesk home">
          <span className="brand-mark"><Headphones size={20} strokeWidth={2.2} /></span>
          <span className="brand-name">help<span>desk</span></span>
        </a>
        <div className="workspace-switch">
          <span className="workspace-icon">S</span>
          <span className="workspace-copy"><strong>Studio North</strong><small>Free workspace</small></span>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item" href="#overview"><LayoutDashboard size={17} /> Overview</a>
          <a className="nav-item active" href="#tickets"><Inbox size={17} /> Tickets <span className="nav-count">{summary.open}</span></a>
          <a className="nav-item" href="#activity"><Activity size={17} /> Activity</a>
        </nav>

        <div className="nav-label team-label">PREFERENCES</div>
        <nav className="side-nav" aria-label="Preferences">
          <a className="nav-item" href="#settings"><Settings2 size={17} /> Settings</a>
          <a className="nav-item" href="#help"><CircleHelp size={17} /> Help center</a>
        </nav>

        <div className="sidebar-spacer" />
        <div className="plan-card">
          <div className="plan-icon"><Sparkles size={16} /></div>
          <strong>Make support a superpower</strong>
          <p>Upgrade your workspace to unlock more.</p>
          <button type="button" className="plan-link">Explore plans <ArrowUpRight size={14} /></button>
        </div>
        <button type="button" className="profile-button">
          <span className="avatar">AM</span>
          <span className="profile-copy"><strong>Alex Morgan</strong><small>Admin</small></span>
          <ChevronDown size={15} />
        </button>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div>
          <div className="topbar-actions">
            <button type="button" className="shortcut-hint" aria-label="Keyboard shortcuts"><Command size={13} /> K</button>
            <button type="button" className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <span className="topbar-divider" />
            <span className="avatar avatar-small">AM</span>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="live-dot" /> {TODAY_LABEL}</div>
              <h1>Good morning, Alex <span className="wave">✳</span></h1>
              <p className="welcome-copy">Here&apos;s what&apos;s happening with your support today.</p>
            </div>
            <button type="button" className="primary-button" onClick={() => { setFormError(""); setModalOpen(true); }}>
              <Plus size={17} strokeWidth={2.4} /> Create ticket
            </button>
          </section>

          {apiError && (
            <div className="error-banner" role="alert">
              <CircleHelp size={17} /><span>{apiError}</span>
              <button type="button" onClick={() => setRefreshKey((key) => key + 1)} aria-label="Retry loading"><ArrowUpRight size={15} /> Retry</button>
            </div>
          )}

          <section className="stats-grid" aria-label="Ticket summary">
            {stats.map(({ label, value, icon: Icon, tone, detail }) => (
              <article className={`stat-card stat-${tone}`} key={label}>
                <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={17} /></span></div>
                <div className="stat-value">{loading ? <span className="skeleton-number" /> : value.toLocaleString()}</div>
                <div className="stat-foot"><span className="stat-foot-dot" />{detail}</div>
              </article>
            ))}
          </section>

          <section className="tickets-panel" id="tickets">
            <div className="panel-heading">
              <div>
                <div className="section-title-row"><h2>All tickets</h2><span className="ticket-total">{summary.total}</span></div>
                <p className="panel-subtitle">Keep track of every customer conversation.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setRefreshKey((key) => key + 1)}>
                <Activity size={15} /> Refresh
              </button>
            </div>

            <div className="table-toolbar">
              <label className="search-box">
                <Search size={17} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets..." aria-label="Search tickets" />
                {search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}
                {!search && <kbd>/</kbd>}
              </label>
              <label className="filter-select">
                <ListFilter size={16} />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </div>

            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Ticket ID</th><th>Title</th><th>Priority</th><th>Status</th><th>Created</th>
                </tr></thead>
                <tbody>
                  {loading && tickets.length === 0 ? (
                    <tr><td colSpan="5" className="loading-cell"><LoaderCircle size={18} className="spin" /> Loading tickets...</td></tr>
                  ) : tickets.length === 0 ? (
                    <tr><td colSpan="5"><div className="empty-state"><span className="empty-icon"><Inbox size={22} /></span><strong>{search || statusFilter !== "all" ? "No matching tickets" : "It’s quiet in here"}</strong><p>{search || statusFilter !== "all" ? "Try changing your search or filters." : "New customer requests will show up here."}</p>{!search && statusFilter === "all" && <button className="empty-create" onClick={() => setModalOpen(true)}><Plus size={15} /> Create your first ticket</button>}</div></td></tr>
                  ) : tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td><span className="ticket-id-cell">{ticket.ticket_id}</span></td>
                      <td>
                        <div className="ticket-cell">
                          <span className="ticket-symbol"><FileText size={16} /></span>
                          <span className="ticket-copy"><strong>{ticket.title}</strong><small>{ticket.description}</small></span>
                        </div>
                      </td>
                      <td><span className={`priority priority-${ticket.priority}`}><i />{ticket.priority[0].toUpperCase() + ticket.priority.slice(1)}</span></td>
                      <td><label className={`status-pill status-${ticket.status}`}><i /><select value={ticket.status} onChange={(event) => changeStatus(ticket.id, event.target.value)} aria-label={`Change status for ${ticket.ticket_id}`}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select><ChevronDown size={12} /></label></td>
                      <td><span className="date-cell"><Clock3 size={14} />{formatDate(ticket.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Showing <strong>{tickets.length}</strong> {tickets.length === 1 ? "ticket" : "tickets"}{statusFilter !== "all" || debouncedSearch ? " matching filters" : ""}</span>
              <span className="footer-status"><Check size={13} /> All caught up</span>
            </div>
          </section>
          <footer className="page-footer"><span>Made for better conversations.</span><span><span className="footer-dot" /> All systems operational</span></footer>
        </div>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="ticket-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-heading">
              <div><span className="modal-icon"><Plus size={18} /></span><div><h2 id="modal-title">Create a ticket</h2><p>Add a new customer request to your inbox.</p></div></div>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close dialog"><X size={18} /></button>
            </div>
            <form onSubmit={createTicket}>
              <label className="form-label" htmlFor="ticket-title">Ticket title <span>Required</span></label>
              <input className="form-control" id="ticket-title" name="title" placeholder="e.g. Unable to access my account" maxLength="180" required autoFocus />
              <label className="form-label" htmlFor="ticket-description">Description <span>Required</span></label>
              <textarea className="form-control description-input" id="ticket-description" name="description" placeholder="Describe the issue and any helpful context..." required rows="4" />
              <label className="form-label" htmlFor="ticket-priority">Priority</label>
              <select className="form-control priority-select" id="ticket-priority" name="priority" defaultValue="medium">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <LoaderCircle size={16} className="spin" /> : <Plus size={16} />}{saving ? "Creating..." : "Create ticket"}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
