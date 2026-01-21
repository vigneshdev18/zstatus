"use client";

import { useState } from "react";
import { useApiQuery, useApiMutation } from "@/lib/hooks";
import Loading from "@/app/components/Loading";
import { HiTrash, HiPlus, HiUserCircle } from "react-icons/hi";
import AddUserModal from "@/app/components/AddUserModal";
import Spinner from "@/app/components/Spinner";

export default function UsersPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch users
  const { data, isLoading, refetch } = useApiQuery<"/api/users">("/api/users");
  const users = data?.users || [];

  // Delete user mutation
  const deleteUserMutation = useApiMutation({
    url: "/api/users/[id]" as any,
    method: "DELETE",
    invalidateQueries: [["api", "/api/users"]],
    options: {
      onSuccess: () => {
        refetch();
      },
    },
  });

  const handleDeleteUser = async (userId: string, email: string) => {
    if (confirm(`Are you sure you want to delete user ${email}?`)) {
      deleteUserMutation.mutate({ url: `/api/users/${userId}` } as any);
    }
  };

  const handleUserAdded = () => {
    setShowAddModal(false);
    refetch();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">User Management</h1>
          <p className="text-gray-400 mt-2">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <HiPlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-gray-400 font-medium">User</th>
              <th className="text-left p-4 text-gray-400 font-medium">Role</th>
              <th className="text-left p-4 text-gray-400 font-medium">
                Created
              </th>
              <th className="text-left p-4 text-gray-400 font-medium">
                Last Login
              </th>
              <th className="text-right p-4 text-gray-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <HiUserCircle className="w-8 h-8 text-gray-400" />
                      <span className="text-white font-medium">
                        {user.email}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-400">
                    {new Date(user.lastLoginAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      disabled={deleteUserMutation.isPending}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete user"
                    >
                      {deleteUserMutation.isPending ? (
                        <Spinner />
                      ) : (
                        <HiTrash className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleUserAdded}
        />
      )}
    </div>
  );
}
