"use client";

import { useRouter } from "next/navigation";
import Button from "@/app/components/Button/Button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLabel?: string;
  showBack?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  backLabel = "Back",
  showBack = true,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      {showBack && (
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="mb-4 !px-0 text-gray-400 hover:text-white"
        >
          ← {backLabel}
        </Button>
      )}
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">{title}</h1>
        {subtitle && <p className="text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}
