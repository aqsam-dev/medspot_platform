import {
  Clock3,
  Pencil
} from "lucide-react";

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

export default function OperatingHoursCard({
  profile,
  onEdit
}) {
  const hours = profile.operating_hours || {};

  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold">
            Operating Hours
          </h2>

          <p className="text-sm text-gray-500">
            Pharmacy working schedule
          </p>
        </div>

        <button
          onClick={onEdit}
          className="
            flex items-center gap-2
            bg-blue-600 text-white
            px-4 py-2 rounded-xl
          "
        >
          <Pencil size={16} />
          Edit
        </button>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-4">
          {days.map((day) => (
            <div
              key={day}
              className="
                border rounded-xl p-4
                bg-gray-50
              "
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock3
                  size={16}
                  className="text-blue-600"
                />

                <span className="font-medium capitalize">
                  {day}
                </span>
              </div>

              {hours?.[day]?.isOpen ? (
                <p className="font-semibold text-green-600">
                  {hours[day].open}
                  {" - "}
                  {hours[day].close}
                </p>
              ) : (
                <p className="font-semibold text-red-500">
                  Closed
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}