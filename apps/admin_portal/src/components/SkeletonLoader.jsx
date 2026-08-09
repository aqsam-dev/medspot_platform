function SkeletonBox(props) {
  var width = props.width || "100%"
  var height = props.height || "16px"
  var radius = props.radius || "8px"
  var style = props.style || {}

  return (
    <div style={{
      width: width,
      height: height,
      borderRadius: radius,
      background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style
    }} />
  )
}

export function StatCardSkeleton() {
  return (
    <div style={{ background: "#f8fafc", borderRadius: "20px", padding: "24px 28px", display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "180px" }}>
      <SkeletonBox width="56px" height="56px" radius="16px" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonBox width="60px" height="28px" radius="8px" />
        <SkeletonBox width="120px" height="14px" radius="6px" />
      </div>
    </div>
  )
}

export function TableSkeleton(props) {
  var rows = props.rows || 5
  var cols = props.cols || 5
  return (
    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
      <div style={{ background: "linear-gradient(135deg, #131b2e, #006a61)", padding: "14px 20px", display: "flex", gap: "20px" }}>
        {Array.from({ length: cols }).map(function(_, i) {
          return <SkeletonBox key={i} width="80px" height="12px" radius="4px" style={{ opacity: 0.3 }} />
        })}
      </div>
      {Array.from({ length: rows }).map(function(_, i) {
        return (
          <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "20px", alignItems: "center", background: i % 2 === 0 ? "white" : "#fafafa" }}>
            <SkeletonBox width="36px" height="36px" radius="50%" />
            <SkeletonBox width="120px" height="14px" />
            <SkeletonBox width="160px" height="14px" />
            <SkeletonBox width="80px" height="14px" />
            <SkeletonBox width="60px" height="24px" radius="999px" />
          </div>
        )
      })}
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div style={{ background: "white", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "12px" }}>
      <SkeletonBox width="60%" height="18px" />
      <SkeletonBox width="100%" height="14px" />
      <SkeletonBox width="80%" height="14px" />
      <SkeletonBox width="40%" height="14px" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <SkeletonBox width="280px" height="32px" radius="10px" />
        <div style={{ marginTop: "8px" }}><SkeletonBox width="400px" height="16px" radius="6px" /></div>
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <TableSkeleton rows={5} cols={5} />
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  )
}

export default SkeletonBox