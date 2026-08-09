import { useState, useEffect } from "react"
import Pagination from "../components/Pagination"
import AdminPageSkeleton from "../assets/ui/AdminPageSkeleton";


function StatusBadge(props) {
  var status = String(
    props.status || "active"
  ).toLowerCase()

  var configs = {
    active: {
      color: "#1d4ed8",
      bg: "#eff6ff",
      label: "Active"
    },

    completed: {
      color: "#006a61",
      bg: "#e6f4f3",
      label: "Completed"
    },

    cancelled: {
      color: "#dc2626",
      bg: "#fee2e2",
      label: "Cancelled"
    },

    expired: {
      color: "#9f1239",
      bg: "#fff1f2",
      label: "Expired"
    }
  }

  var c =
    configs[status] ||
    configs.active

  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: "700",
        color: c.color,
        background: c.bg,
        padding: "4px 12px",
        borderRadius: "999px",
        whiteSpace: "nowrap"
      }}
    >
      {c.label}
    </span>
  )
}

var ITEMS_PER_PAGE = 5

export default function Reservations(props) {
  const [reservations, setReservations] = useState([]);

  const reservationsArray = Array.isArray(reservations)
    ? reservations
    : reservations?.data || []

  useEffect(() => {
    fetchReservations()
  }, [])
async function fetchReservations() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/reservations"
    );

    const result =
      await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
        "Failed to fetch reservations"
      );
    }

    const formatted =
      result.data.map(
        function (reservation) {
          return {
            ...reservation,

            reservationId:
              Number(
                reservation.reservationId
              ),

            userId:
              Number(
                reservation.userId
              ),

            pharmacyId:
              Number(
                reservation.pharmacyId
              ),

            quantity:
              Number(
                reservation.quantity
              ) || 0,

            totalAmount:
              Number(
                reservation.totalAmount
              ) || 0,

            medicines:
              reservation.medicines ||
              [],

            status:
              String(
                reservation.status ||
                "active"
              ).toLowerCase(),

            reservationType:
              String(
                reservation.reservationType ||
                "search"
              ).toLowerCase(),

            date:
              new Date(
                reservation.createdAt
              ).toLocaleDateString()
          };
        }
      );

    setReservations(formatted);

  } catch (error) {
    console.error(
      "FETCH RESERVATIONS ERROR:",
      error
    );

    if (showToast) {
      showToast(
        error.message,
        "error"
      );
    }
  }
}


  var showToast = props.showToast
  var [search, setSearch] = useState("")
  var [statusFilter, setStatusFilter] = useState("All")
  var [view, setView] = useState("main")
  var [selected, setSelected] = useState(null)
  var [showPrescriptionModal, setShowPrescriptionModal] = useState(null)
  var [currentPage, setCurrentPage] = useState(1)
  var [allPage, setAllPage] = useState(1)


  var filtered = reservationsArray.filter(function (r) {
    var matchSearch =
      (r.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.userName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.pharmacy || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.medicine || "").toLowerCase().includes(search.toLowerCase())
    var matchStatus = statusFilter === "All" || r.status === statusFilter.toLowerCase()
    return matchSearch && matchStatus
  })

  var mainTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var mainPaginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  var allTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var allPaginated = filtered.slice((allPage - 1) * ITEMS_PER_PAGE, allPage * ITEMS_PER_PAGE)

  var stats =[
{
label:"Total Reservations",
value:reservationsArray.length,
icon:"bookmark_check",
color:"#006a61",
bg:"#e6f4f3"
},
{
label:"Active",
value:reservationsArray.filter(r=>r.status==="active").length,
icon:"schedule",
color:"#1d4ed8",
bg:"#eff6ff"
},
{
label:"Completed",
value:reservationsArray.filter(r=>r.status==="completed").length,
icon:"check_circle",
color:"#006a61",
bg:"#e6f4f3"
},
{
label:"Expired",
value:reservationsArray.filter(r=>r.status==="expired").length,
icon:"timer_off",
color:"#dc2626",
bg:"#fee2e2"
}
]

