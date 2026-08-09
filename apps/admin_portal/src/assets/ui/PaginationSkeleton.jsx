import Skeleton from "react-loading-skeleton";

export default function PaginationSkeleton() {

  return (

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 12,
        marginTop: 30
      }}
    >

      <Skeleton circle width={40} height={40} />
      <Skeleton circle width={40} height={40} />
      <Skeleton circle width={40} height={40} />
      <Skeleton circle width={40} height={40} />
      <Skeleton circle width={40} height={40} />

    </div>

  );

}