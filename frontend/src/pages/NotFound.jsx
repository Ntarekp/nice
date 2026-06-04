import { useNavigate } from "react-router-dom";
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", gap: "1rem" }}>
      <div style={{ fontSize: "4rem" }}>🔍</div>
      <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>404 — Page Not Found</h1>
      <p style={{ color: "var(--color-text-muted)" }}>The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate("/dashboard")} style={{ marginTop: "1rem", background: "var(--color-primary)", color: "white", padding: "0.7rem 1.5rem", borderRadius: "var(--radius)", fontWeight: 600 }}>
        Go to Dashboard
      </button>
    </div>
  );
}