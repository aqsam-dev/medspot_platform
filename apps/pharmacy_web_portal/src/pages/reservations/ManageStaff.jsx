import { useState , useEffect } from "react";
import AccountLayout from "../../components/layout/AccountLayout";
import StaffCard from "../../components/staff/StaffCard";
import AddStaffModal from "../../components/staff/AddStaffModal";
import {getStaff , addStaff , updateStaff ,  toggleWhatsapp, deleteStaff} from "../../services/staffservice";

export default function ManageStaff() {
const [showAddStaff, setShowAddStaff] = useState(false);
const [staff, setStaff] = useState([]);
const [loading, setLoading] = useState(true);
const [editingStaff, setEditingStaff] = useState(null);
const [search, setSearch] = useState("");
useEffect(() => {
    fetchStaff();
}, []);

async function fetchStaff() {
    try {
        setLoading(true);

        const result = await getStaff();

        if (result.success) {
            setStaff(result.data);
        } else {
            console.log(result.message);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
}

async function handleAddStaff(data) {
    try {

        const result = await addStaff(data);

        if (!result.success) {
            alert(result.message);
            return;
        }

        // Close modal
        setShowAddStaff(false);

        // Refresh list
        fetchStaff();

    } catch (err) {

        console.error(err);

        alert("Failed to add staff.");

    }
}

async function handleEditStaff(data) {

    try {

        const result = await updateStaff(
            editingStaff.staff_id,
            data
        );

        if (!result.success) {

            alert(result.message);

            return;

        }

        setEditingStaff(null);

        setShowAddStaff(false);

        fetchStaff();

    }

    catch (err) {

        console.error(err);

        alert("Failed to update staff.");

    }

}

async function handleDelete(member) {

    const confirmed = window.confirm(
        `Are you sure you want to deactivate ${member.full_name}?`
    );

    if (!confirmed) return;

    try {

        const result = await deleteStaff(member.staff_id);

        if (!result.success) {
            alert(result.message);
            return;
        }

        await fetchStaff();

    } catch (err) {

        console.error(err);

        alert("Failed to deactivate staff.");

    }

}

async function handleToggle(member) {

    try {

        const result = await toggleWhatsapp(member.staff_id);

        if (result.success) {
            fetchStaff();
        } else {
            alert(result.message);
        }

    } catch (err) {
        console.error(err);
    }

}


const filteredStaff = staff.filter((member) => {
    return (
      member.full_name.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase())
    );
  });


  
        if (loading) {
    return (
        <AccountLayout
            headerProps={{
                title: "Manage Staff",
                subtitle:
                    "Manage staff members who receive reservation notifications.",
            }}
        >
            <div className="text-center py-20">
                Loading staff...
            </div>
        </AccountLayout>
    );
}

  return (
    <>
      <AccountLayout
        headerProps={{
          title: "Manage Staff",
          subtitle:
            "Manage staff members who receive reservation notifications.",
        }}
      >
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full
                lg:max-w-md
                px-4
                py-3
                rounded-xl
                border
                border-slate-200
                bg-white
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />
          </div>

          <button
         onClick={() => {

    setEditingStaff(null);

    setShowAddStaff(true);

}}
            className="
              px-6
              py-3
              rounded-xl
              bg-blue-600
              hover:bg-blue-700
              text-white
              font-semibold
              shadow-sm
              transition
            "
          >
            + Add Staff
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Staff
            </p>

            <h2 className="text-3xl font-bold text-blue-600 mt-2">
              {staff.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Receiving Alerts
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {
                staff.filter((s) => s.receive_whatsapp).length
              }
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Disabled
            </p>

            <h2 className="text-3xl font-bold text-red-600 mt-2">
              {
                staff.filter((s) => !s.receive_whatsapp).length
              }
            </h2>
          </div>
        </div>


        {/* Staff Grid */}
        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div className="text-6xl mb-4">👥</div>

            <h2 className="text-2xl font-bold text-slate-800">
              No Staff Found
            </h2>

            <p className="text-slate-500 mt-3">
              Add your first staff member to start receiving
              reservation alerts.
            </p>

            <button
            onClick={() => {

    setEditingStaff(null);

    setShowAddStaff(true);

}}
              className="
                mt-8
                px-6
                py-3
                rounded-xl
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-semibold
              "
            >
              + Add Staff
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredStaff.map((member) => (
            <StaffCard
    key={member.staff_id}
    member={member}
    onEdit={(staff) => {
        setEditingStaff(staff);
        setShowAddStaff(true);
    }}
    onToggleAlerts={handleToggle}
     onDelete={handleDelete}
/>
            ))}
          </div>
        )}
      </AccountLayout>

      {/* Modal */}

      {showAddStaff && (
      <AddStaffModal
    initialData={editingStaff}
    onClose={() => {

        setShowAddStaff(false);

        setEditingStaff(null);

    }}
    onSave={
        editingStaff
            ? handleEditStaff
            : handleAddStaff
    }
/>
      )}
    </>
  );
}