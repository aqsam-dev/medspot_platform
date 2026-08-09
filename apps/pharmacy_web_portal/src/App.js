import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/auth/Login";
import Otp from "./pages/auth/Otp";
import Newpass from "./pages/auth/Newpass";
import Forgetpass from "./pages/auth/Forgetpass";
import StepPharmacy from "./pages/auth/StepPharmacy";
import StepPharmacist from "./pages/auth/StepPharmacist";
import StepLoginFiles from "./pages/auth/StepLoginFiles";
import Dashboard from "./pages/dashboard/Dashboard";
import Prescription from "./pages/prescription/Prescription";
import PrescriptionResponse from "./pages/prescription/PrescriptionResponse";
import Reservations from "./pages/reservations/Reservations";
import Reviews from "./pages/review/Reviews";
import Notifications from "./pages/pharmacyprofile/Notifications";
import PharmacyProfile from "./pages/pharmacyprofile/PharmacyProfile";
import POSIntegration from "./pages/pos/POSIntegrations";
import Settings from "./pages/pharmacyprofile/Settings";
import ManageStaff from "./pages/reservations/ManageStaff";

import "./app.css";

const App = () => {
    return (
        <>
            <Toaster
                position="top-right"
                reverseOrder={false}
            />

            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/pharmacy" element={<StepPharmacy />} />
                <Route path="/pharmacist" element={<StepPharmacist />} />
                <Route path="/loginc" element={<StepLoginFiles />} />
                <Route path="/forgetpass" element={<Forgetpass />} />
                <Route path="/otp" element={<Otp />} />
                <Route path="/newpass" element={<Newpass />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/prescription" element={<Prescription />} />
                <Route path="/presponse" element={<PrescriptionResponse />} />
                <Route path="/reservation" element={<Reservations />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/profile" element={<PharmacyProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pos-integration" element={<POSIntegration />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/manage-staff" element={<ManageStaff />} />
            </Routes>
        </>
    );
};

export default App;