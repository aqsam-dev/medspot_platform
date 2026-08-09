import { useState } from "react";
import {
  User,
  GraduationCap,
  Mail,
  CreditCard,
  FileBadge2,
  Pencil,
  X,
} from "lucide-react";

function Info({ icon, label, value }) {
  return (
    <div className="bg-gray-50 border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs uppercase text-gray-500">
          {label}
        </span>
      </div>

      <p className="font-semibold text-gray-800">
        {value || "-"}
      </p>
    </div>
  );
}

export default function PharmacistInfoCard({
  profile,
  onEdit,
}) {
  const licenseUrl = profile?.pharmacist_license || "";

  const isPdf = licenseUrl.toLowerCase().endsWith(".pdf");

  const [showPdf, setShowPdf] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl border shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              Pharmacist Information
            </h2>

            <p className="text-sm text-gray-500">
              Registered pharmacist details
            </p>
          </div>

          <button
            onClick={onEdit}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition"
          >
            <Pencil size={16} />
            Edit
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Info
              icon={<User size={16} />}
              label="Full Name"
              value={profile.pharmacist_name}
            />

            <Info
              icon={<GraduationCap size={16} />}
              label="Qualification"
              value={profile.qualification}
            />

            <Info
              icon={<CreditCard size={16} />}
              label="CNIC"
              value={profile.pharmacist_cnic}
            />

            <Info
              icon={<Mail size={16} />}
              label="Email"
              value={profile.pharmacist_email}
            />
          </div>

          {/* License */}
          {licenseUrl && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <FileBadge2
                  size={18}
                  className="text-blue-600"
                />

                <h3 className="font-semibold">
                  Pharmacist License
                </h3>
              </div>

              {isPdf ? (
                <button
                  onClick={() => setShowPdf(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition"
                >
                  View License
                </button>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <img
                    src={licenseUrl}
                    alt="Pharmacist License"
                    className="w-full h-[350px] object-contain bg-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDF Modal */}
      {showPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden">

            {/* Close Button */}
            <button
              onClick={() => setShowPdf(false)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow hover:bg-gray-100 transition"
            >
              <X size={22} />
            </button>

            {/* PDF Viewer */}
            <iframe
              src={licenseUrl}
              title="Pharmacist License"
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </>
  );
}