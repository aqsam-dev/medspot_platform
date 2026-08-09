import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { icon: "dashboard", label: "Dashboard", path: "/" },
  { icon: "verified", label: "Verification", path: "/verification" },
  { icon: "local_pharmacy", label: "Pharmacy Management", path: "/pharmacy" },
  { icon: "group", label: "User Management", path: "/users" },
  { icon: "bookmark_check", label: "Reservations", path: "/reservations" },
  { icon: "description", label: "Prescriptions", path: "/prescriptions" },
  { icon: "medication", label: "Medicine Catalog", path: "/medicines" },
  { icon: "admin_panel_settings", label: "Audit Log", path: "/audit" },
];

export default function Sidebar({ expanded, onToggle , onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarWidth = expanded ? "280px" : "72px";

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg,#131b2e 0%,#0a0f1d 100%)",
        padding: "20px 10px",
        boxSizing: "border-box",
        transition: "width .3s",
        boxShadow: "0 25px 50px rgba(0,0,0,.35)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "space-between" : "center",
          marginBottom: "28px",
        }}
      >
        {expanded && (
          <div>
            <h2
              style={{
                color: "#fff",
                fontSize: "20px",
                fontWeight: "800",
                margin: 0,
              }}
            >
              MEDSPOT
            </h2>

            <p
              style={{
                margin: "3px 0 0",
                fontSize: "11px",
                color: "rgba(255,255,255,.45)",
              }}
            >
              Admin Portal
            </p>
          </div>
        )}

        <button
          onClick={onToggle}
          style={{
            width: "38px",
            height: "38px",
            border: "none",
            borderRadius: "10px",
            background: "rgba(255,255,255,.1)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="material-symbols-outlined">
            {expanded ? "chevron_left" : "chevron_right"}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          flex: 1,
        }}
      >
        {navItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: expanded ? "flex-start" : "center",
                gap: expanded ? "12px" : "0",
                padding: "12px",
                borderRadius: "12px",
                cursor: "pointer",
                color: active ? "#89f5e7" : "rgba(255,255,255,.65)",
                background: active
                  ? "rgba(137,245,231,.12)"
                  : "transparent",
                borderRight: active
                  ? "3px solid #89f5e7"
                  : "3px solid transparent",
                transition: ".2s",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  e.currentTarget.style.background =
                    "rgba(255,255,255,.06)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "22px" }}
              >
                {item.icon}
              </span>

              {expanded && (
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

{/* Logout */}
<div
  onClick={function () {
    if(onLogout){onLogout();}
  }}
  style={{
    display: "flex",
    alignItems: "center",
    gap: expanded ? "12px" : "0px",
    padding: "11px",
    marginTop: "10px",
    borderRadius: "10px",
    cursor: "pointer",
    color: "#fca5a5",
    background: "rgba(252,165,165,0.10)",
    borderRight: "3px solid #fca5a5",
    transition: "all 0.2s ease",
    justifyContent: expanded ? "flex-start" : "center",
  }}
  onMouseEnter={function (e) {
    e.currentTarget.style.background = "rgba(252,165,165,0.18)"
  }}
  onMouseLeave={function (e) {
    e.currentTarget.style.background = "rgba(252,165,165,0.10)"
  }}
>
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: "22px",
      color: "#fca5a5",
      flexShrink: 0,
    }}
  >
    logout
  </span>

  {expanded && (
    <span
      style={{
        fontSize: "13px",
        fontWeight: "700",
      }}
    >
      Logout
    </span>
  )}
</div>
    </aside>
  );
}