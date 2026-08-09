import { useState, useEffect } from "react";
import Pagination from "../components/Pagination";
import AdminPageSkeleton from "../assets/ui/AdminPageSkeleton";


var tableColumns = ["Pharmacy Name", "Owner", "Contact", "Rating", "Reservations", "Action"]
var ITEMS_PER_PAGE = 4

function StarRating(props) {
  var rating = props.rating
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map(function (star) {
        return <span key={star} style={{ color: star <= Math.round(rating) ? "#f59e0b" : "#e2e8f0", fontSize: "14px" }}>★</span>
      })}
      <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "4px" }}>{rating}</span>
    </div>
  )
}

function TableRow(props) {
  var pharmacy = props.pharmacy
  var index = props.index
  var onView = props.onView
  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9", background: index % 2 === 0 ? "white" : "#fafafa" }}
      onMouseEnter={function (e) { e.currentTarget.style.background = "#f0fdf9" }}
      onMouseLeave={function (e) { e.currentTarget.style.background = index % 2 === 0 ? "white" : "#fafafa" }}>
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#006a61" }}>local_pharmacy</span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{pharmacy.pharmacy_name}</span>
        </div>
      </td>
      <td style={{ padding: "14px 20px", fontSize: "14px", color: "#374151", whiteSpace: "nowrap" }}>{pharmacy.owner_name}</td>
      <td style={{ padding: "14px 20px", fontSize: "14px", color: "#374151", whiteSpace: "nowrap" }}>{pharmacy.owner_phone}</td>
      <td style={{ padding: "14px 20px" }}><StarRating rating={pharmacy.rating || 0} /> </td>
      <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#006a61" }}>{pharmacy.reservations || 0}</td>
      <td style={{ padding: "14px 20px" }}>
        <button
          onClick={onView}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "10px",
            border: "2px solid #006a61",
            background: "white",
            color: "#006a61",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "16px" }}
          >
            visibility
          </span>
          View Profile
        </button>
      </td>
    </tr>
  )
}

export default function PharmacyManagement(props) {
  var showToast = props.showToast
  const [search, setSearch] = useState("")
  var [view, setView] = useState("main")
  var [selectedPharmacy, setSelectedPharmacy] = useState(null)
  var [blockedLoading, setBlockedLoading] = useState(false)
  var [blockReasons, setBlockReasons] = useState({})
  var [showBlockPopup, setShowBlockPopup] = useState(false)
  var [showUnblockPopup, setShowUnblockPopup] = useState(false)
  var [blockTarget, setBlockTarget] = useState(null)
  var [currentPage, setCurrentPage] = useState(1)
  var [allPage, setAllPage] = useState(1)
  var [pharmacies, setPharmacies] = useState([])
  var [loading, setLoading] = useState(true)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState("")

  useEffect(function () {

    async function fetchPharmacies() {

      try {

        var response = await fetch("http://localhost:5000/api/admin/pharmacies")

        if (!response.ok) {
          throw new Error("Failed to fetch pharmacies")
        }

        var data = await response.json()
        console.log(data)

        setPharmacies(data)

      } catch (error) {

        console.error("Error fetching pharmacies:", error)

      } finally {

        setLoading(false)

      }
    }

    fetchPharmacies()

  }, [])

  if (loading) {
    return <AdminPageSkeleton/>;
  }

  var filtered = pharmacies.filter(function (p) {
    return (
      (p.pharmacy_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.owner_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.area || "").toLowerCase().includes(search.toLowerCase())
    )
  })

  var blockedPharmacies = pharmacies.filter(function (p) {
  return Boolean(p.is_blocked)
})
 var recentPharmacies = [...pharmacies]
  .sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  })
  .slice(0, 3);
  var totalActive = pharmacies.filter(function (p) {
  return !Boolean(p.is_blocked);
}).length;
  var mainTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  var mainPaginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  var allTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var allPaginated = filtered.slice((allPage - 1) * ITEMS_PER_PAGE, allPage * ITEMS_PER_PAGE)

  function isBlocked(id) {
  var pharmacy = pharmacies.find(function (item) {
    return item.pharmacy_id === id
  })

  return pharmacy
    ? Boolean(pharmacy.is_blocked)
    : false
}
function handleBlock(pharmacy) {
  setBlockTarget(pharmacy);
  setShowBlockPopup(true);
}

