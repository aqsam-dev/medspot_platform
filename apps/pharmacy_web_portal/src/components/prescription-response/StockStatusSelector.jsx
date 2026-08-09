export default function StockStatusSelector() {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <h3 className="font-bold mb-4">Stock Status</h3>

      <div className="grid grid-cols-3 gap-4">
        {["All", "Partial", "None"].map((item) => (
          <div
            key={item}
            className="border p-4 rounded-xl text-center cursor-pointer hover:border-blue-500"
          >
            <p className="font-semibold">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}