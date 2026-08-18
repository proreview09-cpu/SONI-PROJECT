const { asyncHandler, ok } = require('../utils/responseHelper');
const { buildReportData } = require('../services/reportService');

async function rowsFor(type, query) {
  const { rows } = await buildReportData(type, query);
  return rows;
}

exports.collections = asyncHandler(async (req, res) => ok(res, await rowsFor('collections', req.query)));
exports.pending = asyncHandler(async (req, res) => ok(res, await rowsFor('pending', req.query)));
exports.overdue = asyncHandler(async (req, res) => ok(res, await rowsFor('overdue', req.query)));
exports.schemeWise = asyncHandler(async (req, res) => ok(res, await rowsFor('scheme-wise', req.query)));
exports.staffWise = asyncHandler(async (req, res) => ok(res, await rowsFor('staff-wise', req.query)));
