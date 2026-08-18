const { asyncHandler, ok } = require('../utils/responseHelper');
const { buildReportData } = require('../services/reportService');
const { createObjectCsvStringifier } = require('csv-writer');
const ExcelJS = require('exceljs');

function flattenRows(rows) {
  if (!rows.length) return { header: [], flat: [] };
  const header = Object.keys(rows[0]).map((key) => ({ id: key, title: key }));
  const flat = rows.map((row) => {
    const out = {};
    for (const key of Object.keys(row)) out[key] = row[key] ?? '';
    return out;
  });
  return { header, flat };
}

exports.export = asyncHandler(async (req, res) => {
  const { type, format } = req.query;
  if (!type) return res.status(400).json({ success: false, message: 'type is required' });

  const { rows, label } = await buildReportData(type, req.query);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${type}-report-${dateStr}`;

  if (format === 'xlsx' || format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(label || 'Report');

    if (rows.length) {
      const keys = Object.keys(rows[0]);
      sheet.addRow(keys.map((k) => k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')));
      for (const row of rows) {
        sheet.addRow(Object.values(row).map((v) => v ?? ''));
      }
      sheet.getRow(1).font = { bold: true };
      sheet.columns.forEach((col) => {
        col.width = Math.min(30, Math.max(12, ...rows.map((r) => String(r[Object.keys(r)[col.number - 1]] ?? '').length)));
      });
    } else {
      sheet.addRow(['No records found']);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    return res.send(Buffer.from(buffer));
  }

  const { header, flat } = flattenRows(rows);
  const csvStringifier = createObjectCsvStringifier({ header });
  const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(flat);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  return res.send(csv);
});
