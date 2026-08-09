import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Building2,
  Link as LinkIcon,
} from "lucide-react";

export default function Header({
  title,
  subtitle,
  extra,
}) {
  const navigate = useNavigate();

  const pharmacy = JSON.parse(
    localStorage.getItem("pharmacyData") || "{}"
  );

  const [showMenu, setShowMenu] = useState(false);

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token =
          localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/notifications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (result.success) {
          setNotifications(
            result.data.slice(0, 3)
          );

          const unread =
            result.data.filter(
              (item) =>
                item.is_read === false
            ).length;

          setUnreadNotifications(unread);
        }
      } catch (error) {
        console.log(
          "Notification Error:",
          error
        );
      }
    }

    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleOutsideClick() {
      setShowMenu(false);
      setShowNotifications(false);
    }

    document.addEventListener(
      "click",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "click",
        handleOutsideClick
      );
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem(
      "pharmacyData"
    );

    window.location.href = "/";
  }

  function navigateTo(path) {
    setShowMenu(false);
    navigate(path);
  }

  return (
    <header className="flex justify-between items-center mb-10">
      {/* Left */}
      <div>
        <h1 className="text-3xl font-bold text-blue-600">
          {title}
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          {subtitle}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {extra}

        {/* Notifications */}
        <div
          className="relative"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            onClick={() =>
              setShowNotifications(
                !showNotifications
              )
            }
            className="
              relative
              w-10
              h-10
              rounded-xl
              border
              bg-white
              hover:bg-gray-100
              flex
              items-center
              justify-center
              transition
              shadow-sm
            "
          >
            <Bell size={18} />

            {unreadNotifications > 0 && (
              <span
                className="
                  absolute
                  -top-1
                  -right-1
                  min-w-[18px]
                  h-[18px]
                  rounded-full
                  bg-red-500
                  text-white
                  text-[10px]
                  flex
                  items-center
                  justify-center
                  px-1
                "
              >
                {unreadNotifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="
                absolute
                right-0
                mt-3
                w-80
                bg-white
                border
                rounded-2xl
                shadow-xl
                overflow-hidden
                z-50
              "
            >
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="font-semibold text-sm">
                  Notifications
                </h3>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(
                    (item) => (
                      <div
                        key={
                          item.notification_id
                        }
                        className="
                          px-4
                          py-3
                          border-b
                          hover:bg-gray-50
                          cursor-pointer
                        "
                      >
                        <p className="text-sm font-medium">
                          {item.message}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </p>
                      </div>
                    )
                  )
                ) : (
                  <div className="p-4 text-sm text-gray-500">
                    No notifications
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/notifications");
                }}
                className="
                  w-full
                  py-3
                  text-blue-600
                  font-medium
                  hover:bg-blue-50
                  border-t
                "
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div
          className="relative"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            onClick={() =>
              setShowMenu(!showMenu)
            }
            className="
              flex
              items-center
              gap-3
              border-l
              pl-6
            "
          >
            <div className="text-right">
              <p className="text-sm font-semibold">
                {pharmacy?.owner_name ||
                  "Pharmacy Owner"}
              </p>

              <p className="text-xs text-gray-500">
                {pharmacy?.pharmacy_name ||
                  "Pharmacy"}
              </p>
            </div>

            <div
              className="
                w-10
                h-10
                rounded-full
                bg-blue-600
                text-white
                flex
                items-center
                justify-center
                font-semibold
                border
              "
            >
              {pharmacy?.pharmacy_name?.[0]?.toUpperCase() ||
                "P"}
            </div>

            <ChevronDown size={16} />
          </button>

          {showMenu && (
            <div
              className="
                absolute
                right-0
                mt-3
                w-64
                bg-white
                border
                rounded-2xl
                shadow-xl
                overflow-hidden
                z-50
              "
            >
              <button
                onClick={() =>
                  navigateTo("/profile")
                }
                className="
                  w-full
                  px-4
                  py-3
                  flex
                  items-center
                  gap-3
                  hover:bg-gray-50
                  text-sm
                  text-left
                "
              >
                <Building2 size={16} />
                Pharmacy Profile
              </button>

              <button
                onClick={() =>
                  navigateTo("/settings")
                }
                className="
                  w-full
                  px-4
                  py-3
                  flex
                  items-center
                  gap-3
                  hover:bg-gray-50
                  text-sm
                  text-left
                "
              >
                <Settings size={16} />
                Settings
              </button>

              <button
                onClick={() =>
                  navigateTo(
                    "/pos-integration"
                  )
                }
                className="
                  w-full
                  px-4
                  py-3
                  flex
                  items-center
                  gap-3
                  hover:bg-gray-50
                  text-sm
                  text-left
                "
              >
                <LinkIcon size={16} />
                POS Integration
              </button>

              <button
                onClick={() =>
                  navigateTo(
                    "/notifications"
                  )
                }
                className="
                  w-full
                  px-4
                  py-3
                  flex
                  items-center
                  gap-3
                  hover:bg-gray-50
                  text-sm
                  text-left
                "
              >
                <Bell size={16} />
                Notifications
              </button>

              <div className="border-t" />

              <button
                onClick={handleLogout}
                className="
                  w-full
                  px-4
                  py-3
                  flex
                  items-center
                  gap-3
                  hover:bg-red-50
                  text-red-600
                  text-sm
                  text-left
                "
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}