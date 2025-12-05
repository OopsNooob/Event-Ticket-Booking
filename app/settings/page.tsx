"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const [selectedRole, setSelectedRole] = useState<"user" | "organizer">("user");
  
  const currentRole = useQuery(
    api.users.getUserRole,
    user?.id ? { userId: user.id } : "skip"
  );

  const canSwitch = useQuery(
    api.users.canSwitchRole,
    user?.id && selectedRole ? { userId: user.id, targetRole: selectedRole } : "skip"
  );
  
  const updateRole = useMutation(api.users.updateUserRole);

  // Auto-select current role when loaded
  useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole);
    }
  }, [currentRole]);

  const handleRoleChange = async () => {
    if (!user || !canSwitch?.canSwitch) return;
    
    try {
      await updateRole({
        userId: user.id,
        role: selectedRole,
      });
      toast.success("Role updated successfully!");
      window.location.href = "/"; // Redirect to home after role change
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
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

            {/* Warning if cannot switch */}
            {canSwitch && !canSwitch.canSwitch && selectedRole !== currentRole && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 mb-1">Cannot Switch Role</p>
                    <p className="text-sm text-red-800">{canSwitch.reason}</p>
                    {canSwitch.ticketCount !== undefined && (
                      <p className="text-sm text-red-800 mt-2">
                        You have <strong>{canSwitch.ticketCount}</strong> purchased ticket(s). 
                        Go to <a href="/admin/migration" className="underline font-semibold">Migration Page</a> to clean up conflict tickets.
                      </p>
                    )}
                    {canSwitch.eventCount !== undefined && (
                      <p className="text-sm text-red-800 mt-2">
                        You have created <strong>{canSwitch.eventCount}</strong> event(s). 
                        Please delete or cancel your events first.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success message if can switch */}
            {canSwitch && canSwitch.canSwitch && selectedRole !== currentRole && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 mb-1">Ready to Switch</p>
                    <p className="text-sm text-green-800">
                      You can safely switch to {selectedRole === "organizer" ? "Event Organizer" : "User"} role.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleRoleChange}
              disabled={!canSwitch || !canSwitch.canSwitch || currentRole === selectedRole}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                !canSwitch || !canSwitch.canSwitch || currentRole === selectedRole
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {currentRole === selectedRole 
                ? "Current Role" 
                : !canSwitch || !canSwitch.canSwitch
                ? "Cannot Switch Role"
                : "Switch Role"}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Role Switching Rules:</strong>
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>User → Organizer:</strong> You must NOT have any purchased tickets</li>
              <li><strong>Organizer → User:</strong> You must NOT have any created events</li>
              <li>This prevents data conflicts in the system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
