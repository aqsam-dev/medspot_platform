import { useState, useEffect } from "react"
import Pagination from "../components/Pagination"
import AdminPageSkeleton from "../assets/ui/AdminPageSkeleton";


var ITEMS_PER_PAGE = 5

function StatusBadge(props) {
  var status = String(
    props.status || "uploaded"
  ).toLowerCase();

  var configs = {
    uploaded: {
      color: "#1d4ed8",
      bg: "#eff6ff",
      label: "Uploaded",
      icon: "upload_file"
    },

    processing: {
      color: "#b45309",
      bg: "#fffbeb",
      label: "Processing",
      icon: "pending"
    },

    processed: {
      color: "#006a61",
      bg: "#e6f4f3",
      label: "Processed",
      icon: "task_alt"
    },

    verified: {
      color: "#059669",
      bg: "#ecfdf5",
      label: "Verified",
      icon: "verified"
    },

    failed: {
      color: "#dc2626",
      bg: "#fee2e2",
      label: "Failed",
      icon: "error"
    },

    rejected: {
      color: "#dc2626",
      bg: "#fee2e2",
      label: "Rejected",
      icon: "cancel"
    }
  };

  var config =
    configs[status] ||
    configs.uploaded;

  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: "700",
        color: config.color,
        background: config.bg,
        padding: "4px 12px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px"
      }}
    >
      <span
        className=
          "material-symbols-outlined"
        style={{
          fontSize: "13px"
        }}
      >
        {config.icon}
      </span>

      {config.label}
    </span>
  );
}

