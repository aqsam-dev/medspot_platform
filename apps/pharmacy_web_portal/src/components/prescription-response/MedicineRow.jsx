export default function MedicineRow({
  data,
  index,
  onChange,
  onDelete,
}) {
  const confidenceColor =
    data.confidence === "High"
      ? "bg-green-50 border-green-200"
      : data.confidence === "Medium"
      ? "bg-yellow-50 border-yellow-200"
      : data.confidence === "Low"
      ? "bg-red-50 border-red-200"
      : "";

  const confidenceBadge =
    data.confidence === "High"
      ? "bg-green-100 text-green-700"
      : data.confidence === "Medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <div className={`border rounded-xl p-4 ${confidenceColor}`}>
      {/* Main Row */}
      <div className="grid grid-cols-12 gap-3">
        {/* Medicine Name */}
        <div className="col-span-4">
          <input
            value={data.medicine_name}
            onChange={(e) =>
              onChange(
                index,
                "medicine_name",
                e.target.value
              )
            }
            placeholder="Medicine Name"
            className="w-full border rounded p-2 bg-white"
          />

          {/* OCR Confidence */}
          {data.confidence && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className={`
                  text-xs
                  px-2
                  py-1
                  rounded
                  font-medium
                  ${confidenceBadge}
                `}
              >
                {data.confidence}
              </span>

              {data.confidence === "Low" && (
                <span className="text-xs text-red-600">
                  Pharmacist verification required
                </span>
              )}
            </div>
          )}

          {/* Raw OCR Text */}
          {data.raw_text && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">
                View OCR Text
              </summary>

              <p className="text-xs text-gray-400 mt-1 break-words">
                {data.raw_text}
              </p>
            </details>
          )}
        </div>

        {/* Status */}
        <select
          value={data.status}
          onChange={(e) =>
            onChange(
              index,
              "status",
              e.target.value
            )
          }
          className="col-span-3 border rounded p-2"
        >
          <option value="available">
            Available
          </option>

          <option value="alternative">
            Alternative
          </option>

          <option value="unavailable">
            Not Available
          </option>
        </select>

        {/* Quantity */}
        <input
          type="number"
          value={data.quantity}
          onChange={(e) =>
            onChange(
              index,
              "quantity",
              e.target.value
            )
          }
          placeholder="Qty"
          className="col-span-2 border rounded p-2"
        />

        {/* Price */}
        <input
          type="number"
          value={data.price}
          onChange={(e) =>
            onChange(
              index,
              "price",
              e.target.value
            )
          }
          placeholder="Price"
          className="col-span-2 border rounded p-2"
        />

        {/* Delete */}
        <button
          onClick={() => onDelete(index)}
          disabled={index === 0}
          className="
            col-span-1
            text-red-500
            font-bold
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
          title={
            index === 0
              ? "At least one row is required"
              : "Delete"
          }
        >
          ✕
        </button>
      </div>

      {/* Alternative Medicine */}
      {data.status === "alternative" && (
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">
            Alternative Medicine
          </label>

          <input
            value={
              data.alternative_medicine || ""
            }
            onChange={(e) =>
              onChange(
                index,
                "alternative_medicine",
                e.target.value
              )
            }
            placeholder="e.g. Calpol 500mg"
            className="w-full border rounded-lg p-2 bg-yellow-50"
          />
        </div>
      )}
    </div>
  );
}