// client/src/utils/export.ts

export const exportToCSV = (filename: string, headers: string[], rows: any[][]) => {
  let csvContent = '\uFEFF'; // Add BOM for Excel UTF-8 display compatibility

  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

  rows.forEach(row => {
    const line = row.map(cell => {
      const str = cell === null || cell === undefined ? '' : String(cell);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',');
    csvContent += line + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (filename: string, sheetName: string, headers: string[], rows: any[][]) => {
  try {
    const globalWin = window as any;
    if (globalWin.XLSX) {
      const XLSX = globalWin.XLSX;
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, filename);
    } else {
      exportToCSV(filename.replace(/\.xlsx?$/, '') + '.csv', headers, rows);
    }
  } catch (e) {
    console.error("Excel generation failed, falling back to CSV:", e);
    exportToCSV(filename.replace(/\.xlsx?$/, '') + '.csv', headers, rows);
  }
};

export const exportToPDF = (filename: string, titleText: string, headers: string[], rows: any[][]) => {
  try {
    const globalWin = window as any;
    if (globalWin.jspdf && globalWin.jspdf.jsPDF) {
      const { jsPDF } = globalWin.jspdf;
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text(titleText, 14, 22);
      
      doc.setFontSize(10);
      let y = 35;
      
      headers.forEach((h, i) => {
        doc.text(h, 14 + (i * 38), y);
      });
      
      doc.line(14, y + 2, 200, y + 2);
      y += 10;
      
      rows.forEach(row => {
        row.forEach((cell, i) => {
          doc.text(String(cell || ''), 14 + (i * 38), y);
        });
        y += 8;
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
      });
      
      doc.save(filename);
    } else {
      alert("PDF library not loaded. Please use Print option.");
    }
  } catch (e) {
    console.error("PDF generation failed:", e);
    alert("Failed to compile PDF document: " + e.message);
  }
};
