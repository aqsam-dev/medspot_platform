import { useState } from "react";

export default function PrescriptionDetails({ prescription }) {
  const [showImage, setShowImage] = useState(false);

  if (!prescription) {
    return <div className="p-6">Select a prescription</div>;
  }

  return (
    <>
      <div className="bg-white rounded-2xl border">

        {/* Header */}
        <div className="p-6 border-b flex justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {prescription.name || "Unknown Patient"}
            </h2>

            <p className="text-sm text-gray-500">
              Patient ID: {prescription.patient_id}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">
              Prescription ID
            </p>

            <p className="font-bold text-blue-600">
              MP-{prescription.prescription_no}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">

          <h3 className="text-xs font-bold text-gray-400 mb-4">
            Medication Details
          </h3>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="italic text-gray-600">
              {prescription.notes || "No notes provided"}
            </p>
          </div>

          {/* Prescription Image */}
          <div className="mt-6">
            <p className="text-sm font-semibold mb-2">
              Prescription Image
            </p>

            <div
              className="w-48 h-32 bg-gray-200 rounded-xl overflow-hidden cursor-pointer border hover:border-blue-500 transition"
              onClick={() => setShowImage(true)}
            >
              <img
                src={prescription.image_url}
                alt="Prescription"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Click image to enlarge
            </p>
          </div>

        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {showImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setShowImage(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImage(false)}
              className="absolute -top-12 right-0 text-white text-3xl"
            >
              ✕
            </button>

            <img
              src={prescription.image_url}
              alt="Prescription Full View"
              className="max-h-[90vh] max-w-full rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}