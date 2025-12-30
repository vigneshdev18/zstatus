"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import PageHeader from "@/app/components/PageHeader";
import Loading from "@/app/components/Loading";
import Button from "@/app/components/Button/Button";
import Link from "next/link";
import FormInput from "@/app/components/FormInput";
import { FormProvider } from "react-hook-form";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useApiMutation } from "@/lib/hooks/useApiMutation";

interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  webhookUrls: string[];
}

interface GroupFormProps {
  groupId?: string;
}

// Form data interface
interface GroupFormData {
  name: string;
  description?: string;
  color: string;
  webhookUrls?: string[];
}

// Yup validation schema
const groupSchema = yup.object({
  name: yup
    .string()
    .required("Group name is required")
    .min(2, "Name must be at least 2 characters"),
  description: yup.string().optional(),
  color: yup
    .string()
    .required("Color is required")
    .matches(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  webhookUrls: yup
    .array()
    .of(
      yup
        .string()
        .url("Must be a valid URL")
        .required("Webhook URL is required")
    )
    .optional()
    .default([]),
});

export default function GroupForm({ groupId }: GroupFormProps) {
  const router = useRouter();
  const isEditMode = !!groupId;
  const [error, setError] = useState("");

  // Fetch group data if editing
  const { data: groupData, isLoading: loading } = useApiQuery(
    `/api/groups/${groupId}` as "/api/groups/[id]",
    {
      enabled: isEditMode && !!groupId,
    }
  );

  const group = groupData?.group;

  const methods = useForm<GroupFormData>({
    resolver: yupResolver(groupSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      color: "#667eea",
      webhookUrls: [],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = methods;
  console.log(errors);
  const { fields, append, remove } = useFieldArray<GroupFormData>({
    control,
    name: "webhookUrls",
  });

  // Reset form when group data loads
  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        description: group.description || "",
        color: group.color || "#667eea",
        webhookUrls: group.webhookUrls.length > 0 ? group.webhookUrls : [""],
      });
    }
  }, [group, reset]);

  // Mutation for create/update
  const saveGroup = useApiMutation({
    url: (isEditMode ? `/api/groups/${groupId}` : "/api/groups") as any,
    method: isEditMode ? "PATCH" : "POST",
    invalidateQueries: [["api", "/api/groups"]],
    options: {
      onSuccess: () => {
        router.push("/groups");
        router.refresh();
      },
      onError: (err) => {
        setError(err.message || "An error occurred");
      },
    },
  });

  // Mutation for delete
  const deleteGroup = useApiMutation({
    url: `/api/groups/${groupId}` as "/api/groups/[id]",
    method: "DELETE",
    invalidateQueries: [["api", "/api/groups"]],
    options: {
      onSuccess: () => {
        router.push("/groups");
        router.refresh();
      },
      onError: (err) => {
        setError(err.message || "Failed to delete group");
      },
    },
  });

  const onSubmit = async (data: GroupFormData) => {
    setError("");

    // Filter out empty webhook URLs
    const validWebhooks =
      data.webhookUrls?.filter((url) => url.trim() !== "") || [];

    const payload = {
      name: data.name,
      description: data.description || undefined,
      color: data.color,
      webhookUrls: validWebhooks,
    };

    saveGroup.mutate(payload as any);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this group? Services in this group will be unassigned."
      )
    ) {
      return;
    }

    deleteGroup.mutate({} as any);
  };

  if (loading) {
    return <Loading message="Loading group..." />;
  }

  if (isEditMode && !group) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Group not found</p>
          <Link
            href="/groups"
            className="text-purple-400 hover:text-purple-300"
          >
            Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  const title = isEditMode ? "Edit Group" : "Create New Group";
  const subtitle = isEditMode
    ? "Update group configuration and webhooks"
    : "Configure a service group with notification channels";
  const submitText = isSubmitting
    ? isEditMode
      ? "Saving..."
      : "Creating..."
    : isEditMode
    ? "Save Changes"
    : "Create Group";

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader
          title={title}
          subtitle={subtitle}
          backLabel="Back to Groups"
        />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/10">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Name */}
          <FormInput
            name="name"
            label="Group Name"
            placeholder="e.g., Production Services, Backend Team"
            required
          />

          {/* Description */}
          <FormInput
            name="description"
            label="Description"
            placeholder="Brief description of this group's purpose..."
            as="textarea"
            rows={3}
          />

          {/* Color */}
          <div>
            <label
              htmlFor="color"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Group Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                id="color"
                {...register("color")}
                className={`h-12 w-20 bg-white/5 border ${
                  errors.color ? "border-red-500" : "border-white/10"
                } rounded-xl cursor-pointer`}
              />
              <p className="text-sm text-gray-400">
                Choose a color to identify this group
              </p>
            </div>
            {errors.color && (
              <p className="text-sm text-red-400 mt-1">
                {errors.color.message}
              </p>
            )}
          </div>

          {/* Webhook URLs */}
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                Teams Webhook URLs
              </h3>
              <Button
                type="button"
                onClick={() => append("" as any)}
                variant="accent"
                size="sm"
              >
                + Add Webhook
              </Button>
            </div>

            <p className="text-sm text-gray-400">
              Add one or more Microsoft Teams webhook URLs. Alerts will be sent
              to all channels.
            </p>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="url"
                      {...register(`webhookUrls.${index}` as const)}
                      className={`w-full px-4 py-3 bg-white/5 border ${
                        errors.webhookUrls?.[index]
                          ? "border-red-500"
                          : "border-white/10"
                      } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm`}
                      placeholder="https://outlook.office.com/webhook/..."
                    />
                    {errors.webhookUrls?.[index] && (
                      <p className="text-sm text-red-400 mt-1">
                        {errors.webhookUrls[index]?.message}
                      </p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => remove(index)}
                      variant="dangerSubtle"
                      size="sm"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {fields.length === 0 && (
              <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-300">
                  ⚠️ No webhook URLs configured. Services in this group won't
                  send notifications.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className={`flex items-center ${
              isEditMode ? "justify-between" : "justify-end"
            }`}
          >
            {isEditMode && (
              <Button
                type="button"
                onClick={handleDelete}
                loading={deleteGroup.isPending}
                variant="dangerSubtle"
              >
                {deleteGroup.isPending ? "Deleting..." : "Delete Group"}
              </Button>
            )}

            <div className="flex items-center gap-4">
              <Link
                href="/groups"
                className="px-6 py-3 glass rounded-xl text-white hover:bg-white/10 transition-smooth"
              >
                Cancel
              </Link>
              <Button type="submit" loading={saveGroup.isPending}>
                {saveGroup.isPending
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                  ? "Save Changes"
                  : "Create Group"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
