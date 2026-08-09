import { useState } from "react";
import { responseAPI } from "../../services/api";

export default function ActionButtons({
  prescription,
  medicines,
}) {
  const [loading, setLoading] =
    useState(false);

  const validMedicines =
    medicines.filter(
      (m) =>
        m.medicine_name.trim() !== "" &&
        m.quantity !== "" &&
        m.price !== ""
    );

  const isValid =
    validMedicines.length > 0;

  const getResponseType = () => {
    const statuses =
      validMedicines.map(
        (m) => m.status
      );

    const availableCount =
      statuses.filter(
        (s) => s === "available"
      ).length;

    const unavailableCount =
      statuses.filter(
        (s) => s === "unavailable"
      ).length;

    if (
      availableCount ===
      statuses.length
    ) {
      return "ALL";
    }

    if (
      unavailableCount ===
      statuses.length
    ) {
      return "NONE";
    }

    return "PARTIAL";
  };

  const handleSendResponse =
    async () => {
      try {
        setLoading(true);

        const payload = {
          prescription_id:
            prescription.id,

          response_type:
            getResponseType(),

          medicines:
            validMedicines,
        };

        console.log(
          "Sending Payload:",
          payload
        );

        const res =
          await responseAPI.send(
            payload
          );

        if (res.success) {
          alert(
            "Response sent successfully"
          );
        }
      } catch (err) {
        console.error(err);

        alert(
          "Failed to send response"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="flex gap-4">
      <button
        disabled={
          !isValid || loading
        }
        onClick={
          handleSendResponse
        }
        className={`
          flex-[2]
          p-3
          rounded-xl
          text-white
          transition
          ${
            isValid && !loading
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }
        `}
      >
        {loading
          ? "Sending..."
          : "Send Response"}
      </button>
    </div>
  );
}