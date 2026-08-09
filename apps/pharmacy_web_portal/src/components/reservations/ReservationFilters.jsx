
export default function ReservationFilters({ status, setStatus, stats }) {

  const filters = [
    {
      label: "All",
      value: "all",
      count: stats?.totalReservations || 0,
      icon: "list_alt",
    },
    {
      label: "Active",
      value: "active",
      count: stats?.activeReservations || 0,
      icon: "pending",
    },
    {
      label: "Completed",
      value: "completed",
      count: stats?.completedReservations || 0,
      icon: "check_circle",
    },
    {
      label: "Expired",
      value: "expired",
      count: stats?.expiredReservations || 0,
      icon: "warning",
    },
    {
      label: "Cancelled",
      value: "cancelled",
      count: stats?.cancelledReservations || 0,
      icon: "cancel",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Filter by Status
        </h2>
      </div>

      {/* FILTER LIST */}
      <div className="p-2 space-y-1">
        {filters.map((item, i) => (
          <button
            key={i}
            onClick={() =>
              setStatus(item.value)
            }
            className={`
        w-full
        flex
        items-center
        justify-between
        px-4
        py-3
        rounded-xl
        text-sm
        transition-all

        ${status === item.value
                ? "bg-slate-50 text-slate-900 font-semibold border border-slate-200"
                : "text-slate-500 hover:bg-slate-50 font-medium"
              }
    `}
          >
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined text-lg ${status === item.value ? "text-blue-600" : ""
                  }`}
              >
                {item.icon}
              </span>

              {item.label}
            </div>

            {/* RIGHT COUNT */}
            <span
              className={`text-xs px-2 py-0.5 rounded-lg ${status === item.value
                ? "bg-white border border-slate-200"
                : "text-slate-400"
                }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}