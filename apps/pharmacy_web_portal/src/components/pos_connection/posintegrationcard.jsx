import { useEffect, useState } from "react";
import posService from "../../services/posService";
import ConnectionStatus from "./connectionstatus";
import SyncStats from "./syncstats";
import SyncHistoryTable from "./synchistorytable";

export default function POSIntegrationCard() {
  const pharmacy = JSON.parse(
    localStorage.getItem("pharmacyData")
  );

  const pharmacyId = pharmacy?.pharmacy_id;

  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const statusData =
        await posService.getStatus(pharmacyId);

      const historyData =
        await posService.getHistory(pharmacyId);

      setStatus(statusData);
      setHistory(historyData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestConnection = async () => {
    const result =
      await posService.testConnection(pharmacyId);

    alert(result.message);

    loadData();
  };

  const handleSync = async () => {
    const result =
      await posService.syncInventory(pharmacyId);

    alert(result.message);

    loadData();
  };
  const handleSaveConnection = async (data) => {
  await posService.saveConnection({
    pharmacy_id: pharmacyId,
    ...data,
  });

  alert("Connection saved successfully");

  loadData();
};


  if (!status) return <div>Loading...</div>;

  return (
    <div className="space-y-6">

      <ConnectionStatus
        status={status}
        onSync={handleSync}
        onTest={handleTestConnection}
        onSaveConnection={handleSaveConnection}
      />

      <SyncStats status={status} />

      <SyncHistoryTable history={history} />

    </div>
  );
}