import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getApiError } from "../lib/apiErrors";
import { useAuthStore } from "../stores/auth.store";
import toast from "react-hot-toast";

function buildMaintenancePayload(form) {
  const payload = {
    extinguisherId: form.extinguisherId,
    actionDate: form.actionDate,
    actionsTaken: form.actionsTaken.trim(),
    status: form.status || "completed",
  };
  if (form.conditionsNoted?.trim()) payload.conditionsNoted = form.conditionsNoted.trim();
  if (form.cost !== "" && form.cost != null) payload.cost = Number(form.cost);
  if (form.nextServiceDate) payload.nextServiceDate = form.nextServiceDate;
  if (form.inspectionId) payload.inspectionId = form.inspectionId;
  return payload;
}

export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [serialLookup, setSerialLookup] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [form, setForm] = useState({
    extinguisherId: "",
    actionDate: new Date().toISOString().slice(0, 10),
    actionsTaken: "",
    conditionsNoted: "",
    cost: "",
    nextServiceDate: "",
    status: "completed",
  });
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isInspector = user?.role === "inspector";

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance", page],
    queryFn: () =>
      api.get("/api/maintenance", { params: { page, limit: 15 } }).then((r) => r.data),
  });

  const { data: extinguishers } = useQuery({
    queryKey: ["extinguishers-for-maintenance"],
    queryFn: () =>
      api.get("/api/extinguishers", { params: { page: 1, limit: 100 } }).then((r) => r.data),
    enabled: isInspector,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post("/api/maintenance", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      setShowForm(false);
      setForm({
        extinguisherId: "",
        actionDate: new Date().toISOString().slice(0, 10),
        actionsTaken: "",
        conditionsNoted: "",
        cost: "",
        nextServiceDate: "",
        status: "completed",
      });
      setSerialLookup("");
      toast.success("Maintenance logged!");
    },
    onError: (e) => toast.error(getApiError(e, "Failed to log maintenance")),
  });

  const handleSerialLookup = async () => {
    if (!serialLookup.trim()) return;
    setLookupLoading(true);
    try {
      const { data } = await api.get(
        `/api/extinguishers/lookup/${encodeURIComponent(serialLookup.trim())}`
      );
      setForm((f) => ({ ...f, extinguisherId: data.id }));
      toast.success(`Selected ${data.serialNumber}`);
    } catch (e) {
      toast.error(getApiError(e, "Extinguisher not found"));
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.extinguisherId) {
      toast.error("Select an extinguisher or look one up by serial number");
      return;
    }
    if (!form.actionDate) {
      toast.error("Action date is required");
      return;
    }
    if (!form.actionsTaken.trim()) {
      toast.error("Describe the maintenance actions taken");
      return;
    }
    createMutation.mutate(buildMaintenancePayload(form));
  };

  return (
    <div>
      <p className="breadcrumb">
        Operations <span>›</span> Maintenance
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 className="page-title">Maintenance Logs</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            {data?.pagination?.total ?? 0} entries
            {user?.role === "admin" && " · read-only"}
          </p>
        </div>
        {isInspector && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Log Activity
          </button>
        )}
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "var(--color-surface-2)",
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
              }}
            >
              {["Extinguisher", "Action Date", "Actions Taken", "Conditions", "Cost", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    style={{ padding: "0.8rem 1rem", textAlign: "left", fontWeight: 500 }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : data?.data?.length ? (
              data.data.map((log) => (
                <tr
                  key={log.id}
                  style={{ borderTop: "1px solid var(--color-border)", fontSize: "0.875rem" }}
                >
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.78rem",
                    }}
                  >
                    {log.extinguisherId?.substring(0, 8)}...
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{log.actionDate}</td>
                  <td style={{ padding: "0.75rem 1rem", maxWidth: "200px" }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.actionsTaken}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", maxWidth: "160px" }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--color-text-muted)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {log.conditionsNoted || "—"}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#27ae60" }}>
                    {log.cost ? `$${log.cost}` : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "20px",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        background:
                          log.status === "completed"
                            ? "rgba(39,174,96,0.15)"
                            : "rgba(243,156,18,0.15)",
                        color: log.status === "completed" ? "#27ae60" : "#f39c12",
                      }}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No maintenance logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination?.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "0.4rem 0.8rem",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              color: "var(--color-text-muted)",
            }}
          >
            ←
          </button>
          <span
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.85rem",
              color: "var(--color-text-muted)",
            }}
          >
            {page}/{data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data?.pagination?.totalPages}
            style={{
              padding: "0.4rem 0.8rem",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              color: "var(--color-text-muted)",
            }}
          >
            →
          </button>
        </div>
      )}

      {showForm && isInspector && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "2rem",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Log Maintenance Activity</h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-muted)",
                marginBottom: "1.25rem",
              }}
            >
              Select equipment by list or serial number — do not paste a raw UUID.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Extinguisher *
                </label>
                <select
                  value={form.extinguisherId}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, extinguisherId: e.target.value }))}
                >
                  <option value="">Select extinguisher</option>
                  {extinguishers?.data?.map((ext) => (
                    <option key={ext.id} value={ext.id}>
                      {ext.serialNumber} — {ext.location}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Or look up by serial
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    placeholder="e.g. TWZ-KGL-001"
                    value={serialLookup}
                    onChange={(e) => setSerialLookup(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSerialLookup()}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSerialLookup}
                    disabled={lookupLoading}
                  >
                    {lookupLoading ? "…" : "Find"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Action date *
                </label>
                <input
                  type="date"
                  required
                  value={form.actionDate}
                  onChange={(e) => setForm((f) => ({ ...f, actionDate: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Actions taken *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.actionsTaken}
                  onChange={(e) => setForm((f) => ({ ...f, actionsTaken: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Conditions noted
                </label>
                <textarea
                  rows={2}
                  value={form.conditionsNoted}
                  onChange={(e) => setForm((f) => ({ ...f, conditionsNoted: e.target.value }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    Cost (optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    Next service date
                  </label>
                  <input
                    type="date"
                    value={form.nextServiceDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nextServiceDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {["completed", "pending_parts", "decommissioned"].map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "0.6rem 1.2rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--color-border)",
                    background: "none",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  style={{
                    background: "var(--color-primary)",
                    color: "white",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                  }}
                >
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
