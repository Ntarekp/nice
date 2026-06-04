import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import toast from "react-hot-toast";
import { getApiError } from "../lib/apiErrors";

const STATUS_COLORS = {
  scheduled: "#3498db",
  in_progress: "#f39c12",
  completed: "#27ae60",
  missed: "#e74c3c",
  cancelled: "#95a5a6",
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || "#95a5a6";
  return (
    <span
      style={{
        padding: "0.2rem 0.65rem",
        borderRadius: "20px",
        fontSize: "0.75rem",
        fontWeight: 500,
        background: `${c}22`,
        color: c,
      }}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

export default function InspectionsPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showComplete, setShowComplete] = useState(null);
  const [viewInspection, setViewInspection] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedInspector, setSelectedInspector] = useState("");
  const [form, setForm] = useState({
    extinguisherId: "",
    scheduledDate: "",
    type: "routine",
    notes: "",
  });
  const [completeForm, setCompleteForm] = useState({
    status: "completed",
    result: "passed",
    findings: "",
    notes: "",
  });
  const [serialLookup, setSerialLookup] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const canSchedule = user?.role === "user";
  const canAssign = user?.role === "admin";
  const canComplete = user?.role === "inspector";
  const canViewAll = user?.role === "admin" || user?.role === "user";

  const { data, isLoading } = useQuery({
    queryKey: ["inspections", page, filterStatus, user?.role],
    queryFn: () =>
      api
        .get("/api/inspections", {
          params: { page, limit: 15, status: filterStatus || undefined },
        })
        .then((r) => r.data),
  });

  const { data: myExtinguishers } = useQuery({
    queryKey: ["my-extinguishers"],
    queryFn: () =>
      api.get("/api/extinguishers", { params: { limit: 100, page: 1 } }).then((r) => r.data),
    enabled: canSchedule,
  });

  const { data: allExtinguishers } = useQuery({
    queryKey: ["extinguishers-for-inspections"],
    queryFn: () =>
      api.get("/api/extinguishers", { params: { limit: 100, page: 1 } }).then((r) => r.data),
    enabled: canAssign || canComplete || canViewAll,
  });

  const { data: inspectors } = useQuery({
    queryKey: ["inspectors-list"],
    queryFn: () =>
      api
        .get("/api/users", { params: { role: "inspector", limit: 50, page: 1, activeOnly: "true" } })
        .then((r) => r.data),
    enabled: canAssign,
  });

  const extMap = useMemo(
    () => Object.fromEntries((allExtinguishers?.data || []).map((e) => [e.id, e])),
    [allExtinguishers]
  );

  const inspectorMap = useMemo(
    () =>
      Object.fromEntries(
        (inspectors?.data || []).map((u) => [
          u.id,
          `${u.firstName} ${u.lastName} (${u.email})`,
        ])
      ),
    [inspectors]
  );

  const scheduleMutation = useMutation({
    mutationFn: (body) => api.post("/api/inspections", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
      toast.success("Inspection requested! An admin will assign an inspector.");
    },
    onError: (e) => toast.error(getApiError(e, "Failed to schedule inspection")),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assignedInspector }) =>
      api.patch(`/api/inspections/${id}/assign`, { assignedInspector }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setAssigningId(null);
      setSelectedInspector("");
      toast.success("Inspector assigned — they were notified by email.");
    },
    onError: (e) => toast.error(getApiError(e, "Failed to assign inspector")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/api/inspections/${id}`, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setShowComplete(null);
      if (variables.body?.status === "completed") {
        toast.success("Inspection completed — admins were notified by email.");
      } else if (variables.body?.status === "in_progress") {
        toast.success("Inspection started.");
      } else {
        toast.success("Inspection updated!");
      }
    },
    onError: (e) => toast.error(getApiError(e, "Failed to update inspection")),
  });

  const startMutation = useMutation({
    mutationFn: (id) => api.patch(`/api/inspections/${id}`, { status: "in_progress" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
      toast.success("Inspection marked in progress.");
    },
    onError: (e) => toast.error(getApiError(e, "Could not start inspection")),
  });

  const handleSerialLookup = async () => {
    if (!serialLookup.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const { data: ext } = await api.get(
        `/api/extinguishers/lookup/${encodeURIComponent(serialLookup.trim())}`
      );
      setLookupResult(ext);
    } catch (e) {
      toast.error(getApiError(e, "Extinguisher not found"));
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSchedule = () => {
    if (!form.extinguisherId) {
      toast.error("Select an extinguisher");
      return;
    }
    if (!form.scheduledDate) {
      toast.error("Scheduled date is required");
      return;
    }
    scheduleMutation.mutate({
      extinguisherId: form.extinguisherId,
      scheduledDate: new Date(form.scheduledDate).toISOString(),
      type: form.type,
      notes: form.notes?.trim() || undefined,
    });
  };

  const handleAssign = (inspectionId) => {
    if (!selectedInspector) {
      toast.error("Select an inspector");
      return;
    }
    assignMutation.mutate({ id: inspectionId, assignedInspector: selectedInspector });
  };

  const handleComplete = () => {
    if (!showComplete) return;
    if (completeForm.status === "completed" && !completeForm.result) {
      toast.error("Select a result");
      return;
    }
    updateMutation.mutate({
      id: showComplete,
      body: {
        status: completeForm.status,
        result: completeForm.status === "completed" ? completeForm.result : undefined,
        findings: completeForm.findings?.trim() || undefined,
        notes: completeForm.notes?.trim() || undefined,
      },
    });
  };

  const tableHeaders = canAssign
    ? ["Equipment", "Scheduled", "Type", "Status", "Inspector", "Result", "Actions"]
    : canComplete
      ? ["Equipment", "Scheduled", "Type", "Status", "Result", "Actions"]
      : ["Equipment", "Scheduled", "Type", "Status", "Inspector", "Result"];

  return (
    <div>
      <p className="breadcrumb">
        Operations <span>›</span> Inspections
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
          <h1 className="page-title">Inspections</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            {data?.pagination?.total ?? 0} total
            {canAssign && " · assign inspectors to scheduled requests"}
            {canComplete && " · complete your assigned work"}
            {canSchedule && " · your facility requests"}
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
          <h3 style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem" }}>
            Verify extinguisher by serial number
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              placeholder="Serial number..."
              value={serialLookup}
              onChange={(e) => setSerialLookup(e.target.value)}
              style={{ maxWidth: "280px" }}
              onKeyDown={(e) => e.key === "Enter" && handleSerialLookup()}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSerialLookup}
              disabled={lookupLoading}
            >
              {lookupLoading ? "Searching..." : "Look up"}
            </button>
          </div>
          {lookupResult && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                background: "var(--color-surface-2)",
                borderRadius: "var(--radius)",
                fontSize: "0.85rem",
              }}
            >
              <strong>{lookupResult.serialNumber}</strong> — {lookupResult.location} (
              {lookupResult.status})
              <button
                type="button"
                onClick={() => navigate(`/extinguishers/${lookupResult.id}`)}
                style={{
                  marginLeft: "0.75rem",
                  background: "none",
                  color: "#e74c3c",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                View details →
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          style={{ width: "auto" }}
        >
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {tableHeaders.map((h) => (
                <th key={h} style={{ padding: "0.8rem 1rem", textAlign: "left", fontWeight: 500 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}
                >
                  Loading...
                </td>
              </tr>
            ) : !data?.data?.length ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}
                >
                  No inspections found.
                </td>
              </tr>
            ) : (
              data.data.map((ins) => {
                const ext = extMap[ins.extinguisherId];
                const needsAssign =
                  canAssign && ins.status === "scheduled" && !ins.assignedInspector;
                const inspectorLabel = ins.assignedInspector
                  ? inspectorMap[ins.assignedInspector] || "Assigned"
                  : needsAssign
                    ? "Unassigned"
                    : "—";

                return (
                  <tr
                    key={ins.id}
                    style={{ borderTop: "1px solid var(--color-border)", fontSize: "0.875rem" }}
                  >
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                        {ext?.serialNumber || "—"}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                        {ext?.location || ins.extinguisherId?.slice(0, 8) + "…"}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {new Date(ins.scheduledDate).toLocaleString()}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textTransform: "capitalize" }}>
                      {ins.type?.replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <StatusBadge status={ins.status} />
                    </td>
                    {(canAssign || canSchedule) && (
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          fontSize: "0.82rem",
                          color: needsAssign ? "#ea580c" : "var(--color-text-muted)",
                        }}
                      >
                        {inspectorLabel}
                      </td>
                    )}
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color:
                          ins.result === "passed"
                            ? "#27ae60"
                            : ins.result === "failed"
                              ? "#e74c3c"
                              : "inherit",
                        fontSize: "0.8rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {ins.result?.replace(/_/g, " ") || "—"}
                    </td>
                    {(canAssign || canComplete) && (
                      <td style={{ padding: "0.75rem 1rem", minWidth: "180px" }}>
                        {needsAssign && assigningId === ins.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            <select
                              value={selectedInspector}
                              onChange={(e) => setSelectedInspector(e.target.value)}
                              style={{ fontSize: "0.8rem" }}
                            >
                              <option value="">Choose inspector</option>
                              {inspectors?.data?.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.firstName} {u.lastName}
                                </option>
                              ))}
                            </select>
                            <div style={{ display: "flex", gap: "0.35rem" }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                                disabled={assignMutation.isPending}
                                onClick={() => handleAssign(ins.id)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                                onClick={() => {
                                  setAssigningId(null);
                                  setSelectedInspector("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : needsAssign ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                            onClick={() => setAssigningId(ins.id)}
                          >
                            Assign inspector
                          </button>
                        ) : null}
                        {canComplete && ins.assignedInspector && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            <button
                              type="button"
                              style={{
                                fontSize: "0.72rem",
                                padding: "0.25rem 0.5rem",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius)",
                              }}
                              onClick={() => setViewInspection(ins)}
                            >
                              View
                            </button>
                            {ins.status === "scheduled" && (
                              <button
                                type="button"
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "0.25rem 0.5rem",
                                  background: "rgba(52,152,219,0.15)",
                                  color: "#3498db",
                                  border: "1px solid rgba(52,152,219,0.3)",
                                  borderRadius: "var(--radius)",
                                }}
                                disabled={startMutation.isPending}
                                onClick={() => startMutation.mutate(ins.id)}
                              >
                                Start
                              </button>
                            )}
                            {["scheduled", "in_progress"].includes(ins.status) && (
                              <button
                                type="button"
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "0.25rem 0.5rem",
                                  background: "rgba(39,174,96,0.15)",
                                  color: "#27ae60",
                                  border: "1px solid rgba(39,174,96,0.3)",
                                  borderRadius: "var(--radius)",
                                }}
                                onClick={() => {
                                  setShowComplete(ins.id);
                                  setCompleteForm({
                                    status: "completed",
                                    result: "passed",
                                    findings: "",
                                    notes: ins.notes || "",
                                  });
                                }}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination?.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
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
          <span style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
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

      {showForm && canSchedule && (
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
              maxWidth: "460px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Request Inspection</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              An admin will assign an inspector after you submit this request.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Your extinguisher *
                </label>
                <select
                  value={form.extinguisherId}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, extinguisherId: e.target.value }))}
                >
                  <option value="">Select extinguisher</option>
                  {myExtinguishers?.data?.map((ext) => (
                    <option key={ext.id} value={ext.id}>
                      {ext.serialNumber} — {ext.location}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledDate}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {["routine", "annual", "emergency", "post_maintenance", "compliance"].map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
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
                  onClick={handleSchedule}
                  disabled={scheduleMutation.isPending}
                  style={{
                    background: "var(--color-primary)",
                    color: "white",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                  }}
                >
                  {scheduleMutation.isPending ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewInspection && canComplete && (
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
          onClick={() => setViewInspection(null)}
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
            {(() => {
              const ext = extMap[viewInspection.extinguisherId];
              return (
                <>
                  <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Assigned inspection</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                    Review equipment on site, then start and complete the inspection.
                  </p>
                  <dl style={{ fontSize: "0.88rem", lineHeight: 1.7, margin: 0 }}>
                    <dt style={{ color: "var(--color-text-muted)" }}>Serial</dt>
                    <dd style={{ margin: "0 0 0.5rem" }}>{ext?.serialNumber || "—"}</dd>
                    <dt style={{ color: "var(--color-text-muted)" }}>Location</dt>
                    <dd style={{ margin: "0 0 0.5rem" }}>{ext?.location || "—"}</dd>
                    <dt style={{ color: "var(--color-text-muted)" }}>Building / floor / room</dt>
                    <dd style={{ margin: "0 0 0.5rem" }}>
                      {[ext?.building, ext?.floor, ext?.room].filter(Boolean).join(" · ") || "—"}
                    </dd>
                    <dt style={{ color: "var(--color-text-muted)" }}>Type / size</dt>
                    <dd style={{ margin: "0 0 0.5rem", textTransform: "capitalize" }}>
                      {ext?.type?.replace(/_/g, " ")} / {ext?.size}
                    </dd>
                    <dt style={{ color: "var(--color-text-muted)" }}>Scheduled</dt>
                    <dd style={{ margin: "0 0 0.5rem" }}>
                      {new Date(viewInspection.scheduledDate).toLocaleString()}
                    </dd>
                    <dt style={{ color: "var(--color-text-muted)" }}>Status</dt>
                    <dd style={{ margin: "0 0 0.5rem" }}>
                      <StatusBadge status={viewInspection.status} />
                    </dd>
                    {viewInspection.notes && (
                      <>
                        <dt style={{ color: "var(--color-text-muted)" }}>Request notes</dt>
                        <dd style={{ margin: "0 0 0.5rem" }}>{viewInspection.notes}</dd>
                      </>
                    )}
                  </dl>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
                    {ext && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate(`/extinguishers/${ext.id}`)}
                      >
                        Equipment details
                      </button>
                    )}
                    {viewInspection.status === "scheduled" && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={startMutation.isPending}
                        onClick={() => {
                          startMutation.mutate(viewInspection.id);
                          setViewInspection((v) => (v ? { ...v, status: "in_progress" } : v));
                        }}
                      >
                        Start inspection
                      </button>
                    )}
                    {["scheduled", "in_progress"].includes(viewInspection.status) && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setShowComplete(viewInspection.id);
                          setCompleteForm({
                            status: "completed",
                            result: "passed",
                            findings: "",
                            notes: viewInspection.notes || "",
                          });
                          setViewInspection(null);
                        }}
                      >
                        Mark complete
                      </button>
                    )}
                    <button type="button" onClick={() => setViewInspection(null)}>
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showComplete && canComplete && (
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
          onClick={() => setShowComplete(null)}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "2rem",
              width: "100%",
              maxWidth: "480px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 600, marginBottom: "1.25rem" }}>Complete inspection</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Status</label>
                <select
                  value={completeForm.status}
                  onChange={(e) =>
                    setCompleteForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
              {completeForm.status === "completed" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    Result *
                  </label>
                  <select
                    value={completeForm.result}
                    onChange={(e) =>
                      setCompleteForm((f) => ({ ...f, result: e.target.value }))
                    }
                  >
                    {["passed", "failed", "needs_maintenance", "decommissioned"].map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Findings
                </label>
                <textarea
                  rows={2}
                  value={completeForm.findings}
                  onChange={(e) =>
                    setCompleteForm((f) => ({ ...f, findings: e.target.value }))
                  }
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Notes</label>
                <textarea
                  rows={2}
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowComplete(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={updateMutation.isPending}
                  onClick={handleComplete}
                >
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
