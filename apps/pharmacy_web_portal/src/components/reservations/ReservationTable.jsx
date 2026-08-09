
export default function ReservationTable({
  reservations,
  loading,
  page,
  totalPages,
  setPage,
  sort, setSort, lastUpdated,
  handleViewDetails
}) {

  const statusStyles = {
    active: "bg-blue-50 text-blue-600",
    completed: "bg-green-50 text-green-600",
    expired: "bg-red-50 text-red-600",
    cancelled: "bg-slate-100 text-slate-600",
  };

  const dotStyles = {
    active: "bg-blue-500",
    completed: "bg-green-500",
    expired: "bg-red-500",
    cancelled: "bg-slate-500",
  };

  const timeStyles = {

    active:
      "text-blue-600",

    completed:
      "text-green-600",

    cancelled:
      "text-slate-500",

    expired:
      "text-red-600"

  };

  const timeIcons = {

    active:
      "timer",

    completed:
      "check_circle",

    cancelled:
      "cancel",

    expired:
      "warning"

  };

const getRemainingTime = (row) => {


  if(row.status === "completed"){
    return {
      label:"Completed",
      type:"completed"
    };
  }


  if(row.status === "cancelled"){
    return {
      label:"Cancelled",
      type:"cancelled"
    };
  }


  if(row.status === "expired"){
    return {
      label:"Expired",
      type:"expired"
    };
  }


  // ONLY ACTIVE

  const expiry = new Date(row.expires_at);
  const now = new Date();

  const diff = expiry - now;


  if(diff <= 0){

    return {
      label:"Waiting expiry update",
      type:"active"
    };

  }


  const mins =
  Math.floor(diff / 60000);


  return {

    label:`${mins} mins left`,
    type:"active"

  };

};

  if (loading) {

    return (

      <div className="bg-white rounded-2xl p-12 text-center">

        Loading reservations...

      </div>

    );

  }

  if (!loading && reservations.length === 0) {

    return (

      <div className="bg-white rounded-2xl p-12 text-center">

        <span className="material-symbols-outlined text-6xl text-slate-300">

          inbox

        </span>

        <h2 className="mt-4 text-lg font-semibold">

          No Reservations Found

        </h2>

        <p className="text-slate-400 mt-2">

          There are currently no reservations.

        </p>

      </div>

    );

  }



  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-slate-900">
            Live Reservations
          </h2>

          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded uppercase tracking-wider">
            Last updated: {lastUpdated}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">
            Sort:
          </span>

          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold cursor-pointer">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold"
            >
              <option value="latest">Latest Token ID</option>
              <option value="oldest">Oldest Token ID</option>
              <option value="expiry">Expiry Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">

          {/* HEAD */}
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Token ID
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-wider text-center">
                Quantity
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Remaining Time
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-slate-100">
            {reservations.map((row) => {
              const remaining = getRemainingTime(row);

              return (
                <tr
                  key={row.reservation_id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-5 text-sm font-bold text-slate-900">
                    #{row.reservation_id}
                  </td>

                  <td className="px-6 py-5 text-sm font-medium text-slate-700">
                    {row.customer_name}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600 text-center">
                    {row.total_quantity} Packs
                  </td>

                  {/* TIME */}
                  <td className="px-6 py-5 text-sm">
                    <span
                      className={`flex items-center gap-1.5 ${timeStyles[remaining.type]}`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {timeIcons[remaining.type]}
                      </span>
                      {remaining.label}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-5">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${statusStyles[row.status]}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${dotStyles[row.status]}`}
                      ></div>
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </div>
                  </td>

                  {/* ACTION */}
<td className="px-6 py-5 text-right">
    <button
        onClick={() =>
            handleViewDetails(
                row.reservation_id
            )
        }
        className="
            inline-flex
            items-center
            gap-1
            px-3
            py-1.5
            rounded-lg
            bg-blue-50
            text-blue-600
            font-semibold
            text-xs
            hover:bg-blue-100
            transition
        "
    >
        <span className="material-symbols-outlined text-sm">
            visibility
        </span>

        View Details
    </button>
</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
        <p className="text-xs text-slate-400 font-medium">
          Showing page {page} of {totalPages}
        </p>

        <div className="flex gap-2">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-2 rounded-lg border"
          >
            Previous
          </button>

          <span className="px-4 py-2 font-semibold">

            {page}

          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-2 rounded-lg border"
          >
            Next
          </button>

        </div>
      </div>

    </div>
  );
}