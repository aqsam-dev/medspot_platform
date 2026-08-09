import MedicineRow from "./MedicineRow";

export default function MedicineFormList({
  medicines,
  setMedicines,
}) {
  const addRow = () => {
    setMedicines([
      ...medicines,
      {
        medicine_name: "",
        status: "available",
        quantity: 1,
        price: "",
        alternative_medicine: "",
      },
    ]);
  };

  const removeRow = (index) => {
    setMedicines(
      medicines.filter((_, i) => i !== index)
    );
  };

  const updateRow = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;

    setMedicines(updated);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">
          Medicine Details
        </h3>

        <button
          onClick={addRow}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl"
        >
          + Add Medicine
        </button>
      </div>

      <div className="space-y-3">
        {medicines.map((row, index) => (
          <MedicineRow
            key={index}
            data={row}
            index={index}
            onChange={updateRow}
            onDelete={removeRow}
          />
        ))}
      </div>
    </div>
  );
}