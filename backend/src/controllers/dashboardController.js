const Enrollment = require('../models/Enrollment');
const Installment = require('../models/Installment');
const Settings = require('../models/Settings');
const { asyncHandler, ok } = require('../utils/responseHelper');
const { startOfDay, addDays } = require('../utils/dateHelpers');

exports.summary = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  const [activeMembers, completed, pendingEmi, thisMonthAgg, recentPayments, dueTodayUnpaid, settings] =
    await Promise.all([
      Enrollment.countDocuments({ status: 'active' }),
      Enrollment.countDocuments({ status: 'completed' }),
      Installment.countDocuments({ status: { $in: ['pending', 'due_today'] } }),
      Installment.aggregate([
        {
          $match: {
            status: 'paid',
            paymentDate: { $gte: monthStartDate, $lt: nextMonthDate },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Installment.find({
        status: 'paid',
        paymentDate: { $gte: today, $lt: tomorrow },
      })
        .populate('customer', 'fullName')
        .populate('enrollment', 'installmentNumber')
        .sort({ paymentDate: -1 }),
      Installment.find({
        status: { $ne: 'paid' },
        dueDate: { $gte: today, $lt: tomorrow },
      })
        .populate('customer', 'fullName')
        .populate('enrollment', 'installmentNumber')
        .sort({ dueDate: 1 }),
      Settings.getSingleton(),
    ]);

  return ok(res, {
    activeMembers,
    thisMonth: thisMonthAgg.length ? thisMonthAgg[0].total : 0,
    pendingEmi,
    completed,
    monthlyTarget: settings.monthlyCollectionTarget || 150000,
    recentPayments,
    dueTodayUnpaid,
  });
});

exports.automationQueue = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const today = startOfDay(new Date());
  const targetDay = addDays(today, settings.reminderDaysBefore);

  const [reminders5Day, dueToday, pendingFollowups] = await Promise.all([
    Installment.countDocuments({
      dueDate: { $gte: targetDay, $lt: addDays(targetDay, 1) },
      status: { $ne: 'paid' },
    }),
    Installment.countDocuments({
      dueDate: { $gte: today, $lt: addDays(today, 1) },
      status: { $ne: 'paid' },
    }),
    Installment.countDocuments({ status: 'overdue' }),
  ]);

  return ok(res, {
    reminders5Day,
    dueToday,
    pendingFollowups,
    lastRunAt: settings.automationLastRunAt,
    lastStatus: settings.automationLastStatus,
    lastMessage: settings.automationMessage,
  });
});
