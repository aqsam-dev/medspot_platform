export default function SummarySection({ medicines }) {
  const total = medicines.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;

    return sum + qty * price;
  }, 0);

  const totalMedicines = medicines.length;

  const high = medicines.filter(
    (item) => item.confidence === "High"
  ).length;

  const medium = medicines.filter(
    (item) => item.confidence === "Medium"
  ).length;

  const low = medicines.filter(
    (item) => item.confidence === "Low"
  ).length;

  const reliability =
    totalMedicines > 0
      ? Math.round(
          ((high + medium) / totalMedicines) * 100
        )
      : 0;

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-5">
      {/* OCR Summary */}
      <div>
        <h3 className="font-bold mb-3">
          OCR Summary
        </h3>

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">
              Total
            </p>

            <p className="font-semibold">
              {totalMedicines}
            </p>
          </div>

          <div>
            <p className="text-green-600">
              High
            </p>

            <p className="font-semibold">
              {high}
            </p>
          </div>

          <div>
            <p className="text-yellow-600">
              Medium
            </p>

            <p className="font-semibold">
              {medium}
            </p>
          </div>

          <div>
            <p className="text-red-600">
              Low
            </p>

            <p className="font-semibold">
              {low}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Reliable OCR Score:
            <span className="font-bold ml-1">
              {reliability}%
            </span>
          </p>
        </div>

        {low > 0 && (
          <div className="
            mt-4
            p-3
            rounded-xl
            bg-red-50
            border
            border-red-200
            text-red-700
            text-sm
          ">
            ⚠ Review all low confidence
            medicines before sending the
            prescription response.
          </div>
        )}
      </div>

      {/* Divider */}
      <hr />

      {/* Price Summary */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500">
            Total Price
          </p>

          <p className="text-sm text-gray-400">
            Calculated from quantity × price
          </p>
        </div>

        <p className="text-blue-600 font-bold text-2xl">
          Rs {total.toFixed(2)}
        </p>
      </div>
    </div>
  );
}