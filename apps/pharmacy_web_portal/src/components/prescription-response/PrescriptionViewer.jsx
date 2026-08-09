export default function PrescriptionViewer({ prescription }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-8">

      <h2 className="font-bold mb-4">
        Prescription Reference
      </h2>

      <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">

        <img
          src={prescription.image_url}
          alt={`MP-${prescription.prescription_no}`}
          className="object-contain h-full w-full"
        />

      </div>

      <div className="mt-4 text-sm text-gray-500">
        Prescription No: MP-{prescription.prescription_no}
      </div>

    </div>
  );
}