// js/export.js
// Export data formats to CSV, Excel-compatible formats, and window print helpers

import { t } from './utils.js';

export const exporter = {
  // Export array of objects to CSV file download
  exportToCSV: (filename, headers, rows) => {
    let csvContent = '\uFEFF'; // Add BOM for Excel UTF-8 display compatibility

    // Append headers
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    // Append rows
    rows.forEach(row => {
      const line = row.map(cell => {
        const str = cell === null || cell === undefined ? '' : String(cell);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',');
      csvContent += line + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  // Export roster history or lists to Excel file trigger
  exportToExcel: (filename, headers, rows) => {
    // Generate as XML spreadsheet structure or CSV with .xls extension
    // Simple Excel XML spreadsheet structure is supported natively by Excel and maintains column encoding
    exporter.exportToCSV(filename.replace(/\.xlsx?$/, '') + '.csv', headers, rows);
  },

  // Native Print Roster
  printTimetable: (elementId, titleText) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printHTML = `
      <div class="print-container p-6 bg-white text-black font-sans">
        <div class="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h1 class="text-2xl font-bold">${t('loginTitle')}</h1>
            <p class="text-xs text-slate-500">${titleText}</p>
          </div>
          <div class="text-right">
            <p class="text-xs font-semibold">Date: ${new Date().toLocaleDateString()}</p>
            <p class="text-[10px] text-slate-400">Made with ❤️ by Atharva Deshmukh</p>
          </div>
        </div>
        <div>
          ${printContent.innerHTML}
        </div>
      </div>
    `;

    // Open print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>${titleText}</title>
          <link rel="stylesheet" href="css/style.css">
          <link rel="stylesheet" href="css/dashboard.css">
          <style>
            body { background: white !important; color: black !important; }
            .no-print, button, select, input { display: none !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { border: 1px solid #cbd5e1 !important; padding: 8px !important; text-align: center !important; }
            th { background-color: #f1f5f9 !important; font-weight: bold !important; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          ${printHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
