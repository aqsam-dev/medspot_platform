import Skeleton from "react-loading-skeleton";

export default function TableSkeleton() {

  const rows = Array.from({ length: 5 });

  return (

    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid #f1f5f9"
      }}
    >

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse"
        }}
      >

        <thead>

          <tr
            style={{
              background:
                "linear-gradient(135deg,#131b2e,#006a61)"
            }}
          >

            {[
              "Name",
              "Owner",
              "Contact",
              "Rating",
              "Reservations",
              "Action"
            ].map((h) => (

              <th
                key={h}
                style={{
                  color: "white",
                  padding: "16px"
                }}
              >
                {h}
              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {rows.map((_, row) => (

            <tr key={row}>

              {[1,2,3,4,5,6].map((col)=>(

                <td
                  key={col}
                  style={{
                    padding:"18px"
                  }}
                >

                  <Skeleton height={18} />

                </td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}