import { useNavigate } from "react-router-dom";

export default function PrescriptionNotes({ prescription }) {
  const navigate = useNavigate();

  const handleApprove = () => {
    if (!prescription) {
      alert("Please select a prescription first");
      return;
    }

    navigate("/presponse", {
      state: {
        prescription,
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="text-xs font-bold text-gray-400 mb-4">
        Pharmacist Action
      </h3>

      <div className="flex justify-between mt-4">
        <button
          onClick={handleApprove}
          disabled={!prescription}
          className={`px-6 py-2 rounded-xl text-white ${
            prescription
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Approve & Fill
        </button>
      </div>
    </div>
  );
}