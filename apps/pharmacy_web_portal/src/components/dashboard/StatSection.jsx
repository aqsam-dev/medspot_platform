import StatCard from "./StatsCard";

export default function StatSection({
    stats = {},
}) {

    const {
        totalReservations = 0,
        activeReservations = 0,
        completedReservations = 0,
        cancelledReservations = 0,
        expiredReservations = 0,

        // supports both names
        totalRevenue = 0,
        todayRevenue = 0,

    } = stats;


    const revenue =
        totalRevenue || todayRevenue || 0;


    return (

        <div className="
            bg-white
            p-6
            rounded-2xl
            drop-shadow-md
            border
            border-slate-100
        ">


            <h1 className="
                font-bold
                text-2xl
                mb-6
            ">
                Pharmacy Overview
            </h1>



            <div className="
                grid
                grid-cols-2
                gap-4
            ">


                <StatCard
                    title="Total Reservations"
                    value={totalReservations}
                />


                <StatCard
                    title="Active Orders"
                    value={activeReservations}
                />


                <StatCard
                    title="Completed Orders"
                    value={completedReservations}
                />


                <StatCard
                    title="Cancelled Orders"
                    value={cancelledReservations}
                />


                <StatCard
                    title="Expired Orders"
                    value={expiredReservations}
                />



                {/* TOTAL REVENUE */}

                <div
                    className="
                        p-5
                        rounded-xl
                        bg-blue-50
                        border
                        border-blue-100
                        flex
                        flex-col
                        justify-center
                    "
                >

                    <p className="
                        text-sm
                        font-bold
                        text-blue-600
                        uppercase
                        tracking-wider
                    ">
                        Total Revenue
                    </p>


                    <p className="
                        text-3xl
                        font-bold
                        text-primary
                    ">
                        PKR{" "}
                        {Number(revenue).toLocaleString("en-US")}
                    </p>


                </div>


            </div>


        </div>

    );
}