const Installment = require('../models/Installment');
const Settings = require('../models/Settings');
const { sendMessage } = require('../services/whatsappService');
const { startOfDay, addDays, formatDate } = require('../utils/dateHelpers');

async function runDailyAutomation() {
  const settings = await Settings.getSingleton();
  const today = startOfDay(new Date());
  const stats = { job1_5dayReminders: 0, job2_dueToday: 0, job3_overdue: 0, followupsSent: 0 };

  const activeFilter = async (inst) => {
    if (!inst.enrollment || inst.enrollment.status !== 'active') return false;
    return true;
  };

  // JOB 1 — 5-Day Advance Reminder
  const targetDay = addDays(today, settings.reminderDaysBefore);
  const job1Rows = await Installment.find({
    dueDate: { $gte: targetDay, $lt: addDays(targetDay, 1) },
    status: { $ne: 'paid' },
    reminderSent5Day: false,
  }).populate('customer enrollment');

  for (const inst of job1Rows) {
    if (!(await activeFilter(inst))) continue;
    await sendMessage(
      inst.customer,
      '5day_reminder',
      { amount: inst.amount, dueDate: formatDate(inst.dueDate) },
      { installmentId: inst._id }
    );
    inst.reminderSent5Day = true;
    await inst.save();
    stats.job1_5dayReminders++;
  }

  // JOB 2 — Due-Today Reminder
  const job2Rows = await Installment.find({
    dueDate: { $gte: today, $lt: addDays(today, 1) },
    status: { $ne: 'paid' },
    reminderSentDueDate: false,
  }).populate('customer enrollment');

  for (const inst of job2Rows) {
    if (!(await activeFilter(inst))) continue;
    await sendMessage(
      inst.customer,
      'due_today',
      { amount: inst.amount },
      { installmentId: inst._id }
    );
    inst.status = 'due_today';
    inst.reminderSentDueDate = true;
    await inst.save();
    stats.job2_dueToday++;
  }

  // JOB 3 — Overdue Detection + Pending Follow-up
  const overdueCutoff = addDays(today, -(settings.gracePeriodDays || 0));
  const job3Rows = await Installment.find({
    dueDate: { $lt: overdueCutoff },
    status: { $nin: ['paid'] },
  }).populate('customer enrollment');

  const reNotifyMs = (settings.followupReNotifyDays || 7) * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const inst of job3Rows) {
    if (!(await activeFilter(inst))) continue;
    inst.status = 'overdue';
    const shouldSend =
      !inst.lastFollowupSentAt || now - new Date(inst.lastFollowupSentAt).getTime() >= reNotifyMs;
    if (shouldSend) {
      await sendMessage(
        inst.customer,
        'pending_followup',
        { amount: inst.amount, dueDate: formatDate(inst.dueDate) },
        { installmentId: inst._id }
      );
      inst.lastFollowupSentAt = new Date();
      stats.followupsSent++;
    }
    await inst.save();
    stats.job3_overdue++;
  }

  settings.automationLastRunAt = new Date();
  settings.automationLastStatus = 'success';
  settings.automationMessage = `J1: ${stats.job1_5dayReminders} reminders • J2: ${stats.job2_dueToday} due-today • J3: ${stats.job3_overdue} overdue`;
  await settings.save();

  return stats;
}

module.exports = runDailyAutomation;
