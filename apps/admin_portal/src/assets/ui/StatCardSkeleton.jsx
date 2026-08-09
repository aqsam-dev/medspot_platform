import Skeleton from "react-loading-skeleton";

export default function StatCardSkeleton() {

  return (

    <div
      style={{
        flex: 1,
        minWidth: 220,
        background: "#fff",
        borderRadius: 20,
        padding: 24,
        display: "flex",
        gap: 16,
        alignItems: "center"
      }}
    >

      <Skeleton
        circle
        width={56}
        height={56}
      />

      <div style={{ flex: 1 }}>
        <Skeleton width={70} height={28} />

        <div style={{ marginTop: 10 }}>
          <Skeleton width={140} />
        </div>

      </div>

    </div>

  );

}