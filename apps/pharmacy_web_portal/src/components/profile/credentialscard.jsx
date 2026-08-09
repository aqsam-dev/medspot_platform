import {
  UserCircle2,
  Lock,
  ShieldCheck
} from "lucide-react";

export default function CredentialsCard({
  profile,
  onChangeUsername,
  onChangePassword
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">
          Credentials & Security
        </h2>

        <p className="text-sm text-gray-500">
          Manage login credentials
        </p>
      </div>

      <div className="p-6 space-y-6">

        {/* Username */}

        <div className="flex justify-between items-center border rounded-xl p-4">

          <div className="flex items-center gap-3">
            <UserCircle2
              size={20}
              className="text-blue-600"
            />

            <div>
              <p className="text-xs text-gray-500">
                Username
              </p>

              <p className="font-semibold">
                {profile.username}
              </p>
            </div>
          </div>

          <button
            onClick={onChangeUsername}
            className="
              bg-blue-600
              text-white
              px-4 py-2
              rounded-xl
            "
          >
            Change Username
          </button>

        </div>

        {/* Password */}

        <div className="flex justify-between items-center border rounded-xl p-4">

          <div className="flex items-center gap-3">
            <Lock
              size={20}
              className="text-red-500"
            />

            <div>
              <p className="text-xs text-gray-500">
                Password
              </p>

              <p className="font-semibold">
                ••••••••••••
              </p>
            </div>
          </div>

          <button
            onClick={onChangePassword}
            className="
              bg-red-500
              text-white
              px-4 py-2
              rounded-xl
            "
          >
            Change Password
          </button>

        </div>

        {/* Security */}

        <div className="
          bg-green-50
          border
          border-green-200
          rounded-xl
          p-4
          flex
          items-center
          gap-3
        ">
          <ShieldCheck
            className="text-green-600"
          />

          <div>
            <p className="font-medium">
              Security Status
            </p>

            <p className="text-sm text-gray-600">
              Account credentials are protected with encrypted passwords.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}