export default function Prescriptions(props) {
  var showToast = props.showToast
  var [prescriptions, setPrescriptions] = useState([])
  var [loading, setLoading] = useState(true)
  var [search, setSearch] = useState("")
  var [statusFilter, setStatusFilter] = useState("All")
  var [view, setView] = useState("main")
  var [selected, setSelected] = useState(null)
  var [showDocModal, setShowDocModal] = useState(null)
  var [currentPage, setCurrentPage] = useState(1)
  var [allPage, setAllPage] = useState(1)
  useEffect(function () {
    fetchPrescriptions()
  }, [])

  async function fetchPrescriptions() {
    try {
      var response = await
        fetch("http://localhost:5000/api/admin/prescriptions")


      if (!response.ok) {
        throw new Error("Failed to fetch prescriptions")
      }

      var result = await response.json()

      var data = result.data

      var formattedData = data.map(function (item) {
return {
  id:
    "MP-" +
    item.prescription_no,

  uuid:
    item.id,

  prescriptionNo:
    item.prescription_no,

  patientId:
    item.patient_id,

  userName:
    item.patient_name ||
    "Unknown Patient",

  userEmail:
    item.patient_email ||
    "N/A",

  notes:
    item.notes ||
    "No Notes",

  medicine:
    Array.isArray(
      item.response_items
    ) &&
    item.response_items.length > 0
      ? item.response_items
          .map(function (medicine) {
            return medicine.medicine_name;
          })
          .join(", ")
      : "No medicines in response",

  medicines:
    Array.isArray(
      item.response_items
    )
      ? item.response_items
      : [],

  pharmacy:
    item.pharmacy_name ||
    "No Pharmacy",

  pharmacyResponse:
    item.response_type ||
    "No Response",

  totalPrice:
    Number(
      item.total_price
    ) || 0,

  dateUploaded:
    item.created_at
      ? new Date(
          item.created_at
        ).toLocaleDateString()
      : "N/A",

  dateResponded:
    item.response_date
      ? new Date(
          item.response_date
        ).toLocaleDateString()
      : "Pending",

  status:
    String(
      item.status ||
      "UPLOADED"
    ).toLowerCase(),

  ocrStatus:
    String(
      item.ocr_status ||
      "pending"
    ).toLowerCase(),

  file:
    item.image_url,

  fileType:
    item.image_url &&
    item.image_url
      .toLowerCase()
      .includes(".pdf")
      ? "pdf"
      : "image",

  latitude:
    item.latitude,

  longitude:
    item.longitude,

  radius:
    item.radius
};
      })

      setPrescriptions(formattedData)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

   if (loading) {
      return <AdminPageSkeleton/>;
   }


  var filtered = prescriptions.filter(function (p) {
    var matchSearch = (
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.userName.toLowerCase().includes(search.toLowerCase()) ||
      p.medicine.toLowerCase().includes(search.toLowerCase()) ||
      p.pharmacy.toLowerCase().includes(search.toLowerCase())
    )
    var matchStatus = statusFilter === "All" || p.status === statusFilter.toLowerCase()
    return matchSearch && matchStatus
  })

  var mainTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var mainPaginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  var allTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var allPaginated = filtered.slice((allPage - 1) * ITEMS_PER_PAGE, allPage * ITEMS_PER_PAGE)

var stats = [
  {
    label: "Total Prescriptions",
    value: prescriptions.length,
    icon: "description",
    color: "#006a61",
    bg: "#e6f4f3"
  },
  {
    label: "Uploaded",
    value: prescriptions.filter(
      function (prescription) {
        return (
          prescription.status ===
          "uploaded"
        );
      }
    ).length,
    icon: "upload_file",
    color: "#1d4ed8",
    bg: "#eff6ff"
  },
  {
    label: "Processed",
    value: prescriptions.filter(
      function (prescription) {
        return (
          prescription.status ===
          "processed"
        );
      }
    ).length,
    icon: "task_alt",
    color: "#059669",
    bg: "#ecfdf5"
  },
  {
    label: "Failed",
    value: prescriptions.filter(
      function (prescription) {
        return (
          prescription.status ===
          "failed"
        );
      }
    ).length,
    icon: "error",
    color: "#dc2626",
    bg: "#fee2e2"
  }
];

  var csvData = prescriptions.map(function (p) {
    return { ID: p.id, User: p.userName, Email: p.userEmail, Medicine: p.medicine, Pharmacy: p.pharmacy, PharmacyResponse: p.pharmacyResponse, DateUploaded: p.dateUploaded, Status: p.status, ReservationID: p.reservationId }
  })

  var docModal = showDocModal && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={function () { setShowDocModal(null) }}>
      <div style={{ background: "white", borderRadius: "24px", width: "100%", maxWidth: "520px", padding: "36px", boxShadow: "0 30px 80px rgba(0,0,0,0.3)" }}
        onClick={function (e) { e.stopPropagation() }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Prescription Document</h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>{showDocModal.id} — {showDocModal.medicine}</p>
          </div>
          <button onClick={function () { setShowDocModal(null) }} style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>close</span>
          </button>
        </div>
        <div style={{ background: "linear-gradient(135deg, #f8fafc, #e6f4f3)", borderRadius: "20px", padding: "48px 32px", textAlign: "center", border: "2px dashed #c7e8e4", marginBottom: "20px" }}>
          <img
            src={showDocModal.file}
            alt="Prescription"
            style={{
              width: "100%",
              maxHeight: "600px",
              objectFit: "contain",
              borderRadius: "12px"
            }}
          />
          <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>{showDocModal.file}</p>
          <p style={{ fontSize: "13px", color: "#64748b" }}>Uploaded by {showDocModal.userName}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Patient", value: showDocModal.userName },
            { label: "Medicine", value: showDocModal.medicine },
            { label: "Date Uploaded", value: showDocModal.dateUploaded },
            { label: "Status", value: showDocModal.status.charAt(0).toUpperCase() + showDocModal.status.slice(1) },
          ].map(function (f) {
            return (
              <div key={f.label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "10px 14px" }}>
                <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", marginBottom: "2px" }}>{f.label}</p>
                <p style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{f.value}</p>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center" }}></p>
      </div>
    </div>
  )

  var prescriptionTable = function (data) {
    return (
      <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #131b2e, #006a61)" }}>
                {["Prescription ID", "Patient", "Medicine", "Pharmacy", "Date", "Pharmacy Response", "Status", "Action"].map(function (col) {
                  return <th key={col} style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "15px" }}>No prescriptions found.</td></tr>}
              {data.map(function (rx, index) {
                return (
                  <tr key={rx.id}
                    style={{ borderBottom: "1px solid #f1f5f9", background: index % 2 === 0 ? "white" : "#fafafa" }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = "#f0fdf9" }}
                    onMouseLeave={function (e) { e.currentTarget.style.background = index % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: "#006a61" }}>{rx.id}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{rx.userName}</p>
                        <p style={{ fontSize: "11px", color: "#94a3b8" }}>{rx.userEmail}</p>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151", whiteSpace: "nowrap" }}>{rx.medicine}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151" }}>{rx.pharmacy}</td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{rx.dateUploaded}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "12px", color: rx.status === "verified" ? "#006a61" : rx.status === "rejected" ? "#dc2626" : "#b45309", fontWeight: "600" }}>
                        {rx.pharmacyResponse}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge status={rx.status} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={function () { setSelected(rx); setView("detail") }}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "7px 12px", borderRadius: "8px", border: "2px solid #006a61", background: "white", color: "#006a61", fontWeight: "700", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
                          onMouseEnter={function (e) { e.currentTarget.style.background = "#e6f4f3" }}
                          onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>visibility</span>View
                        </button>
                        <button onClick={function () { setShowDocModal(rx) }}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "7px 12px", borderRadius: "8px", border: "2px solid #7c3aed", background: "white", color: "#7c3aed", fontWeight: "700", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
                          onMouseEnter={function (e) { e.currentTarget.style.background = "#f5f3ff" }}
                          onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>description</span>Doc
                        </button>
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

  // DETAIL VIEW
  if (view === "detail" && selected) {
var statusConfig = {
  uploaded: {
    color: "#1d4ed8",
    bg: "#eff6ff",
    bannerBg:
      "linear-gradient(135deg, #1d4ed8, #60a5fa)"
  },

  processing: {
    color: "#b45309",
    bg: "#fffbeb",
    bannerBg:
      "linear-gradient(135deg, #92400e, #f59e0b)"
  },

  processed: {
    color: "#006a61",
    bg: "#e6f4f3",
    bannerBg:
      "linear-gradient(135deg, #006a61, #4edea3)"
  },

  verified: {
    color: "#059669",
    bg: "#ecfdf5",
    bannerBg:
      "linear-gradient(135deg, #059669, #34d399)"
  },

  failed: {
    color: "#dc2626",
    bg: "#fee2e2",
    bannerBg:
      "linear-gradient(135deg, #dc2626, #f87171)"
  },

  rejected: {
    color: "#dc2626",
    bg: "#fee2e2",
    bannerBg:
      "linear-gradient(135deg, #dc2626, #f87171)"
  }
}

var sc =
  statusConfig[selected.status] || statusConfig.uploaded

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main"); setSelected(null) }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>Prescription Detail</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Viewing {selected.id} — {selected.medicine}</p>
          </div>
        </div>

        {/* Banner */}
        <div style={{ background: sc.bannerBg, borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ color: "white", fontSize: "30px" }}>description</span>
            </div>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "white" }}>{selected.id}</h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>Uploaded on {selected.dateUploaded}</p>
            </div>
          </div>
          <StatusBadge status={selected.status} />
        </div>

        {/* Patient Info */}
        <div style={{ background: "white", borderRadius: "20px", padding: "24px 28px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "20px" }}>person</span>Patient Information
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { label: "Full Name", value: selected.userName, icon: "person" },
              { label: "Email", value: selected.userEmail, icon: "email" },
            ].map(function (field) {
              return (
                <div key={field.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#006a61" }}>{field.icon}</span>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>{field.label}</p>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{field.value}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Prescription Details */}
        <div style={{ background: "white", borderRadius: "20px", padding: "24px 28px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "20px" }}>medication</span>Prescription Details
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { label: "Medicine", value: selected.medicine, icon: "medication" },
              { label: "Quantity", value: selected.quantity + " units", icon: "inventory" },
              { label: "Date Uploaded", value: selected.dateUploaded, icon: "calendar_today" },
              { label: "Reservation ID", value: selected.reservationId, icon: "bookmark_check" },
            ].map(function (field) {
              return (
                <div key={field.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#006a61" }}>{field.icon}</span>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>{field.label}</p>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{field.value}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pharmacy Response */}
        <div style={{ background: "white", borderRadius: "20px", padding: "24px 28px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "20px" }}>local_pharmacy</span>Pharmacy Response
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#006a61" }}>store</span>
                <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Assigned Pharmacy</p>
              </div>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{selected.pharmacy}</p>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#006a61" }}>schedule</span>
                <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Date Responded</p>
              </div>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{selected.dateResponded}</p>
            </div>
          </div>
          <div style={{ background: selected.status === "verified" ? "#e6f4f3" : selected.status === "rejected" ? "#fee2e2" : "#fffbeb", borderRadius: "12px", padding: "16px 20px", border: "1px solid " + (selected.status === "verified" ? "#c7e8e4" : selected.status === "rejected" ? "#fecaca" : "#fde68a") }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: sc.color }}>
                {selected.status === "verified" ? "check_circle" : selected.status === "rejected" ? "cancel" : "info"}
              </span>
              <p style={{ fontSize: "14px", fontWeight: "700", color: sc.color }}>{selected.pharmacyResponse}</p>
            </div>
          </div>
        </div>

        {/* Document */}
        <div style={{ background: "white", borderRadius: "20px", padding: "24px 28px", marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "20px" }}>folder_open</span>Prescription File
          </h3>
          <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "24px" }}>
                  {selected.fileType === "pdf" ? "picture_as_pdf" : "image"}
                </span>
              </div>
              <div>
                <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{selected.file}</p>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>{selected.fileType.toUpperCase()} • Uploaded {selected.dateUploaded}</p>
              </div>
            </div>
            <button onClick={function () { setShowDocModal(selected) }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "2px solid #006a61", background: "white", color: "#006a61", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "#e6f4f3" }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>View Document
            </button>
          </div>
        </div>

       <div
  style={{
    textAlign: "center",
    padding: "20px",
    borderRadius: "16px",
    background: sc.bg
  }}
>
  <p
    style={{
      fontWeight: "700",
      color: sc.color,
      fontSize: "15px"
    }}
  >
    Current prescription status:{" "}
    {selected.status
      .charAt(0)
      .toUpperCase() +
      selected.status.slice(1)}
  </p>
</div>
        {docModal}
      </div>
    )
  }

  // ALL PRESCRIPTIONS PAGE
  if (view === "all") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main") }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>All Prescriptions</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>{prescriptions.length} prescriptions on the platform</p>
          </div>

        </div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
            <input type="text" placeholder="Search prescriptions..." value={search}
              onChange={function (e) { setSearch(e.target.value); setAllPage(1) }}
              style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box" }}
              onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
              onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {[
  "All",
  "Uploaded",
  "Processing",
  "Processed",
  "Verified",
  "Failed"
].map(function (tab) {

  
var colors = {
  All: "#006a61",
  Uploaded: "#1d4ed8",
  Processing: "#b45309",
  Processed: "#006a61",
  Verified: "#059669",
  Failed: "#dc2626"
}
            var active = statusFilter === tab
            return (
              <button key={tab} onClick={function () { setStatusFilter(tab); setAllPage(1) }}
                style={{ padding: "8px 18px", borderRadius: "999px", border: "2px solid", borderColor: active ? colors[tab] : "#e2e8f0", background: active ? colors[tab] : "white", color: active ? "white" : "#64748b", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                {tab}
              </button>
            )
          })}
        </div>
        {prescriptionTable(allPaginated)}
        <Pagination currentPage={allPage} totalPages={allTotalPages} onPageChange={function (p) { setAllPage(p) }} />
        {docModal}
      </div>
    )
  }

  // MAIN VIEW
  return (
    <div>
      <div style={{ marginBottom: "32px", paddingTop: "16px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Prescription Management</h1>
        <div style={{ height: "3px", width: "80px", background: "linear-gradient(90deg, #006a61, #4edea3)", borderRadius: "999px", marginBottom: "12px" }}></div>
        <p style={{ fontSize: "15px", color: "#64748b" }}>Track, verify and manage all medical prescriptions uploaded by users across the platform.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        {stats.map(function (stat) {
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
          <input type="text" placeholder="Search by ID, user, medicine or pharmacy..." value={search}
            onChange={function (e) { setSearch(e.target.value); setCurrentPage(1) }}
            style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box", fontWeight: "500" }}
            onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
            onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
        </div>

      </div>

      {/* Status Filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
  "All",
  "Uploaded",
  "Processing",
  "Processed",
  "Verified",
  "Failed"
].map(function (tab) {
          var colors = { All: "#006a61", Verified: "#059669", Pending: "#b45309", Rejected: "#dc2626" }
          var active = statusFilter === tab
          return (
            <button key={tab} onClick={function () { setStatusFilter(tab); setCurrentPage(1) }}
              style={{ padding: "8px 18px", borderRadius: "999px", border: "2px solid", borderColor: active ? colors[tab] : "#e2e8f0", background: active ? colors[tab] : "white", color: active ? "white" : "#64748b", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
              {tab}
            </button>
          )
        })}
      </div>

      {/* Table heading + View All */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "22px" }}>table_chart</span>
          All Prescriptions
        </h2>
        <button onClick={function () { setView("all") }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
          onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
          onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>open_in_full</span>View All
        </button>
      </div>

      {prescriptionTable(mainPaginated)}
      <Pagination currentPage={currentPage} totalPages={mainTotalPages} onPageChange={function (p) { setCurrentPage(p) }} />
      {docModal}
    </div>
  )
}