const Customer = require('../models/Customer');
const Enrollment = require('../models/Enrollment');
const Installment = require('../models/Installment');
const { asyncHandler, ok, fail } = require('../utils/responseHelper');
const { formatDate, formatINR } = require('../utils/dateHelpers');

exports.ask = asyncHandler(async (req, res) => {
  const { customerId, question } = req.body;
  if (!customerId || !question) return fail(res, 'customerId and question are required');

  const customer = await Customer.findById(customerId);
  if (!customer) return fail(res, 'Customer not found', 404);

  const enrollment = await Enrollment.findOne({
    customer: customerId,
    status: { $ne: 'cancelled' },
  }).sort({ createdAt: -1 });

  if (!enrollment) {
    return ok(res, {
      answer: `${customer.fullName} does not have an active scheme enrollment right now.`,
    });
  }

  const installments = await Installment.find({ enrollment: enrollment._id }).sort({
    installmentNumber: 1,
  });

  // ------------------------------------------------------------------
  // EXTENSION POINT (Phase 2 — optional upgrade): the deterministic
  // pattern-matching below can be swapped for a free-text LLM call
  // (e.g. Anthropic API) without touching the route or the frontend.
  // Keep the same { answer } response shape.
  // ------------------------------------------------------------------

  const q = String(question).toLowerCase();
  const next = installments.find((i) => i.status !== 'paid');
  const remaining = installments.filter((i) => i.status !== 'paid').length;

  let answer;

  if (/(next|when|due|date|emi date)/.test(q)) {
    if (!next) {
      answer = `Great news — ${customer.fullName} has completed all ${enrollment.totalInstallments} installments. No further EMIs are due.`;
    } else if (enrollment.status === 'completed') {
      answer = `${customer.fullName} has completed the scheme. Reward status: ${enrollment.rewardStatus}.`;
    } else {
      answer = `${customer.fullName}'s next EMI of ${formatINR(next.amount)} is due on ${formatDate(next.dueDate)} (installment ${next.installmentNumber}/${enrollment.totalInstallments}).`;
    }
  } else if (/(paid|total|amount paid|so far|collected)/.test(q)) {
    answer = `${customer.fullName} has paid ${formatINR(enrollment.totalPaid)} so far — ${enrollment.installmentsPaid} of ${enrollment.totalInstallments} installments.`;
  } else if (/(remain|left|how many|balance)/.test(q)) {
    answer =
      remaining === 0
        ? `${customer.fullName} has no installments remaining — the scheme is complete.`
        : `${customer.fullName} has ${remaining} installment${remaining === 1 ? '' : 's'} remaining (${enrollment.installmentsPaid} of ${enrollment.totalInstallments} paid).`;
  } else {
    answer = `I can help with: next EMI date, total amount paid, and installments remaining for ${customer.fullName}. Try asking one of those.`;
  }

  return ok(res, { answer });
});
