import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/MainLayout";
import ReservationStats from "../../components/reservations/ReservationStats";
import ReservationTable from "../../components/reservations/ReservationTable";
import ReservationFilters from "../../components/reservations/ReservationFilters";
import ReservationSlip from "../../components/reservations/ReservationSlip";

export default function Reservations() {
    const navigate = useNavigate();

    const [selectedReservation, setSelectedReservation] =
        useState(null);

    const [showModal, setShowModal] =
        useState(false);

    const [reservations, setReservations] =
        useState([]);

    const [stats, setStats] =
        useState(null);

    const [status, setStatus] =
        useState("all");

    const [search, setSearch] =
        useState("");

    const [sort, setSort] =
        useState("latest");

    const [page, setPage] =
        useState(1);

    const [totalPages, setTotalPages] =
        useState(1);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const token =
        localStorage.getItem("token");

    // ==========================
    // VIEW DETAILS
    // ==========================

   const handleViewDetails = async (id) => {
    try {

        const res = await fetch(
            `http://localhost:5000/api/pharmacy/reservations/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        console.log("MODAL DATA:", data);

        setSelectedReservation(data);
        setShowModal(true);

    } catch (err) {
        console.log(err);
    }
};

    // ==========================
    // FETCH RESERVATIONS
    // ==========================

    const fetchReservations =
        async () => {

            try {

                setLoading(true);

                const res =
                    await fetch(
                        `http://localhost:5000/api/pharmacy/reservations?status=${status}&sort=${sort}&page=${page}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                const data =
                    await res.json();

                console.log(
                    "RESERVATIONS:",
                    data.reservations
                );

                setReservations(
                    data.reservations
                );

                setStats(
                    data.stats
                );

                setTotalPages(
                    data.totalPages
                );

            }
            catch (err) {

                console.log(err);

                setError(
                    "Failed to load reservations."
                );

            }
            finally {

                setLoading(
                    false
                );

            }

        };

    // ==========================
    // FETCH ON CHANGE
    // ==========================

    useEffect(() => {

        fetchReservations();

    }, [
        page,
        status,
        search,
        sort
    ]);

    // ==========================
    // SOCKET REFRESH
    // ==========================

    useEffect(() => {

        const refresh = () => {

            console.log(
                "REFRESHING RESERVATIONS..."
            );

            fetchReservations();

        };

        window.addEventListener(
            "refreshReservations",
            refresh
        );

        return () => {

            window.removeEventListener(
                "refreshReservations",
                refresh
            );

        };

    }, []);

    return (
        <>
            <Layout
                headerProps={{
                    title:
                        "Reservations",

                    subtitle:
                        "Manage all reservations",

                    extra: (
                        <button
                            onClick={() =>
                                navigate(
                                    "/manage-staff"
                                )
                            }
                            className="
                                px-5
                                py-2.5
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                hover:bg-slate-50
                                transition
                                font-semibold
                                text-slate-700
                            "
                        >
                            Manage Staff
                        </button>
                    )
                }}
            >
                {stats && (
                    <ReservationStats
                        stats={stats}
                    />
                )}

                <div className="
                    flex
                    flex-col
                    lg:flex-row
                    gap-8
                ">
                    <div className="flex-1">

                        <ReservationTable
                            reservations={
                                reservations
                            }
                            handleViewDetails={
                                handleViewDetails
                            }
                            loading={
                                loading
                            }
                            page={
                                page
                            }
                            totalPages={
                                totalPages
                            }
                            setPage={
                                setPage
                            }
                            sort={
                                sort
                            }
                            setSort={
                                setSort
                            }
                            fetchReservations={
                                fetchReservations
                            }
                        />

                    </div>

                    <div className="
                        w-full
                        lg:w-72
                    ">
                        <ReservationFilters
                            status={
                                status
                            }
                            setStatus={
                                setStatus
                            }
                            stats={
                                stats
                            }
                        />
                    </div>
                </div>
            </Layout>

            {showModal && (
                <ReservationSlip
                    data={selectedReservation}
                    onClose={() =>  setShowModal(false)}                                                
                   fetchReservations={fetchReservations}             
                />
            )}
        </>
    );
}