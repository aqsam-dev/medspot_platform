export default function UserDetailsCard({ prescription }) {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">

      <h3 className="font-bold text-lg mb-4">
        Patient Info
      </h3>

      <p className="font-semibold">
        {prescription.name || "Unknown Patient"}
      </p>

      <p className="text-sm text-gray-500">
        Patient ID: {prescription.patient_id}
      </p>

      <p className="text-sm text-gray-500 mt-1">
        Prescription: MP-{prescription.prescription_no}
      </p>

      <div className="mt-4 bg-blue-50 p-4 rounded-xl text-sm italic">
        {prescription.notes || "No notes provided"}
      </div>

    </div>
  );
}