import { useEffect, useState, useCallback } from "react";
import { prescriptionAPI } from "../../services/api";

export default function QueueList({ onSelect }) {
  const [data, setData] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const loadPrescriptions = useCallback(async () => {
    try {
      const res = await prescriptionAPI.getAll();

      if (res.success) {
        setData(res.data);

        if (res.data.length > 0) {
          setActiveId(res.data[0].id);

          if (onSelect) {
            onSelect(res.data[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    }
  }, [onSelect]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const handleSelect = (item) => {
    setActiveId(item.id);

    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <div className="bg-white rounded-2xl border h-[calc(100vh-200px)] flex flex-col">
      {/* HEADER */}
      <div className="p-6 border-b flex justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase">
          Queue ({data.length})
        </h3>
      </div>

      {/* LIST */}
      <div className="overflow-y-auto flex-1">
        {data.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No prescriptions found
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`p-4 cursor-pointer border-l-4 transition ${
                activeId === item.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              {/* TOP ROW */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-600 text-sm">
                  MP-{item.prescription_no}
                </span>

                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>

              {/* PATIENT NAME */}
              <p className="font-semibold mt-2 text-gray-900">
                {item.name || "Unknown Patient"}
              </p>

              {/* NOTES */}
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {item.notes || "No notes provided"}
              </p>

              {/* OCR DETAILS */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {/* Medicine Count */}
                <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                  {item.medicine_count || 0} Medicines
                </span>

                {/* OCR Confidence */}
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    item.max_confidence === "High"
                      ? "bg-green-100 text-green-700"
                      : item.max_confidence === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  OCR: {item.max_confidence || "Low"}
                </span>

                {/* Response Status */}
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    item.has_response
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.has_response ? "Responded" : "Pending"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}