async function confirmBlock() {
  if (!blockTarget || blockedLoading) return;

  try {
    setBlockedLoading(true);

    const response = await fetch(
      `http://localhost:5000/api/admin/pharmacies/${blockTarget.pharmacy_id}/block`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Violated platform policy",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to block pharmacy");
    }

    // Update pharmacy status locally
    setPharmacies(function (previousPharmacies) {
      return previousPharmacies.map(function (pharmacy) {
        if (pharmacy.pharmacy_id === blockTarget.pharmacy_id) {
          return {
            ...pharmacy,
            is_blocked: true,
            active: false,
          };
        }

        return pharmacy;
      });
    });

    // Update selected pharmacy so detail screen changes immediately
    setSelectedPharmacy(function (previousPharmacy) {
      if (
        previousPharmacy &&
        previousPharmacy.pharmacy_id === blockTarget.pharmacy_id
      ) {
        return {
          ...previousPharmacy,
          is_blocked: true,
          active: false,
        };
      }

      return previousPharmacy;
    });

    setBlockReasons(function (previousReasons) {
      return {
        ...previousReasons,
        [blockTarget.pharmacy_id]: "Violated platform policy",
      };
    });

    if (showToast) {
      showToast(
        `${blockTarget.pharmacy_name} has been blocked`,
        "error"
      );
    }

    setShowBlockPopup(false);
    setBlockTarget(null);
  } catch (error) {
    console.error("Block pharmacy error:", error);

    if (showToast) {
      showToast(error.message || "Failed to block pharmacy", "error");
    }
  } finally {
    setBlockedLoading(false);
  }
}

function handleUnblock(pharmacy) {
  setBlockTarget(pharmacy);
  setShowUnblockPopup(true);
}

