"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loading from "@/app/components/Loading";

interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  webhookUrls: string[];
}

export default function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [webhookUrls, setWebhookUrls] = useState<string[]>([""]);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetchGroup(p.id);
    });
  }, [params]);

  const fetchGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) {
        throw new Error("Group not found");
      }
      const data = await response.json();
      setGroup(data.group);
      setWebhookUrls(
        data.group.webhookUrls.length > 0 ? data.group.webhookUrls : [""]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const validWebhooks = webhookUrls.filter((url) => url.trim() !== "");

    const data = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      color: formData.get("color"),
      webhookUrls: validWebhooks,
    };

    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update group");
      }

      router.push("/groups");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this group? Services in this group will be unassigned."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete group");
      }

      router.push("/groups");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete group");
      setDeleting(false);
    }
  };

  const addWebhookUrl = () => {
    setWebhookUrls([...webhookUrls, ""]);
  };

  const removeWebhookUrl = (index: number) => {
    setWebhookUrls(webhookUrls.filter((_, i) => i !== index));
  };

  const updateWebhookUrl = (index: number, value: string) => {
    const newUrls = [...webhookUrls];
    newUrls[index] = value;
    setWebhookUrls(newUrls);
  };

  if (loading) {
    return <Loading message="Loading group..." />;
  }

  if (!group) {
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/groups"
          className="text-gray-400 hover:text-white transition-smooth inline-block mb-4"
        >
          ← Back to Groups
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-2">Edit Group</h1>
        <p className="text-gray-400">Update group configuration and webhooks</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/10">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white">Group Information</h3>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={group.name}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={group.description}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
            />
          </div>

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
                name="color"
                defaultValue={group.color || "#667eea"}
                className="h-12 w-20 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
              />
              <p className="text-sm text-gray-400">
                Choose a color to identify this group
              </p>
            </div>
          </div>
        </div>

        {/* Webhook URLs */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Teams Webhook URLs</h3>
            <button
              type="button"
              onClick={addWebhookUrl}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-300 text-sm font-medium transition-smooth"
            >
              + Add Webhook
            </button>
          </div>

          <div className="space-y-3">
            {webhookUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateWebhookUrl(index, e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                    placeholder="https://outlook.office.com/webhook/..."
                  />
                </div>
                {webhookUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWebhookUrl(index)}
                    className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-300 transition-smooth"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {webhookUrls.filter((url) => url.trim() !== "").length === 0 && (
            <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-300">
                ⚠️ No webhook URLs configured. Services in this group won't send
                notifications.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-300 font-medium transition-smooth disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Group"}
          </button>

          <div className="flex items-center gap-4">
            <Link
              href="/groups"
              className="px-6 py-3 glass rounded-xl text-white hover:bg-white/10 transition-smooth"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
