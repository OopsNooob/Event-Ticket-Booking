"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";

export default function SellerDashboard() {
  const { user, isLoaded } = useUser();

  const stats = useQuery(
    api.payments.getSellerStats,
    user ? { userId: user.id } : "skip"
  );

  const payments = useQuery(
    api.payments.getUserPayments,
    user ? { userId: user.id } : "skip"
  );

  if (isLoaded && !user) {
    redirect("/sign-in");
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRole="organizer">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Seller Dashboard
          </h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Net Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                ${stats.netRevenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                ${stats.pendingAmount.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Refunded</p>
              <p className="text-2xl font-bold text-red-600">
                ${stats.totalRefunded.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Payment Counts */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-lg font-semibold">{stats.completedCount}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-lg font-semibold">{stats.pendingCount}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Refunded</p>
                <p className="text-lg font-semibold">{stats.refundedCount}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Failed</p>
                <p className="text-lg font-semibold">{stats.failedCount}</p>
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Payments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments?.slice(0, 10).map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.event?.name || "Unknown Event"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 capitalize">
                          {payment.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : payment.status === "refunded"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}