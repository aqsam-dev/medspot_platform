import { useState, useEffect } from "react"

export function useToast() {
  var [toasts, setToasts] = useState([])

  function showToast(message, type) {
    var id = Date.now()
    var t = type || "success"
    setToasts(function(prev) { return [...prev, { id: id, message: message, type: t }] })
    setTimeout(function() {
      setToasts(function(prev) { return prev.filter(function(toast) { return toast.id !== id }) })
    }, 3000)
  }

  return { toasts: toasts, showToast: showToast }
}

export default function Toast(props) {
  var toasts = props.toasts

  var configs = {
    success: { bg: "#006a61", icon: "check_circle" },
    error: { bg: "#dc2626", icon: "error" },
    warning: { bg: "#b45309", icon: "warning" },
    info: { bg: "#1d4ed8", icon: "info" },
  }

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px" }}>
      {toasts.map(function(toast) {
        var config = configs[toast.type] || configs.success
        return (
          <div key={toast.id}
            style={{ background: config.bg, color: "white", padding: "14px 20px", borderRadius: "14px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: "10px", minWidth: "280px", animation: "slideIn 0.3s ease" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{config.icon}</span>
            <p style={{ fontSize: "14px", fontWeight: "600" }}>{toast.message}</p>
          </div>
        )
      })}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  )
}