export default function ReservationStats({ stats }) {

  if (!stats) {
    return null;
  }


  const cards = [
    {
      title: "Today's Earnings",
      value: `PKR ${stats.todayRevenue ?? 0}`,
      icon: "payments",
      type: "blue",
    },

    {
      title: "Active Reservations",
      value: stats.activeReservations ?? 0,
      icon: "assignment",
      type: "orange",
    },

    {
      title: "Completed Orders",
      value: stats.completedReservations ?? 0,
      icon: "check_circle",
      type: "red",
    },

{
  title: "Avg. Processing",
  value: "10 mins",
  icon: "schedule",
  type: "indigo",
},
  ];


  const styles = {

    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
    },

    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
    },

    red: {
      bg: "bg-red-50",
      text: "text-red-600",
    },

    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
    },

  };


  return (

    <div className="
      grid
      grid-cols-1
      md:grid-cols-2
      xl:grid-cols-4
      gap-6
      mb-8
    ">

      {
        cards.map((item,index)=>{

          const style =
              styles[item.type];


          return (

            <div
              key={index}
              className="
                bg-white
                p-6
                rounded-2xl
                shadow-sm
                border
                border-slate-100
                flex
                items-center
                gap-5
                hover:shadow-md
                transition-all
              "
            >

              {/* ICON */}

              <div
                className={`
                  w-12
                  h-12
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  ${style.bg}
                  ${style.text}
                `}
              >

                <span className="
                  material-symbols-outlined
                  text-2xl
                ">
                  {item.icon}
                </span>

              </div>


              {/* TEXT */}

              <div>

                <p className="
                  text-xs
                  font-bold
                  text-slate-400
                  uppercase
                  tracking-wider
                ">
                  {item.title}
                </p>


                <p
                  className={`
                    text-3xl
                    font-bold
                    ${style.text}
                  `}
                >
                  {item.value}
                </p>


              </div>


            </div>

          );

        })
      }


    </div>

  );
}