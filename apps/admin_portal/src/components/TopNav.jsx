import { useNavigate, useLocation } from "react-router-dom";

const pageNames = {
  "/": "Dashboard",
  "/verification": "Pharmacy Verification Center",
  "/pharmacy": "Pharmacy Management",
  "/users": "User Management",
  "/reports": "Report & Moderation",
  "/medicines": "Medicine Catalog",
  "/notifications": "Notifications",
  "/reservations": "Reservations",
  "/prescriptions": "Prescription Management",
  "/analytics": "Analytics & Reports",
  "/audit": "Audit Log",
};

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === "/";
  const pageName = pageNames[location.pathname] || "Admin Portal";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "18px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      {isDashboard ? (
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
            }}
          >
            Welcome back, Admin
          </h1>

          <p
            style={{
              marginTop: "6px",
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            Here's what's happening with MedSpot today.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "none",
              background: "#f1f5f9",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "20px",
                color: "#374151",
              }}
            >
              arrow_back
            </span>
          </button>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: "800",
                color: "#0f172a",
              }}
            >
              {pageName}
            </h1>

            <p
              style={{
                marginTop: "4px",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              MedSpot Admin Portal
            </p>
          </div>
        </div>
      )}
    </header>
  );
}