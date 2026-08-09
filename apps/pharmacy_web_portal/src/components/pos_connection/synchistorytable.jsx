export default function SyncHistoryTable({
  history,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="font-semibold mb-4">
        Sync History
      </h2>

      <table className="w-full">

        <thead>

          <tr className="border-b">

            <th className="text-left py-3">
              Date
            </th>

            <th className="text-left py-3">
              Status
            </th>

            <th className="text-left py-3">
              Records
            </th>

          </tr>

        </thead>

        <tbody>

          {history.map(item => (
            <tr
              key={item.id}
              className="border-b"
            >
              <td className="py-3">
                {item.sync_time}
              </td>

              <td className="py-3">
                {item.status}
              </td>

              <td className="py-3">
                {item.records_synced}
              </td>
            </tr>
          ))}

        </tbody>

      </table>
    </div>
  );
}