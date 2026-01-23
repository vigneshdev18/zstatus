import { HiLockClosed } from "react-icons/hi";
import Link from "next/link";
import Button from "@/app/components/Button/Button";

interface UnauthorizedProps {
  title?: string;
  message?: string;
  returnPath?: string;
  returnLabel?: string;
}

export default function Unauthorized({
  title = "Unauthorized Access",
  message = "You do not have permission to access this page.",
  returnPath = "/services",
  returnLabel = "Return to Dashboard",
}: UnauthorizedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="glass p-12 rounded-3xl max-w-lg w-full relative overflow-hidden group">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-80" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-700" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-lg shadow-red-500/10 animate-pulse-slow">
            <HiLockClosed className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            {title}
          </h1>

          <p className="text-gray-400 mb-8 leading-relaxed max-w-sm">
            {message}
          </p>

          <Link href={returnPath}>
            <Button
              variant="primary"
              className="px-8 bg-red-600 hover:bg-red-700 border-red-500/50"
            >
              {returnLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
