/**
 * Standardized Data Export Utilities
 * 
 * Interoperability Architecture: Standardized Data Export (ADD ID 64)
 * 
 * Provides utilities to export data in standard formats (CSV, JSON)
 * for reporting and analysis purposes.
 * 
 * Benefits:
 * - ✅ Standardized export format (CSV/JSON)
 * - ✅ Framework-independent data export
 * - ✅ Easy integration with analytics tools
 * - ✅ Audit trail and compliance
 * - ✅ Data portability
 */

/**
 * Revenue Report Data Type
 * Represents a single row in the revenue export
 */
export interface RevenueReportRow {
  eventId: string;
  eventName: string;
  eventDate: string;
  location: string;
  ticketsSold: number;
  price: number;
  totalRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  status: "completed" | "pending" | "refunded" | "failed";
  exportedAt: string;
}

/**
 * Seller Monthly Report Data Type
 */
export interface SellerMonthlyReport {
  month: number;
  year: number;
  totalRevenue: number;
  netRevenue: number;
  completedPayments: number;
  refundedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalTickets: number;
  exportedAt: string;
}

/**
 * Event Performance Report Data Type
 */
export interface EventPerformanceReport {
  eventId: string;
  eventName: string;
  eventDate: string;
  location: string;
  totalTickets: number;
  ticketsSold: number;
  availableTickets: number;
  sellOutPercentage: number;
  pricePerTicket: number;
  totalRevenue: number;
  averagePrice: number;
  exportedAt: string;
}

/**
 * Convert data to CSV format
 * 
 * @param data - Array of objects to convert to CSV
 * @param headers - Column headers (optional, uses object keys if not provided)
 * @returns CSV string
 * 
 * @example
 * const data = [
 *   { name: "Event 1", revenue: 1000 },
 *   { name: "Event 2", revenue: 2000 }
 * ];
 * const csv = convertToCSV(data);
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  headers?: string[]
): string {
  if (!data || data.length === 0) {
    return "";
  }

  // Get headers from first object if not provided
  const cols = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = cols
    .map((col) => `"${String(col).replace(/"/g, '""')}"`)
    .join(",");

  // Create data rows
  const rows = data.map((obj) =>
    cols
      .map((col) => {
        const val = obj[col];

        // Handle different types
        if (val === null || val === undefined) {
          return '""';
        }

        const str = String(val);
        // Escape quotes and wrap in quotes
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [headerRow, ...rows].join("\n");
}

/**
 * Download CSV file
 * 
 * @param csv - CSV content
 * @param filename - Output filename
 * 
 * @example
 * downloadCSV(csvContent, "revenue_report.csv");
 */
export function downloadCSV(csv: string, filename: string): void {
  // Create blob
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  // Create object URL
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  // Set link attributes
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export revenue data to CSV
 * 
 * @param data - Revenue report rows
 * @param filename - Output filename (default: revenue_report_{date}.csv)
 * 
 * @example
 * const revenueData = [...];
 * exportRevenueToCSV(revenueData);
 */
export function exportRevenueToCSV(
  data: RevenueReportRow[],
  filename?: string
): void {
  const headers = [
    "Event ID",
    "Event Name",
    "Event Date",
    "Location",
    "Tickets Sold",
    "Price",
    "Total Revenue",
    "Refunded Amount",
    "Net Revenue",
    "Status",
    "Exported At",
  ];

  const csv = convertToCSV(
    data.map((row) => ({
      "Event ID": row.eventId,
      "Event Name": row.eventName,
      "Event Date": row.eventDate,
      "Location": row.location,
      "Tickets Sold": row.ticketsSold,
      "Price": row.price.toFixed(2),
      "Total Revenue": row.totalRevenue.toFixed(2),
      "Refunded Amount": row.refundedAmount.toFixed(2),
      "Net Revenue": row.netRevenue.toFixed(2),
      "Status": row.status,
      "Exported At": row.exportedAt,
    })),
    headers
  );

  const defaultFilename =
    filename || `revenue_report_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(csv, defaultFilename);
}

/**
 * Export monthly report to CSV
 * 
 * @param data - Monthly report data
 * @param filename - Output filename
 */
export function exportMonthlyReportToCSV(
  data: SellerMonthlyReport,
  filename?: string
): void {
  const csv = convertToCSV(
    [
      {
        "Month": `${data.month}/${data.year}`,
        "Total Revenue": data.totalRevenue.toFixed(2),
        "Net Revenue": data.netRevenue.toFixed(2),
        "Completed Payments": data.completedPayments,
        "Refunded Payments": data.refundedPayments,
        "Pending Payments": data.pendingPayments,
        "Failed Payments": data.failedPayments,
        "Total Tickets": data.totalTickets,
        "Exported At": data.exportedAt,
      },
    ],
    [
      "Month",
      "Total Revenue",
      "Net Revenue",
      "Completed Payments",
      "Refunded Payments",
      "Pending Payments",
      "Failed Payments",
      "Total Tickets",
      "Exported At",
    ]
  );

  const defaultFilename =
    filename ||
    `monthly_report_${data.year}_${String(data.month).padStart(2, "0")}.csv`;
  downloadCSV(csv, defaultFilename);
}

/**
 * Export event performance data to CSV
 * 
 * @param data - Event performance reports
 * @param filename - Output filename
 */
export function exportEventPerformanceToCSV(
  data: EventPerformanceReport[],
  filename?: string
): void {
  const headers = [
    "Event ID",
    "Event Name",
    "Event Date",
    "Location",
    "Total Tickets",
    "Tickets Sold",
    "Available Tickets",
    "Sell-Out %",
    "Price per Ticket",
    "Total Revenue",
    "Average Price",
    "Exported At",
  ];

  const csv = convertToCSV(
    data.map((row) => ({
      "Event ID": row.eventId,
      "Event Name": row.eventName,
      "Event Date": row.eventDate,
      "Location": row.location,
      "Total Tickets": row.totalTickets,
      "Tickets Sold": row.ticketsSold,
      "Available Tickets": row.availableTickets,
      "Sell-Out %": row.sellOutPercentage.toFixed(1),
      "Price per Ticket": row.pricePerTicket.toFixed(2),
      "Total Revenue": row.totalRevenue.toFixed(2),
      "Average Price": row.averagePrice.toFixed(2),
      "Exported At": row.exportedAt,
    })),
    headers
  );

  const defaultFilename =
    filename ||
    `event_performance_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(csv, defaultFilename);
}

/**
 * Export to JSON for data portability
 * 
 * @param data - Data to export
 * @param filename - Output filename
 */
export function exportToJSON(
  data: unknown,
  filename: string = "export.json"
): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate timestamp for export records
 * 
 * @returns ISO timestamp string
 */
export function generateExportTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format currency for CSV export
 * 
 * @param amount - Amount in dollars
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrencyForExport(
  amount: number,
  currency: string = "USD"
): string {
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Format date for CSV export
 * 
 * @param date - Date to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateForExport(date: Date | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
