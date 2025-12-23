import { cn } from "@/lib/utils/cn";
import Link from "next/link";

const ViewAllButton = ({
  href,
  className,
}: {
  href: string;
  className?: string;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm text-purple-400 hover:text-purple-300 transition-smooth",
        className
      )}
    >
      View all →
    </Link>
  );
};

export default ViewAllButton;
