import { useState } from "react";
import pharmacyProfileService from "../../services/pharmacyprofileservice";

export default function ChangeUsernameModal({
  profile,
  onClose,
  onSuccess
}) {

  const [formData, setFormData] =
    useState({
      currentPassword: "",
      newUsername: ""
    });

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async () => {

    if (
      !/^[a-zA-Z0-9_]{3,20}$/
      .test(formData.newUsername)
    ) {
      setError(
        "Username must be 3-20 characters"
      );
      return;
    }

    try {

      setLoading(true);

      const res =
        await pharmacyProfileService
          .changeUsername({
            pharmacy_id:
              profile.pharmacy_id,

            currentPassword:
              formData.currentPassword,

            newUsername:
              formData.newUsername
          });

      if (!res.success) {
        setError(res.message);
        return;
      }

      onSuccess();

    } catch (err) {

      console.error(err);

      setError(
        "Failed to update username"
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

      <div className="bg-white p-6 rounded-2xl w-full max-w-md">

        <h2 className="text-xl font-semibold mb-4">
          Change Username
        </h2>

        <input
          type="password"
          placeholder="Current Password"
          className="w-full border p-3 rounded-xl mb-3"
          onChange={(e)=>
            setFormData(prev=>({
              ...prev,
              currentPassword:e.target.value
            }))
          }
        />

        <input
          placeholder="New Username"
          className="w-full border p-3 rounded-xl"
          onChange={(e)=>
            setFormData(prev=>({
              ...prev,
              newUsername:e.target.value
            }))
          }
        />

        {error && (
          <p className="text-red-500 mt-3">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-xl"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
}