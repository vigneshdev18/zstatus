"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [webhookUrls, setWebhookUrls] = useState<string[]>([""]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    // Filter out empty webhook URLs
    const validWebhooks = webhookUrls.filter((url) => url.trim() !== "");

    const data = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      color: formData.get("color"),
      webhookUrls: validWebhooks,
    };

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create group");
      }

      router.push("/groups");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
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
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Create New Group
        </h1>
        <p className="text-gray-400">
          Configure a service group with notification channels
        </p>
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

          {/* Group Name */}
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
              placeholder="e.g., Frontend Team"
            />
          </div>

          {/* Description */}
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
              placeholder="Optional description of this group"
            />
          </div>

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
                name="color"
                defaultValue="#667eea"
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

          <p className="text-sm text-gray-400">
            Add one or more Microsoft Teams webhook URLs. Alerts will be sent to
            all channels.
          </p>

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

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/groups"
            className="px-6 py-3 glass rounded-xl text-white hover:bg-white/10 transition-smooth"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  );
}
