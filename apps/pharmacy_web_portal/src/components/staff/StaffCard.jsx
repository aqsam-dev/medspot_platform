import {
  User,
  Phone,
  MessageCircle,
  Pencil,
  Trash2,
  Bell,
  BellOff,
} from "lucide-react";

export default function StaffCard({
  member,
  onEdit,
  onDelete,
  onToggleAlerts,
}) {
  const alertsEnabled = member.receive_whatsapp;
  const active = member.is_active;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between p-6">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <User size={28} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {member.full_name}
            </h2>

            <p className="text-sm text-slate-500">
              {member.role}
            </p>
          </div>

        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>

      </div>

      <div className="border-t border-slate-100" />

      {/* Body */}
      <div className="p-6 space-y-5">

        {/* Phone */}
        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Phone size={18} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Phone
            </p>

            <p className="font-medium text-slate-700">
              {member.phone || "-"}
            </p>
          </div>

        </div>

        {/* WhatsApp */}
        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
            <MessageCircle size={18} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              WhatsApp
            </p>

            <p className="font-medium text-slate-700">
              {member.whatsapp}
            </p>
          </div>

        </div>

        {/* Alerts */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">

          <div className="flex items-center gap-3">

            {alertsEnabled ? (
              <Bell className="text-blue-600" size={20} />
            ) : (
              <BellOff className="text-red-500" size={20} />
            )}

            <div>
              <p className="font-semibold text-slate-700">
                Reservation Alerts
              </p>

              <p className="text-xs text-slate-500">
                {alertsEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>

          </div>

          <button
            onClick={() => onToggleAlerts?.(member)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              alertsEnabled
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-red-100 hover:bg-red-200 text-red-600"
            }`}
          >
            {alertsEnabled ? "Disable" : "Enable"}
          </button>

        </div>

      </div>

      <div className="border-t border-slate-100" />

      {/* Footer */}
      <div className="flex justify-end gap-3 p-5 bg-slate-50">

        <button
          onClick={() => onEdit?.(member)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition"
        >
          <Pencil size={16} />
          Edit
        </button>

        <button
          onClick={() => onDelete?.(member)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
        >
          <Trash2 size={16} />
          Deactivate
        </button>

      </div>

    </div>
  );
}