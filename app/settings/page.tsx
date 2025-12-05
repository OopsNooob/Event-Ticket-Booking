"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const [selectedRole, setSelectedRole] = useState<"user" | "organizer">("user");
  
  const currentRole = useQuery(
    api.users.getUserRole,
    user?.id ? { userId: user.id } : "skip"
  );
  
  const updateRole = useMutation(api.users.updateUserRole);

  const handleRoleChange = async () => {
    if (!user) return;
    
    try {
      await updateRole({
        userId: user.id,
        role: selectedRole,
      });
      toast.success("Role updated successfully!");
      window.location.href = "/"; // Redirect to home after role change
    } catch (error) {
      toast.error("Failed to update role");
      console.error(error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to access settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Account Settings</h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Email:</span> {user.primaryEmailAddress?.emailAddress}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Current Role:</span>{" "}
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                currentRole === "organizer" 
                  ? "bg-blue-100 text-blue-800" 
                  : "bg-green-100 text-green-800"
              }`}>
                {currentRole === "organizer" ? "Event Organizer" : "User"}
              </span>
            </p>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Role</h2>
            <p className="text-gray-600 mb-4">
              Switch between User and Event Organizer roles:
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={selectedRole === "user"}
                  onChange={(e) => setSelectedRole(e.target.value as "user")}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">User</p>
                  <p className="text-sm text-gray-600">Browse events and purchase tickets</p>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="role"
                  value="organizer"
                  checked={selectedRole === "organizer"}
                  onChange={(e) => setSelectedRole(e.target.value as "organizer")}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Event Organizer</p>
                  <p className="text-sm text-gray-600">Create and manage events, view analytics</p>
                </div>
              </label>
            </div>

            <button
              onClick={handleRoleChange}
              disabled={currentRole === selectedRole}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                currentRole === selectedRole
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {currentRole === selectedRole ? "Current Role" : "Switch Role"}
            </button>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Changing roles will redirect you to the appropriate dashboard.
              Users can only view and purchase tickets. Organizers can only create and manage events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
