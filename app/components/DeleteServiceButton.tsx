"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteServiceButton({
  serviceId,
  serviceName,
}: {
  serviceId: string;
  serviceName: string;
}) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

      router.push("/services");
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`
          px-6 py-3 rounded-xl font-medium transition-smooth
          ${
            deleteConfirm
              ? "bg-gradient-danger text-white hover:scale-105 shadow-gradient"
              : "glass text-red-400 hover:bg-red-500/10"
          }
          disabled:opacity-50 disabled:hover:scale-100
        `}
      >
        {deleting
          ? "Deleting..."
          : deleteConfirm
          ? `Click again to confirm deletion of "${serviceName}"`
          : "Delete Service"}
      </button>
      {deleteConfirm && (
        <button
          onClick={() => setDeleteConfirm(false)}
          className="px-6 py-3 glass rounded-xl text-white hover:bg-white/10 transition-smooth"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