async function confirmUnblock() {
  if (!blockTarget || blockedLoading) return;

  try {
    setBlockedLoading(true);

    const response = await fetch(
      `http://localhost:5000/api/admin/pharmacies/${blockTarget.pharmacy_id}/unblock`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to unblock pharmacy");
    }

    // Update pharmacy status locally
    setPharmacies(function (previousPharmacies) {
      return previousPharmacies.map(function (pharmacy) {
        if (pharmacy.pharmacy_id === blockTarget.pharmacy_id) {
          return {
            ...pharmacy,
            is_blocked: false,
            active: true,
          };
        }

        return pharmacy;
      });
    });

    // Update selected pharmacy immediately
    setSelectedPharmacy(function (previousPharmacy) {
      if (
        previousPharmacy &&
        previousPharmacy.pharmacy_id === blockTarget.pharmacy_id
      ) {
        return {
          ...previousPharmacy,
          is_blocked: false,
          active: true,
        };
      }

      return previousPharmacy;
    });

    setBlockReasons(function (previousReasons) {
      const updatedReasons = { ...previousReasons };
      delete updatedReasons[blockTarget.pharmacy_id];
      return updatedReasons;
    });

    if (showToast) {
      showToast(
        `${blockTarget.pharmacy_name} has been unblocked`,
        "success"
      );
    }

    setShowUnblockPopup(false);
    setBlockTarget(null);
  } catch (error) {
    console.error("Unblock pharmacy error:", error);

    if (showToast) {
      showToast(
        error.message || "Failed to unblock pharmacy",
        "error"
      );
    }
  } finally {
    setBlockedLoading(false);
  }
}

  var blockPopup = showBlockPopup && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function () { setShowBlockPopup(false) }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "36px 32px", width: "340px", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }} onClick={function (e) { e.stopPropagation() }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#dc2626" }}>block</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Block Pharmacy?</h2>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "28px" }}>Are you sure you want to block <strong>{blockTarget && blockTarget.pharmacy_name}</strong>? They will lose access to the platform.</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={function () { setShowBlockPopup(false) }} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "white", color: "#374151", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
          <button
  onClick={confirmBlock}
  disabled={blockedLoading}
  style={{
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#006a61",
    color: "white",
    fontWeight: "700",
    fontSize: "14px",
    cursor: blockedLoading ? "not-allowed" : "pointer",
    opacity: blockedLoading ? 0.7 : 1,
  }}
>
  {blockedLoading ? "Blocking..." : "Blocked"}
</button>
        </div>
      </div>
    </div>
  )

  var unblockPopup = showUnblockPopup && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function () { setShowUnblockPopup(false) }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "36px 32px", width: "340px", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }} onClick={function (e) { e.stopPropagation() }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#006a61" }}>lock_open</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Unblock Pharmacy?</h2>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "28px" }}>Are you sure you want to unblock <strong>{blockTarget && blockTarget.pharmacy_name}</strong>? They will regain access.</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={function () { setShowUnblockPopup(false) }} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "white", color: "#374151", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
          <button
  onClick={confirmUnblock}
  disabled={blockedLoading}
  style={{
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#006a61",
    color: "white",
    fontWeight: "700",
    fontSize: "14px",
    cursor: blockedLoading ? "not-allowed" : "pointer",
    opacity: blockedLoading ? 0.7 : 1,
  }}
>
  {blockedLoading ? "Unblocking..." : "Unblock"}
</button>
        </div>
      </div>
    </div>
  )

  var sharedTable = function (data) {
    return (
      <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #131b2e, #006a61)" }}>
                {tableColumns.map(function (col) {
                  return <th key={col} style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>No pharmacies found.</td></tr>}
              {data.map(function (pharmacy, index) {
                return <TableRow key={pharmacy.pharmacy_id} pharmacy={pharmacy} index={index} isBlocked={isBlocked(pharmacy.pharmacy_id)} onView={function () { setSelectedPharmacy(pharmacy); setView("detail") }} />
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (view === "detail" && selectedPharmacy) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main"); setSelectedPharmacy(null) }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>Pharmacy Profile</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Detailed view of {selectedPharmacy.pharmacy_name}</p>
          </div>
        </div>
        <div style={{ background: isBlocked(selectedPharmacy.pharmacy_id) ? "linear-gradient(135deg, #dc2626, #f87171)" : "linear-gradient(135deg, #131b2e, #006a61)", borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ color: "white", fontSize: "32px" }}>local_pharmacy</span>
            </div>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "white" }}>{selectedPharmacy.pharmacy_name}</h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>Joined on {selectedPharmacy.created_at}</p>
            </div>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", padding: "6px 18px", borderRadius: "999px", background: "white", color: isBlocked(selectedPharmacy.pharmacy_id) ? "#dc2626" : "#006a61" }}>
            {isBlocked(selectedPharmacy.pharmacy_id) ? "Blocked" : selectedPharmacy.active ? "Active" : "Inactive"}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>

          {[
            { label: "Owner Name", value: selectedPharmacy.owner_name, icon: "person" },

            { label: "Owner CNIC", value: selectedPharmacy.owner_cnic, icon: "badge" },

            { label: "Email", value: selectedPharmacy.owner_email, icon: "email" },

            { label: "Phone", value: selectedPharmacy.owner_phone, icon: "phone" },

            { label: "Address", value: selectedPharmacy.full_address, icon: "location_on" },

            {
              label: "Years In Operation",
              value: selectedPharmacy.years_in_operation + " Years",
              icon: "history"
            },



            {
              label: "Joined Date",
              value: new Date(selectedPharmacy.created_at).toLocaleDateString(),
              icon: "calendar_today"
            },

            {
              label: "Total Reservations",
              value: selectedPharmacy.reservations || 0,
              icon: "bookmark_check"
            }

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
        <div style={{ background: "white", borderRadius: "20px", padding: "24px 28px", marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>Rating & Description</h3>


          <StarRating rating={selectedPharmacy.rating} />
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "12px" }}>{selectedPharmacy.description || "No description available"}

          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            border: "1px solid #f1f5f9"
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "#006a61" }}
            >
              location_on
            </span>
            Pharmacy Location
          </h3>

          {selectedPharmacy.map_lat && selectedPharmacy.map_lng ? (
            <iframe
              title="Pharmacy Location"
              width="100%"
              height="400"
              style={{
                border: "none",
                borderRadius: "16px"
              }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${selectedPharmacy.map_lat},${selectedPharmacy.map_lng}&z=17&output=embed`}
            />
          ) : (
            <p style={{ color: "#64748b" }}>
              Location not available
            </p>
          )}
        </div>



        {/* Operating Hours */}
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "24px 28px",
            marginBottom: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            border: "1px solid #f1f5f9"
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px",
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
              schedule
            </span>
            Operating Hours
          </h3>

          {selectedPharmacy.operating_hours ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              {Object.entries(selectedPharmacy.operating_hours).map(
                function ([day, hours]) {
                  return (
                    <div
                      key={day}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0"
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "600",
                          color: "#0f172a",
                          textTransform: "capitalize"
                        }}
                      >
                        {day}
                      </span>

                      <span
                        style={{
                          color: "#64748b",
                          fontWeight: "500"
                        }}
                      >
                        {typeof hours === "object"
                          ? `${hours.open} - ${hours.close}`
                          : hours}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: "12px",
                color: "#64748b"
              }}
            >
              Operating hours not available
            </div>
          )}
        </div>

        <div style={{ background: "white", borderRadius: "20px", padding: "24px 28px", marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "20px" }}>folder_open</span>License Documents
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              {
                label: "Pharmacy License",
                number: "View License",
                icon: "verified",
                url: selectedPharmacy.license_url
              },

              {
                label: "Pharmacist License",
                number: "View License",
                icon: "badge",
                url: selectedPharmacy.pharmacist_license_url
              }
            ].map(function (doc) {
              return (
                <div key={doc.label} style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "24px" }}>{doc.icon}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{doc.label}</p>
                      <p style={{ fontSize: "13px", color: "#94a3b8" }}>License No: {doc.number}</p>
                    </div>
                  </div>
                  <button
                    onClick={function () {
                      setSelectedDocument(doc.url)
                      setShowDocumentModal(true)
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      borderRadius: "12px",
                      border: "2px solid #006a61",
                      background: "white",
                      color: "#006a61",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                    onMouseEnter={function (e) {
                      e.currentTarget.style.background = "#e6f4f3"
                    }}
                    onMouseLeave={function (e) {
                      e.currentTarget.style.background = "white"
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      visibility
                    </span>
                    View
                  </button>
                </div>
              )
            })}
          </div>
        </div>
        {!isBlocked(selectedPharmacy.pharmacy_id) ? (
          <button onClick={function () { handleBlock(selectedPharmacy) }}
            style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "2px solid #fee2e2", background: "white", color: "#dc2626", fontWeight: "700", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            onMouseEnter={function (e) { e.currentTarget.style.background = "#fee2e2" }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>block</span>Block This Pharmacy
          </button>
        ) : (
          <button onClick={function () { handleUnblock(selectedPharmacy) }}
            style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
            onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>lock_open</span>Unblock This Pharmacy
          </button>
        )}
        {blockPopup}
        {unblockPopup}
        {showDocumentModal && (
          <div
            onClick={() => setShowDocumentModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              zIndex: 9999,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                width: "90%",
                maxWidth: "1000px",
                height: "90vh",
                background: "#fff",
                borderRadius: "16px",
                overflow: "hidden"
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDocumentModal(false)}
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: "20px",
                  cursor: "pointer",
                  zIndex: 10
                }}
              >
                ✕
              </button>

              <iframe
                src={selectedDocument}
                title="License Preview"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </div>
          </div>
        )}
      </div>

    )
  }

  // ALL PHARMACIES VIEW
  if (view === "all") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main") }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>All Registered Pharmacies</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>{pharmacies.length} pharmacies registered on the platform</p>
          </div>

        </div>
        <div style={{ position: "relative", marginBottom: "24px", maxWidth: "480px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
          <input type="text" placeholder="Search pharmacies..." value={search} onChange={function (e) { setSearch(e.target.value); setAllPage(1) }}
            style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box" }}
            onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
            onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
        </div>
        {sharedTable(allPaginated)}
        <Pagination currentPage={allPage} totalPages={allTotalPages} onPageChange={function (p) { setAllPage(p) }} />
        {blockPopup}
        {unblockPopup}
      </div>
    )
  }

  // BLOCKED PHARMACIES VIEW
  if (view === "blocked") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main") }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>Blocked Pharmacies</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>{blockedPharmacies.length} pharmacies currently blocked</p>
          </div>
        </div>
        {blockedPharmacies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "white", borderRadius: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#e2e8f0", display: "block", marginBottom: "16px" }}>verified</span>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>No Blocked Pharmacies</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>There are currently no blocked pharmacies on the platform.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {blockedPharmacies.map(function (pharmacy) {
              return (
                <div key={pharmacy.pharmacy_id} style={{ background: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", borderLeft: "4px solid #dc2626", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "#dc2626" }}>local_pharmacy</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>{pharmacy.pharmacy_name}</p>
                      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>{pharmacy.owner_name} • {pharmacy.owner_email}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#dc2626" }}>info</span>
                        <p style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600" }}>{blockReasons[pharmacy.pharmacy_id] || "Violated platform policy"}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={function () { setSelectedPharmacy(pharmacy); setView("detail") }}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", border: "2px solid #006a61", background: "white", color: "#006a61", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                      onMouseEnter={function (e) { e.currentTarget.style.background = "#e6f4f3" }}
                      onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>View
                    </button>
                    <button onClick={function () { handleUnblock(pharmacy) }}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                      onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
                      onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>lock_open</span>Unblock
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {unblockPopup}
      </div>
    )
  }

  // MAIN VIEW
  return (
    <div>
      <div style={{ marginBottom: "32px", paddingTop: "16px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Pharmacy Management</h1>
        <div style={{ height: "3px", width: "80px", background: "linear-gradient(90deg, #006a61, #4edea3)", borderRadius: "999px", marginBottom: "12px" }}></div>
        <p style={{ fontSize: "15px", color: "#64748b" }}>Manage and monitor all registered pharmacies on the platform.</p>
      </div>
      <div style={{ position: "relative", marginBottom: "28px", maxWidth: "480px" }}>
        <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
        <input type="text" placeholder="Search pharmacies by name, owner or address..." value={search}
          onChange={function (e) { setSearch(e.target.value); setCurrentPage(1) }}
          style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box", fontWeight: "500" }}
          onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
          onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
      </div>
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[
          { label: "Total Registered Pharmacies", value: pharmacies.length, icon: "local_pharmacy", color: "#006a61", bg: "#e6f4f3" },
          { label: "Total Active This Month", value: totalActive, icon: "check_circle", color: "#1d4ed8", bg: "#eff6ff" },
        ].map(function (stat) {
          return (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: "20px", padding: "24px 28px", display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "220px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "28px", color: stat.color }}>{stat.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: "32px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Blocked Pharmacies Button */}
      <div style={{ marginBottom: "28px" }}>
        <button onClick={function () { setView("blocked") }}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 24px", borderRadius: "14px", border: "2px solid #fee2e2", background: "white", color: "#dc2626", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}
          onMouseEnter={function (e) { e.currentTarget.style.background = "#fee2e2" }}
          onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>block</span>
          Blocked Pharmacies
          <span style={{ background: "#dc2626", color: "white", borderRadius: "999px", padding: "2px 10px", fontSize: "13px", fontWeight: "800" }}>{blockedPharmacies.length}</span>
        </button>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "22px" }}>new_releases</span>Recently Joined Pharmacies
        </h2>
        <div style={{
          display: "grid", gridTemplateColumns:
            window.innerWidth < 768
              ? "1fr"
              : "repeat(3,1fr)", gap: "16px"
        }}>
          {recentPharmacies.map(function (pharmacy) {
            return (
              <div key={pharmacy.pharmacy_id}
                style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", borderLeft: "4px solid #006a61", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "all 0.2s ease", cursor: "pointer" }}
                onMouseEnter={function (e) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,106,97,0.12)" }}
                onMouseLeave={function (e) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)" }}
                onClick={function () { setSelectedPharmacy(pharmacy); setView("detail") }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "22px" }}>local_pharmacy</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{pharmacy.pharmacy_name}</h3>
                    <p style={{ fontSize: "12px", color: "#94a3b8" }}>Joined{" "}
{pharmacy.created_at
  ? new Date(pharmacy.created_at).toLocaleDateString()
  : "N/A"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[{ icon: "person", value: pharmacy.owner_name }, { icon: "phone", value: pharmacy.owner_phone }, { 
  icon: "location_on",
  value:
    pharmacy.full_address ||
    [pharmacy.area, pharmacy.city].filter(Boolean).join(", ") ||
    "Address not available",
 }].map(function (item) {
                    return (
                      <div key={item.icon} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#006a61" }}>{item.icon}</span>
                        <span style={{ fontSize: "13px", color: "#374151" }}>{item.value}</span>
                      </div>
                    )
                  })}
                  <StarRating rating={pharmacy.rating} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "22px" }}>table_chart</span>All Registered Pharmacies
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>

            <button onClick={function () { setView("all") }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
              onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
              onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>open_in_full</span>View All
            </button>
          </div>
        </div>
        {sharedTable(mainPaginated)}
        <Pagination currentPage={currentPage} totalPages={mainTotalPages} onPageChange={function (p) { setCurrentPage(p) }} />
      </div>
    </div>
  )
}