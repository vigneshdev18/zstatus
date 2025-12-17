"use client";

import { MouseEventHandler, useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshServiceButton({
  serviceId,
}: {
  serviceId: string;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleRefresh: MouseEventHandler<HTMLButtonElement> = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setChecking(true);
    try {
      const response = await fetch(`/api/services/${serviceId}/check`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to run health check");
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Health check error:", error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={checking}
      className="p-2 glass rounded-lg hover:bg-white/10 transition-smooth disabled:opacity-50 cursor-pointer"
      title="Run manual health check"
    >
      <svg
        className={`w-4 h-4 text-gray-400 ${checking ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );
}
