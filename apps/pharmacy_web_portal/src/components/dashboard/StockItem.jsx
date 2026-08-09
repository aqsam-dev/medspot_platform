// src/components/dashboard/StockItem.jsx

export default function StockItem({ name, quantity, type = "low" }) {
  const styles = {
    low: {
      wrapper: "bg-red-50 border-red-100 font-bold",
      badge: "text-red-600 rounded-lg bg-red-100",
      label: "Low Stock",
    },
    out: {
      wrapper: "bg-orange-50 border-orange-100 font-bold",
      badge: "text-orange-600 rounded-lg bg-orange-100",
      label: "Out of Stock",
    },
    new: {
      wrapper: "bg-emerald-50 border-emerald-100 font-bold",
      badge: "text-emerald-600 rounded-lg bg-emerald-100",
      label: "New Stock",
    },
    restock: {
      wrapper: "bg-emerald-50 border-emerald-100 font-bold",
      badge: "text-emerald-600 rounded-lg bg-emerald-100",
      label: "Restocked",
    },
  };

  const s = styles[type] || styles.low;

  return (
    <div className={`flex justify-between p-4 border rounded-lg  ${s.wrapper}`}>
      <div>
        <p className="font-bold text-lg">{name}</p>
        <p className="text-base text-slate-500">{quantity}</p>
      </div>

      <span className={`text-xs px-2 py-1 rounded flex items-center justify-center ${s.badge}`}>
        {s.label}
      </span>
    </div>
  );
}