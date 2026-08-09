import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function PharmacyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
     <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pharmacyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#006a61" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#006a61" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis
  allowDecimals={false}
  tick={{
    fontSize: 11,
    fill: "#9ca3af",
    fontWeight: 600
  }}
  axisLine={false}
  tickLine={false}
  width={30}
/>
        <Tooltip contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px' }} formatter={function(v) { return [v + ' stores', 'Onboarded'] }} />
        <Area type="monotone" dataKey="stores" stroke="#006a61" strokeWidth={3} fill="url(#pharmacyGradient)" dot={{ fill: '#006a61', r: 4, strokeWidth: 0 }} activeDot={{ r: 7, fill: '#006a61' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function UserGrowthChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "13px" }} formatter={function(v) { return [v + " users", "New Registrations"] }} />
        <Bar dataKey="users" fill="#006a61" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

const [stats, setStats] = useState({
  totalReservations: 0,
  totalUsers: 0,
  totalPharmacies: 0,
  pendingPharmacies: 0
})

  const [medicines, setMedicines] = useState([])
  const [activities, setActivities] = useState([])
  const [pharmacyData, setPharmacyData] = useState([])
  const [userGrowthData, setUserGrowthData] = useState([])

async function fetchDashboard() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/dashboard"
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Failed to load dashboard"
      )
    }

    setStats(data.stats || {})
    setMedicines(data.topMedicines || [])
    setActivities(data.recentActivities || [])
    setPharmacyData(data.pharmacyGrowth || [])
    setUserGrowthData(data.userGrowth || [])

  } catch (error) {
    console.error(
      "ADMIN DASHBOARD ERROR:",
      error
    )

    setStats({
      totalReservations: 0,
      totalUsers: 0,
      totalPharmacies: 0,
      pendingPharmacies: 0
    })

    setMedicines([])
    setActivities([])
    setPharmacyData([])
    setUserGrowthData([])
  }
}

useEffect(() => {
  fetchDashboard()
}, [])

useEffect(() => {
  function checkSize() {
    setIsMobile(window.innerWidth < 640)
    setIsTablet(window.innerWidth < 1024)
  }

  checkSize()

  window.addEventListener("resize", checkSize)

  return () => {
    window.removeEventListener("resize", checkSize)
  }
}, [])

  var cardStyle = {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.6)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    borderRadius: "20px",
    padding: "24px",
    position: "relative",
    overflow: "hidden"
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr", gap: "16px" }}>
        {[
          
{
 label: 'Total Reservations',
 value: stats.totalReservations,
 icon: 'bookmark_check',
 borderColor:'#006a61'
},
{
 label:'Total Users',
 value:stats.totalUsers,
 icon:'person_add',
 borderColor:'#bec6e0'
},

{
  label: "Total Pharmacies",
  value: stats.totalPharmacies,
  icon: "domain",
  borderColor: "#4edea3"
}

        ].map(function(stat) {
          return (
            <div key={stat.label} style={{ ...cardStyle, borderLeft: "4px solid " + stat.borderColor }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e6f4f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: "#006a61", fontSize: "24px" }}>{stat.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{stat.label}</p>
                <h3 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>{stat.value}</h3>  
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: "16px" }}>

        {/* Bar Chart */}
        <div style={cardStyle}>
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>Daily User Growth</h4>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>New registrations over the last 14 days</p>
          </div>
         <UserGrowthChart data={userGrowthData} />
        </div>

        {/* Area Chart */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <h4 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>Pharmacy Growth</h4>
              <p style={{ fontSize: "13px", color: "#94a3b8" }}>Onboarding</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#006a61" }}></div>
              <span style={{ fontSize: "12px", color: "#006a61", fontWeight: "600" }}>Stores</span>
            </div>
          </div>
         <PharmacyChart data={pharmacyData} />
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "2fr 1fr", gap: "16px", paddingBottom: "24px" }}>

{/* Top Medicines */}
<div>
  <h3
    style={{
      fontSize: "18px",
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
      stars
    </span>

    Top Medicine of the Week
  </h3>


  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "12px"
    }}
  >

    {medicines.map(function(med) {

      return (

        <div
          key={med.name}
          style={{
            ...cardStyle,
            padding: "18px",
            borderLeft: "4px solid #006a61",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >

          <h5
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              margin: 0
            }}
          >
            {med.name}
          </h5>


          <p
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              margin: 0
            }}
          >
            {med.category} • {med.units} units
          </p>


        </div>

      )

    })}

  </div>

</div>

        {/* Recent Activity */}
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#006a61" }}>history</span>
            Recent Activity
          </h3>
          <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", borderRadius: "20px", overflow: "hidden" }}>
            {activities.map(function(act, i) {
              return (
                <div key={`${act.title}-${act.sub}-${i}`}
                  style={{ padding: "14px 18px", borderBottom: i < activities.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = "rgba(255,255,255,0.5)" }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = "transparent" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: act.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: act.color }}>{act.icon}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", marginBottom: "2px" }}>{act.title}</p>
                    <p style={{ fontSize: "12px", color: "#94a3b8" }}>{act.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}