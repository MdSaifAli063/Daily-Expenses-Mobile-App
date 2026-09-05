import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { DailyEntry } from '../types/dailyEntry';
import {
  ReportData,
  ReportDayEntry,
  ReportExpense,
  ReportExportRecord,
  ReportType,
} from '../types/report';
import { Shop } from '../types/shop';
import {
  calculateEntryFinancials,
  formatCurrency,
  formatEntryDate,
  getDayOfWeek,
} from '../utils/entryCalculations';
import {
  calculateReportSummary,
  formatDateRange,
  getNextDayDate,
} from '../utils/reportCalculations';

const ENTRY_SELECT_QUERY = `
  id,
  shop_id,
  user_id,
  entry_date,
  day_type,
  collection,
  milk_expense,
  vimal_expense,
  home_expense,
  notes,
  created_at,
  updated_at,
  other_expenses (
    id,
    daily_entry_id,
    shop_id,
    user_id,
    expense_name,
    amount,
    category,
    created_at,
    updated_at
  )
`;

function mapDbRowToDailyEntry(data: any): DailyEntry {
  return {
    id: data.id,
    shop_id: data.shop_id,
    user_id: data.user_id,
    entry_date: data.entry_date,
    day_type: (data.day_type as 'working' | 'holiday') || 'working',
    collection: Number(data.collection) || 0,
    milk_expense: Number(data.milk_expense) || 0,
    vimal_expense: Number(data.vimal_expense) || 0,
    home_expense: Number(data.home_expense) || 0,
    notes: data.notes || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    other_expenses: (data.other_expenses || []).map((oe: any) => ({
      id: oe.id,
      daily_entry_id: oe.daily_entry_id,
      shop_id: oe.shop_id,
      user_id: oe.user_id,
      expense_name: oe.expense_name,
      amount: Number(oe.amount) || 0,
      category: oe.category || 'Business',
      created_at: oe.created_at,
      updated_at: oe.updated_at,
    })),
  };
}

