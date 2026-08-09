export default function Modal(props) {
  var show = props.show
  var onClose = props.onClose
  var title = props.title
  var children = props.children
  var width = props.width || "400px"
  var hideClose = props.hideClose || false

  if (!show) return null

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: "24px" }}
      onClick={onClose}>
      <div
        style={{ background: "white", borderRadius: "24px", padding: "32px", width: width, maxWidth: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", position: "relative", zIndex: 101, maxHeight: "90vh", overflowY: "auto" }}
        onClick={function(e) { e.stopPropagation() }}>
        {!hideClose && (
          <button
            onClick={onClose}
            style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#374151" }}>close</span>
          </button>
        )}
        {title && (
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "24px", paddingRight: "32px" }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}