"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, Users, RefreshCw, Ticket, Trash2, Shield, AlertTriangle, UserX } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const ADMIN_EMAILS = ["dodinhkhang8@gmail.com", "hoanghiepta2005@gmail.com"];

export default function MigrationPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  
  const status = useQuery(api.migrations.checkUsersRoleStatus);
  const usersWithEvents = useQuery(api.migrations.getUsersWithEvents);
  const conflictTickets = useQuery(api.migrations.findConflictTickets);
  const ticketsOverview = useQuery(api.migrations.getTicketsOverview);
  const purchasedWaitingList = useQuery(api.migrations.checkPurchasedWaitingListEntries);
  const oversoldEvents = useQuery(api.migrations.checkOversoldEvents);
  
  const migrateRoles = useMutation(api.migrations.migrateUserRoles);
  const resetRoles = useMutation(api.migrations.resetAllRolesToUser);
  const deleteConflicts = useMutation(api.migrations.deleteConflictTickets);
  const expireWaitingList = useMutation(api.migrations.expirePurchasedWaitingListEntries);
  const deleteWaitingList = useMutation(api.migrations.deletePurchasedWaitingListEntries);

  // Check admin access
  if (isLoaded && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md">
          <div className="flex flex-col items-center text-center">
            <Shield className="w-16 h-16 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You must be signed in to access this page.</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoaded && !ADMIN_EMAILS.includes(user?.primaryEmailAddress?.emailAddress || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md">
          <div className="flex flex-col items-center text-center">
            <Shield className="w-16 h-16 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              This page is restricted to administrators only.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Your email: {user?.primaryEmailAddress?.emailAddress}
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleMigration = async () => {
    if (!confirm("Bạn có chắc muốn chạy migration? Điều này sẽ cập nhật role cho tất cả users dựa trên việc họ có tạo event hay không.")) {
      return;
    }
    
    setIsRunning(true);
    try {
      const result = await migrateRoles();
      toast.success(result.message);
    } catch (error) {
      toast.error("Migration failed: " + error);
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("CẢNH BÁO: Điều này sẽ reset TẤT CẢ users về role 'user'. Bạn có chắc?")) {
      return;
    }
    
    setIsRunning(true);
    try {
      const result = await resetRoles();
      toast.success(result.message);
    } catch (error) {
      toast.error("Reset failed: " + error);
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeleteConflicts = async () => {
    if (!conflictTickets || conflictTickets.totalConflicts === 0) {
      toast.error("No conflict tickets to delete");
      return;
    }
    
    if (!confirm(`Bạn có chắc muốn XÓA ${conflictTickets.totalConflicts} tickets được mua bởi organizers? Hành động này KHÔNG THỂ HOÀN TÁC!`)) {
      return;
    }
    
    setIsRunning(true);
    try {
      const result = await deleteConflicts();
      toast.success(result.message);
    } catch (error) {
      toast.error("Delete failed: " + error);
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExpireWaitingList = async () => {
    if (!purchasedWaitingList || purchasedWaitingList.totalPurchasedEntries === 0) {
      toast.error("No purchased waiting list entries to expire");
      return;
    }

    if (!confirm(`Bạn có chắc muốn expire ${purchasedWaitingList.totalPurchasedEntries} waiting list entries? Điều này sẽ cho phép users mua ticket lại từ các events đã mua.`)) {
      return;
    }
    
    setIsRunning(true);
    try {
      const result = await expireWaitingList();
      toast.success(result.message);
    } catch (error) {
      toast.error("Expire failed: " + error);
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeleteWaitingList = async () => {
    if (!purchasedWaitingList || purchasedWaitingList.totalPurchasedEntries === 0) {
      toast.error("No purchased waiting list entries to delete");
      return;
    }

    if (!confirm(`⚠️ CẢNH BÁO: Bạn có chắc muốn XÓA HOÀN TOÀN ${purchasedWaitingList.totalPurchasedEntries} waiting list entries? Hành động này KHÔNG THỂ HOÀN TÁC!`)) {
      return;
    }
    
    setIsRunning(true);
    try {
      const result = await deleteWaitingList();
      toast.success(result.message);
    } catch (error) {
      toast.error("Delete failed: " + error);
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  if (!status || !usersWithEvents || !conflictTickets || !ticketsOverview || !purchasedWaitingList || !oversoldEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Badge */}
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-3 text-white">
            <Shield className="w-6 h-6" />
            <div>
              <p className="font-semibold">Admin Access</p>
              <p className="text-sm text-purple-100">
                Logged in as: {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Data Migration</h1>
          <p className="text-gray-600">
            Đồng bộ role cho users dựa trên việc họ đã tạo event hay chưa
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{status.stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-gray-600 text-sm">With Role</p>
                <p className="text-2xl font-bold">{status.stats.usersWithRole}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-gray-600 text-sm">Without Role</p>
                <p className="text-2xl font-bold text-orange-600">
                  {status.stats.usersWithoutRole}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-gray-600 text-sm">Organizers</p>
                <p className="text-2xl font-bold">{status.stats.organizers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Migration Actions */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Migration Actions</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Auto-assign Roles</h3>
              <p className="text-sm text-blue-800 mb-3">
                Users nào đã tạo event → <strong>organizer</strong><br />
                Users chưa tạo event → <strong>user</strong>
              </p>
              <button
                onClick={handleMigration}
                disabled={isRunning || status.stats.usersWithoutRole === 0}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  isRunning || status.stats.usersWithoutRole === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
                {isRunning ? "Running..." : "Run Migration"}
              </button>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 p-4">
              <h3 className="font-semibold text-red-900 mb-2">Reset All Roles</h3>
              <p className="text-sm text-red-800 mb-3">
                ⚠️ CẢNH BÁO: Reset tất cả users về role "user" (chỉ dùng khi cần test)
              </p>
              <button
                onClick={handleReset}
                disabled={isRunning}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  isRunning
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                Reset All Roles
              </button>
            </div>
          </div>
        </div>

        {/* Tickets Overview */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tickets Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-semibold">Total Tickets</p>
              <p className="text-2xl font-bold text-blue-900">{ticketsOverview.totalTickets}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800 font-semibold">User Tickets</p>
              <p className="text-2xl font-bold text-green-900">{ticketsOverview.regularUserTickets}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-800 font-semibold">Organizer Tickets</p>
              <p className="text-2xl font-bold text-orange-900">{ticketsOverview.organizerTickets}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-emerald-800 font-semibold">Valid</p>
              <p className="text-2xl font-bold text-emerald-900">{ticketsOverview.validTickets}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-800 font-semibold">Used</p>
              <p className="text-2xl font-bold text-purple-900">{ticketsOverview.usedTickets}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-800 font-semibold">Expired</p>
              <p className="text-2xl font-bold text-gray-900">{ticketsOverview.expiredTickets}</p>
            </div>
          </div>
        </div>

        {/* Conflict Tickets Section */}
        {conflictTickets.totalConflicts > 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8 border-2 border-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Conflict Tickets ({conflictTickets.totalConflicts})
                </h2>
                <p className="text-gray-600">
                  Tickets được mua bởi {conflictTickets.organizersWithTickets} organizers - cần xóa để đồng bộ
                </p>
              </div>
            </div>

            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                ⚠️ <strong>Organizers không được phép mua tickets.</strong> Các tickets này đã được mua từ trước khi users
                trở thành organizers. Click nút bên dưới để xóa tất cả conflict tickets.
              </p>
            </div>

            <button
              onClick={handleDeleteConflicts}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                isRunning
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              <Trash2 className="w-5 h-5" />
              Delete {conflictTickets.totalConflicts} Conflict Tickets
            </button>

            {/* Conflict Tickets Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Purchased At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {conflictTickets.conflicts.slice(0, 10).map((ticket: any) => (
                    <tr key={ticket.ticketId}>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{ticket.userEmail}</div>
                        <div className="text-gray-500 text-xs">{ticket.userName}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{ticket.eventName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${ticket.amount}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          ticket.ticketStatus === "valid" 
                            ? "bg-green-100 text-green-800"
                            : ticket.ticketStatus === "used"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {ticket.ticketStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(ticket.purchasedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {conflictTickets.totalConflicts > 10 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Showing 10 of {conflictTickets.totalConflicts} conflict tickets
                </p>
              )}
            </div>
          </div>
        )}

        {conflictTickets.totalConflicts === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8 border-2 border-green-500">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">No Conflicts Found</h2>
                <p className="text-gray-600">
                  Không có tickets conflict. Tất cả dữ liệu đã đồng bộ! ✓
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Purchased Waiting List Entries */}
        {purchasedWaitingList.totalPurchasedEntries > 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Purchased Waiting List Entries Migration
                </h2>
                <p className="text-gray-600 mt-2">
                  Found {purchasedWaitingList.totalPurchasedEntries} old waiting list entries blocking repurchases
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExpireWaitingList}
                  disabled={isRunning}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Expire Entries
                </button>
                <button
                  onClick={handleDeleteWaitingList}
                  disabled={isRunning}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Entries
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Total Entries
                    </h3>
                    <p className="text-3xl font-bold text-yellow-600">
                      {purchasedWaitingList.totalPurchasedEntries}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Waiting list entries with PURCHASED status
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-start gap-4">
                  <UserX className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Affected Users
                    </h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {purchasedWaitingList.affectedUsers}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Users who cannot repurchase tickets
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Vấn đề:</p>
                  <p className="mb-2">
                    Các waiting list entries này được tạo trước khi feature "mua nhiều lần từ cùng một event" được implement. 
                    Chúng có status là PURCHASED và đang block users khỏi việc mua thêm tickets từ cùng event đó.
                  </p>
                  <p className="font-semibold mb-1">Giải pháp:</p>
                  <p>
                    Migration này sẽ thay đổi status của các entries này từ PURCHASED → EXPIRED, 
                    cho phép users mua tickets lại từ các events đã mua trước đây.
                  </p>
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Entries Count
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unique Events
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Tickets
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {purchasedWaitingList.details.slice(0, 10).map((detail: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-mono text-xs text-gray-600">{detail.userId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          {detail.purchasedEntriesCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {detail.uniqueEventsCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {detail.totalTicketsOwned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {purchasedWaitingList.details.length > 10 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Showing 10 of {purchasedWaitingList.details.length} users
                </p>
              )}
            </div>
          </div>
        )}

        {purchasedWaitingList.totalPurchasedEntries === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8 border-2 border-green-500">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">No Purchased Entries Found</h2>
                <p className="text-gray-600">
                  Không có waiting list entries với status PURCHASED. Users có thể mua tickets bình thường! ✓
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Users Without Role */}
        {status.usersWithoutRole.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Users Without Role ({status.usersWithoutRole.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {status.usersWithoutRole.map((user) => (
                    <tr key={user.userId}>
                      <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.name || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                        {user.userId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users with Events */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Users Who Created Events ({usersWithEvents.length})
          </h2>
          <p className="text-gray-600 mb-4">
            Những users này sẽ được assign role "organizer" khi chạy migration
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Current Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Events Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Event Names
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usersWithEvents.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      {user.currentRole ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.currentRole === "organizer"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.currentRole}
                        </span>
                      ) : (
                        <span className="text-orange-600 font-semibold">No role</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.eventsCreated}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <ul className="list-disc list-inside">
                        {user.eventNames.slice(0, 3).map((name, idx) => (
                          <li key={idx}>{name}</li>
                        ))}
                        {user.eventNames.length > 3 && (
                          <li className="text-gray-400">
                            +{user.eventNames.length - 3} more...
                          </li>
                        )}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔍 Waiting List Status
          </h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 font-mono">
              Purchased entries count: <span className="font-bold text-lg">{purchasedWaitingList.totalPurchasedEntries}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {purchasedWaitingList.totalPurchasedEntries === 0 
                ? "✅ Tất cả purchased entries đã được xóa/expire. Users có thể mua tickets bình thường!"
                : "⚠️ Còn purchased entries trong database. Hãy chạy migration để xóa chúng."
              }
            </p>
          </div>
        </div>

        {/* Oversold Events Warning */}
        {oversoldEvents.totalOversoldEvents > 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8 border-2 border-red-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-red-900 flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  Oversold Events Detected!
                </h2>
                <p className="text-red-600 mt-2 font-semibold">
                  {oversoldEvents.totalOversoldEvents} event(s) have more tickets sold than available
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">⚠️ CRITICAL ISSUE:</p>
                  <p className="mb-2">
                    Một số events đã bán VƯỢT QUÁ tổng số vé available. Điều này xảy ra do:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mb-2">
                    <li>Thiếu validation khi purchase</li>
                    <li>Race condition khi nhiều users mua cùng lúc</li>
                    <li>Bug trong logic check availability</li>
                  </ul>
                  <p className="font-semibold mb-1">Giải pháp:</p>
                  <p>
                    Bạn cần tăng totalTickets của event hoặc refund một số tickets. 
                    Đã thêm validation mới để ngăn chặn vấn đề này trong tương lai.
                  </p>
                </div>
              </div>
            </div>

            {/* Events Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Event Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Tickets
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sold Tickets
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Oversold By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {oversoldEvents.events.map((event: any) => (
                    <tr key={event.eventId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {event.eventName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {event.totalTickets}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          {event.soldTickets}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                          +{event.oversold} tickets
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>✅ Fix đã được apply:</strong> Bây giờ hệ thống có validation ngăn chặn mua vượt quá số vé available. 
                Bạn cần manually fix các events trên bằng cách tăng totalTickets hoặc refund tickets.
              </p>
            </div>
          </div>
        )}

        {oversoldEvents.totalOversoldEvents === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8 border-2 border-green-500">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">No Oversold Events</h2>
                <p className="text-gray-600">
                  ✅ Tất cả events đều có số vé bán ra hợp lệ!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
