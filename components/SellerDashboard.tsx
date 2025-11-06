"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { CalendarDays, DollarSign, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import Spinner from "./Spinner";

export default function SellerDashboard() {
  const { user } = useUser();

  // Get seller statistics
  const stats = useQuery(
    api.payments.getSellerStats,
    user ? { userId: user.id } : "skip"
  );

  const payments = useQuery(
    api.payments.getUserPayments,
    user ? { userId: user.id } : "skip"
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access seller dashboard</p>
      </div>
    );
  }

  if (stats === undefined) {
    return <Spinner />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <h2 className="text-2xl font-bold">Seller Dashboard</h2>
          <p className="text-blue-100 mt-2">
            Manage your events and track your earnings
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-green-700 mt-2">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">
                  Net Revenue
                </p>
                <p className="text-2xl font-bold text-blue-700 mt-2">
                  ${stats.netRevenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-700 mt-2">
                  ${stats.pendingAmount.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-yellow-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Refunded</p>
                <p className="text-2xl font-bold text-red-700 mt-2">
                  ${stats.totalRefunded.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-red-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payment Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-2xl font-semibold text-green-600">
                  {stats.completedCount}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-2xl font-semibold text-yellow-600">
                  {stats.pendingCount}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Refunded</p>
                <p className="text-2xl font-semibold text-red-600">
                  {stats.refundedCount}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Failed</p>
                <p className="text-2xl font-semibold text-gray-600">
                  {stats.failedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Manage Your Events
            </h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/seller/new-event"
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus className="w-5 h-5" />
                Create New Event
              </Link>
              <Link
                href="/seller/events"
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors shadow-md"
              >
                <CalendarDays className="w-5 h-5" />
                View My Events
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Payments
              </h2>
            </div>
            <div className="overflow-x-auto">
              {payments && payments.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.slice(0, 10).map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
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
                            {payment.paymentMethod.replace(/_/g, " ")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500">
                  No payments yet. Create your first event to start selling
                  tickets!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
