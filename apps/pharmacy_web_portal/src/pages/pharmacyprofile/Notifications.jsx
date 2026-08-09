import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Package,
  XCircle,
  ChevronRight,
} from "lucide-react";

import AccountLayout from "../../components/layout/AccountLayout";

export default function Notifications() {
const [notifications, setNotifications] = useState([]);

useEffect(() => {
  fetchNotifications();
}, []);

const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/notifications",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Failed to fetch notifications."
      );
    }

    if (data.success) {
      setNotifications(data.data || []);
    }

  } catch (err) {
    console.error(
      "Notification fetch error:",
      err
    );

    setNotifications([]);
  }
};

const getIconData = (type) => {
  switch (type) {
    case "reservation":
      return {
        icon: Bell,
        color: "text-blue-600",
        bg: "bg-blue-100",
      };

    case "reservation_completed":
      return {
        icon: Package,
        color: "text-green-600",
        bg: "bg-green-100",
      };

    case "reservation_cancelled":
      return {
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-100",
      };

    case "prescription":
      return {
        icon: Calendar,
        color: "text-purple-600",
        bg: "bg-purple-100",
      };

    case "review":
      return {
        icon: Bell,
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      };

    case "staff_added":
      return {
        icon: Bell,
        color: "text-indigo-600",
        bg: "bg-indigo-100",
      };

    case "staff_removed":
      return {
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-100",
      };

    default:
      return {
        icon: Bell,
        color: "text-gray-600",
        bg: "bg-gray-100",
      };
  }
};
  return (
    <AccountLayout
      headerProps={{
        title: "Notifications",
        subtitle:
          "Stay updated with recent pharmacy activity",
      }}
    >
      <div className="space-y-6">
        {/* Summary Card */}

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-semibold">
            Notification Center
          </h2>

          <p className="text-blue-100 mt-2">
            You have {notifications.length} recent
            notifications.
          </p>
        </div>

        {/* Notification List */}

        <div className="bg-white rounded-2xl shadow border overflow-hidden">
          {notifications.map((item) => {

  const {
    icon: Icon,
    color,
    bg,
  } = getIconData(item.type);

            return (
              <div
                key={item.notification_id}
                className="
                  flex items-center justify-between
                  p-5 border-b last:border-b-0
                  hover:bg-gray-50
                  transition
                  cursor-pointer
                "
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`
                      w-12 h-12 rounded-xl
                      flex items-center justify-center
                      ${bg}
                    `}
                  >
                    <Icon
                      size={22}
                      className={color}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {item.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {item.message}
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="text-gray-400"
                />
              </div>
            );
          })}
        </div>
      </div>
    </AccountLayout>
  );
}