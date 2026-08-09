import React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ReservationSlip({
    data,
    onClose,
    fetchReservations,
}) {
    console.log(data);
    const [loading, setLoading] = useState(false);
    if (!data) return null;
    const { reservation, items } = data;
    const token = localStorage.getItem("token");
const handleComplete = async () => {
    if (loading) return;

    setLoading(true);

    try {
        const response = await fetch(
            `http://localhost:5000/api/pharmacy/reservations/${reservation.reservation_id}/completed`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        console.log(result);

        if (!response.ok) {
            throw new Error(result.message || "Failed to complete reservation.");
        }

        // Success notification
        toast.success("Reservation completed successfully!");

        // Refresh reservation table
        await fetchReservations();

        // Refresh dashboard widgets if needed
        window.dispatchEvent(
            new Event("refreshReservations")
        );

        // Close slip
        onClose();

    } catch (err) {

        console.error(err);

        toast.error(
            err.message || "Something went wrong."
        );

    } finally {

        setLoading(false);

    }
};

    return (
        <div
            className="
                fixed
                inset-0
                bg-black/50
                flex
                items-center
                justify-center
                z-50
                p-4
            "
        >
            <div
                className="
                    bg-white
                    rounded-2xl
                    shadow-2xl
                    w-full
                    max-w-3xl
                    max-h-[90vh]
                    overflow-y-auto
                "
            >
                {/* HEADER */}
                <div
                    className="
                        bg-blue-600
                        text-white
                        px-8
                        py-6
                        rounded-t-2xl
                        flex
                        justify-between
                        items-center
                    "
                >
                    <div>
                        <h1
                            className="
                                text-2xl
                                font-bold
                            "
                        >
                            Reservation #
                            {
                                reservation
                                    .reservation_id
                            }
                        </h1>
                        <p
                            className="
                                text-sm
                                text-blue-100
                                mt-1
                            "
                        >
                            Reservation Details
                        </p>
                    </div>
                    <button
                        disabled={loading}
                        onClick={
                            onClose
                        }
                    >
                        <span
                            className="
                                material-symbols-outlined
                                text-3xl
                            "
                        >
                            close
                        </span>
                    </button>

                </div>

                <div className="p-8">

                    {/* CUSTOMER INFO */}

                    <div
                        className="
                            bg-slate-50
                            rounded-2xl
                            p-6
                            mb-6
                            border
                        "
                    >

                        <h2
                            className="
                                text-xs
                                font-bold
                                uppercase
                                text-slate-400
                                mb-5
                            "
                        >
                            Customer Information
                        </h2>

                        <div
                            className="
                                grid
                                grid-cols-2
                                gap-6
                            "
                        >

                            <div>
                                <p
                                    className="
                                        text-xs
                                        text-slate-400
                                        uppercase
                                        font-bold
                                    "
                                >
                                    Customer
                                </p>

                                <p
                                    className="
                                        mt-1
                                        font-semibold
                                        text-slate-800
                                    "
                                >
                                    {
                                        reservation
                                            .customer_name
                                    }
                                </p>
                            </div>

                            <div>
                                <p
                                    className="
                                        text-xs
                                        text-slate-400
                                        uppercase
                                        font-bold
                                    "
                                >
                                    Status
                                </p>

                                <p
                                    className="
                                        mt-1
                                        font-semibold
                                        text-blue-600
                                    "
                                >
                                    {
                                        reservation
                                            .status
                                    }
                                </p>
                            </div>

                            <div>
                                <p
                                    className="
                                        text-xs
                                        text-slate-400
                                        uppercase
                                        font-bold
                                    "
                                >
                                    Reservation Type
                                </p>

                                <p
                                    className="
                                        mt-1
                                        font-semibold
                                    "
                                >
                                    {
                                        reservation
                                            .reservation_type
                                    }
                                </p>
                            </div>

                            <div>
                                <p
                                    className="
                                        text-xs
                                        text-slate-400
                                        uppercase
                                        font-bold
                                    "
                                >
                                    Expires At
                                </p>

                                <p
                                    className="
                                        mt-1
                                        font-semibold
                                    "
                                >
                                    {
                                        new Date(
                                            reservation.expires_at
                                        ).toLocaleString()
                                    }
                                </p>
                            </div>

                        </div>

                    </div>

                    {/* MEDICINES */}

                    <div
                        className="
                            border
                            rounded-2xl
                            overflow-hidden
                        "
                    >

                        <div
                            className="
                                px-6
                                py-4
                                bg-blue-50
                                border-b
                            "
                        >

                            <h2
                                className="
                                    font-bold
                                    text-blue-700
                                "
                            >
                                Reserved Medicines
                            </h2>

                        </div>

                        {items.map(
                            (item) => (

                                <div
                                    key={
                                        item
                                            .reservation_item_id
                                    }
                                    className="
                                        px-6
                                        py-4
                                        flex
                                        justify-between
                                        items-center
                                        border-b
                                        last:border-b-0
                                    "
                                >

                                    <div>

                                        <p
                                            className="
                                                font-semibold
                                                text-slate-800
                                            "
                                        >
                                            {
                                                item
                                                    .medicine_name
                                            }
                                        </p>

                                    </div>

                                    <div
                                        className="
                                            px-3
                                            py-1
                                            rounded-full
                                            bg-slate-100
                                            text-sm
                                            font-semibold
                                        "
                                    >
                                        Qty:
                                        {" "}
                                        {
                                            item
                                                .quantity
                                        }
                                    </div>

                                </div>

                            )
                        )}

                    </div>

                    {/* TOTAL */}

                    <div
                        className="
                            mt-6
                            flex
                            justify-between
                            text-sm
                            font-semibold
                            text-slate-600
                        "
                    >

                        <span>
                            Total Items
                        </span>

                        <span>
                            {
                                items.reduce(
                                    (
                                        total,
                                        item
                                    ) =>
                                        total +
                                        item.quantity,
                                    0
                                )
                            }
                        </span>

                    </div>

                    {/* BUTTONS */}

                    <div
                        className="
                            flex
                            justify-end
                            gap-4
                            mt-10
                        "
                    >

                        <button
                            onClick={
                                onClose
                            }
                            className="
                                px-5
                                py-2.5
                                rounded-xl
                                border
                                border-slate-200
                                font-semibold
                                hover:bg-slate-50
                            "
                        >
                            Close
                        </button>

                        {
                            reservation.status ===
                            "ACTIVE" && (

                                <button
                                    disabled={loading}
                                    onClick={handleComplete}
                                    className={`
    px-5
    py-2.5
    rounded-xl
    text-white
    font-semibold
    transition

    ${loading
                                            ? "bg-slate-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700"
                                        }
`}
                                >
                                    {
                                        loading
                                            ? "Completing..."
                                            : "Mark Completed"
                                    }
                                </button>

                            )
                        }

                    </div>

                </div>

            </div>

        </div>

    );

}