export const reportService = {
  /**
   * Queries Supabase for all daily entries inside [startDate, endDate],
   * aggregates metrics, flattens individual expenses, and formats day-by-day rows.
   */
  async getReportData(
    startDate: string,
    endDate: string,
    shopId: string,
    reportType: ReportType
  ): Promise<{ data: ReportData | null; error: Error | null }> {
    try {
      const nextDayAfterEnd = getNextDayDate(endDate);

      const { data, error } = await supabase
        .from('daily_entries')
        .select(ENTRY_SELECT_QUERY)
        .eq('shop_id', shopId)
        .gte('entry_date', startDate)
        .lt('entry_date', nextDayAfterEnd)
        .order('entry_date', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const entries: DailyEntry[] = (data || []).map(mapDbRowToDailyEntry);

      // Compute summary metrics
      const summary = calculateReportSummary(entries, startDate, endDate);

      // Extract all individual other expenses belonging to this period
      const expenses: ReportExpense[] = [];
      for (const entry of entries) {
        for (const oe of entry.other_expenses || []) {
          expenses.push({
            id: oe.id || `${entry.id}-${oe.expense_name}`,
            daily_entry_id: entry.id,
            expense_name: oe.expense_name,
            category: oe.category || 'Business',
            amount: Number(oe.amount) || 0,
            entry_date: entry.entry_date,
          });
        }
      }

      // Format day-by-day entries
      const dayEntries: ReportDayEntry[] = entries.map((entry) => {
        const fin = calculateEntryFinancials(entry);
        return {
          id: entry.id,
          entry_date: entry.entry_date,
          day_type: entry.day_type,
          collection: fin.collection,
          totalExpense: fin.totalExpense,
          profit: fin.profit,
          notes: entry.notes,
        };
      });

      const periodLabel = formatDateRange(startDate, endDate);

      return {
        data: {
          summary,
          expenses,
          dayEntries,
          periodLabel,
          reportType,
        },
        error: null,
      };
    } catch (err: any) {
      console.error('[reportService.getReportData] Unexpected error:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Generates a printable PDF from report data using expo-print,
   * uploads to Supabase Storage ('report-exports'), records metadata, and prompts local share.
   */
  async generateAndSavePdf(
    reportData: ReportData,
    shop: Shop
  ): Promise<{ success: boolean; fileUri?: string; error: Error | null }> {
    try {
      const { summary, expenses, dayEntries, periodLabel, reportType } = reportData;

      // Build printable HTML string with authentic shop ledger styling
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Expense Report - ${shop.shop_name}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1F2937;
              padding: 30px;
              background-color: #FFFFFF;
            }
            .header {
              border-bottom: 2px solid #0E5B42;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .shop-name {
              font-size: 24px;
              font-weight: bold;
              color: #0E5B42;
              margin: 0;
            }
            .owner-name {
              font-size: 13px;
              color: #6B7280;
              margin-top: 4px;
            }
            .report-title {
              font-size: 18px;
              font-weight: 600;
              margin-top: 15px;
              color: #111827;
            }
            .report-period {
              font-size: 13px;
              color: #4B5563;
              margin-top: 3px;
            }
            .section-title {
              font-size: 15px;
              font-weight: bold;
              color: #0E5B42;
              margin-top: 25px;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th, td {
              padding: 8px 12px;
              text-align: left;
              border-bottom: 1px solid #E5E7EB;
              font-size: 13px;
            }
            th {
              background-color: #F8FAF7;
              color: #374151;
              font-weight: 600;
            }
            .text-right {
              text-align: right;
            }
            .summary-table td {
              font-size: 14px;
              padding: 10px 12px;
            }
            .font-bold {
              font-weight: bold;
            }
            .profit-val {
              color: #0E5B42;
              font-weight: bold;
            }
            .expense-val {
              color: #DC2626;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
              background-color: #F1F5F9;
              color: #475569;
            }
            .footer {
              margin-top: 40px;
              font-size: 11px;
              color: #9CA3AF;
              text-align: center;
              border-top: 1px solid #E5E7EB;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${shop.shop_name}</div>
            <div class="owner-name">Owner: ${shop.owner_name}</div>
            <div class="report-title">Expense Report</div>
            <div class="report-period">Period: ${periodLabel}</div>
          </div>

          <div class="section-title">Summary</div>
          <table class="summary-table">
            <tr>
              <td>Total collection</td>
              <td class="text-right font-bold">${formatCurrency(summary.totalCollection)}</td>
            </tr>
            <tr>
              <td>Business expense</td>
              <td class="text-right expense-val">${formatCurrency(summary.businessExpense)}</td>
            </tr>
            <tr>
              <td>Home expense</td>
              <td class="text-right expense-val">${formatCurrency(summary.homeExpense)}</td>
            </tr>
            <tr>
              <td>Total cash outflow</td>
              <td class="text-right font-bold expense-val">${formatCurrency(summary.totalCashOutflow)}</td>
            </tr>
            <tr>
              <td class="font-bold">Business profit</td>
              <td class="text-right font-bold profit-val">${formatCurrency(summary.businessProfit)}</td>
            </tr>
            <tr>
              <td>Average daily collection</td>
              <td class="text-right font-bold">${formatCurrency(summary.averageDailyCollection)}</td>
            </tr>
            <tr>
              <td>Working days</td>
              <td class="text-right">${summary.workingDays}</td>
            </tr>
            <tr>
              <td>Holidays</td>
              <td class="text-right">${summary.holidays}</td>
            </tr>
          </table>

          <div class="section-title">Expense Breakdown</div>
          ${
            expenses.length === 0
              ? '<p style="color: #6B7280; font-style: italic; font-size: 13px;">No individual expenses recorded in this period.</p>'
              : `
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense Name</th>
                  <th>Category</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${expenses
                  .map(
                    (exp) => `
                  <tr>
                    <td>${formatEntryDate(exp.entry_date)}</td>
                    <td>${exp.expense_name}</td>
                    <td><span class="badge">${exp.category}</span></td>
                    <td class="text-right expense-val font-bold">${formatCurrency(exp.amount)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
          }

          <div class="section-title">Day-by-Day Entries</div>
          ${
            dayEntries.length === 0
              ? '<p style="color: #6B7280; font-style: italic; font-size: 13px;">No daily records in this period.</p>'
              : `
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Day Type</th>
                  <th class="text-right">Collection</th>
                  <th class="text-right">Expenses</th>
                  <th class="text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                ${dayEntries
                  .map(
                    (d) => `
                  <tr>
                    <td>${formatEntryDate(d.entry_date)}</td>
                    <td>${getDayOfWeek(d.entry_date)}</td>
                    <td><span class="badge">${d.day_type === 'holiday' ? 'Holiday' : 'Working day'}</span></td>
                    <td class="text-right">${formatCurrency(d.collection)}</td>
                    <td class="text-right expense-val">${formatCurrency(d.totalExpense)}</td>
                    <td class="text-right profit-val">${formatCurrency(d.profit)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
          }

          <div class="footer">
            Generated by Dailydoubt on ${new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </body>
        </html>
      `;

      // 1. Generate local PDF file
      const { uri } = await Print.printToFileAsync({ html });

      // 2. Prepare storage file name & path
      const timestamp = Date.now();
      const fileName = `expense-report-${reportType}-${summary.startDate}-to-${summary.endDate}-${timestamp}.pdf`;
      const storagePath = `${shop.user_id}/${shop.id}/${fileName}`;

      // 3. Upload PDF to Supabase Storage
      try {
        const response = await fetch(uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('report-exports')
          .upload(storagePath, blob, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.warn('[reportService] Storage upload failed:', uploadError);
        } else {
          // 4. Insert metadata record into public.report_exports
          await supabase.from('report_exports').insert({
            user_id: shop.user_id,
            shop_id: shop.id,
            report_type: reportType,
            start_date: summary.startDate,
            end_date: summary.endDate,
            file_type: 'pdf',
            storage_path: storagePath,
            file_name: fileName,
          });
        }
      } catch (uploadErr) {
        console.warn('[reportService] Upload handling warning:', uploadErr);
      }

      // 5. Open/share locally using expo-sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share PDF Report',
          UTI: 'com.adobe.pdf',
        });
      }

      return { success: true, fileUri: uri, error: null };
    } catch (err: any) {
      console.error('[reportService.generateAndSavePdf] Error:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Generates a structured multi-sheet Excel (.xlsx) file using SheetJS,
   * saves locally, uploads to Supabase Storage, and opens via expo-sharing.
   */
  async generateAndSaveExcel(
    reportData: ReportData,
    shop: Shop
  ): Promise<{ success: boolean; fileUri?: string; error: Error | null }> {
    try {
      const { summary, expenses, dayEntries, periodLabel, reportType } = reportData;

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData = [
        ['Shop Name', shop.shop_name],
        ['Owner Name', shop.owner_name],
        ['Report Period', periodLabel],
        ['', ''],
        ['Metric', 'Value (₹)'],
        ['Total collection', summary.totalCollection],
        ['Business expense', summary.businessExpense],
        ['Home expense', summary.homeExpense],
        ['Total cash outflow', summary.totalCashOutflow],
        ['Business profit', summary.businessProfit],
        ['Average daily collection', summary.averageDailyCollection],
        ['Working days', summary.workingDays],
        ['Holidays', summary.holidays],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Sheet 2: Daily Entries
      const dailyRows = [
        [
          'Date',
          'Day',
          'Day Type',
          'Collection (₹)',
          'Total Expense (₹)',
          'Profit (₹)',
          'Notes',
        ],
        ...dayEntries.map((d) => [
          d.entry_date,
          getDayOfWeek(d.entry_date),
          d.day_type,
          d.collection,
          d.totalExpense,
          d.profit,
          d.notes || '',
        ]),
      ];
      const wsDaily = XLSX.utils.aoa_to_sheet(dailyRows);
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Entries');

      // Sheet 3: Expense Breakdown
      const expenseRows = [
        ['Date', 'Expense Name', 'Category', 'Amount (₹)'],
        ...expenses.map((e) => [
          e.entry_date,
          e.expense_name,
          e.category,
          e.amount,
        ]),
      ];
      const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expense Breakdown');

      // Generate base64 string from workbook
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      // Save locally in cache/document directory
      const timestamp = Date.now();
      const fileName = `expense-report-${reportType}-${summary.startDate}-to-${summary.endDate}-${timestamp}.xlsx`;
      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      const fileUri = `${baseDir}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Prepare storage path & upload to Supabase Storage
      const storagePath = `${shop.user_id}/${shop.id}/${fileName}`;
      try {
        const response = await fetch(fileUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('report-exports')
          .upload(storagePath, blob, {
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            upsert: true,
          });

        if (uploadError) {
          console.warn('[reportService] Excel storage upload warning:', uploadError);
        } else {
          // Record export metadata
          await supabase.from('report_exports').insert({
            user_id: shop.user_id,
            shop_id: shop.id,
            report_type: reportType,
            start_date: summary.startDate,
            end_date: summary.endDate,
            file_type: 'xlsx',
            storage_path: storagePath,
            file_name: fileName,
          });
        }
      } catch (uploadErr) {
        console.warn('[reportService] Upload Excel warning:', uploadErr);
      }

      // Share/open locally via expo-sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Share Excel Report',
        });
      }

      return { success: true, fileUri, error: null };
    } catch (err: any) {
      console.error('[reportService.generateAndSaveExcel] Error:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Retrieves export history for the user's shop.
   */
  async getReportHistory(
    shopId: string
  ): Promise<{ data: ReportExportRecord[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('report_exports')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: (data || []) as ReportExportRecord[], error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Generates a temporary signed download URL for an export in private storage.
   */
  async getSignedUrlForExport(
    storagePath: string,
    expiresInSeconds: number = 300
  ): Promise<{ signedUrl: string | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from('report-exports')
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error || !data) {
        return { data: null, error: error ? new Error(error.message) : null } as any;
      }

      return { signedUrl: data.signedUrl, error: null };
    } catch (err: any) {
      return { signedUrl: null, error: err };
    }
  },
};
