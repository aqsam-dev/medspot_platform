import { useState } from "react";

export default function ConnectionStatus({
  status,
  onSync,
  onTest,
  onSaveConnection,
}) {
  const [baseUrl, setBaseUrl] = useState(status.base_url || "");
  const [apiKey, setApiKey] = useState(status.api_key || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const validateUrl = (url) => {
    try {
      const parsed = new URL(url);
      return (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      );
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    setError("");

    const url = baseUrl.trim();

    if (!url) {
      setError("Base URL is required.");
      return;
    }

    if (!validateUrl(url)) {
      setError(
        "Please enter a valid URL (e.g. http://192.168.1.100:5000)"
      );
      return;
    }

    setSaving(true);

    try {
      await onSaveConnection({
        base_url: url,
        api_key: apiKey.trim(),
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save connection."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">

      <h2 className="text-xl font-semibold">
        POS Integration
      </h2>

      <p className="text-gray-500 mb-6">
        Configure your pharmacy POS connection.
      </p>

      <div className="space-y-5">

        <div>
          <label className="block text-sm font-medium mb-2">
            POS Base URL <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            value={baseUrl}
            onChange={(e) => {
              setBaseUrl(e.target.value);
              setError("");
            }}
            placeholder="http://192.168.1.100:5000"
            className={`w-full rounded-lg px-4 py-3 border ${
              error
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />

          <p className="text-xs text-gray-500 mt-1">
            Example:
            {" "}
            http://192.168.1.100:5000
          </p>

          {error && (
            <p className="text-red-600 text-sm mt-2">
              {error}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            API Key (Optional)
          </label>

          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API Key"
            className="w-full border border-gray-300 rounded-lg px-4 py-3"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-lg text-white ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saving ? "Saving..." : "Save Connection"}
        </button>

      </div>

      <hr className="my-6" />

      <div className="flex justify-between items-center">

        <div>
          <p className="text-gray-500">
            Connection Status
          </p>

          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full ${
              status.connected
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status.connected
              ? "Connected"
              : "Disconnected"}
          </span>
        </div>

        <div className="text-right">
          <p>
            <strong>POS Vendor:</strong>{" "}
            {status.vendor || "-"}
          </p>

          <p>
            <strong>Last Sync:</strong>{" "}
            {status.last_sync || "Never"}
          </p>
        </div>

      </div>

      <div className="flex gap-3 mt-6">

        <button
          onClick={onTest}
          disabled={!status.connected}
          className={`px-4 py-2 rounded-lg ${
            status.connected
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Test Connection
        </button>

        <button
          onClick={onSync}
          disabled={!status.connected}
          className={`px-4 py-2 rounded-lg ${
            status.connected
              ? "border border-gray-300 hover:bg-gray-100"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Sync Inventory
        </button>

      </div>

    </div>
  );
}