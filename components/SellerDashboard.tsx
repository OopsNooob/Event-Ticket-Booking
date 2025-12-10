"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { CalendarDays, DollarSign, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import Spinner from "./Spinner";
import { useState } from "react";

export default function SellerDashboard() {
  const { user } = useUser();
  
  // Get current month/year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Get overall statistics
  const stats = useQuery(
    api.payments.getSellerStats,
    user ? { userId: user.id } : "skip"
  );

  // Get monthly statistics
  const monthlyStats = useQuery(
    api.payments.getSellerStatsByMonth,
    user ? { userId: user.id, month: selectedMonth, year: selectedYear } : "skip"
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access seller dashboard</p>
      </div>
    );
  }

  if (stats === undefined || monthlyStats === undefined) {
    return <Spinner />;
  }

  // Generate month options (last 12 months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
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

        {/* Monthly Revenue Breakdown */}
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Monthly Revenue Breakdown
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    View revenue and performance for a specific month
                  </p>
                </div>
                <div>
                  <select
                    value={`${selectedYear}-${selectedMonth}`}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-');
                      setSelectedYear(parseInt(year));
                      setSelectedMonth(parseInt(month));
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {monthOptions.map((option) => (
                      <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Monthly Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">${monthlyStats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Net Revenue</p>
                <p className="text-2xl font-bold text-blue-600">${monthlyStats.netRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Tickets Sold</p>
                <p className="text-2xl font-bold text-purple-600">{monthlyStats.completedCount}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-600">{monthlyStats.totalPayments}</p>
              </div>
            </div>

            {/* Event Breakdown Table */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Performance</h3>
              {monthlyStats.eventBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tickets Sold
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {monthlyStats.eventBreakdown.map((event) => (
                        <tr key={event.eventId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{event.eventName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{event.ticketsSold}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">
                              ${event.revenue.toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium text-gray-900 mb-2">No sales this month</p>
                  <p className="text-sm">No tickets were sold in {monthOptions.find(o => o.month === selectedMonth && o.year === selectedYear)?.label}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
