import MainLayout from "../../components/layout/MainLayout";
import { useEffect, useState } from "react";

export default function Reviews() {

    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/pharmacy/reviews",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log(data);

            setStats(data);
            setReviews(data.reviews);

        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="p-10">
                    Loading Reviews...
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout
            headerProps={{
                title: "Reviews & Ratings",
                subtitle:
                    "See what your customers are saying about your pharmacy",
            }}
        >
            {/* TOP SECTION */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

                {/* Rating Overview */}

                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-12">

                    <div className="flex flex-col items-center justify-center md:border-r border-slate-100 md:pr-12">

                        <p className="text-xs font-bold text-slate-400 mb-4 uppercase">
                            Average Rating
                        </p>

                        <div className="text-6xl font-black">
                            {stats?.average_rating || 0}
                        </div>

                        <div className="flex mt-3 gap-1">
                            {
                                [...Array(
                                    Math.round(
                                        Number(
                                            stats?.average_rating || 0
                                        )
                                    )
                                )].map((_, i) => (
                                    <span
                                        key={i}
                                        className="material-symbols-outlined text-amber-400"
                                    >
                                        star
                                    </span>
                                ))
                            }
                        </div>

                        <p className="text-xs text-slate-400 mt-4">
                            Total Reviews:
                            <span className="text-black font-semibold ml-1">
                                {stats?.total_reviews || 0}
                            </span>
                        </p>

                    </div>

                    {/* Breakdown */}

                    <div className="flex-1">

                        <p className="text-xs font-bold text-slate-400 mb-6 uppercase">
                            Rating Breakdown
                        </p>

                        {
                            [{
    star:5,
    count:Number(
        stats?.rating_breakdown?.[5] || 0
    )
},
{
    star:4,
    count:Number(
        stats?.rating_breakdown?.[4] || 0
    )
},
{
    star:3,
    count:Number(
        stats?.rating_breakdown?.[3] || 0
    )
},
{
    star:2,
    count:Number(
        stats?.rating_breakdown?.[2] || 0
    )
},
{
    star:1,
    count:Number(
        stats?.rating_breakdown?.[1] || 0
    )
},
                            ].map((item) => (

                                <div
                                    key={item.star}
                                    className="flex items-center gap-4 mb-3"
                                >
                                    <span className="text-xs w-4">
                                        {item.star}
                                    </span>

                                    <div className="flex-1 h-2 bg-slate-100 rounded-full">

                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{
                                                width: `${
                                                    stats?.total_reviews
                                                        ? (item.count /
                                                            Number(
                                                                stats.total_reviews
                                                            )) *
                                                          100
                                                        : 0
                                                }%`,
                                            }}
                                        />

                                    </div>

                                    <span className="text-xs w-8 text-right">
                                        {item.count}
                                    </span>

                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Sentiment */}

                <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100">

                    <h2 className="font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                            insights
                        </span>

                        Sentiment Analysis
                    </h2>

                    <div className="space-y-3">
                        <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs w-fit">
                            Quick Service
                        </div>

                        <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs w-fit">
                            Reliable
                        </div>

                        <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs w-fit">
                            Polite Staff
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-blue-100 flex justify-between">
                        <span className="text-sm text-slate-500">
                            Overall Sentiment
                        </span>

                        <span className="text-sm font-bold text-green-500">
                            Positive
                        </span>
                    </div>
                </div>
            </div>

            {/* Reviews */}

            <div>

                <h2 className="text-2xl font-bold mb-6">
                    Customer Reviews
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {
                        reviews.map((item) => (

                            <div
                                key={item.review_id}
                                className="
                                bg-white
                                p-6
                                rounded-2xl
                                border
                                border-slate-100"
                            >
                                <div className="flex justify-between mb-4">

                                    <div>

                                        <h4 className="font-bold text-sm">
                                            {item.patient_name}
                                        </h4>

                                        <div className="flex">

                                            {
                                                [...Array(
                                                    item.rating
                                                )].map(
                                                    (_, i) => (
                                                        <span
                                                            key={
                                                                i
                                                            }
                                                            className="
                                                            material-symbols-outlined
                                                            text-amber-400"
                                                        >
                                                            star
                                                        </span>
                                                    )
                                                )
                                            }
                                        </div>
                                    </div>

                                    <span className="text-xs text-slate-400">
                                        {
                                            new Date(
                                                item.created_at
                                            ).toLocaleDateString()
                                        }
                                    </span>
                                </div>

                                <p className="text-sm text-slate-600">
                                    {item.review}
                                </p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </MainLayout>
    );
}