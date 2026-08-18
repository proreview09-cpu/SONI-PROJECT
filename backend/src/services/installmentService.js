const Installment = require('../models/Installment');
const Enrollment = require('../models/Enrollment');
const { sendMessage } = require('./whatsappService');
const { writeAudit } = require('./auditService');
const { buildDueDates } = require('../utils/generateSchedule');
const { HttpError } = require('../middleware/errorHandler');
const { formatDate } = require('../utils/dateHelpers');

async function generateInstallmentsForEnrollment(enrollment, customerId) {
  const dueDates = buildDueDates(enrollment.startDate, enrollment.dueDay, enrollment.totalInstallments);
  const docs = dueDates.map((dueDate, i) => ({
    enrollment: enrollment._id,
    customer: customerId,
    installmentNumber: i + 1,
    dueDate,
    amount: enrollment.monthlyAmount,
    status: 'upcoming',
  }));
  return Installment.insertMany(docs);
}

async function recordPayment(installmentId, payload, user) {
  const installment = await Installment.findById(installmentId).populate('customer enrollment');
  if (!installment) throw new HttpError(404, 'Installment not found');
  if (installment.status === 'paid') throw new HttpError(409, 'This installment is already paid');
  if (!installment.enrollment || installment.enrollment.status === 'cancelled') {
    throw new HttpError(400, 'This enrollment has been cancelled');
  }

  const method = payload.method || 'cash';
  if (!['cash', 'upi', 'bank_transfer', 'cheque', 'other'].includes(method)) {
    throw new HttpError(400, 'Invalid payment method');
  }

  installment.status = 'paid';
  installment.paymentDate = new Date();
  installment.paymentMethod = method;
  installment.referenceNumber = payload.reference || '';
  installment.remarks = payload.remarks || '';
  installment.recordedBy = user._id;
  await installment.save();

  const enrollment = installment.enrollment;
  enrollment.installmentsPaid += 1;
  enrollment.totalPaid += installment.amount;

  let completed = false;
  if (enrollment.installmentsPaid >= enrollment.totalInstallments) {
    enrollment.status = 'completed';
    enrollment.rewardStatus = 'eligible';
    completed = true;
  }
  await enrollment.save();

  await sendMessage(
    installment.customer,
    'payment_confirmation',
    {
      amount: installment.amount,
      installmentNumber: installment.installmentNumber,
      totalPaid: enrollment.totalPaid,
    },
    { installmentId: installment._id }
  );

  if (completed) {
    await sendMessage(
      installment.customer,
      'completion',
      { totalPaid: enrollment.totalPaid },
      { installmentId: installment._id }
    );
  }

  await writeAudit(user._id, 'PAYMENT_RECORDED', 'Installment', installment._id, {
    customer: installment.customer._id,
    amount: installment.amount,
    method: installment.paymentMethod,
    installmentNumber: installment.installmentNumber,
  });

  return installment;
}

async function cancelEnrollment(enrollment, user) {
  if (enrollment.status === 'cancelled') return enrollment;
  enrollment.status = 'cancelled';
  await enrollment.save();
  await writeAudit(user._id, 'ENROLLMENT_CANCELLED', 'Enrollment', enrollment._id, {
    customer: enrollment.customer,
    refundNote: 'No automatic refund — handled manually by staff',
  });
  return enrollment;
}

function nextUnpaidInstallment(installments) {
  const sorted = [...installments].sort((a, b) => a.dueDate - b.dueDate);
  return sorted.find((i) => i.status !== 'paid') || null;
}

function rewardLabel(rewardStatus) {
  const labels = {
    not_applicable: 'Not applicable yet',
    eligible: 'Eligible',
    pending: 'Pending',
    claimed: 'Claimed',
    closed: 'Closed',
  };
  return labels[rewardStatus] || rewardStatus;
}

module.exports = {
  generateInstallmentsForEnrollment,
  recordPayment,
  cancelEnrollment,
  nextUnpaidInstallment,
  rewardLabel,
  formatDate,
};
