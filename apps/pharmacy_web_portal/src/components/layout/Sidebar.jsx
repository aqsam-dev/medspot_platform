import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    icon: "dashboard",
    path: "/dashboard",
  },
  {
    name: "Reservations",
    icon: "event_note",
    path: "/reservation",
  },
  {
    name: "Prescriptions",
    icon: "receipt_long",
    path: "/prescription",
  },
  {
    name: "Reviews",
    icon: "rate_review",
    path: "/reviews",
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
}) {
  const pharmacy = JSON.parse(
    localStorage.getItem("pharmacyData") || "{}"
  );

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen
        bg-white border-r
        transition-all duration-300
        z-20
        flex flex-col
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Top Section */}

      <div className="border-b">
        <div
          className={`
            flex items-center
            px-4 py-5
            ${collapsed ? "justify-center" : "justify-between"}
          `}
        >
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <span className="material-symbols-outlined">
                  medical_services
                </span>
              </div>

      

                <p className="text-xl font-bold text-blue-600 ">
                  {pharmacy?.pharmacy_name}
                </p>
              </div>
          
          )}

          {collapsed && (
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <span className="material-symbols-outlined">
                medical_services
              </span>
            </div>
          )}

          <button
            onClick={() =>
              setCollapsed(!collapsed)
            }
            className="
              p-2 rounded-lg
              hover:bg-gray-100
              transition
            "
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Navigation */}

      <nav className="flex-1 px-3 py-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={collapsed ? item.name : ""}
            className={({ isActive }) =>
              `
              group relative
              flex items-center
              ${
                collapsed
                  ? "justify-center"
                  : "gap-3"
              }
              px-4 py-3 rounded-xl
              transition-all
              ${
                isActive
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }
            `
            }
          >
            <span className="material-symbols-outlined">
              {item.icon}
            </span>

            {!collapsed && (
              <span className="font-medium">
                {item.name}
              </span>
            )}

            {/* Custom Tooltip */}

            {collapsed && (
              <div
                className="
                  absolute left-16
                  opacity-0
                  group-hover:opacity-100
                  pointer-events-none
                  transition
                  bg-gray-900
                  text-white
                  text-xs
                  px-2 py-1
                  rounded-md
                  whitespace-nowrap
                  z-50
                "
              >
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}