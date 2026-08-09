import BarChartIcon from "@mui/icons-material/BarChart";

export default function RevenueChart({
    revenue = []
}) {

    const maxRevenue = Math.max(
        ...revenue.map(
            item => Number(item.revenue)
        ),
        1
    );


    return (
        <div className="
            bg-white
            p-6
            rounded-2xl
            border
            border-slate-100
            shadow-sm
        ">

            <div className="
                flex
                justify-between
                items-center
                mb-8
            ">

                <h2 className="
                    font-bold
                    text-2xl
                    flex
                    items-center
                    gap-2
                ">
                    <BarChartIcon className="text-primary" />

                    Revenue

                    <span className="
                        text-slate-400
                        text-lg
                    ">
                        (Last 7 Days)
                    </span>

                </h2>


                <span className="
                    text-xs
                    bg-slate-100
                    px-3
                    py-2
                    rounded-lg
                    font-bold
                    text-slate-500
                ">
                    7 Days
                </span>

            </div>


            {
                revenue.length === 0 ? (

                    <div className="
                        h-40
                        flex
                        items-center
                        justify-center
                        text-slate-400
                    ">
                        No revenue data
                    </div>

                ) : (

                    <div className="
                        flex
                        items-end
                        justify-between
                        h-64
                        gap-4
                    ">

                        {
                            revenue.map(
                                (item, index) => {

                                    const height = Math.max(
                                        (
                                            Number(item.revenue) /
                                            maxRevenue
                                        ) * 100,
                                        5
                                    );


                                    return (

                                        <div
                                            key={index}
                                            className="
                                                flex
                                                flex-col
                                                items-center
                                                gap-2
                                                flex-1
                                                h-full
                                                justify-end
                                            "
                                        >

                                            <span className="
                                                text-xs
                                                text-slate-500
                                            ">
                                                Rs {Number(item.revenue).toLocaleString()}
                                            </span>


                                            <div
                                                className="
                                                    w-full
                                                    bg-primary
                                                    rounded-t-lg
                                                    transition-all
                                                    duration-300
                                                "
                                                style={{
                                                    height: `${height}%`
                                                }}
                                            />


                                            <span className="
                                                text-[10px]
                                                text-slate-400
                                            ">
                                                {
                                                    new Date(item.date)
                                                        .toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                                day: "numeric"
                                                            }
                                                        )
                                                }
                                            </span>

                                        </div>

                                    );

                                }
                            )
                        }

                    </div>

                )
            }

        </div>
    );
}