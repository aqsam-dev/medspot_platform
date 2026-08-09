import { useState } from "react";
import pharmacyProfileService from "../../services/pharmacyprofileservice";

const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" }
];

const createDefaultHours = () => {
  const hours = {};

  daysOfWeek.forEach((day) => {
    hours[day.id] = {
      isOpen: false,
      open: "",
      close: ""
    };
  });

  return hours;
};

const prepareInitialHours = (savedHours) => {
  const defaultHours = createDefaultHours();

  if (!savedHours || typeof savedHours !== "object") {
    return defaultHours;
  }

  daysOfWeek.forEach((day) => {
    const savedDay = savedHours[day.id];

    if (savedDay) {
      defaultHours[day.id] = {
        isOpen: Boolean(savedDay.isOpen),
        open: savedDay.open || "",
        close: savedDay.close || ""
      };
    }
  });

  return defaultHours;
};

export default function EditOperatingHoursModal({
  profile,
  onClose,
  onSuccess
}) {
  const initialHours = prepareInitialHours(
    profile.operating_hours
  );

  const initially24Hours = daysOfWeek.every(
    (day) =>
      initialHours[day.id]?.isOpen === true &&
      initialHours[day.id]?.open === "00:00" &&
      initialHours[day.id]?.close === "23:59"
  );

  const [operatingHours, setOperatingHours] =
    useState(initialHours);

  const [is24Hours, setIs24Hours] =
    useState(initially24Hours);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleDayToggle = (dayId) => {
    setError("");

    setOperatingHours((previous) => {
      const currentDay = previous[dayId] || {
        isOpen: false,
        open: "",
        close: ""
      };

      const willOpen = !currentDay.isOpen;

      return {
        ...previous,
        [dayId]: {
          isOpen: willOpen,
          open: willOpen
            ? currentDay.open || "09:00"
            : "",
          close: willOpen
            ? currentDay.close || "18:00"
            : ""
        }
      };
    });
  };

  const handleTimeChange = (
    dayId,
    field,
    value
  ) => {
    setError("");

    setOperatingHours((previous) => ({
      ...previous,
      [dayId]: {
        ...previous[dayId],
        [field]: value
      }
    }));
  };

  const handle24Hours = (value) => {
    setError("");
    setIs24Hours(value);

    if (value) {
      const allDays = {};

      daysOfWeek.forEach((day) => {
        allDays[day.id] = {
          isOpen: true,
          open: "00:00",
          close: "23:59"
        };
      });

      setOperatingHours(allDays);
      return;
    }

    const normalHours = {};

    daysOfWeek.forEach((day) => {
      normalHours[day.id] = {
        isOpen:
          day.id !== "sunday",
        open:
          day.id !== "sunday"
            ? "09:00"
            : "",
        close:
          day.id !== "sunday"
            ? "18:00"
            : ""
      };
    });

    setOperatingHours(normalHours);
  };

  const validateOperatingHours = () => {
    const openDays = daysOfWeek.filter(
      (day) =>
        operatingHours[day.id]?.isOpen
    );

    if (openDays.length === 0) {
      return "At least one day must be open.";
    }

    for (const day of openDays) {
      const dayHours =
        operatingHours[day.id];

      if (
        !dayHours.open ||
        !dayHours.close
      ) {
        return `Please select opening and closing times for ${day.label}.`;
      }

      if (
        !is24Hours &&
        dayHours.open >= dayHours.close
      ) {
        return `${day.label}'s closing time must be later than its opening time.`;
      }
    }

    return "";
  };

  const handleSubmit = async () => {
    const validationError =
      validateOperatingHours();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
        The service function should receive:
        1. Pharmacy ID
        2. The operating-hours object

        The service itself will send:
        {
          operating_hours: operatingHours
        }
      */
      const response =
        await pharmacyProfileService.updateOperatingHours(
          profile.pharmacy_id,
          operatingHours
        );

      if (
        response?.success === false
      ) {
        throw new Error(
          response.message ||
            "Failed to update operating hours."
        );
      }

      onSuccess();
    } catch (err) {
      console.error(
        "Update Operating Hours Error:",
        err.response?.data ||
          err.message
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update operating hours."
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
        bg-black/50
        p-4
      "
    >
      <div
        className="
          w-full max-w-4xl
          max-h-[90vh]
          overflow-auto
          rounded-2xl
          bg-white
          p-6
        "
      >
        <h2 className="mb-6 text-xl font-semibold">
          Edit Operating Hours
        </h2>

        <div className="mb-6">
          <p className="mb-3 font-medium">
            Does the pharmacy operate 24/7?
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handle24Hours(true)
              }
              className={`
                rounded-xl px-5 py-2
                disabled:cursor-not-allowed
                disabled:opacity-60
                ${
                  is24Hours
                    ? "bg-blue-600 text-white"
                    : "border bg-white text-gray-700"
                }
              `}
            >
              Yes
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handle24Hours(false)
              }
              className={`
                rounded-xl px-5 py-2
                disabled:cursor-not-allowed
                disabled:opacity-60
                ${
                  !is24Hours
                    ? "bg-blue-600 text-white"
                    : "border bg-white text-gray-700"
                }
              `}
            >
              No
            </button>
          </div>
        </div>

        {is24Hours ? (
          <div
            className="
              rounded-xl
              border border-blue-200
              bg-blue-50
              px-4 py-4
              text-sm text-blue-700
            "
          >
            The pharmacy will be marked as open
            24 hours a day, seven days a week.
          </div>
        ) : (
          <div className="space-y-3">
            {daysOfWeek.map((day) => {
              const dayHours =
                operatingHours[day.id] || {
                  isOpen: false,
                  open: "",
                  close: ""
                };

              return (
                <div
                  key={day.id}
                  className="
                    rounded-xl border p-4
                  "
                >
                  <div
                    className="
                      flex flex-col gap-4
                      md:flex-row
                      md:items-center
                    "
                  >
                    <label
                      className="
                        flex min-w-36
                        items-center gap-3
                      "
                    >
                      <input
                        type="checkbox"
                        disabled={loading}
                        checked={
                          dayHours.isOpen
                        }
                        onChange={() =>
                          handleDayToggle(
                            day.id
                          )
                        }
                        className="
                          h-4 w-4
                          cursor-pointer
                        "
                      />

                      <span className="font-medium">
                        {day.label}
                      </span>
                    </label>

                    {dayHours.isOpen ? (
                      <div
                        className="
                          flex flex-1
                          flex-col gap-3
                          sm:flex-row
                          sm:items-center
                        "
                      >
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`${day.id}-open`}
                            className="text-sm text-gray-600"
                          >
                            Opens
                          </label>

                          <input
                            id={`${day.id}-open`}
                            type="time"
                            disabled={loading}
                            value={
                              dayHours.open
                            }
                            onChange={(e) =>
                              handleTimeChange(
                                day.id,
                                "open",
                                e.target.value
                              )
                            }
                            className="
                              rounded-lg
                              border p-2
                              disabled:bg-gray-100
                            "
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`${day.id}-close`}
                            className="text-sm text-gray-600"
                          >
                            Closes
                          </label>

                          <input
                            id={`${day.id}-close`}
                            type="time"
                            disabled={loading}
                            value={
                              dayHours.close
                            }
                            onChange={(e) =>
                              handleTimeChange(
                                day.id,
                                "close",
                                e.target.value
                              )
                            }
                            className="
                              rounded-lg
                              border p-2
                              disabled:bg-gray-100
                            "
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div
            className="
              mt-4 rounded-xl
              border border-red-200
              bg-red-50
              px-4 py-3
              text-sm text-red-600
            "
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
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