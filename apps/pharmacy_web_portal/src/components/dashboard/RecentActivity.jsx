import React from "react";

export default function RecentActivity({
    activities = [],
    loading = false
}) {
    const getTypeStyles = (type) => {
        switch (type?.toLowerCase()) {
            case "completed":
                return "text-emerald-600 bg-emerald-50 border-emerald-100";

            case "expired":
                return "text-red-600 bg-red-50 border-red-100";

            case "cancelled":
                return "text-red-600 bg-red-50 border-red-100";

            case "active":
                return "text-blue-600 bg-blue-50 border-blue-100";

            default:
                return "text-amber-600 bg-amber-50 border-amber-100";
        }
    };

    return (
        <div className="bg-white rounded-2xl drop-shadow-md border border-slate-100 overflow-hidden">

            {/* Header */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-2xl">
                    Recent Activity
                </h2>

                <span className="text-[13px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    {activities.length} Items
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">

                    <thead>
                        <tr className="bg-slate-50 text-left">
                            <th className="text-[14px] text-slate-400 px-8 py-5">
                                Activity
                            </th>

                            <th className="text-[14px] text-slate-400 px-8 py-5">
                                Type
                            </th>

                            <th className="text-[14px] text-slate-400 px-8 py-5 text-right">
                                Time
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">

                        {loading ? (
                            <tr>
                                <td
                                    colSpan="3"
                                    className="px-8 py-10 text-center text-slate-400"
                                >
                                    Loading recent activity...
                                </td>
                            </tr>
                        ) : activities.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="3"
                                    className="px-8 py-10 text-center text-slate-400"
                                >
                                    No recent activity found.
                                </td>
                            </tr>
                        ) : (
                            activities.map((activity) => (
                                <tr
                                    key={activity.id}
                                    className="hover:bg-slate-50/30 transition"
                                >
                                    {/* Activity */}
                                    <td className="px-8 py-6">
                                        <p className="text-lg font-bold">
                                            {activity.message}
                                        </p>

                                       <p className="text-base text-slate-400 mt-1">
    Prescription No: {activity.prescription_no || "N/A"}
</p>
                                    </td>

                                    {/* Type */}
                                    <td className="px-8 py-6">
                                        <span
                                            className={`text-[13px] font-bold px-4 py-1.5 rounded-lg border capitalize ${getTypeStyles(
                                                activity.type
                                            )}`}
                                        >
                                            {activity.type}
                                        </span>
                                    </td>

                                    {/* Time */}
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-sm text-slate-400 italic">
                                            {new Date(
                                                activity.created_at
                                            ).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="p-6 bg-slate-50/30 text-center border-t border-slate-50">
                    <button className="text-xs font-bold text-slate-400 hover:text-primary uppercase tracking-widest">
                        Showing Last 10 Activities
                    </button>
                </div>
            </div>
        </div>
    );
}