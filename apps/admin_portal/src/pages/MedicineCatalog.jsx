import { useState, useEffect } from "react"
import Pagination from "../components/Pagination"
import AdminPageSkeleton from "../assets/ui/AdminPageSkeleton";

export default function MedicineCatalog(props) {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMedicines()
  }, [])

 async function fetchMedicines() {
  try {
    setLoading(true)

    const response = await fetch(
      "http://localhost:5000/api/admin/medicines"
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Failed to fetch medicines"
      )
    }

    const medicineRows = Array.isArray(data)
      ? data
      : data.data || []

    const formatted = medicineRows.map(
      function (item) {
        return {
          ...item,
          generic: item.generic_name,
          created_at: item.created_at
        }
      }
    )

    setMedicines(formatted)

  } catch (error) {
    console.error(
      "FETCH MEDICINES ERROR:",
      error
    )

    setMedicines([])

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

  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const [view, setView] = useState("main")
  const [form, setForm] = useState({
    name: "",
    generic: "",
    brand: "",
    strength: "",
    type: "",
    form: ""
  })

  const [formErrors, setFormErrors] = useState({})
  const [editTarget, setEditTarget] = useState(null)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [activeTypeFilter, setActiveTypeFilter] = useState("All")
  const [activeFormFilter, setActiveFormFilter] = useState("All Forms")
  var emptyForm = { name: "", generic: "", brand: "", strength: "", type: "", form: "" }
  var typeOptions = [
    "antibiotic",
    "analgesic",
    "antiviral",
    "antifungal",
    "antipyretic",
    "antiseptic",
    "antacid",
    "antiallergic",
    "antihypertensive",
    "antidiabetic",
    "vitamin",
    "supplement"
  ]
  var formOptions = [
    "tablet",
    "capsule",
    "syrup",
    "injection",
    "cream",
    "ointment",
    "drop",
    "inhaler"
  ]
  var typeFilterTabs = ["All", "Antibiotic", "Cholesterol", "Diabetes", "Asthma", "Painkiller", "Antacid", "Cough", "Antihistamine"]
  var formFilterTabs = [
    "All Forms",
    "tablet",
    "capsule",
    "syrup",
    "injection",
    "inhaler",
    "drop",
    "cream"
  ]
  var ITEMS_PER_PAGE = 5

  var typeColors = {
    antibiotic: { color: "#2a9aca" },
    analgesic: { color: "#2a9aca" },
    antiviral: { color: "#2a9aca" },
    antifungal: { color: "#2a9aca" },
    antipyretic: { color: "#2a9aca" },
    antiseptic: { color: "#2a9aca" },
    antacid: { color: "#2a9aca" },
    antiallergic: { color: "#2a9aca" },
    antihypertensive: { color: "#2a9aca" },
    antidiabetic: { color: "#2a9aca" },
    vitamin: { color: "#2a9aca" },
    supplement: { color: "#2a9aca" }
  }

  var formColors = {
    "Tablet": { icon: "medication", color: "#2a9aca" },
    "Capsule": { icon: "medication_liquid", color: "#2a9aca" },
    "Syrup": { icon: "water_drop", color: "#2a9aca" },
    "Injection": { icon: "vaccines", color: "#2a9aca" },
    "Inhaler": { icon: "air", color: "#2a9aca" },
    "Drops": { icon: "opacity", color: "#2a9aca" },
    "Cream": { icon: "soap", color: "#2a9aca" },
  }

  function FormField(props) {
    return (
      <div>
        <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>{props.label}</label>
        {props.type === "select" ? (
          <select value={props.value} onChange={props.onChange}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "white", color: "#0f172a" }}
            onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
            onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }}>
            <option value="">Select {props.label}</option>
            {props.options.map(function (opt) { return <option key={opt} value={opt}>{opt}</option> })}
          </select>
        ) : (
          <input type="text" value={props.value} onChange={props.onChange} placeholder={props.placeholder}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "15px", outline: "none", boxSizing: "border-box", fontWeight: "500" }}
            onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
            onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
        )}
      </div>
    )
  }
  const filtered = medicines.filter(function (m) {
    var matchSearch =
      (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.generic || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.brand || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.type || "").toLowerCase().includes(search.toLowerCase())

    var matchType =
      activeTypeFilter === "All" ||
      (m.type || "").toLowerCase() === activeTypeFilter.toLowerCase()

    var matchForm =
      activeFormFilter === "All Forms" ||
      (m.form || "").toLowerCase() === activeFormFilter.toLowerCase()

    return matchSearch && matchType && matchForm
  })

  var mainTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var mainPaginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  var allTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var allPaginated = filtered.slice((allPage - 1) * ITEMS_PER_PAGE, allPage * ITEMS_PER_PAGE)

  function handleEdit(medicine) {
    setEditTarget(medicine)
    setForm({ name: medicine.name, generic: medicine.generic, brand: medicine.brand, strength: medicine.strength, type: medicine.type, form: medicine.form })
    setFormErrors({})
    setView("edit")
  }

  function handleAdd() { setEditTarget(null); setForm(emptyForm); setFormErrors({}); setView("add") }
  async function handleSave() {
    var errs = {}
    if (!form.name) errs.name = "Required"
    if (!form.generic) errs.generic = "Required"
    if (!form.brand) errs.brand = "Required"
    if (!form.strength) errs.strength = "Required"
    if (!form.type) errs.type = "Required"
    if (!form.form) errs.form = "Required"
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      const { showToast } = props;
      return
    }
    if (editTarget) {
      await fetch(
        `http://localhost:5000/api/admin/medicines/${editTarget.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: form.name,
            generic_name: form.generic,
            brand: form.brand,
            strength: form.strength,
            form: form.form,
            type: form.type
          })
        }
      )


      fetchMedicines()
      if (showToast) showToast("Medicine updated successfully", "success")
    } else {
      await fetch("http://localhost:5000/api/admin/medicines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name,
          generic_name: form.generic,
          brand: form.brand,
          strength: form.strength,
          form: form.form,
          type: form.type
        })
      })

      await fetchMedicines()
      if (showToast) showToast("Medicine added successfully", "success")
    }
    setView("main"); setEditTarget(null); setForm(emptyForm); setFormErrors({})
  }

  async function handleDeleteConfirm() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/medicines/${deleteTarget.id}`,
        {
          method: "DELETE"
        }
      )

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      await fetchMedicines()

      if (showToast) {
        showToast("Medicine deleted successfully", "success")
      }
    } catch (error) {
      if (showToast) {
        showToast("Failed to delete medicine", "error")
      }
    } finally {
      setShowDeletePopup(false)
      setDeleteTarget(null)
    }
  }

  function updateForm(field, value) {
    setForm(function (prev) { return { ...prev, [field]: value } })
    setFormErrors(function (prev) { return { ...prev, [field]: "" } })
  }

  var filterSection = (
    <div style={{ marginBottom: "28px" }}>
      <div style={{ marginBottom: "8px" }}>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Category</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {typeFilterTabs.map(function (tab) {
            return (
              <button key={tab} onClick={function () { setActiveTypeFilter(tab); setCurrentPage(1); setAllPage(1) }}
                style={{ padding: "7px 14px", borderRadius: "999px", border: "2px solid", borderColor: activeTypeFilter === tab ? "#006a61" : "#e2e8f0", background: activeTypeFilter === tab ? "#006a61" : "white", color: activeTypeFilter === tab ? "white" : "#64748b", fontWeight: "600", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}>
                {tab}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Form</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {formFilterTabs.map(function (tab) {
            var fc = formColors[tab] || { color: "#64748b" }
            return (
              <button key={tab} onClick={function () { setActiveFormFilter(tab); setCurrentPage(1); setAllPage(1) }}
                style={{ padding: "7px 14px", borderRadius: "999px", border: "2px solid", borderColor: activeFormFilter === tab ? fc.color : "#e2e8f0", background: activeFormFilter === tab ? fc.color : "white", color: activeFormFilter === tab ? "white" : "#64748b", fontWeight: "600", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}>
                {tab}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  var deletePopup = showDeletePopup && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function () { setShowDeletePopup(false) }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "36px 32px", width: "340px", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }} onClick={function (e) { e.stopPropagation() }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#dc2626" }}>delete</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Delete Medicine?</h2>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "28px" }}>Are you sure you want to delete <strong>{deleteTarget && deleteTarget.name}</strong>?</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={function () { setShowDeletePopup(false) }} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "white", color: "#374151", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleDeleteConfirm} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#dc2626", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  )

  var medicineTable = function (data) {
    return (
      <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #131b2e, #006a61)" }}>
                {["Medicine Name", "Generic Name", "Brand", "Strength", "Type", "Form", "Created At", "Action"].map(function (col) {
                  return <th key={col} style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "15px" }}>No medicines found.</td></tr>}
              {data.map(function (med, index) {
                var tc = typeColors[med.type] || { color: "#64748b", bg: "#f1f5f9" }
                var fc = formColors[med.form] || { icon: "medication", color: "#64748b" }
                return (
                  <tr key={med.id} style={{ borderBottom: "1px solid #f1f5f9", background: index % 2 === 0 ? "white" : "#fafafa" }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = "#f0fdf9" }}
                    onMouseLeave={function (e) { e.currentTarget.style.background = index % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#006a61" }}>{fc.icon}</span>
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{med.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#374151" }}>{med.generic}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{med.brand}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#374151" }}>{med.strength}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: tc.color, background: tc.bg, padding: "4px 12px", borderRadius: "999px", whiteSpace: "nowrap" }}>{med.type}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: fc.color }}>
                          {fc.icon}
                        </span>
                        <span style={{ fontSize: "13px", color: "#374151" }}>
                          {med.form}
                        </span>
                      </div>
                    </td>

                    {/* ADD THIS */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#374151" }}>
                      {med.created_at
                        ? new Date(med.created_at).toLocaleDateString()
                        : "-"}
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={function () { handleEdit(med) }}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "7px 12px", borderRadius: "8px", border: "2px solid #006a61", background: "white", color: "#006a61", fontWeight: "700", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
                          onMouseEnter={function (e) { e.currentTarget.style.background = "#e6f4f3" }}
                          onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>Edit
                        </button>
                        <button onClick={function () { setDeleteTarget(med); setShowDeletePopup(true) }}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "7px 12px", borderRadius: "8px", border: "2px solid #fee2e2", background: "white", color: "#dc2626", fontWeight: "700", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
                          onMouseEnter={function (e) { e.currentTarget.style.background = "#fee2e2" }}
                          onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>Delete
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

  var searchAndAdd = function (placeholder) {
    return (
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
          <input type="text" placeholder={placeholder} value={search}
            onChange={function (e) { setSearch(e.target.value); setCurrentPage(1); setAllPage(1) }}
            style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box", fontWeight: "500" }}
            onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
            onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
        </div>
        <button onClick={handleAdd}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 24px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer", whiteSpace: "nowrap" }}
          onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
          onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>Add Medicine
        </button>
      </div>
    )
  }

  if (loading) {
  return <AdminPageSkeleton />;
}


  // ADD / EDIT PAGE
  if (view === "add" || view === "edit") {
    return (
      <div style={{ maxWidth: "700px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main") }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>{view === "edit" ? "Edit Medicine" : "Add New Medicine"}</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>{view === "edit" ? "Update details of " + editTarget.name : "Fill in all details to add a new medicine"}</p>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #131b2e, #006a61)", borderRadius: "20px", padding: "24px 28px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ color: "white", fontSize: "26px" }}>{view === "edit" ? "edit" : "add_circle"}</span>
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "white" }}>{view === "edit" ? "Editing: " + editTarget.name : "New Medicine Entry"}</h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>All fields are required</p>
          </div>
        </div>
        <div style={{ background: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <FormField label="Medicine Name" value={form.name} placeholder="e.g. Amoxicillin 500mg" onChange={function (e) { updateForm("name", e.target.value) }} />
              {formErrors.name && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontWeight: "600" }}>{formErrors.name}</p>}
            </div>
            <div>
              <FormField label="Generic Name" value={form.generic} placeholder="e.g. Amoxicillin" onChange={function (e) { updateForm("generic", e.target.value) }} />
              {formErrors.generic && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontWeight: "600" }}>{formErrors.generic}</p>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <FormField label="Brand" value={form.brand} placeholder="e.g. Amoxil" onChange={function (e) { updateForm("brand", e.target.value) }} />
              {formErrors.brand && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontWeight: "600" }}>{formErrors.brand}</p>}
            </div>
            <div>
              <FormField label="Strength" value={form.strength} placeholder="e.g. 500mg" onChange={function (e) { updateForm("strength", e.target.value) }} />
              {formErrors.strength && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontWeight: "600" }}>{formErrors.strength}</p>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <FormField label="Type" value={form.type} type="select" options={typeOptions} onChange={function (e) { updateForm("type", e.target.value) }} />
              {formErrors.type && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontWeight: "600" }}>{formErrors.type}</p>}
            </div>
            <div>
              <FormField label="Form" value={form.form} type="select" options={formOptions} onChange={function (e) { updateForm("form", e.target.value) }} />
              {formErrors.form && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontWeight: "600" }}>{formErrors.form}</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button onClick={function () { setView("main") }}
              style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "2px solid #e2e8f0", background: "white", color: "#374151", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "#f1f5f9" }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>Cancel</button>
            <button onClick={handleSave}
              style={{ flex: 2, padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}
              onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
              onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{view === "edit" ? "save" : "add_circle"}</span>
                {view === "edit" ? "Save Changes" : "Add Medicine"}
              </span>
            </button>
          </div>
        </div>
        {deletePopup}
      </div>
    )
  }

  // ALL MEDICINES PAGE
  if (view === "all") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main") }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>All Medicines</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>{medicines.length} medicines in the catalog</p>
          </div>
        </div>
        {searchAndAdd("Search medicines...")}
        {filterSection}
        {medicineTable(allPaginated)}
        <Pagination currentPage={allPage} totalPages={allTotalPages} onPageChange={function (p) { setAllPage(p) }} />
        {deletePopup}
      </div>
    )
  }

  // MAIN VIEW
  return (
    <div>
      <div style={{ marginBottom: "32px", paddingTop: "16px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Medicine Catalog Management</h1>
        <div style={{ height: "3px", width: "80px", background: "linear-gradient(90deg, #006a61, #4edea3)", borderRadius: "999px", marginBottom: "12px" }}></div>
        <p style={{ fontSize: "15px", color: "#64748b" }}>Manage all standard medicine, generic name and classification available on Medspot.</p>
      </div>
      {searchAndAdd("Search by medicine name, generic, brand or type...")}
      {filterSection}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[
          { label: "Total Medicines", value: medicines.length, icon: "medication", color: "#006a61", bg: "#e6f4f3" },
          { label: "Total Categories", value: typeOptions.length, icon: "category", color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Total Brands", value: [...new Set(medicines.map(function (m) { return m.brand }))].length, icon: "store", color: "#1d4ed8", bg: "#eff6ff" },
          { label: "Total Forms", value: formOptions.length, icon: "science", color: "#b45309", bg: "#fffbeb" },
        ].map(function (stat) {
          return (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: "16px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "140px" }}>
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
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "22px" }}>table_chart</span>Medicine Catalog
          </h2>
          <button onClick={function () { setView("all") }}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
            onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
            onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>open_in_full</span>View All
          </button>
        </div>
        {medicineTable(mainPaginated)}
        <Pagination currentPage={currentPage} totalPages={mainTotalPages} onPageChange={function (p) { setCurrentPage(p) }} />
      </div>
      {deletePopup}
    </div>
  )
}