import SearchSkeleton from "./SearchSkeleton";
import StatCardSkeleton from "./StatCardSkeleton";
import RecentCardSkeleton from "./RecentCardSkeleton";
import TableSkeleton from "./TableSkeleton";
import PaginationSkeleton from "./PaginationSkeleton";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function AdminPageSkeleton() {
  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: "32px", paddingTop: "16px" }}>
        <Skeleton width={280} height={34} />

        <div style={{ marginTop: 12 }}>
          <Skeleton width={80} height={4} />
        </div>

        <div style={{ marginTop: 12 }}>
          <Skeleton width={420} height={16} />
        </div>
      </div>

      <SearchSkeleton />

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "32px",
          flexWrap: "wrap"
        }}
      >
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Button */}

      <div style={{ marginBottom: 30 }}>
        <Skeleton
          width={220}
          height={50}
          borderRadius={14}
        />
      </div>

      {/* Recent */}

      <div style={{ marginBottom: 16 }}>
        <Skeleton width={220} height={24} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 16,
          marginBottom: 36
        }}
      >
        <RecentCardSkeleton />
        <RecentCardSkeleton />
        <RecentCardSkeleton />
      </div>

      {/* Table */}

      <div style={{ marginBottom: 18 }}>
        <Skeleton width={220} height={24} />
      </div>

      <TableSkeleton />

      <PaginationSkeleton />

    </div>
  );
}