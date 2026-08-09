import { useState , useEffect } from "react"
import Pagination from "../components/Pagination"

var typeFilterOptions = [
  "All",
  "pharmacy",
  "patient",
  "medicine",
  "report",
  "prescription"
]
var ITEMS_PER_PAGE = 8

export default function AuditLog(props) {
  var [search, setSearch] = useState("")
  var [typeFilter, setTypeFilter] = useState("All")
  var [dateFrom, setDateFrom] = useState("")
  var [dateTo, setDateTo] = useState("")
  var [currentPage, setCurrentPage] = useState(1)
 var [auditLogs,setAuditLogs]=useState([])
var [loading,setLoading]=useState(true)
var [selectedLog,setSelectedLog]=useState(null)

useEffect(function () {
  loadAuditLogs()
}, [])

  var filtered = auditLogs.filter(function(log) {
    var matchSearch = (
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase())
    )
    var matchType = typeFilter === "All" || log.targetType === typeFilter
    var matchFrom = !dateFrom || new Date(log.date) >= new Date(dateFrom)
    var matchTo = !dateTo || new Date(log.date) <= new Date(dateTo)
    return matchSearch && matchType && matchFrom && matchTo
  })

  async function loadAuditLogs() {
  try {
    setLoading(true)

    const response = await fetch(
      "http://localhost:5000/api/admin/audit-logs"
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
        "Failed to fetch audit logs"
      )
    }

    const formattedLogs = result.data.map(
      function (log) {
        const action =
          String(log.action || "")

        let icon = "history"
        let color = "#006a61"
        let bg = "#e6f4f3"

        if (
          action.toLowerCase().includes("blocked") ||
          action.toLowerCase().includes("rejected") ||
          action.toLowerCase().includes("deleted")
        ) {
          icon = "block"
          color = "#dc2626"
          bg = "#fee2e2"
        } else if (
          action.toLowerCase().includes("approved") ||
          action.toLowerCase().includes("unblocked")
        ) {
          icon = "check_circle"
          color = "#059669"
          bg = "#ecfdf5"
        } else if (
          action.toLowerCase().includes("medicine")
        ) {
          icon = "medication"
          color = "#7c3aed"
          bg = "#f5f3ff"
        } else if (
          action.toLowerCase().includes("pharmacy")
        ) {
          icon = "local_pharmacy"
        } else if (
          action.toLowerCase().includes("user")
        ) {
          icon = "person"
          color = "#1d4ed8"
          bg = "#eff6ff"
        }

        const createdAt = log.created_at
          ? new Date(log.created_at)
          : null

        return {
          id:
            "AL-" +
            String(log.audit_id).padStart(
              3,
              "0"
            ),

          auditId:
            log.audit_id,

          action:
            log.action || "Unknown Action",

          category:
            log.category || "General",

          targetType:
            String(
              log.target_type || "unknown"
            ).toLowerCase(),

          targetId:
            log.target_id,

          target:
            log.target_name ||
            "Unknown Target",

          details:
            log.description ||
            "No description provided",

          date:
            createdAt
              ? createdAt.toLocaleDateString()
              : "N/A",

          time:
            createdAt
              ? createdAt.toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit"
                  }
                )
              : "N/A",

          createdAt:
            log.created_at,

          icon,
          color,
          bg
        }
      }
    )

    setAuditLogs(formattedLogs)

  } catch (error) {
    console.error(
      "LOAD AUDIT LOGS ERROR:",
      error
    )

    setAuditLogs([])

    if (props.showToast) {
      props.showToast(
        error.message,
        "error"
      )
    }

  } finally {
    setLoading(false)
  }
}

  var totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  var stats = [
    { label: "Total Actions", value: auditLogs.length, icon: "history", color: "#006a61", bg: "#e6f4f3" },
    { label: "Approvals", value: auditLogs.filter(function(l) { return l.action.includes("Approved") || l.action.includes("Verified") || l.action.includes("Unblocked") }).length, icon: "check_circle", color: "#059669", bg: "#ecfdf5" },
    { label: "Blocks & Rejections", value: auditLogs.filter(function(l) { return l.action.includes("Blocked") || l.action.includes("Rejected") || l.action.includes("Dismissed") }).length, icon: "block", color: "#dc2626", bg: "#fee2e2" },
    { label: "Catalog Changes", value: auditLogs.filter(function(l) { return l.targetType === "medicine" }).length, icon: "medication", color: "#7c3aed", bg: "#f5f3ff" },
  ]

  var csvData = auditLogs.map(function(log) {
    return { ID: log.id, Action: log.action, Target: log.target, Type: log.targetType, Details: log.details, Date: log.date, Time: log.time, Admin: log.admin }
  })

 var typeLabels = {
  pharmacy: "Pharmacy",
  patient: "User",
  medicine: "Medicine",
  report: "Report",
  prescription: "Prescription"
}
 var typeColors = {
  pharmacy: {
    color: "#006a61",
    bg: "#e6f4f3"
  },

  patient: {
    color: "#1d4ed8",
    bg: "#eff6ff"
  },

  medicine: {
    color: "#7c3aed",
    bg: "#f5f3ff"
  },

  report: {
    color: "#dc2626",
    bg: "#fee2e2"
  },

  prescription: {
    color: "#b45309",
    bg: "#fffbeb"
  }
}
  // DETAIL VIEW
  if (selectedLog) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function() { setSelectedLog(null) }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>Audit Log Detail</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Viewing {selectedLog.id}</p>
          </div>
        </div>

        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #131b2e, #006a61)", borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ color: "white", fontSize: "32px" }}>{selectedLog.icon}</span>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "white", marginBottom: "4px" }}>{selectedLog.action}</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>{selectedLog.date} at {selectedLog.time}</p>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: (typeColors[selectedLog.targetType] || {color:"#64748b"}).color, background: "white", padding: "4px 14px", borderRadius: "999px" }}>
            {typeLabels[selectedLog.targetType] || selectedLog.targetType}
          </span>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Log ID", value: selectedLog.id, icon: "tag" },
            { label: "Action Performed", value: selectedLog.action, icon: "gavel" },
            { label: "Target", value: selectedLog.target, icon: "adjust" },
            { label: "Target Type", value: typeLabels[selectedLog.targetType] || selectedLog.targetType, icon: "category" },
            { label: "Date", value: selectedLog.date, icon: "calendar_today" },
            { label: "Time", value: selectedLog.time, icon: "schedule" },
          ].map(function(field) {
            return (
              <div key={field.label} style={{ background: "white", borderRadius: "16px", padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#006a61" }}>{field.icon}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>{field.label}</p>
                </div>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>{field.value}</p>
              </div>
            )
          })}
        </div>

        {/* Details Card */}
        <div style={{ background: "white", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "20px" }}>info</span>Action Details
          </h3>
          <div style={{ background: selectedLog.bg, borderRadius: "12px", padding: "16px 20px", border: "1px solid", borderColor: "rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: selectedLog.color, flexShrink: 0, marginTop: "2px" }}>{selectedLog.icon}</span>
              <p style={{ fontSize: "15px", color: "#0f172a", lineHeight: "1.6", fontWeight: "500" }}>{selectedLog.details}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MAIN VIEW
  return (
    <div>
      <div style={{ marginBottom: "32px", paddingTop: "16px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Audit Log</h1>
        <div style={{ height: "3px", width: "80px", background: "linear-gradient(90deg, #006a61, #4edea3)", borderRadius: "999px", marginBottom: "12px" }}></div>
        <p style={{ fontSize: "15px", color: "#64748b" }}>Full history of all admin actions performed on the Medspot platform.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        {stats.map(function(stat) {
          return (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: "20px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "160px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "24px", color: stat.color }}>{stat.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search + Export */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
          <input type="text" placeholder="Search by action, target or details..." value={search}
            onChange={function(e) { setSearch(e.target.value); setCurrentPage(1) }}
            style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box", fontWeight: "500" }}
            onFocus={function(e) { e.target.style.borderColor = "#006a61" }}
            onBlur={function(e) { e.target.style.borderColor = "#e2e8f0" }} />
        </div>
      </div>

      {/* Date Range */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>From:</span>
          <input type="date" value={dateFrom} onChange={function(e) { setDateFrom(e.target.value); setCurrentPage(1) }}
            style={{ padding: "10px 14px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", color: "#0f172a", background: "white" }}
            onFocus={function(e) { e.target.style.borderColor = "#006a61" }}
            onBlur={function(e) { e.target.style.borderColor = "#e2e8f0" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>To:</span>
          <input type="date" value={dateTo} onChange={function(e) { setDateTo(e.target.value); setCurrentPage(1) }}
            style={{ padding: "10px 14px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", color: "#0f172a", background: "white" }}
            onFocus={function(e) { e.target.style.borderColor = "#006a61" }}
            onBlur={function(e) { e.target.style.borderColor = "#e2e8f0" }} />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={function() { setDateFrom(""); setDateTo("") }}
            style={{ padding: "10px 16px", borderRadius: "12px", border: "2px solid #fee2e2", background: "white", color: "#dc2626", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            Clear Dates
          </button>
        )}
      </div>

      {/* Type Filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {typeFilterOptions.map(function(tab) {
          var tc = typeColors[tab] || { color: "#006a61" }
          var active = typeFilter === tab
          return (
            <button key={tab} onClick={function() { setTypeFilter(tab); setCurrentPage(1) }}
              style={{ padding: "8px 16px", borderRadius: "999px", border: "2px solid", borderColor: active ? (tab === "All" ? "#006a61" : tc.color) : "#e2e8f0", background: active ? (tab === "All" ? "#006a61" : tc.color) : "white", color: active ? "white" : "#64748b", fontWeight: "600", fontSize: "13px", cursor: "pointer", textTransform: "capitalize" }}>
              {tab === "All" ? "All Actions" : typeLabels[tab]}
            </button>
          )
        })}
      </div>

      {/* Log List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        {paginated.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px", background: "white", borderRadius: "20px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "56px", color: "#e2e8f0", display: "block", marginBottom: "12px" }}>history</span>
            <p style={{ fontSize: "15px", color: "#94a3b8", fontWeight: "600" }}>No audit logs found.</p>
          </div>
        )}
        {paginated.map(function(log) {
          var tc = typeColors[log.targetType] || { color: "#64748b", bg: "#f1f5f9" }
          return (
            <div key={log.id}
              onClick={function() { setSelectedLog(log) }}
              style={{ background: "white", borderRadius: "16px", padding: "18px 22px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", borderLeft: "4px solid " + log.color, display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)" }}
              onMouseLeave={function(e) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)" }}>

              {/* Icon */}
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: log.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: log.color }}>{log.icon}</span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{log.action}</p>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: tc.color, background: tc.bg, padding: "2px 10px", borderRadius: "999px" }}>{typeLabels[log.targetType] || log.targetType}</span>
                </div>
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>
                  Target: <strong style={{ color: "#374151" }}>{log.target}</strong>
                </p>
                <p style={{ fontSize: "12px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.details}</p>
              </div>

              {/* Right side */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{log.time}</p>
                <p style={{ fontSize: "12px", color: "#94a3b8" }}>{log.date}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{log.id}</p>
              </div>

              <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "18px", flexShrink: 0 }}>chevron_right</span>
            </div>
          )
        })}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={function(p) { setCurrentPage(p) }} />
    </div>
  )
}