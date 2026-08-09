export default function SyncStats({ status }) {
  return (
    <div className="grid grid-cols-4 gap-5">

      <Card
        title="Medicines Synced"
        value={status.total_medicines}
      />

      <Card
        title="Today's Syncs"
        value={status.today_syncs}
      />

      <Card
        title="Failed Records"
        value={status.failed_records}
      />

      <Card
        title="Success Rate"
        value={`${status.success_rate}%`}
      />

    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">

      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <h3 className="text-3xl font-bold mt-2">
        {value}
      </h3>

    </div>
  );
}