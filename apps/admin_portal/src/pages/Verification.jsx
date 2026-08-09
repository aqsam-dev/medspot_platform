import { useState, useEffect } from "react"
import AdminPageSkeleton from "../assets/ui/AdminPageSkeleton";

var API_URL = "http://localhost:5000/api/admin"


export default function Verification(props) {
  const showToast = props.showToast
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const [statuses, setStatuses] = useState({})
  const [showDocModal, setShowDocModal] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDetails, setSelectedDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("pending");
  useEffect(() => {
    fetchRequests();
  }, []);

async function fetchRequests() {
  try {
    setLoading(true);

    const response = await fetch(
      `${API_URL}/pharmacy-verification/pending`
    );

    console.log("Response Status:", response.status);

    const data = await response.json();

    console.log("Pending Pharmacies Response:", data);

    if (!data.success) {
      console.error("API Error:", data);
      return;
    }

    const formatted = data.data.map((item) => ({
      id: item.pharmacy_id,
      pharmacyName: item.pharmacy_name,
      pharmacistName: item.pharmacist_name || "N/A",
      email: item.owner_email,
      phone: item.owner_phone,
      address: `${item.area}, ${item.city}`,
      dateSubmitted: new Date(item.created_at).toLocaleDateString(),
      license_url: item.license_url,
      pharmacist_license_url: item.pharmacist_license_url,
      status: item.verification_status
    }));

    console.log("Formatted Requests:", formatted);

    setRequests(formatted);

    const statusMap = {};

    formatted.forEach((r) => {
      statusMap[r.id] = r.status;
    });

    setStatuses(statusMap);

  } catch (err) {
    console.error("Fetch Requests Error:", err);
  } finally {
    setLoading(false);
  }
}
 async function fetchPharmacyDetails(id) {
  console.log("Selected Pharmacy ID:", id);

  try {
    setDetailsLoading(true);

    const response = await fetch(`${API_URL}/pharmacies/${id}`);

    console.log("HTTP Status:", response.status);

    if (!response.ok) {
      throw new Error("Failed to fetch pharmacy details");
    }

    const result = await response.json();

    console.log("Complete API Response:", result);

    console.log("Latitude:", result.map_lat);
    console.log("Longitude:", result.map_lng);

    setSelectedDetails(result);

  } catch (err) {
    console.error("Fetch Pharmacy Details Error:", err);
  } finally {
    setDetailsLoading(false);
  }
}


var filtered = requests.filter((r) => {

  const matchesSearch =
    r.pharmacyName.toLowerCase().includes(search.toLowerCase()) ||
    r.pharmacistName.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    activeFilter === "all"
      ? true
      : r.status === activeFilter;

  return matchesSearch && matchesStatus;
});


  function getStatus(id) { return statuses[id] || "pending" }
  async function handleAccept(id) {

    try {

      const response = await fetch(
        `${API_URL}/pharmacy-verification/${id}/approve`, {
        method: "PUT"
      })

      const data = await response.json()

      if (data.success) {

        setStatuses(prev => ({
          ...prev,
          [id]: "approved"
        }))

        showToast(
          "Pharmacy Approved",
          "success"
        )

        fetchRequests()

        setSelected(null)
      }
    } catch (err) {
      console.log(err)
    }
  }

  async function handleReject(id) {
    try {
      const response = await fetch(
        `${API_URL}/pharmacy-verification/${id}/reject`, {
        method: "PUT"
      })

      const data = await response.json()
      if (data.success) {

        setStatuses(prev => ({
          ...prev,
          [id]: "rejected"
        }))

        showToast(
          "Pharmacy rejected",
          "error"
        )

        fetchRequests()

        setSelected(null)
      }

    } catch (err) {
      console.log(err)
    }
  }

  function statusBadge(status) {
    if (status === "approved") return { label: "Approved", color: "#006a61", bg: "#e6f4f3" }
    if (status === "rejected") return { label: "Rejected", color: "#dc2626", bg: "#fee2e2" }
    return { label: "Pending", color: "#b45309", bg: "#fffbeb" }
  }

  if (selected && detailsLoading) {
    return <AdminPageSkeleton />;
  }

if (selected && selectedDetails) {
    return (
      <div>
        {/* 1. ← Back & Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <button onClick={function () {
            setSelected(null)
            setSelectedDetails(null)
          }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>Pharmacy Request Detail</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Reviewing application from {selected.pharmacyName}</p>
          </div>
        </div>

        {/* 2. Hero Banner */}
        <div style={{ background: getStatus(selected.id) === "approved" ? "linear-gradient(135deg, #006a61, #4edea3)" : getStatus(selected.id) === "rejected" ? "linear-gradient(135deg, #dc2626, #f87171)" : "linear-gradient(135deg, #131b2e, #006a61)", borderRadius: "20px", padding: "28px 32px", marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ color: "white", fontSize: "30px" }}>local_pharmacy</span>
            </div>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "white" }}>{selected.pharmacyName}</h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>Submitted on {selected.dateSubmitted}</p>
            </div>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", color: statusBadge(getStatus(selected.id)).color, background: "white", padding: "6px 18px", borderRadius: "999px" }}>
            {statusBadge(getStatus(selected.id)).label}
          </span>
        </div>

        {/* 3. Information Cards (Grid with Address spanning full width) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Pharmacy Name", value: selectedDetails.pharmacy_name, icon: "store" },
            { label: "Owner Name", value: selectedDetails.owner_name, icon: "person" },
            { label: "Owner Email", value: selectedDetails.owner_email, icon: "email" },
            { label: "Owner Phone", value: selectedDetails.owner_phone, icon: "phone" },
            { label: "Owner CNIC", value: selectedDetails.owner_cnic, icon: "badge" },
            { label: "Pharmacist", value: selectedDetails.pharmacist_name, icon: "medical_services" },
            { label: "Qualification", value: selectedDetails.qualification, icon: "school" },
            { label: "Pharmacist Email", value: selectedDetails.pharmacist_email, icon: "alternate_email" },
            { label: "Pharmacist CNIC", value: selectedDetails.pharmacist_cnic, icon: "badge" },
            { label: "Years in Operation", value: selectedDetails.years_in_operation, icon: "schedule" },
            { label: "Address", value: selectedDetails.full_address, icon: "location_on", fullWidth: true },
          ].map(function (field) {
            return (
              <div 
                key={field.label} 
                style={{ 
                  background: "white", 
                  borderRadius: "16px", 
                  padding: "18px 20px", 
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)", 
                  border: "1px solid #f1f5f9",
                  gridColumn: field.fullWidth ? "span 2" : "span 1"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#006a61" }}>{field.icon}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>{field.label}</p>
                </div>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>
                  {typeof field.value === "object" ? JSON.stringify(field.value, null, 2) : field.value}
                </p>
              </div>
            )
          })}
        </div>

        {/* 4. Pharmacy Location & Exact Coordinates Google Map */}
        <div style={{ background: "white", borderRadius: "20px", padding: "24px", marginBottom: "32px", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61" }}>location_on</span> Pharmacy Location
          </h3>
          <p style={{ marginBottom: "20px", fontWeight: "500", color: "#475569", fontSize: "15px" }}>{selectedDetails.full_address}</p>
          <iframe
            title="map"
            width="100%"
            height="300"
            style={{ border: "none", borderRadius: "16px" }}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${selectedDetails.map_lat},${selectedDetails.map_lng}&z=17&output=embed`}
          />
        </div>

        {/* 5. Operating Hours (Enhanced status coloring and layout) */}
        <div style={{ background: "white", borderRadius: "20px", padding: "24px", marginBottom: "32px", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61" }}>schedule</span> Operating Hours
          </h3>
          {selectedDetails.operating_hours &&
            Object.entries(selectedDetails.operating_hours).map(([day, time]) => (
              <div key={day} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontWeight: "600", textTransform: "capitalize", color: "#334155" }}>{day}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {time?.isOpen ? (
                    <>
                      <span style={{ color: "#10b981", fontWeight: "700", fontSize: "14px" }}>🟢 Open</span>
                      <span style={{ color: "#64748b", fontSize: "14px", marginLeft: "8px" }}>{time.open} - {time.close}</span>
                    </>
                  ) : (
                    <span style={{ color: "#ef4444", fontWeight: "700", fontSize: "14px" }}>🔴 Closed</span>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* 6. Supporting Documents */}
        <div style={{ background: "white", borderRadius: "20px", padding: "24px 28px", marginBottom: "32px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "22px" }}>folder_open</span> Supporting Documents
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Pharmacy License", number: selectedDetails.license_url, icon: "verified", description: "Verified Pharmacy Registration Certificate" },
              { label: "Pharmacist License", number: selectedDetails.pharmacist_license_url, icon: "badge", description: "Official Pharmacist Registration Certificate Roll" },
            ].map(function (doc) {
              return (
                <div key={doc.label} style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "24px" }}>{doc.icon}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>📄 {doc.label}</p>
                      <p style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{doc.description}</p>
                    </div>
                  </div>
                  <button onClick={function () { setShowDocModal(doc) }}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "2px solid #006a61", background: "white", color: "#006a61", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = "#e6f4f3" }}
                    onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>View
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* 7. Action Buttons (Reject Application / Approve Application) */}
        {getStatus(selected.id) === "pending" ? (
          <div style={{ display: "flex", gap: "16px" }}>
            <button onClick={function () { handleReject(selected.id) }}
              style={{ flex: 1, padding: "16px", borderRadius: "16px", border: "2px solid #fee2e2", background: "white", color: "#dc2626", fontWeight: "700", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "#fee2e2" }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>cancel</span>Reject Application
            </button>
            <button onClick={function () { handleAccept(selected.id) }}
              style={{ flex: 1, padding: "16px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
              onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>check_circle</span>Approve Application
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", borderRadius: "16px", background: getStatus(selected.id) === "approved" ? "#e6f4f3" : "#fee2e2" }}>
            <p style={{ fontWeight: "700", color: getStatus(selected.id) === "approved" ? "#006a61" : "#dc2626", fontSize: "16px" }}>
              This application has been {getStatus(selected.id)}.
            </p>
          </div>
        )}

        {/* Document Modal supporting Image and PDF viewports */}
        {showDocModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
            onClick={function () { setShowDocModal(null) }}>
            <div style={{ background: "white", borderRadius: "20px", width: "100%", maxWidth: "680px", padding: "32px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}
              onClick={function (e) { e.stopPropagation() }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{showDocModal.label}</h3>
                <button onClick={function () { setShowDocModal(null) }} style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#374151" }}>close</span>
                </button>
              </div>
              <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                {typeof showDocModal.number === "string" && showDocModal.number.toLowerCase().endsWith(".pdf") ? (
                  <iframe 
                    src={showDocModal.number} 
                    title={showDocModal.label} 
                    style={{ width: "100%", height: "500px", border: "1px solid #e2e8f0", borderRadius: "12px" }}
                  />
                ) : (
                  <img src={showDocModal.number} alt="document viewport" style={{ width: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "12px" }} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: "32px", paddingTop: "16px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Pharmacy Verification Center</h1>
        <div style={{ height: "3px", width: "80px", background: "linear-gradient(90deg, #006a61, #4edea3)", borderRadius: "999px", marginBottom: "12px" }}></div>
        <p style={{ fontSize: "15px", color: "#64748b" }}>Review and authenticate pharmacy applications submitted for registration.</p>
      </div>

<div
  style={{
    display: "flex",
    gap: "16px",
    marginBottom: "28px",
    flexWrap: "wrap",
  }}
>
  {[
    {
      label: "All",
      value: requests.length,
      color: "#006a61",
      bg: "#e6f4f3",
      icon: "inbox",
      filter: "all",
    },
    {
      label: "Pending",
      value: requests.filter(
        (r) => getStatus(r.id) === "pending"
      ).length,
      color: "#b45309",
      bg: "#fffbeb",
      icon: "schedule",
      filter: "pending",
    },
    {
      label: "Approved",
      value: requests.filter(
        (r) => getStatus(r.id) === "approved"
      ).length,
      color: "#006a61",
      bg: "#dcfce7",
      icon: "check_circle",
      filter: "approved",
    },
    {
      label: "Rejected",
      value: requests.filter(
        (r) => getStatus(r.id) === "rejected"
      ).length,
      color: "#dc2626",
      bg: "#fee2e2",
      icon: "cancel",
      filter: "rejected",
    },
  ].map(function (stat) {
    return (
      <div
        key={stat.label}
        onClick={() => setActiveFilter(stat.filter)}
        style={{
          background: stat.bg,
          borderRadius: "16px",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minWidth: "170px",
          cursor: "pointer",
          border:
            activeFilter === stat.filter
              ? `3px solid ${stat.color}`
              : "3px solid transparent",
          transition: "0.2s",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "28px",
            color: stat.color,
          }}
        >
          {stat.icon}
        </span>

        <div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: stat.color,
            }}
          >
            {stat.value}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              fontWeight: "500",
            }}
          >
            {stat.label}
          </div>
        </div>
      </div>
    );
  })}
</div>

      <div style={{ position: "relative", marginBottom: "24px", maxWidth: "480px" }}>
        <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
        <input type="text" placeholder="Search by pharmacy, pharmacist or address..." value={search}
          onChange={function (e) { setSearch(e.target.value) }}
          style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box", fontWeight: "500" }}
          onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
          onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>Incoming Requests</h2>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "15px" }}>No requests found.</div>}
        {filtered.map(function (req) {
          var status = getStatus(req.id)
          var badge = statusBadge(status)
          return (
            <div key={req.id} onClick={function () {
              setSelected(req);
              fetchPharmacyDetails(req.id);
            }}
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", borderLeft: "4px solid " + (status === "approved" ? "#006a61" : status === "rejected" ? "#dc2626" : "#f59e0b"), borderRadius: "16px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "all 0.2s ease" }}
              onMouseEnter={function (e) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,106,97,0.12)" }}
              onMouseLeave={function (e) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "24px" }}>local_pharmacy</span>
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>{req.pharmacyName}</h3>
                  <p style={{ fontSize: "13px", color: "#64748b" }}>{req.pharmacistName} • {req.dateSubmitted}</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>{req.address}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: badge.color, background: badge.bg, padding: "4px 14px", borderRadius: "999px" }}>{badge.label}</span>
                <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "20px" }}>chevron_right</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}