var prescriptionModal =
  showPrescriptionModal && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
      onClick={function () {
        setShowPrescriptionModal(null)
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "900px",
          padding: "24px",
          boxShadow:
            "0 25px 60px rgba(0,0,0,0.3)"
        }}
        onClick={function (e) {
          e.stopPropagation()
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#0f172a"
            }}
          >
            Prescription Document
          </h3>

          <button
            onClick={function () {
              setShowPrescriptionModal(
                null
              )
            }}
            style={{
              background:
                "rgba(0,0,0,0.05)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <span
              className=
                "material-symbols-outlined"
              style={{
                fontSize: "18px",
                color: "#374151"
              }}
            >
              close
            </span>
          </button>
        </div>

        <div
          style={{
            width: "100%",
            height: "70vh",
            borderRadius: "16px",
            overflow: "hidden",
            background: "#f8fafc",
            border:
              "1px solid #e2e8f0"
          }}
        >
          {showPrescriptionModal
            .toLowerCase()
            .includes(".pdf") ? (
            <iframe
              src={
                showPrescriptionModal
              }
              title="Prescription"
              width="100%"
              height="100%"
              style={{
                border: "none"
              }}
            />
          ) : (
            <img
              src={
                showPrescriptionModal
              }
              alt="Prescription"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain"
              }}
            />
          )}
        </div>
      </div>
    </div>
  )

  var reservationTable = function (data) {
    return (
      <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #131b2e, #006a61)" }}>
                {["Reservation ID", "User", "Pharmacy", "Medicine", "Date", "Status", "Action"].map(function (col) {
                  return <th key={col} style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "15px" }}>No reservations found.</td></tr>}
              {data.map(function (res, index) {
                return (
                  <tr key={res.id}
                    style={{ borderBottom: "1px solid #f1f5f9", background: index % 2 === 0 ? "white" : "#fafafa" }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = "#f0fdf9" }}
                    onMouseLeave={function (e) { e.currentTarget.style.background = index % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "700", color: "#006a61" }}>{res.id}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{res.userName}</p>
                        <p style={{ fontSize: "12px", color: "#94a3b8" }}>{res.userEmail}</p>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#374151" }}>{res.pharmacy}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#374151" }}>{res.medicine}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b", whiteSpace: "nowrap" }}>{res.date}</td>
                    <td style={{ padding: "14px 20px" }}><StatusBadge status={res.status} /></td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={function () { setSelected(res); setView("detail") }}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "7px 12px", borderRadius: "8px", border: "2px solid #006a61", background: "white", color: "#006a61", fontWeight: "700", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
                          onMouseEnter={function (e) { e.currentTarget.style.background = "#e6f4f3" }}
                          onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>visibility</span>View
                        </button>
{res.reservationType==="prescription" &&
res.prescription && (

<button
onClick={()=>{
setShowPrescriptionModal(
res.prescription.imageUrl
)
}}
style={{
display:"flex",
alignItems:"center",
gap:"4px",
padding:"7px 12px",
borderRadius:"8px",
border:"2px solid #7c3aed",
background:"white",
color:"#7c3aed",
fontWeight:"700",
fontSize:"12px",
cursor:"pointer"
}}
>
<span
className="material-symbols-outlined"
style={{fontSize:"14px"}}
>
description
</span>

Rx

</button>

)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  var searchAndFilter = function (onSearch, onFilter) {
    return (
      <>
        <div style={{ position: "relative", marginBottom: "16px", maxWidth: "480px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
          <input type="text" placeholder="Search by ID, user, pharmacy or medicine..." value={search}
            onChange={function (e) { setSearch(e.target.value); onSearch() }}
            style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box", fontWeight: "500" }}
            onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
            onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
"All",
"Active",
"Completed",
"Cancelled",
"Expired"
].map(function (tab) {
            return (
              <button key={tab} onClick={function () { setStatusFilter(tab); onFilter() }}
                style={{ padding: "8px 16px", borderRadius: "999px", border: "2px solid", borderColor: statusFilter === tab ? "#006a61" : "#e2e8f0", background: statusFilter === tab ? "#006a61" : "white", color: statusFilter === tab ? "white" : "#64748b", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                {tab}
              </button>
            )
          })}
        </div>
      </>
    )
  }

  // DETAIL VIEW
  if (view === "detail" && selected) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main"); setSelected(null) }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>Reservation Detail</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Viewing {selected.id}</p>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #131b2e, #006a61)", borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ color: "white", fontSize: "28px" }}>bookmark_check</span>
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "white" }}>{selected.id}</h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>{selected.date}</p>
            </div>
          </div>
          <StatusBadge status={selected.status} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "User Name", value: selected.userName, icon: "person" },
            { label: "Email", value: selected.userEmail, icon: "email" },
            { label: "Pharmacy", value: selected.pharmacy, icon: "local_pharmacy" },
            {
              label: "Medicines",
              value: selected.medicines
                ?.map((m) => `${m.medicine_name} (${m.quantity})`)
                .join(", "),
              icon: "medication"
            },
{
  label: "Quantity",
  value: selected.quantity + " units",
  icon: "inventory"
},
{
  label: "Total Amount",
  value:
    "PKR " +
    Number(
      selected.totalAmount || 0
    ).toLocaleString(),
  icon: "payments"
},
{
  label: "Date",
  value: selected.date,
  icon: "calendar_today"
},
{
  label: "Reservation Type",
  value:
    selected.reservationType ===
    "prescription"
      ? "Prescription"
      : "Medicine Search",
  icon: "category"
},
          ].map(function (field) {
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
{selected.reservationType ===
  "prescription" &&
selected.prescription ? (
  <div
    style={{
      background: "white",
      borderRadius: "20px",
      padding: "24px 28px",
      marginBottom: "24px",
      boxShadow:
        "0 2px 12px rgba(0,0,0,0.04)",
      border: "1px solid #f1f5f9"
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px"
      }}
    >
      <div>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              color: "#006a61",
              fontSize: "20px"
            }}
          >
            description
          </span>

          Prescription Attached
        </h3>

        <p
          style={{
            fontSize: "13px",
            color: "#64748b",
            marginBottom: "5px"
          }}
        >
          Prescription No:{" "}
          {selected.prescription
            .prescriptionNo || "N/A"}
        </p>

        <p
          style={{
            fontSize: "13px",
            color: "#64748b"
          }}
        >
          Notes:{" "}
          {selected.prescription.notes ||
            "No notes"}
        </p>
      </div>

      {selected.prescription.imageUrl && (
        <button
          onClick={function () {
            setShowPrescriptionModal(
              selected.prescription.imageUrl
            )
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: "#006a61",
            color: "white",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "17px"
            }}
          >
            visibility
          </span>

          View Prescription
        </button>
      )}
    </div>
  </div>
) : (
  <div
    style={{
      background: "white",
      borderRadius: "20px",
      padding: "24px 28px",
      marginBottom: "24px",
      boxShadow:
        "0 2px 12px rgba(0,0,0,0.04)",
      border: "1px solid #f1f5f9"
    }}
  >
    <p
      style={{
        fontSize: "14px",
        color: "#94a3b8",
        textAlign: "center"
      }}
    >
      This reservation was made through
      medicine search. No prescription is
      attached.
    </p>
  </div>
)}

{prescriptionModal}
      </div>
    )
  }

  // ALL RESERVATIONS VIEW
  if (view === "all") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main") }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>All Reservations</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>{reservationsArray.length} total reservations on the platform</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
          {stats.map(function (stat) {
            return (
              <div key={stat.label} style={{ background: stat.bg, borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "140px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: stat.color }}>{stat.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>{stat.label}</div>
                </div>
              </div>
            )
          })}
        </div>
        {searchAndFilter(function () { setAllPage(1) }, function () { setAllPage(1) })}
        {reservationTable(allPaginated)}
        <Pagination currentPage={allPage} totalPages={allTotalPages} onPageChange={function (p) { setAllPage(p) }} />
        {prescriptionModal}
      </div>
    )
  }

  // MAIN VIEW
  return (
    <div>
      <div style={{ marginBottom: "32px", paddingTop: "16px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Reservations</h1>
        <div style={{ height: "3px", width: "80px", background: "linear-gradient(90deg, #006a61, #4edea3)", borderRadius: "999px", marginBottom: "12px" }}></div>
        <p style={{ fontSize: "15px", color: "#64748b" }}>Monitor and manage all medicine reservations across the platform.</p>
      </div>
      <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        {stats.map(function (stat) {
          return (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: "20px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "160px" }}>
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
      {searchAndFilter(function () { setCurrentPage(1) }, function () { setCurrentPage(1) })}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "22px" }}>table_chart</span>
          All Reservations
        </h2>
        <button onClick={function () { setView("all") }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
          onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
          onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>open_in_full</span>
          View All
        </button>
      </div>
      {reservationTable(mainPaginated)}
      <Pagination currentPage={currentPage} totalPages={mainTotalPages} onPageChange={function (p) { setCurrentPage(p) }} />
      {prescriptionModal}
    </div>
  )
}