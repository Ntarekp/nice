import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const [form, setForm] = useState({ firstName: user?.firstName||"", lastName: user?.lastName||"", phone: user?.phone||"", department: user?.department||"" });
  const [pwForm, setPwForm] = useState({ currentPassword:"", newPassword:"", confirm:"" });

  const updateMutation = useMutation({
    mutationFn: (body) => api.patch("/api/users/me", body),
    onSuccess: (res) => { updateUser(res.data); toast.success("Profile updated!"); },
    onError: (e) => toast.error(e.response?.data?.error || "Update failed")
  });

  const changePwMutation = useMutation({
    mutationFn: (body) => api.post("/api/auth/change-password", body),
    onSuccess: () => { toast.success("Password changed! Please log in again."); setTimeout(() => logout(), 1500); },
    onError: (e) => {
      const d = e.response?.data;
      if (d?.details) d.details.forEach(m => toast.error(m));
      else toast.error(d?.error || "Failed");
    }
  });

  const handleChangePw = () => {
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Passwords do not match");
    changePwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.5rem" }}>👤 My Profile</h1>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--color-primary)", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700 }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", textTransform: "capitalize" }}>{user?.role} · {user?.email}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[["firstName","First Name"],["lastName","Last Name"],["phone","Phone"],["department","Department"]].map(([k,l]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{l}</label>
              <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}
          style={{ marginTop: "1.25rem", background: "var(--color-primary)", color: "white", padding: "0.65rem 1.5rem", borderRadius: "var(--radius)", fontWeight: 600 }}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>🔑 Change Password</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[["currentPassword","Current Password"],["newPassword","New Password"],["confirm","Confirm New Password"]].map(([k,l]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{l}</label>
              <input type="password" value={pwForm[k]} onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <p style={{ fontSize: "0.78rem", color: "var(--color-text-dim)" }}>Min 8 chars · uppercase · lowercase · number · special char</p>
          <button onClick={handleChangePw} disabled={changePwMutation.isPending}
            style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", padding: "0.65rem", borderRadius: "var(--radius)", fontWeight: 600, border: "1px solid rgba(231,76,60,0.3)" }}>
            {changePwMutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}