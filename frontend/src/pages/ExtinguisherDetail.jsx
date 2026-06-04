import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { statusBadgeClass } from "../lib/badges";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";

export default function ExtinguisherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isReadOnly = user?.role === "admin";

  const { data: ext, isLoading } = useQuery({
    queryKey: ["extinguisher", id],
    queryFn: () => api.get(`/api/extinguishers/${id}`).then(r => r.data)
  });

  const { data: inspections } = useQuery({
    queryKey: ["inspections-for-ext", id],
    queryFn: () => api.get(`/api/inspections?extinguisherId=${id}&limit=10`).then(r => r.data)
  });

  const { data: maintenance } = useQuery({
    queryKey: ["maintenance-for-ext", id],
    queryFn: () => api.get(`/api/maintenance?extinguisherId=${id}&limit=10`).then(r => r.data)
  });

  if (isLoading) return <div style={{ padding: "2rem", color: "var(--color-text-muted)" }}>Loading...</div>;
  if (!ext) return <div style={{ padding: "2rem" }}>Not found</div>;

  const isExpired = new Date(ext.expiryDate) < new Date();

  return (
    <div>
      <p className="breadcrumb">Inventory <span>›</span> {ext.serialNumber}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/extinguishers")}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">{ext.serialNumber}</h1>
          <p className="text-muted">
            {ext.location}
            {isReadOnly && " · read-only (admin)"}
          </p>
        </div>
        <span className={statusBadgeClass(ext.status)}>{ext.status}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          ["Type", ext.type?.replace(/_/g," ")],
          ["Size", ext.size],
          ["Manufacturer", ext.manufacturer || "—"],
          ["Model", ext.model || "—"],
          ["Installation Date", ext.installationDate],
          ["Expiry Date", <span style={{ color: isExpired ? "#e74c3c" : "inherit" }}>{ext.expiryDate} {isExpired ? "⚠ EXPIRED" : ""}</span>],
          ["Last Inspection", ext.lastInspectionDate || "—"],
          ["Next Inspection", ext.nextInspectionDate || "—"],
          ["Pressure", ext.pressure || "—"],
          ["Building", ext.building || "—"],
        ].map(([label, value]) => (
          <div key={label} className="card card-body" style={{ padding: "0.9rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>{label}</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 500, textTransform: "capitalize" }}>{value}</div>
          </div>
        ))}
      </div>

      {ext.notes && (
        <div className="card card-body" style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>Notes</div>
          <p style={{ fontSize: "0.9rem" }}>{ext.notes}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card card-body">
          <h3 style={{ fontWeight: 600, marginBottom: "1rem", fontSize: "0.95rem" }}>🔍 Recent Inspections</h3>
          {inspections?.data?.length === 0 ? <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>No inspections yet</p> :
            inspections?.data?.map(ins => (
              <div key={ins.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" }}>
                <div>
                  <div>{new Date(ins.scheduledDate).toLocaleDateString()}</div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>{ins.type}</div>
                </div>
                <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.72rem",
                  background: ins.status === "completed" ? "rgba(39,174,96,0.15)" : "rgba(243,156,18,0.15)",
                  color: ins.status === "completed" ? "#27ae60" : "#f39c12"
                }}>{ins.status}</span>
              </div>
            ))}
        </div>

        <div className="card card-body">
          <h3 style={{ fontWeight: 600, marginBottom: "1rem", fontSize: "0.95rem" }}>🔧 Maintenance History</h3>
          {maintenance?.data?.length === 0 ? <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>No maintenance logs yet</p> :
            maintenance?.data?.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" }}>
                <div>
                  <div>{m.actionDate}</div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>{m.actionsTaken?.substring(0,40)}...</div>
                </div>
                {m.cost && <span style={{ color: "#27ae60", fontSize: "0.8rem" }}>${m.cost}</span>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}