export default function Pagination(props) {
  var currentPage = props.currentPage
  var totalPages = props.totalPages
  var onPageChange = props.onPageChange

  if (totalPages <= 1) return null

  var pages = []
  for (var i = 1; i <= totalPages; i++) { pages.push(i) }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "between", marginTop: "20px", gap: "8px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <button
          onClick={function() { onPageChange(currentPage - 1) }}
          disabled={currentPage === 1}
          style={{ width: "36px", height: "36px", borderRadius: "10px", border: "2px solid #e2e8f0", background: currentPage === 1 ? "#f8fafc" : "white", color: currentPage === 1 ? "#cbd5e1" : "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
        </button>

        {pages.map(function(page) {
          return (
            <button key={page} onClick={function() { onPageChange(page) }}
              style={{ width: "36px", height: "36px", borderRadius: "10px", border: "2px solid", borderColor: currentPage === page ? "#006a61" : "#e2e8f0", background: currentPage === page ? "#006a61" : "white", color: currentPage === page ? "white" : "#374151", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
              {page}
            </button>
          )
        })}

        <button
          onClick={function() { onPageChange(currentPage + 1) }}
          disabled={currentPage === totalPages}
          style={{ width: "36px", height: "36px", borderRadius: "10px", border: "2px solid #e2e8f0", background: currentPage === totalPages ? "#f8fafc" : "white", color: currentPage === totalPages ? "#cbd5e1" : "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
        </button>
      </div>
      <p style={{ fontSize: "13px", color: "#64748b", marginLeft: "8px" }}>
        Page {currentPage} of {totalPages}
      </p>
    </div>
  )
}