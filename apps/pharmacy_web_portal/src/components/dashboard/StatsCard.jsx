// src/components/dashboard/StatCard.jsx

export default function StatCard({ title, value }) {
  return (
    <div className="p-5 rounded-xl  drop-shadow bg-slate-50">
      <p className="text-sm tracking-wider font-bold text-slate-400 uppercase">
        {title}
      </p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}