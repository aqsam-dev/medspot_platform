import { useEffect, useState } from "react";

import AccountLayout from "../../components/layout/AccountLayout";
import PharmacyBasicInfoCard from "../../components/profile/pharmacybasicinfocard";
import AddressLocationCard from "../../components/profile/addresslocationcard";
import OperatingHoursCard from "../../components/profile/operatinghourscard";
import PharmacistInfoCard from "../../components/profile/pharmacistinfocard";
import CredentialsCard from "../../components/profile/credentialscard";

import EditBasicInfoModal from "../../components/profile/editbasicinfomodal";
import EditAddressModal from "../../components/profile/editaddresslocationmodal";
import EditOperatingHoursModal from "../../components/profile/editoperatinghoursmodal";
import EditPharmacistModal from "../../components/profile/editpharmacistinfomodal";

import ChangeUsernameModal from "../../components/profile/changeusernamemodal";
import ChangePasswordModal from "../../components/profile/changepasswordmodal";

import pharmacyProfileService from "../../services/pharmacyprofileservice";

export default function PharmacyProfile() {
  const [profile, setProfile] = useState(null);

  const [showBasicModal, setShowBasicModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showPharmacistModal, setShowPharmacistModal] =
    useState(false);

  const [showUsernameModal, setShowUsernameModal] =
    useState(false);

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const loadProfile = async () => {
    try {
      const pharmacy = JSON.parse(
        localStorage.getItem("pharmacyData")
      );

      if (!pharmacy?.pharmacy_id) return;

      const data =
        await pharmacyProfileService.getProfile(
          pharmacy.pharmacy_id
        );

      setProfile(data);
    } catch (err) {
      console.error("Profile Load Error:", err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (!profile) {
    return (
      <AccountLayout
        headerProps={{
          title: "Pharmacy Profile",
          subtitle: "Loading..."
        }}
      >
        <div>Loading profile...</div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      headerProps={{
        title: "Pharmacy Profile",
        subtitle:
          "Manage pharmacy information and credentials"
      }}
    >
      <div className="space-y-6">

        {/* CARD 1 */}
        <PharmacyBasicInfoCard
          profile={profile}
          onEdit={() => setShowBasicModal(true)}
        />

        {/* CARD 2 */}
        <AddressLocationCard
          profile={profile}
          onEdit={() => setShowAddressModal(true)}
        />

        {/* CARD 3 */}
        <OperatingHoursCard
          profile={profile}
          onEdit={() => setShowHoursModal(true)}
        />

        {/* CARD 4 */}
        <PharmacistInfoCard
          profile={profile}
          onEdit={() => setShowPharmacistModal(true)}
        />

        {/* CARD 5 */}
        <CredentialsCard
          profile={profile}
          onChangeUsername={() =>
            setShowUsernameModal(true)
          }
          onChangePassword={() =>
            setShowPasswordModal(true)
          }
        />
      </div>

      {/* BASIC INFO MODAL */}
      {showBasicModal && (
        <EditBasicInfoModal
          profile={profile}
          onClose={() =>
            setShowBasicModal(false)
          }
          onSuccess={() => {
            setShowBasicModal(false);
            loadProfile();
          }}
        />
      )}

      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <EditAddressModal
          profile={profile}
          onClose={() =>
            setShowAddressModal(false)
          }
          onSuccess={() => {
            setShowAddressModal(false);
            loadProfile();
          }}
        />
      )}

      {/* OPERATING HOURS MODAL */}
      {showHoursModal && (
        <EditOperatingHoursModal
          profile={profile}
          onClose={() =>
            setShowHoursModal(false)
          }
          onSuccess={() => {
            setShowHoursModal(false);
            loadProfile();
          }}
        />
      )}

      {/* PHARMACIST MODAL */}
      {showPharmacistModal && (
        <EditPharmacistModal
          profile={profile}
          onClose={() =>
            setShowPharmacistModal(false)
          }
          onSuccess={() => {
            setShowPharmacistModal(false);
            loadProfile();
          }}
        />
      )}

      {/* USERNAME */}
      {showUsernameModal && (
        <ChangeUsernameModal
          profile={profile}
          onClose={() =>
            setShowUsernameModal(false)
          }
          onSuccess={() => {
            setShowUsernameModal(false);
            loadProfile();
          }}
        />
      )}

      {/* PASSWORD */}
      {showPasswordModal && (
        <ChangePasswordModal
          profile={profile}
          onClose={() =>
            setShowPasswordModal(false)
          }
        />
      )}
    </AccountLayout>
  );
}