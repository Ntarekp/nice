import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import toast from "react-hot-toast";

export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ extinguisherId: "", actionDate: "", actionsTaken: "", conditionsNoted: "", cost: "", nextServiceDate: "", status: "completed" });
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance", page],
    queryFn: () => api.get("/api/maintenance", { params: { page, limit: 15 } }).then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post("/api/maintenance", body),
    onSuccess: () => { qc.invalidateQueries(["maintenance"]); setShowForm(false); toast.success("Maintenance logged!"); },
    onError: (e) => toast.error(e.response?.data?.error || "Failed")
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 600 }}>🔧 Maintenance Logs</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{data?.pagination?.total ?? 0} entries</p>
        </div>
        {["admin","inspector"].includes(user?.role) && (
          <button onClick={() => setShowForm(true)} style={{ background: "var(--color-primary)", color: "white", padding: "0.6rem 1.2rem", borderRadius: "var(--radius)", fontWeight: 600 }}>
            + Log Activity
          </button>
        )}
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-2)", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              {["Extinguisher", "Action Date", "Actions Taken", "Conditions", "Cost", "Status"].map(h => (
                <th key={h} style={{ padding: "0.8rem 1rem", textAlign: "left", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>Loading...</td></tr>
            ) : data?.data?.map(log => (
              <tr key={log.id} style={{ borderTop: "1px solid var(--color-border)", fontSize: "0.875rem" }}>
                <td style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{log.extinguisherId?.substring(0,8)}...</td>
                <td style={{ padding: "0.75rem 1rem" }}>{log.actionDate}</td>
                <td style={{ padding: "0.75rem 1rem", maxWidth: "200px" }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.actionsTaken}</div></td>
                <td style={{ padding: "0.75rem 1rem", maxWidth: "160px" }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>{log.conditionsNoted || "—"}</div></td>
                <td style={{ padding: "0.75rem 1rem", color: "#27ae60" }}>{log.cost ? `$${log.cost}` : "—"}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 500,
                    background: log.status === "completed" ? "rgba(39,174,96,0.15)" : "rgba(243,156,18,0.15)",
                    color: log.status === "completed" ? "#27ae60" : "#f39c12" }}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.pagination?.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
            style={{ padding: "0.4rem 0.8rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-text-muted)" }}>←</button>
          <span style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{page}/{data.pagination.totalPages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page>=data?.pagination?.totalPages}
            style={{ padding: "0.4rem 0.8rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-text-muted)" }}>→</button>
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflow: "auto" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 600, marginBottom: "1.5rem" }}>Log Maintenance Activity</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[["extinguisherId","Extinguisher UUID","text"],["actionDate","Action Date","date"],["cost","Cost (optional)","number"],["nextServiceDate","Next Service Date","date"]].map(([k,l,t]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{l}</label>
                  <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
              {[["actionsTaken","Actions Taken *"],["conditionsNoted","Conditions Noted"]].map(([k,l]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{l}</label>
                  <textarea rows={2} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {["completed","pending_parts","decommissioned"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)} style={{ padding: "0.6rem 1.2rem", borderRadius: "var(--radius)", border: "1px solid var(--color-border)", background: "none", color: "var(--color-text-muted)" }}>Cancel</button>
                <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}
                  style={{ background: "var(--color-primary)", color: "white", padding: "0.6rem 1.5rem", borderRadius: "var(--radius)", fontWeight: 600 }}>
                  {createMutation.isPending ? "Logging..." : "Log Activity"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}