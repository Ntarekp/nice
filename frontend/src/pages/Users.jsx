import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import toast from "react-hot-toast";

/** Rows must come from the API only — valid UUID + email. */
function normalizeUsers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (u) =>
      u &&
      typeof u.id === "string" &&
      u.id.length > 0 &&
      typeof u.email === "string" &&
      u.email.includes("@")
  );
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    phone: "",
    department: "",
  });
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", page, search, filterRole, showInactive],
    queryFn: () =>
      api
        .get("/api/users", {
          params: {
            page,
            limit: 15,
            search: search || undefined,
            role: filterRole || undefined,
            activeOnly: showInactive ? "false" : "true",
          },
        })
        .then((r) => r.data),
  });

  const users = normalizeUsers(data?.data);

  const createMutation = useMutation({
    mutationFn: (body) =>
      api.post("/api/users", {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.trim().toLowerCase(),
        role: body.role,
        phone: body.phone?.trim() || undefined,
        department: body.department?.trim() || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setShowForm(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        role: "user",
        phone: "",
        department: "",
      });
      const payload = res?.data;
      if (payload?.emailSent === false) {
        toast.success(payload?.message || "User created.");
        if (import.meta.env.DEV && payload?.devPasswordHint) {
          console.info(
            "[dev] Temporary password for",
            payload.user?.email,
            ":",
            payload.devPasswordHint
          );
          toast(`Dev temp password: ${payload.devPasswordHint}`, {
            icon: "🔑",
            duration: 20000,
          });
        }
      } else {
        toast.success(
          payload?.message || "User created! Welcome email sent with temporary password."
        );
      }
    },
    onError: (e) => {
      const body = e.response?.data;
      if (body?.errors?.length) {
        body.errors.forEach((err) => toast.error(err.msg || err.message));
      } else {
        toast.error(body?.error || "Failed to create user");
      }
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deactivated");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Failed"),
  });

  const ROLE_COLORS = { admin: "#9b59b6", inspector: "#e67e22", user: "#3498db" };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 600 }}>👥 User Management</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            {data?.pagination?.total ?? users.length} active users in database
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: "var(--color-primary)",
            color: "white",
            padding: "0.6rem 1.2rem",
            borderRadius: "var(--radius)",
            fontWeight: 600,
          }}
        >
          + Add User
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: "280px" }}
        />
        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setPage(1);
          }}
          style={{ width: "auto" }}
        >
          <option value="">All Roles</option>
          {["admin", "inspector", "user"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.85rem",
            color: "var(--color-text-muted)",
          }}
        >
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => {
              setShowInactive(e.target.checked);
              setPage(1);
            }}
          />
          Show deactivated
        </label>
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
              {["Name", "Email", "Role", "Status", "Last Login", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{ padding: "0.8rem 1rem", textAlign: "left", fontWeight: 500 }}
                >
                  {h}
                </th>
              ))}
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
                  Loading users from database…
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>
                  <p style={{ color: "#e74c3c", marginBottom: "0.75rem" }}>
                    {error?.response?.data?.error || "Could not load users"}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    style={{
                      padding: "0.4rem 0.8rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No users found in the database.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  style={{ borderTop: "1px solid var(--color-border)", fontSize: "0.875rem" }}
                >
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: ROLE_COLORS[u.role] + "33",
                          color: ROLE_COLORS[u.role],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {u.firstName?.[0]}
                        {u.lastName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {u.firstName} {u.lastName}
                        </div>
                        {u.department && (
                          <div
                            style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
                          >
                            {u.department}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {u.email}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.65rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        background: ROLE_COLORS[u.role] + "22",
                        color: ROLE_COLORS[u.role],
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.65rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        background: u.isActive
                          ? "rgba(39,174,96,0.15)"
                          : "rgba(149,165,166,0.15)",
                        color: u.isActive ? "#27ae60" : "#95a5a6",
                      }}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-muted)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {u.isActive && (
                      <button
                        onClick={() => {
                          if (confirm(`Deactivate ${u.firstName} ${u.lastName}?`)) {
                            deactivateMutation.mutate(u.id);
                          }
                        }}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.6rem",
                          background: "rgba(231,76,60,0.12)",
                          color: "#e74c3c",
                          border: "1px solid rgba(231,76,60,0.3)",
                          borderRadius: "var(--radius)",
                        }}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
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

      {showForm && (
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
              maxWidth: "500px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Create New User</h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-muted)",
                marginBottom: "1.5rem",
              }}
            >
              A temporary password will be generated and emailed to the user.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[
                ["firstName", "First Name *"],
                ["lastName", "Last Name *"],
                ["email", "Email Address *"],
                ["phone", "Phone"],
                ["department", "Department"],
              ].map(([k, l]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                    gridColumn: k === "email" ? "1/-1" : undefined,
                  }}
                >
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    {l}
                  </label>
                  <input
                    type={k === "email" ? "email" : "text"}
                    value={form[k]}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                    required={l.includes("*")}
                  />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Role *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {["admin", "inspector", "user"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  gridColumn: "1/-1",
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                  marginTop: "0.5rem",
                }}
              >
                <button
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
                  onClick={() => createMutation.mutate(form)}
                  disabled={createMutation.isPending}
                  style={{
                    background: "var(--color-primary)",
                    color: "white",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                  }}
                >
                  {createMutation.isPending ? "Creating..." : "Create & Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
