"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiTrash } from "react-icons/hi";
import Button from "@/app/components/Button/Button";
import { useApiMutation } from "@/lib/hooks/useApiMutation";

interface Props {
  serviceId: string;
  serviceName: string;
}

export default function DeleteServiceButton({ serviceId, serviceName }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  const deleteService = useApiMutation<void, void>({
    url: `/api/services/${serviceId}`,
    method: "DELETE",
    invalidateQueries: [["api", "/api/services"]],
    options: {
      onSuccess: () => {
        router.push("/services");
        router.refresh();
      },
      onError: (err) => {
        setError(err.message || "Failed to delete service");
      },
    },
  });

  const handleDelete = async () => {
    if (
      !confirm(`Are you sure you want to delete the service "${serviceName}"?`)
    ) {
      return;
    }

    deleteService.mutate(undefined);
  };

  return (
    <div className="flex items-center gap-3">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        onClick={handleDelete}
        loading={deleteService.isPending}
        variant="danger"
        icon={<HiTrash />}
      >
        {deleteService.isPending ? "Deleting..." : "Delete Service"}
      </Button>
    </div>
  );
}
