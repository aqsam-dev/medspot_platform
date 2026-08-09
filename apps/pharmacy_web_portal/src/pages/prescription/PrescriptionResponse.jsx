import { useLocation } from "react-router-dom";
import { useState , useEffect } from "react";
import axios from "axios";

import Layout from "../../components/layout/MainLayout";
import PrescriptionViewer from "../../components/prescription-response/PrescriptionViewer";
import UserDetailsCard from "../../components/prescription-response/UserDetailsCard";
import MedicineFormList from "../../components/prescription-response/MedicineFormList";
import SummarySection from "../../components/prescription-response/SummarySection";
import ActionButtons from "../../components/prescription-response/ActionButtons";

export default function PrescriptionResponse() {
  const location = useLocation();

  const prescription = location.state?.prescription;

const [medicines,setMedicines]=
useState([]);

useEffect(()=>{

    if(!prescription) return;

    fetchMedicines();

},[]);

const fetchMedicines=
async()=>{

    try{

        const response=
        await axios.get(
            `http://localhost:5000/api/pharmacy/prescriptions/${prescription.id}/medicines`
        );
const rows = response.data.data
.sort((a, b) => {
    const order = {
        High: 1,
        Medium: 2,
        Low: 3
    };

    return (
        order[a.confidence] -
        order[b.confidence]
    );
})
.map((med) => ({
    medicine_name: med.name,
    status: "available",
    quantity: 1,
    price: "",
    alternative_medicine: "",
    confidence: med.confidence,
    raw_text: med.raw_text
}));

setMedicines(rows);

    }catch(err){

        console.log(err);
    }
};


  if (!prescription) {
    return (
      <Layout
        headerProps={{
          title: "Prescription Response",
          subtitle: "No prescription selected",
        }}
      >
        <div className="p-6">
          No prescription selected.
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      headerProps={{
        title: "Prescription Response",
        subtitle: `MP-${prescription.prescription_no}`,
      }}
    >
      <div className="grid grid-cols-12 gap-8">

        {/* LEFT */}
        <div className="col-span-12 lg:col-span-5">
          <PrescriptionViewer prescription={prescription} />
        </div>

        {/* RIGHT */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <UserDetailsCard prescription={prescription} />

          <div className="bg-yellow-50 p-4 rounded-xl border">
    <h3 className="font-semibold mb-2">
        OCR Summary
    </h3>

    <div className="flex gap-4">

        <span>
            Total:
            {medicines.length}
        </span>

        <span>
            High:
            {
                medicines.filter(
                    x=>x.confidence==="High"
                ).length
            }
        </span>

        <span>
            Medium:
            {
                medicines.filter(
                    x=>x.confidence==="Medium"
                ).length
            }
        </span>

        <span>
            Low:
            {
                medicines.filter(
                    x=>x.confidence==="Low"
                ).length
            }
        </span>

    </div>
</div>

          <MedicineFormList
            medicines={medicines}
            setMedicines={setMedicines}
          />

          <SummarySection medicines={medicines} />

          <ActionButtons
            prescription={prescription}
            medicines={medicines}
          />
        </div>

      </div>
    </Layout>
  );
}