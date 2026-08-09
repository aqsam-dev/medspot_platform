import MainLayout from "../../components/layout/MainLayout";
import POSIntegrationCard from "../../components/pos_connection/posintegrationcard";

export default function POSIntegration() {
  return (
    <MainLayout
      headerProps={{
        title: "POS Integration",
        subtitle: "Connect MedSpot with your POS system",
      }}
    >
      <POSIntegrationCard />
    </MainLayout>
  );
}