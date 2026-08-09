import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";

export default function AccountLayout({
  children,
  headerProps,
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="
            mb-6
            flex items-center gap-2
            text-gray-600
            hover:text-blue-600
            font-medium
            transition-colors
          "
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        {/* Header */}
        <Header {...headerProps} />

        {/* Page Content */}
        <div className="mt-6">
          {children}
        </div>

      </div>
    </div>
  );
}
