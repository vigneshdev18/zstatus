"use client";

import { use } from "react";
import ServiceForm from "@/app/components/ServiceForm";
import Loading from "@/app/components/Loading";
import Unauthorized from "@/app/components/Unauthorized";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (user?.role === "viewer") {
    return <Unauthorized />;
  }

  return <ServiceForm serviceId={id} />;
}
