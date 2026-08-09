import Skeleton from "react-loading-skeleton";

export default function SearchSkeleton() {
  return (
    <div
      style={{
        marginBottom: 28,
        maxWidth: 480
      }}
    >
      <Skeleton
        height={52}
        borderRadius={14}
      />
    </div>
  );
}