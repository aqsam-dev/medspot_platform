import Skeleton from "react-loading-skeleton";

export default function RecentCardSkeleton() {

  return (

    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        border: "1px solid #eee"
      }}
    >

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 20
        }}
      >

        <Skeleton
          circle
          width={44}
          height={44}
        />

        <div>

          <Skeleton width={130} />

          <div style={{ marginTop: 6 }}>
            <Skeleton width={90} />
          </div>

        </div>

      </div>

      <Skeleton height={12} />

      <div style={{ marginTop: 10 }}>
        <Skeleton height={12} width="70%" />
      </div>

      <div style={{ marginTop: 10 }}>
        <Skeleton height={12} width="60%" />
      </div>

      <div style={{ marginTop: 18 }}>
        <Skeleton width={120} />
      </div>

    </div>

  );

}