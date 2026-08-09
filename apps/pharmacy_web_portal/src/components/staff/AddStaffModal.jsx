import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function AddStaffModal({
  onClose,
  onSave,
  initialData = null,
}) {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    full_name: initialData?.full_name || "",
    role: initialData?.role || "Salesman",
    phone: initialData?.phone || "",
    whatsapp: initialData?.whatsapp || "",
    receive_whatsapp:
      initialData?.receive_whatsapp ?? true,
  });

  useEffect(() => {

    setForm({

        full_name:
            initialData?.full_name || "",

        role:
            initialData?.role || "Salesman",

        phone:
            initialData?.phone || "",

        whatsapp:
            initialData?.whatsapp || "",

        receive_whatsapp:
            initialData?.receive_whatsapp ?? true

    });

}, [initialData]);

function handleChange(e) {
  const { name, value, type, checked } = e.target;

  if (type === "checkbox") {
    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
    return;
  }

  let newValue = value;

  // Validation for WhatsApp number
  if (name === "whatsapp") {
    // Only digits
    newValue = newValue.replace(/\D/g, "");

    // Maximum 11 digits
    newValue = newValue.slice(0, 11);

    // First digit can only be 0
    if (newValue.length >= 1 && newValue[0] !== "0") {
      return;
    }

    // Second digit must be 3
    if (newValue.length >= 2 && newValue.substring(0, 2) !== "03") {
      return;
    }
  }

  setForm((prev) => ({
    ...prev,
    [name]: newValue,
  }));
}

async function handleSubmit(e) {
  e.preventDefault();

  if (!form.full_name.trim()) {
    alert("Please enter full name.");
    return;
  }

  if (!form.whatsapp.trim()) {
    alert("Please enter WhatsApp number.");
    return;
  }

  if (!/^03\d{9}$/.test(form.whatsapp)) {
    alert(
      "WhatsApp number must start with 03 and contain exactly 11 digits."
    );
    return;
  }

  if (onSave) {
    await onSave(form);
  }
}

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">

        {/* HEADER */}

        <div className="flex items-center justify-between px-8 py-6 border-b">

          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isEdit
                ? "Edit Staff Member"
                : "Add Staff Member"}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Staff members will receive
              reservation notifications.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6"
        >

          {/* NAME */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Full Name
            </label>

            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Ali Khan"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* ROLE */}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Role
            </label>

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option>Salesman</option>
              <option>Cashier</option>
            </select>
          </div>

          {/* WHATSAPP */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              WhatsApp Number
            </label>
           <input
  type="text"
  name="whatsapp"
  value={form.whatsapp}
  onChange={handleChange}
  inputMode="numeric"
  maxLength={11}
  placeholder="03XXXXXXXXX"
  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
/>
          </div>
          {/* CHECKBOX */}
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
            <input
              type="checkbox"
              name="receive_whatsapp"
              checked={form.receive_whatsapp}
              onChange={handleChange}
              className="mt-1 w-5 h-5 accent-blue-600"
            />
            <div>
              <p className="font-semibold text-blue-700">
                Receive Reservation Alerts
              </p>
              <p className="text-sm text-blue-600 mt-1">
                This staff member will receive
                WhatsApp notifications whenever
                a customer reserves medicine.
              </p>
            </div>
          </div>
          {/* FOOTER */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
            >
              {isEdit
                ? "Update Staff"
                : "Save Staff"}
            </button>
        </div>
        </form>
      </div>
    </div>
  );
}