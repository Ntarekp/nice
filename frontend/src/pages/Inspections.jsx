import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import toast from "react-hot-toast";

export default function InspectionsPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ extinguisherId: "", scheduledDate: "", type: "routine", notes: "" });
  const [serialLookup, setSerialLookup] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const canSchedule = user?.role === "user";
  const canComplete = user?.role === "inspector";
  const isAdminView = user?.role === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["inspections", page, filterStatus],
    queryFn: () => api.get("/api/inspections", { params: { page, limit: 15, status: filterStatus || undefined } }).then(r => r.data)
  });

  const { data: myExtinguishers } = useQuery({
    queryKey: ["my-extinguishers"],
    queryFn: () => api.get("/api/extinguishers", { params: { limit: 100, page: 1 } }).then(r => r.data),
    enabled: canSchedule,
  });

  const scheduleMutation = useMutation({
    mutationFn: (body) => api.post("/api/inspections", body),
    onSuccess: () => { qc.invalidateQueries(["inspections"]); setShowForm(false); toast.success("Inspection requested!"); },
    onError: (e) => toast.error(e.response?.data?.error || "Failed")
  });

  const handleSerialLookup = async () => {
    if (!serialLookup.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const { data } = await api.get(`/api/extinguishers/lookup/${encodeURIComponent(serialLookup.trim())}`);
      setLookupResult(data);
    } catch (e) {
      toast.error(e.response?.data?.error || "Extinguisher not found");
    } finally {
      setLookupLoading(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/api/inspections/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(["inspections"]); toast.success("Updated!"); },
    onError: (e) => toast.error(e.response?.data?.error || "Failed")
  });

  const STATUS_COLORS = { scheduled: "#3498db", in_progress: "#f39c12", completed: "#27ae60", missed: "#e74c3c", cancelled: "#95a5a6" };

  return (
    <div>
      <p className="breadcrumb">Operations <span>›</span> Inspections</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Inspections</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            {data?.pagination?.total ?? 0} total
            {isAdminView && " · read-only"}
            {canComplete && " · your assignments"}
            {canSchedule && " · your requests"}
          </p>
        </div>
        {canSchedule && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Request Inspection
          </button>
        )}
      </div>

      {canComplete && (
        <div className="card card-body" style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Verify extinguisher by serial number</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input placeholder="Serial number..." value={serialLookup} onChange={e => setSerialLookup(e.target.value)}
              style={{ maxWidth: "280px" }} onKeyDown={e => e.key === "Enter" && handleSerialLookup()} />
            <button type="button" className="btn btn-primary" onClick={handleSerialLookup} disabled={lookupLoading}>
              {lookupLoading ? "Searching..." : "Look up"}
            </button>
          </div>
          {lookupResult && (
            <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--color-surface-2)", borderRadius: "var(--radius)", fontSize: "0.85rem" }}>
              <strong>{lookupResult.serialNumber}</strong> — {lookupResult.location} ({lookupResult.status})
              <button onClick={() => navigate(`/extinguishers/${lookupResult.id}`)}
                style={{ marginLeft: "0.75rem", background: "none", color: "#e74c3c", fontWeight: 600, fontSize: "0.8rem" }}>
                View details →
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ width: "auto" }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {["Extinguisher ID", "Scheduled Date", "Type", "Status", "Result", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.8rem 1rem", textAlign: "left", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>Loading...</td></tr>
            ) : data?.data?.map(ins => (
              <tr key={ins.id} style={{ borderTop: "1px solid var(--color-border)", fontSize: "0.875rem" }}>
                <td style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{ins.extinguisherId?.substring(0,8)}...</td>
                <td style={{ padding: "0.75rem 1rem" }}>{new Date(ins.scheduledDate).toLocaleString()}</td>
                <td style={{ padding: "0.75rem 1rem", textTransform: "capitalize" }}>{ins.type?.replace(/_/g," ")}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ padding: "0.2rem 0.65rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 500,
                    background: `${STATUS_COLORS[ins.status]}22`, color: STATUS_COLORS[ins.status] }}>
                    {ins.status?.replace(/_/g," ")}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem", color: ins.result === "passed" ? "#27ae60" : ins.result === "failed" ? "#e74c3c" : "inherit", fontSize: "0.8rem", textTransform: "capitalize" }}>
                  {ins.result || "—"}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  {ins.status === "scheduled" && canComplete && (
                    <button onClick={() => updateMutation.mutate({ id: ins.id, body: { status: "completed", result: "passed" } })}
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", background: "rgba(39,174,96,0.15)", color: "#27ae60",
                        border: "1px solid rgba(39,174,96,0.3)", borderRadius: "var(--radius)" }}>
                      Mark Done
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.pagination?.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
            style={{ padding: "0.4rem 0.8rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-text-muted)" }}>←</button>
          <span style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{page}/{data.pagination.totalPages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page>=data?.pagination?.totalPages}
            style={{ padding: "0.4rem 0.8rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-text-muted)" }}>→</button>
        </div>
      )}

      {showForm && canSchedule && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "460px" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 600, marginBottom: "1.5rem" }}>Request Inspection</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Your extinguisher *</label>
                <select value={form.extinguisherId} required onChange={e => setForm(f => ({ ...f, extinguisherId: e.target.value }))}>
                  <option value="">Select extinguisher</option>
                  {myExtinguishers?.data?.map(ext => (
                    <option key={ext.id} value={ext.id}>{ext.serialNumber} — {ext.location}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Date & Time *</label>
                <input type="datetime-local" value={form.scheduledDate} required onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {["routine","annual","emergency","post_maintenance","compliance"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button onClick={() => setShowForm(false)} style={{ padding: "0.6rem 1.2rem", borderRadius: "var(--radius)", border: "1px solid var(--color-border)", background: "none", color: "var(--color-text-muted)" }}>Cancel</button>
                <button onClick={() => scheduleMutation.mutate(form)} disabled={scheduleMutation.isPending}
                  style={{ background: "var(--color-primary)", color: "white", padding: "0.6rem 1.5rem", borderRadius: "var(--radius)", fontWeight: 600 }}>
                  {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}