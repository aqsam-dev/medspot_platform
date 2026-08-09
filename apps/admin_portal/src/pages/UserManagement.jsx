import { useState, useEffect } from "react"
import Pagination from "../components/Pagination"
import AdminPageSkeleton from "../assets/ui/AdminPageSkeleton";




function Avatar(props) {
  var name = props.name
  var size = props.size || 36
  var initials = name.split(" ").map(function (n) { return n[0] }).join("").slice(0, 2).toUpperCase()
  var colors = ["#006a61", "#1d4ed8", "#7c3aed", "#b45309", "#dc2626", "#059669"]
  var color = colors[name.length % colors.length]
  return (
    <div style={{ width: size + "px", height: size + "px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.35 + "px", fontWeight: "700", color: "white" }}>{initials}</span>
    </div>
  )
}

function UserTableRow(props) {
  var user = props.user
  var index = props.index
  var onView = props.onView
  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9", background: index % 2 === 0 ? "white" : "#fafafa" }}
      onMouseEnter={function (e) { e.currentTarget.style.background = "#f0fdf9" }}
      onMouseLeave={function (e) { e.currentTarget.style.background = index % 2 === 0 ? "white" : "#fafafa" }}>
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Avatar name={user.name} size={36} />
          <div>
            <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{user.name}</p>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Joined {user.joinedDate}</p>
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#374151" }}>{user.email}</td>
      <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#006a61", textAlign: "center" }}>{user.reservations}</td>
      <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#7c3aed", textAlign: "center" }}>{user.prescriptions}</td>
      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b", whiteSpace: "nowrap" }}>
        {user.joinedDate}
      </td>
      <td style={{ padding: "14px 20px" }}>
        <button onClick={onView}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", border: "2px solid #006a61", background: "white", color: "#006a61", fontWeight: "700", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}
          onMouseEnter={function (e) { e.currentTarget.style.background = "#e6f4f3" }}
          onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>View Profile
        </button>
      </td>
    </tr>
  )
}

var tableHeaders = [
  "User Name",
  "Email",
  "Reservations",
  "Prescriptions",
  "Joined Date",
  "Action"
]
var ITEMS_PER_PAGE = 5

export default function UserManagement(props) {
  var showToast = props.showToast
  var [search, setSearch] = useState("")
  var [view, setView] = useState("main")
  var [selectedUser, setSelectedUser] = useState(null)
  var [blockReasons, setBlockReasons] = useState({})
  var [showBlockPopup, setShowBlockPopup] = useState(false)
  var [showUnblockPopup, setShowUnblockPopup] = useState(false)
  var [blockTarget, setBlockTarget] = useState(null)
  var [blockReason, setBlockReason] = useState("")
  var [currentPage, setCurrentPage] = useState(1)
  var [allPage, setAllPage] = useState(1)
  var [users, setUsers] = useState([])
  var [loading, setLoading] = useState(true)

async function loadUsers() {
  try {
    setLoading(true)

    const response = await fetch(
      "http://localhost:5000/api/admin/users"
    )

    if (!response.ok) {
      throw new Error(
        "Failed to fetch users"
      )
    }

    const data = await response.json()

    const formattedUsers = data.map(
      function (user) {
        return {
          id: user.patient_id,
          name: user.name,
          email: user.email,
          profileImage:
            user.profile_image,

          reservations:
            Number(user.reservations) || 0,

          prescriptions:
            Number(user.prescriptions) || 0,

          joinedDate:
            new Date(
              user.created_at
            ).toLocaleDateString(),

          created_at:
            user.created_at,

          isBlocked:
            Boolean(user.is_blocked)
        }
      }
    )

    setUsers(formattedUsers)

  } catch (error) {
    console.error(
      "LOAD USERS ERROR:",
      error
    )

    if (showToast) {
      showToast(
        "Failed to load users",
        "error"
      )
    }

  } finally {
    setLoading(false)
  }
}

useEffect(function () {
  loadUsers()
}, [])


  if (loading) {
     return <AdminPageSkeleton/>;
  }

  var filtered = users.filter(function (u) {
    return (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  })

var blockedUsers = users.filter(
  function (user) {
    return user.isBlocked
  }
)
  var totalUsers = users.length
  var totalReservations = users.reduce(
  function (sum, user) {
    return sum + (user.reservations || 0)
  },
  0
)
  var totalPrescriptions = users.reduce(
  function (sum, user) {
    return sum + (user.prescriptions || 0)
  },
  0
)

  var mainTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var mainPaginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  var allTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  var allPaginated = filtered.slice((allPage - 1) * ITEMS_PER_PAGE, allPage * ITEMS_PER_PAGE)

function isBlocked(id) {
  var user = users.find(
    function (item) {
      return item.id === id
    }
  )

  return user
    ? user.isBlocked
    : false
}
  function handleBlock(user) { setBlockTarget(user); setBlockReason(""); setShowBlockPopup(true) }
 async function confirmBlock() {
  if (!blockTarget) {
    return
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/admin/users/${blockTarget.id}/block`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          reason:
            blockReason ||
            "Violated platform policy"
        })
      }
    )

    const result =
      await response.json()

    if (!response.ok) {
      throw new Error(
        result.message ||
        "Failed to block user"
      )
    }

    setBlockReasons(
      function (previous) {
        return {
          ...previous,
          [blockTarget.id]:
            blockReason ||
            "Violated platform policy"
        }
      }
    )

    setShowBlockPopup(false)
    setBlockTarget(null)
    setBlockReason("")

    await loadUsers()

    if (selectedUser) {
      setSelectedUser(
        function (previous) {
          return previous
            ? {
                ...previous,
                isBlocked: true
              }
            : previous
        }
      )
    }

    if (showToast) {
      showToast(
        result.message ||
        "User blocked successfully",
        "success"
      )
    }

  } catch (error) {
    console.error(
      "BLOCK USER ERROR:",
      error
    )

    if (showToast) {
      showToast(
        error.message,
        "error"
      )
    }
  }
}
  function handleUnblock(user) { setBlockTarget(user); setShowUnblockPopup(true) }
 async function confirmUnblock() {
  if (!blockTarget) {
    return
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/admin/users/${blockTarget.id}/unblock`,
      {
        method: "PUT"
      }
    )

    const result =
      await response.json()

    if (!response.ok) {
      throw new Error(
        result.message ||
        "Failed to unblock user"
      )
    }

    setBlockReasons(
      function (previous) {
        var updated = {
          ...previous
        }

        delete updated[
          blockTarget.id
        ]

        return updated
      }
    )

    setShowUnblockPopup(false)
    setBlockTarget(null)

    await loadUsers()

    if (selectedUser) {
      setSelectedUser(
        function (previous) {
          return previous
            ? {
                ...previous,
                isBlocked: false
              }
            : previous
        }
      )
    }

    if (showToast) {
      showToast(
        result.message ||
        "User unblocked successfully",
        "success"
      )
    }

  } catch (error) {
    console.error(
      "UNBLOCK USER ERROR:",
      error
    )

    if (showToast) {
      showToast(
        error.message,
        "error"
      )
    }
  }
}

  var searchBar = (
    <div style={{ position: "relative", marginBottom: "24px", maxWidth: "480px" }}>
      <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
      <input type="text" placeholder="Search users" value={search}
        onChange={function (e) { setSearch(e.target.value); setCurrentPage(1); setAllPage(1) }}
        style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box", fontWeight: "500" }}
        onFocus={function (e) { e.target.style.borderColor = "#006a61" }}
        onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
    </div>
  )

  var blockPopup = showBlockPopup && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function () { setShowBlockPopup(false) }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "36px 32px", width: "380px", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }} onClick={function (e) { e.stopPropagation() }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#dc2626" }}>block</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Block User?</h2>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>You are about to block <strong>{blockTarget && blockTarget.name}</strong>.</p>
        <textarea placeholder="Enter reason for blocking (optional)..." value={blockReason}
          onChange={function (e) { setBlockReason(e.target.value) }} rows={3}
          style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", boxSizing: "border-box", resize: "none", marginBottom: "20px", fontFamily: "inherit" }}
          onFocus={function (e) { e.target.style.borderColor = "#dc2626" }}
          onBlur={function (e) { e.target.style.borderColor = "#e2e8f0" }} />
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={function () { setShowBlockPopup(false) }} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "white", color: "#374151", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmBlock} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#dc2626", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Block</button>
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
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Unblock User?</h2>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "28px" }}>Are you sure you want to unblock <strong>{blockTarget && blockTarget.name}</strong>?</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={function () { setShowUnblockPopup(false) }} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "white", color: "#374151", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmUnblock} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#006a61", color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Unblock</button>
        </div>
      </div>
    </div>
  )

  var usersTable = function (data) {
    return (
      <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #131b2e, #006a61)" }}>
                {tableHeaders.map(function (col) {
                  return <th key={col} style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "15px" }}>No users found.</td></tr>}
              {data.map(function (user, index) {
                return <UserTableRow key={user.id} user={user} index={index} onView={function () { setSelectedUser(Object.assign({}, user, { _from: view })); setView("detail") }} />
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // DETAIL PAGE
  if (view === "detail" && selectedUser) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView(selectedUser._from || "main"); setSelectedUser(null) }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>User Profile</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Detailed view of {selectedUser.name}</p>
          </div>
        </div>
        <div style={{ background: isBlocked(selectedUser.id) ? "linear-gradient(135deg, #dc2626, #f87171)" : "linear-gradient(135deg, #131b2e, #006a61)", borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Avatar name={selectedUser.name} size={64} />
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "white" }}>{selectedUser.name}</h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>Joined on {selectedUser.joinedDate}</p>
            </div>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", padding: "6px 18px", borderRadius: "999px", background: "white", color: isBlocked(selectedUser.id) ? "#dc2626" : "#006a61" }} />
          {isBlocked(selectedUser.id)
            ? "Blocked"
            : "Registered"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Full Name", value: selectedUser.name, icon: "person" },

            { label: "Email Address", value: selectedUser.email, icon: "email" },

            { label: "Total Reservations", value: selectedUser.reservations, icon: "bookmark_check" },

            { label: "Prescriptions Uploaded", value: selectedUser.prescriptions, icon: "description" },

            { label: "Joined Date", value: selectedUser.joinedDate, icon: "calendar_today" },
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
        {isBlocked(selectedUser.id) && blockReasons[selectedUser.id] && (
          <div style={{ background: "#fee2e2", borderRadius: "16px", padding: "16px 20px", marginBottom: "24px", border: "1px solid #fecaca" }}>
            <p style={{ fontSize: "12px", color: "#dc2626", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Block Reason</p>
            <p style={{ fontSize: "14px", color: "#7f1d1d" }}>{blockReasons[selectedUser.id]}</p>
          </div>
        )}
        {!isBlocked(selectedUser.id) ? (
          <button onClick={function () { handleBlock(selectedUser) }}
            style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "2px solid #fee2e2", background: "white", color: "#dc2626", fontWeight: "700", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            onMouseEnter={function (e) { e.currentTarget.style.background = "#fee2e2" }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>block</span>Block This User
          </button>
        ) : (
          <button onClick={function () { handleUnblock(selectedUser) }}
            style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #006a61, #4edea3)", color: "white", fontWeight: "700", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.9" }}
            onMouseLeave={function (e) { e.currentTarget.style.opacity = "1" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>lock_open</span>Unblock This User
          </button>
        )}
        {blockPopup}
        {unblockPopup}
      </div>
    )
  }

  // ALL USERS PAGE
  if (view === "all") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main") }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>All Registered Users</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>{users.length} users registered on the platform</p>
          </div>

        </div>
        {searchBar}
        {usersTable(allPaginated)}
        <Pagination currentPage={allPage} totalPages={allTotalPages} onPageChange={function (p) { setAllPage(p) }} />
      </div>
    )
  }

  // BLOCKED USERS PAGE
  if (view === "blocked") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "16px" }}>
          <button onClick={function () { setView("main") }} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#374151" }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>Blocked Users</h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>{blockedUsers.length} users currently blocked</p>
          </div>
        </div>
        {blockedUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "white", borderRadius: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#e2e8f0", display: "block", marginBottom: "16px" }}>verified_user</span>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>No Blocked Users</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>There are currently no blocked users on the platform.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {blockedUsers.map(function (user) {
              return (
                <div key={user.id} style={{ background: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", borderLeft: "4px solid #dc2626", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <Avatar name={user.name} size={44} />
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>{user.name}</p>
                      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>{user.email}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#dc2626" }}>info</span>
                        <p style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600" }}>{blockReasons[user.id] || "Violated platform policy"}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={function () { setSelectedUser(Object.assign({}, user, { _from: "blocked" })); setView("detail") }}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", border: "2px solid #006a61", background: "white", color: "#006a61", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                      onMouseEnter={function (e) { e.currentTarget.style.background = "#e6f4f3" }}
                      onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>View
                    </button>
                    <button onClick={function () { handleUnblock(user) }}
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
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>User Management</h1>
        <div style={{ height: "3px", width: "80px", background: "linear-gradient(90deg, #006a61, #4edea3)", borderRadius: "999px", marginBottom: "12px" }}></div>
        <p style={{ fontSize: "15px", color: "#64748b" }}>Review, monitor and update user accounts across the platform.</p>
      </div>
      {searchBar}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[
          { label: "Total Registered Users", value: totalUsers, icon: "group", color: "#006a61", bg: "#e6f4f3" },
          { label: "Total Reservations", value: totalReservations, icon: "person_check", color: "#1d4ed8", bg: "#eff6ff" },
          { label: "Total Prescriptions", value: totalPrescriptions, icon: "person_add", color: "#7c3aed", bg: "#f5f3ff" },
        ].map(function (stat) {
          return (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: "20px", padding: "24px 28px", display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "180px" }}>
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
      <div style={{ marginBottom: "28px" }}>
        <button onClick={function () { setView("blocked") }}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 24px", borderRadius: "14px", border: "2px solid #fee2e2", background: "white", color: "#dc2626", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}
          onMouseEnter={function (e) { e.currentTarget.style.background = "#fee2e2" }}
          onMouseLeave={function (e) { e.currentTarget.style.background = "white" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>block</span>
          Blocked Users
          <span style={{ background: "#dc2626", color: "white", borderRadius: "999px", padding: "2px 10px", fontSize: "13px", fontWeight: "800" }}>{blockedUsers.length}</span>
        </button>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "22px" }}>table_chart</span>All Registered Users
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
        {usersTable(mainPaginated)}
        <Pagination currentPage={currentPage} totalPages={mainTotalPages} onPageChange={function (p) { setCurrentPage(p) }} />
      </div>
    </div>
  )
}