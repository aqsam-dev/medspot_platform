// ChangePasswordModal.jsx

import { useState } from "react";
import pharmacyProfileService from "../../services/pharmacyprofileservice";

export default function ChangePasswordModal({
  profile,
  onClose
}) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  const validate = () => {
    if (!formData.currentPassword) {
      return "Current password is required";
    }

    if (!passwordRegex.test(formData.newPassword)) {
      return "Password must be 8+ chars with uppercase, lowercase, number and special character";
    }

    if (
      formData.newPassword !==
      formData.confirmPassword
    ) {
      return "Passwords do not match";
    }

    if (
      formData.currentPassword ===
      formData.newPassword
    ) {
      return "New password must be different";
    }

    return null;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response =
        await pharmacyProfileService.changePassword({
          pharmacy_id: profile.pharmacy_id,
          currentPassword:
            formData.currentPassword,
          newPassword:
            formData.newPassword
        });

      if (!response.success) {
        setError(
          response.message ||
          "Failed to update password"
        );
        return;
      }

      setSuccess(
        "Password updated successfully"
      );

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0
        bg-black/50
        flex items-center
        justify-center
        z-50
      "
    >
      <div
        className="
          bg-white
          rounded-2xl
          p-6
          w-full
          max-w-md
        "
      >
        <h2
          className="
            text-xl font-semibold
            mb-6
          "
        >
          Change Password
        </h2>

        <div className="space-y-4">

          <div>
            <label className="block mb-2 text-sm font-medium">
              Current Password
            </label>

            <input
              type="password"
              value={
                formData.currentPassword
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currentPassword:
                    e.target.value
                }))
              }
              className="
                w-full
                border
                rounded-xl
                p-3
              "
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              New Password
            </label>

            <input
              type="password"
              value={
                formData.newPassword
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  newPassword:
                    e.target.value
                }))
              }
              className="
                w-full
                border
                rounded-xl
                p-3
              "
              placeholder="Enter new password"
            />

            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 characters,
              uppercase, lowercase,
              number and special character
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Confirm Password
            </label>

            <input
              type="password"
              value={
                formData.confirmPassword
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword:
                    e.target.value
                }))
              }
              className="
                w-full
                border
                rounded-xl
                p-3
              "
              placeholder="Confirm password"
            />
          </div>

          {error && (
            <div
              className="
                bg-red-50
                text-red-600
                border
                border-red-200
                rounded-xl
                p-3
                text-sm
              "
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="
                bg-green-50
                text-green-600
                border
                border-green-200
                rounded-xl
                p-3
                text-sm
              "
            >
              {success}
            </div>
          )}
        </div>

        <div
          className="
            flex
            justify-end
            gap-3
            mt-6
          "
        >
          <button
            onClick={onClose}
            disabled={loading}
            className="
              px-4 py-2
              border
              rounded-xl
            "
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              px-4 py-2
              bg-blue-600
              text-white
              rounded-xl
            "
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}