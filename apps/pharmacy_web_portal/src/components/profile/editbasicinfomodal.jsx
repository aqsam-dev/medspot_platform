import { useState } from "react";

import pharmacyProfileService from "../../services/pharmacyprofileservice";

export default function EditBasicInfoModal({
  profile,
  onClose,
  onSuccess
}) {
  const [formData, setFormData] = useState({
    pharmacy_name: profile.pharmacy_name || "",
    owner_name: profile.owner_name || "",
    owner_email: profile.owner_email || "",
    owner_phone: profile.owner_phone || "",
    owner_cnic: profile.owner_cnic || "",
    years_in_operation:
      profile.years_in_operation ?? ""
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  const clearFieldError = (fieldName) => {
    setErrors((previous) => {
      const updatedErrors = {
        ...previous
      };

      delete updatedErrors[fieldName];

      return updatedErrors;
    });
  };

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setSubmitError("");
    clearFieldError(name);

    if (
      name === "owner_name" ||
      name === "pharmacy_name"
    ) {
      const cleaned = value
        .replace(/[^A-Za-z0-9 &'-.]/g, "")
        .replace(/\s{2,}/g, " ")
        .slice(0, 50);

      setFormData((previous) => ({
        ...previous,
        [name]: cleaned
      }));

      return;
    }

    if (name === "owner_phone") {
      const digits = value
        .replace(/\D/g, "")
        .slice(0, 11);

      setFormData((previous) => ({
        ...previous,
        owner_phone: digits
      }));

      return;
    }

    if (name === "owner_cnic") {
      const digits = value
        .replace(/\D/g, "")
        .slice(0, 13);

      let formatted = digits;

      if (digits.length > 5) {
        formatted =
          `${digits.slice(0, 5)}-${digits.slice(5)}`;
      }

      if (digits.length > 12) {
        formatted =
          `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
      }

      setFormData((previous) => ({
        ...previous,
        owner_cnic: formatted
      }));

      return;
    }

    if (name === "owner_email") {
      setFormData((previous) => ({
        ...previous,
        owner_email:
          value.trimStart().toLowerCase()
      }));

      return;
    }

    if (name === "years_in_operation") {
      const cleaned = value
        .replace(/\D/g, "")
        .slice(0, 2);

      setFormData((previous) => ({
        ...previous,
        years_in_operation: cleaned
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const validate = () => {
    const validationErrors = {};

    const pharmacyName =
      formData.pharmacy_name.trim();

    const ownerName =
      formData.owner_name.trim();

    const ownerEmail =
      formData.owner_email.trim();

    const yearsInOperation =
      Number(formData.years_in_operation);

    if (
      pharmacyName.length < 2 ||
      pharmacyName.length > 50
    ) {
      validationErrors.pharmacy_name =
        "Pharmacy name must contain 2 to 50 characters.";
    }

    if (
      !/^[A-Za-z ]{3,50}$/.test(
        ownerName
      )
    ) {
      validationErrors.owner_name =
        "Owner name must contain 3 to 50 letters only.";
    }

    if (
      !/^[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|icloud)\.com$/i.test(
        ownerEmail
      )
    ) {
      validationErrors.owner_email =
        "Enter a valid Gmail, Yahoo, Hotmail, or iCloud email.";
    }

    if (
      !/^03\d{9}$/.test(
        formData.owner_phone
      )
    ) {
      validationErrors.owner_phone =
        "Phone number must start with 03 and contain 11 digits.";
    }

    if (
      !/^\d{5}-\d{7}-\d$/.test(
        formData.owner_cnic
      )
    ) {
      validationErrors.owner_cnic =
        "Enter CNIC in 12345-1234567-1 format.";
    }

    if (
      formData.years_in_operation === "" ||
      Number.isNaN(yearsInOperation) ||
      yearsInOperation < 0 ||
      yearsInOperation > 50
    ) {
      validationErrors.years_in_operation =
        "Years in operation must be between 0 and 50.";
    }

    return validationErrors;
  };

  const handleSubmit = async () => {
    const validationErrors =
      validate();

    setErrors(validationErrors);
    setSubmitError("");

    if (
      Object.keys(validationErrors)
        .length > 0
    ) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        pharmacy_name:
          formData.pharmacy_name.trim(),

        owner_name:
          formData.owner_name.trim(),

        owner_email:
          formData.owner_email
            .trim()
            .toLowerCase(),

        owner_phone:
          formData.owner_phone.trim(),

        owner_cnic:
          formData.owner_cnic.trim(),

        years_in_operation:
          Number(
            formData.years_in_operation
          )
      };

      const response =
        await pharmacyProfileService.updateBasicInfo(
          profile.pharmacy_id,
          payload
        );

      if (response.success) {
        onSuccess();
      }
    } catch (error) {
      console.error(
        "Update Basic Info Error:",
        error
      );

      setSubmitError(
        error.message ||
        "Failed to update basic information."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/40 p-4
      "
    >
      <div
        className="
          w-full max-w-2xl
          max-h-[90vh]
          overflow-auto
          rounded-2xl
          bg-white p-6
        "
      >
        <h2 className="mb-6 text-xl font-semibold">
          Edit Basic Information
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="pharmacy_name"
              className="mb-2 block text-sm font-medium"
            >
              Pharmacy Name
            </label>

            <input
              id="pharmacy_name"
              name="pharmacy_name"
              type="text"
              value={
                formData.pharmacy_name
              }
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter pharmacy name"
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${errors.pharmacy_name
                  ? "border-red-500"
                  : "focus:border-blue-500"
                }
              `}
            />

            {errors.pharmacy_name && (
              <p className="mt-1 text-sm text-red-500">
                {
                  errors.pharmacy_name
                }
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="owner_name"
              className="mb-2 block text-sm font-medium"
            >
              Owner Name
            </label>

            <input
              id="owner_name"
              name="owner_name"
              type="text"
              value={
                formData.owner_name
              }
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter owner name"
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${errors.owner_name
                  ? "border-red-500"
                  : "focus:border-blue-500"
                }
              `}
            />

            {errors.owner_name && (
              <p className="mt-1 text-sm text-red-500">
                {errors.owner_name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="owner_email"
              className="mb-2 block text-sm font-medium"
            >
              Owner Email
            </label>

            <input
              id="owner_email"
              name="owner_email"
              type="email"
              value={
                formData.owner_email
              }
              onChange={handleChange}
              disabled={loading}
              placeholder="owner@gmail.com"
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${errors.owner_email
                  ? "border-red-500"
                  : "focus:border-blue-500"
                }
              `}
            />

            {errors.owner_email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.owner_email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="owner_phone"
              className="mb-2 block text-sm font-medium"
            >
              Owner Phone
            </label>

            <input
              id="owner_phone"
              name="owner_phone"
              type="text"
              value={
                formData.owner_phone
              }
              onChange={handleChange}
              disabled={loading}
              placeholder="03XXXXXXXXX"
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${errors.owner_phone
                  ? "border-red-500"
                  : "focus:border-blue-500"
                }
              `}
            />

            {errors.owner_phone && (
              <p className="mt-1 text-sm text-red-500">
                {errors.owner_phone}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="owner_cnic"
              className="mb-2 block text-sm font-medium"
            >
              Owner CNIC
            </label>

            <input
              id="owner_cnic"
              name="owner_cnic"
              type="text"
              value={
                formData.owner_cnic
              }
              onChange={handleChange}
              disabled={loading}
              placeholder="12345-1234567-1"
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${errors.owner_cnic
                  ? "border-red-500"
                  : "focus:border-blue-500"
                }
              `}
            />

            {errors.owner_cnic && (
              <p className="mt-1 text-sm text-red-500">
                {errors.owner_cnic}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="years_in_operation"
              className="mb-2 block text-sm font-medium"
            >
              Years in Operation
            </label>

            <input
              id="years_in_operation"
              name="years_in_operation"
              type="number"
              min="0"
              max="50"
              value={
                formData.years_in_operation
              }
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter number of years"
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${errors.years_in_operation
                  ? "border-red-500"
                  : "focus:border-blue-500"
                }
              `}
            />

            {errors.years_in_operation && (
              <p className="mt-1 text-sm text-red-500">
                {
                  errors.years_in_operation
                }
              </p>
            )}
          </div>
        </div>

        {submitError && (
          <div
            className="
              mt-4 rounded-xl
              border border-red-200
              bg-red-50
              px-4 py-3
              text-sm text-red-600
            "
          >
            {submitError}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              rounded-xl border
              px-4 py-2
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="
              rounded-xl
              bg-blue-600
              px-4 py-2
              text-white
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}