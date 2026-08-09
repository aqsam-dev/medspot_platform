import { useState } from "react";
import pharmacyProfileService from "../../services/pharmacyprofileservice";

const qualifications = [
  { value: "bpharm", label: "B-Pharm" },
  { value: "mpharm", label: "M-Pharm" }
];

export default function EditPharmacistModal({
  profile,
  onClose,
  onSuccess
}) {
  const [loading, setLoading] =
    useState(false);

  const [errors, setErrors] =
    useState({});

  const [submitError, setSubmitError] =
    useState("");

  const [formData, setFormData] =
    useState({
      pharmacist_name:
        profile.pharmacist_name || "",

      qualification:
        profile.qualification || "",

      pharmacist_cnic:
        profile.pharmacist_cnic || "",

      pharmacist_email:
        profile.pharmacist_email || ""
    });

  const clearFieldError = (field) => {
    setErrors((previous) => {
      const updated = {
        ...previous
      };

      delete updated[field];

      return updated;
    });
  };

  const handleChange = (event) => {
    const {
      name,
      value
    } = event.target;

    setSubmitError("");
    clearFieldError(name);

    if (name === "pharmacist_name") {
      const cleaned = value
        .replace(/[^A-Za-z ]/g, "")
        .replace(/\s{2,}/g, " ")
        .slice(0, 50);

      setFormData((previous) => ({
        ...previous,
        pharmacist_name: cleaned
      }));

      return;
    }

    if (name === "pharmacist_cnic") {
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
        pharmacist_cnic: formatted
      }));

      return;
    }

    if (name === "pharmacist_email") {
      setFormData((previous) => ({
        ...previous,
        pharmacist_email:
          value.trimStart().toLowerCase()
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

    const pharmacistName =
      formData.pharmacist_name.trim();

    const pharmacistEmail =
      formData.pharmacist_email.trim();

    if (
      !/^[A-Za-z ]{3,50}$/.test(
        pharmacistName
      )
    ) {
      validationErrors.pharmacist_name =
        "Name must contain 3 to 50 letters only.";
    }

    if (!formData.qualification) {
      validationErrors.qualification =
        "Please select a qualification.";
    }

    if (
      !/^\d{5}-\d{7}-\d$/.test(
        formData.pharmacist_cnic
      )
    ) {
      validationErrors.pharmacist_cnic =
        "Enter CNIC in 12345-1234567-1 format.";
    }

    if (
      !/^[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|icloud)\.com$/i.test(
        pharmacistEmail
      )
    ) {
      validationErrors.pharmacist_email =
        "Enter a valid Gmail, Yahoo, Hotmail, or iCloud email.";
    }

    return validationErrors;
  };

  const handleSubmit = async () => {
    const validationErrors =
      validate();

    setErrors(validationErrors);
    setSubmitError("");

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        pharmacist_name:
          formData.pharmacist_name.trim(),

        qualification:
          formData.qualification,

        pharmacist_cnic:
          formData.pharmacist_cnic.trim(),

        pharmacist_email:
          formData.pharmacist_email
            .trim()
            .toLowerCase()
      };

      const response =
        await pharmacyProfileService.updatePharmacistInfo(
          profile.pharmacy_id,
          payload
        );

      if (
        response?.success === false
      ) {
        throw new Error(
          response.message ||
            "Failed to update pharmacist information."
        );
      }

      onSuccess();
    } catch (error) {
      console.error(
        "Update Pharmacist Error:",
        error.response?.data ||
          error.message
      );

      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update pharmacist information."
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
        bg-black/50 p-4
      "
    >
      <div
        className="
          max-h-[90vh]
          w-full max-w-2xl
          overflow-auto
          rounded-2xl
          bg-white p-6
        "
      >
        <h2 className="mb-6 text-xl font-semibold">
          Edit Pharmacist Information
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="pharmacist_name"
              className="mb-2 block text-sm font-medium"
            >
              Full Name
            </label>

            <input
              id="pharmacist_name"
              name="pharmacist_name"
              type="text"
              value={
                formData.pharmacist_name
              }
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter pharmacist name"
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${
                  errors.pharmacist_name
                    ? "border-red-500"
                    : "focus:border-blue-500"
                }
              `}
            />

            {errors.pharmacist_name && (
              <p className="mt-1 text-sm text-red-500">
                {
                  errors.pharmacist_name
                }
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="qualification"
              className="mb-2 block text-sm font-medium"
            >
              Qualification
            </label>

            <select
              id="qualification"
              name="qualification"
              value={
                formData.qualification
              }
              onChange={handleChange}
              disabled={loading}
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${
                  errors.qualification
                    ? "border-red-500"
                    : "focus:border-blue-500"
                }
              `}
            >
              <option value="">
                Select qualification
              </option>

              {qualifications.map(
                (qualification) => (
                  <option
                    key={
                      qualification.value
                    }
                    value={
                      qualification.value
                    }
                  >
                    {
                      qualification.label
                    }
                  </option>
                )
              )}
            </select>

            {errors.qualification && (
              <p className="mt-1 text-sm text-red-500">
                {
                  errors.qualification
                }
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="pharmacist_cnic"
              className="mb-2 block text-sm font-medium"
            >
              CNIC
            </label>

            <input
              id="pharmacist_cnic"
              name="pharmacist_cnic"
              type="text"
              value={
                formData.pharmacist_cnic
              }
              onChange={handleChange}
              disabled={loading}
              placeholder="12345-1234567-1"
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${
                  errors.pharmacist_cnic
                    ? "border-red-500"
                    : "focus:border-blue-500"
                }
              `}
            />

            {errors.pharmacist_cnic && (
              <p className="mt-1 text-sm text-red-500">
                {
                  errors.pharmacist_cnic
                }
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="pharmacist_email"
              className="mb-2 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="pharmacist_email"
              name="pharmacist_email"
              type="email"
              value={
                formData.pharmacist_email
              }
              onChange={handleChange}
              disabled={loading}
              placeholder="pharmacist@gmail.com"
              className={`
                w-full rounded-xl border p-3
                outline-none
                disabled:bg-gray-100
                ${
                  errors.pharmacist_email
                    ? "border-red-500"
                    : "focus:border-blue-500"
                }
              `}
            />

            {errors.pharmacist_email && (
              <p className="mt-1 text-sm text-red-500">
                {
                  errors.pharmacist_email
                }
              </p>
            )}
          </div>
        </div>

        {profile.pharmacist_license && (
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium">
              Current Pharmacist License
            </label>

            <div className="rounded-xl border bg-gray-50 p-3">
              <img
                src={
                  profile.pharmacist_license
                }
                alt="Pharmacist license"
                className="
                  h-64 w-full
                  rounded-lg
                  object-contain
                "
              />

              <p className="mt-2 text-sm text-gray-500">
                The uploaded license cannot be changed.
              </p>
            </div>
          </div>
        )}

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
            onClick={handleSubmit}
            disabled={loading}
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