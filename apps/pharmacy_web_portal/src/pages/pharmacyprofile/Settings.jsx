import { useNavigate } from "react-router-dom";
import {
  Building2,
  Link as LinkIcon,
  Users,
  Bell,
  Star,
  ChevronRight,
} from "lucide-react";

import AccountLayout from "../../components/layout/AccountLayout";

export default function Settings() {
  const navigate = useNavigate();

  const settingsOptions = [
    {
      title: "Pharmacy Profile",
      description:
        "View and manage your pharmacy information, address and operating details.",
      icon: Building2,
      path: "/profile",
    },
    {
      title: "POS Integration",
      description:
        "Connect and manage your pharmacy point-of-sale system.",
      icon: LinkIcon,
      path: "/pos-integration",
    },
    {
      title: "Manage Staff",
      description:
        "Add staff members and manage who receives reservation notifications.",
      icon: Users,
      path: "/manage-staff",
    },
    {
      title: "Notifications",
      description:
        "View pharmacy notifications and reservation-related alerts.",
      icon: Bell,
      path: "/notifications",
    },
    {
      title: "Reviews",
      description:
        "View ratings and feedback submitted by patients.",
      icon: Star,
      path: "/reviews",
    },
  ];

  return (
    <AccountLayout
      headerProps={{
        title: "Settings",
        subtitle:
          "Manage your pharmacy account, integrations and preferences.",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {settingsOptions.map((option) => {
          const Icon = option.icon;

          return (
            <button
              key={option.path}
              type="button"
              onClick={() => navigate(option.path)}
              className="
                w-full
                bg-white
                border
                border-gray-200
                rounded-2xl
                p-6
                text-left
                shadow-sm
                hover:shadow-md
                hover:border-blue-200
                transition-all
                duration-200
                group
              "
            >
              <div className="flex items-center gap-4">
                <div
                  className="
                    w-12
                    h-12
                    rounded-xl
                    bg-blue-50
                    text-blue-600
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                    group-hover:bg-blue-600
                    group-hover:text-white
                    transition-colors
                  "
                >
                  <Icon size={22} />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">
                    {option.title}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 leading-6">
                    {option.description}
                  </p>
                </div>

                <ChevronRight
                  size={21}
                  className="
                    text-gray-400
                    flex-shrink-0
                    group-hover:text-blue-600
                    group-hover:translate-x-1
                    transition-all
                  "
                />
              </div>
            </button>
          );
        })}
      </div>
    </AccountLayout>
  );
}