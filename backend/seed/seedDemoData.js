const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Scheme = require('../src/models/Scheme');
const Enrollment = require('../src/models/Enrollment');
const Installment = require('../src/models/Installment');
const Announcement = require('../src/models/Announcement');
const WhatsAppLog = require('../src/models/WhatsAppLog');
const AuditLog = require('../src/models/AuditLog');
const Settings = require('../src/models/Settings');
const { buildDueDates } = require('../src/utils/generateSchedule');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/suvarn_bachat_yojana';

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

const FIRST_NAMES = [
  'Amit', 'Priya', 'Vikram', 'Sunita', 'Arjun', 'Kavita', 'Dinesh', 'Shobha',
  'Nitin', 'Aruna', 'Sanjay', 'Geeta', 'Ravi', 'Kiran', 'Ashok', 'Madhu',
  'Pramod', 'Usha', 'Vinod', 'Sarita', 'Mahesh', 'Anita', 'Rahul', 'Shilpa',
  'Bharat', 'Jyoti', 'Kishore', 'Nalini', 'Omkar', 'Padma', 'Girish', 'Radha',
  'Sameer', 'Komal', 'Jayesh', 'Ritu', 'Manish', 'Farida', 'Sandeep', 'Nisha',
  'Yogesh', 'Preeti', 'Alok', 'Divya', 'Chandan', 'Rashmi', 'Siddharth', 'Lata',
];

const LAST_NAMES = [
  'Patel', 'Sharma', 'Iyer', 'Gupta', 'Desai', 'Mehta', 'Rao', 'Nair',
  'Joshi', 'Singh', 'Reddy', 'Menon', 'Kulkarni', 'Bhatt', 'Verma', 'Kapoor',
  'Agarwal', 'Chopra', 'Saxena', 'Malhotra',
];

const METHODS = ['cash', 'cash', 'upi', 'cash', 'upi', 'bank_transfer'];
const HONORIFICS = ['Mr.', 'Mrs.', 'Ms.'];

function makePhone(used) {
  let phone;
  do {
    phone = '98' + String(rand(10000000, 99999999));
  } while (used.has(phone));
  used.add(phone);
  return phone;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function createEnrollmentWithSchedule(customer, scheme, startDate, dueDay) {
  const enrollment = await Enrollment.create({
    customer: customer._id,
    scheme: scheme._id,
    startDate,
    dueDay,
    monthlyAmount: scheme.monthlyAmount,
    totalInstallments: scheme.durationMonths || 11,
    installmentsPaid: 0,
    totalPaid: 0,
    status: 'active',
    rewardStatus: 'not_applicable',
  });

  const dueDates = buildDueDates(startDate, dueDay, enrollment.totalInstallments);
  const docs = dueDates.map((dueDate, i) => ({
    enrollment: enrollment._id,
    customer: customer._id,
    installmentNumber: i + 1,
    dueDate,
    amount: enrollment.monthlyAmount,
    status: 'upcoming',
  }));

  const installments = await Installment.insertMany(docs);
  return { enrollment, installments };
}

async function markPaid(installment, paymentDate, byUser, logConfirmation = false) {
  installment.status = 'paid';
  installment.paymentDate = paymentDate;
  installment.paymentMethod = pick(METHODS);
  installment.referenceNumber = pick(['', '', '', 'UTR' + rand(1000000, 9999999)]);
  installment.recordedBy = byUser._id;
  await installment.save();

  const enrollment = await Enrollment.findById(installment.enrollment);
  enrollment.installmentsPaid += 1;
  enrollment.totalPaid += installment.amount;
  if (enrollment.installmentsPaid >= enrollment.totalInstallments) {
    enrollment.status = 'completed';
    enrollment.rewardStatus = 'eligible';
  }
  await enrollment.save();

  if (logConfirmation) {
    await WhatsAppLog.create({
      customer: installment.customer,
      installment: installment._id,
      templateType: 'payment_confirmation',
      messageContent: `Payment received: ₹${installment.amount}\nInstallment ${installment.installmentNumber}/11 • Total paid ₹${enrollment.totalPaid}`,
      status: 'sent',
      provider: 'stub',
      sentAt: paymentDate,
    });
  }
  return enrollment;
}

async function welcomeLog(customer, enrollment, byUser) {
  return WhatsAppLog.create({
    customer: customer._id,
    installment: null,
    templateType: 'welcome',
    messageContent: `Welcome to Suvarn Bachat Yojana, ${customer.fullName}! Your scheme has started with a monthly installment of ₹${enrollment.monthlyAmount}, payable on the ${enrollment.dueDay} of every month for ${enrollment.totalInstallments} months. Thank you for joining us.`,
    status: 'sent',
    provider: 'stub',
    sentAt: enrollment.startDate,
  });
}

async function seed() {
  console.log(`Seeding MongoDB at ${MONGO_URI} ...`);
  await mongoose.connect(MONGO_URI);

  const models = [User, Customer, Scheme, Enrollment, Installment, Announcement, WhatsAppLog, AuditLog, Settings];
  for (const m of models) await m.deleteMany({});
  console.log('Cleared existing collections.');

  // ---- Settings -----------------------------------------------------------
  const settings = await Settings.create({
    businessName: 'Suvarn Bachat Yojana',
    defaultDueDay: 5,
    reminderDaysBefore: 5,
    gracePeriodDays: 0,
    whatsappProvider: 'stub',
    followupReNotifyDays: 7,
    monthlyCollectionTarget: 150000,
    whatsappTemplates: {},
  });

  // ---- Users --------------------------------------------------------------
  const owner = new User({ name: 'Rajesh Mehta', email: 'owner@demo.com', phone: '9811111111', role: 'owner' });
  owner.setPassword('admin123');
  await owner.save();

  const staff1 = new User({ name: 'Suresh Kumar', email: 'staff@demo.com', phone: '9822222222', role: 'staff' });
  staff1.setPassword('staff123');
  await staff1.save();

  const staff2 = new User({ name: 'Anita Rao', email: 'staff2@demo.com', phone: '9833333333', role: 'staff' });
  staff2.setPassword('staff123');
  await staff2.save();

  // ---- Schemes ------------------------------------------------------------
  const schemes = [];
  for (const amt of [1000, 2000, 3000, 4000, 5000]) {
    schemes.push(
      await Scheme.create({
        name: `₹${amt.toLocaleString('en-IN')} Monthly Plan`,
        monthlyAmount: amt,
        durationMonths: 11,
        bonusType: 'free_installment',
        bonusValue: 1,
        isActive: true,
      })
    );
  }
  await Scheme.create({
    name: '₹750 Custom Plan',
    monthlyAmount: 750,
    durationMonths: 11,
    bonusType: 'fixed_amount',
    bonusValue: 1000,
    isActive: true,
  });

  const schemeByAmount = (amt) => schemes.find((s) => s.monthlyAmount === amt);
  const usedPhones = new Set();
  const now = new Date();
  const today = startOfDay(now);
  const dueDay = settings.defaultDueDay;

  // ---- Featured customers (match the preview mockup) ----------------------
  // 1. Ramesh Patel — ₹2,000 plan, 6/11 paid, ₹12,000 total, next due 5th of next month
  const ramesh = await Customer.create({
    fullName: 'Ramesh Patel',
    phone: makePhone(usedPhones),
    alternatePhone: '',
    address: '12, Gold Bazaar, Ahmedabad',
    notes: 'Prefers cash payment',
    createdBy: owner._id,
  });
  const rameshEnr = await createEnrollmentWithSchedule(
    ramesh,
    schemeByAmount(2000),
    new Date(now.getFullYear(), now.getMonth() - 6, 18),
    dueDay
  );
  await welcomeLog(ramesh, rameshEnr.enrollment, owner);
  for (const inst of rameshEnr.installments) {
    const due = startOfDay(inst.dueDate);
    if (due <= today || inst.installmentNumber === 6) {
      const payDate = inst.installmentNumber === 6 ? today : new Date(due.getTime() + rand(0, 2) * 86400000);
      await markPaid(inst, payDate, staff1, true);
    }
  }

  // 2. Neha Sharma — ₹3,000 plan, latest payment today
  const neha = await Customer.create({
    fullName: 'Neha Sharma',
    phone: makePhone(usedPhones),
    address: '45, Silver Street, Surat',
    createdBy: owner._id,
  });
  const nehaEnr = await createEnrollmentWithSchedule(
    neha,
    schemeByAmount(3000),
    new Date(now.getFullYear(), now.getMonth() - 5, 20),
    dueDay
  );
  await welcomeLog(neha, nehaEnr.enrollment, owner);
  const nehaCurrentMonth = nehaEnr.installments.filter((i) => i.dueDate.getMonth() === now.getMonth() && i.dueDate.getFullYear() === now.getFullYear());
  for (const inst of nehaEnr.installments) {
    const due = startOfDay(inst.dueDate);
    if (due <= today) {
      const isCurrent = nehaCurrentMonth.some((c) => c._id.toString() === inst._id.toString());
      await markPaid(inst, isCurrent ? today : new Date(due.getTime() + rand(0, 3) * 86400000), staff1, isCurrent);
    }
  }

  // 3. Harish Joshi — ₹5,000 plan, due today (pending)
  const harish = await Customer.create({
    fullName: 'Harish Joshi',
    phone: makePhone(usedPhones),
    address: '3, Diamond Colony, Rajkot',
    notes: 'Travelling frequently — call before visit',
    createdBy: staff1._id,
  });
  const harishDueDay = Math.max(1, Math.min(28, now.getDate()));
  const harishEnr = await createEnrollmentWithSchedule(
    harish,
    schemeByAmount(5000),
    new Date(now.getFullYear(), now.getMonth() - 2, 10),
    harishDueDay
  );
  await welcomeLog(harish, harishEnr.enrollment, staff1);
  for (const inst of harishEnr.installments) {
    const due = startOfDay(inst.dueDate);
    if (due < today) await markPaid(inst, new Date(due.getTime() + rand(1, 2) * 86400000), staff2, false);
  }

  // 4. Meena Patel — ₹1,000 plan, overdue
  const meena = await Customer.create({
    fullName: 'Meena Patel',
    phone: makePhone(usedPhones),
    address: '78, Temple Road, Bhavnagar',
    createdBy: staff1._id,
  });
  const meenaEnr = await createEnrollmentWithSchedule(
    meena,
    schemeByAmount(1000),
    new Date(now.getFullYear(), now.getMonth() - 3, 18),
    dueDay
  );
  await welcomeLog(meena, meenaEnr.enrollment, staff1);
  for (const inst of meenaEnr.installments) {
    if (inst.installmentNumber === 1) {
      const due = startOfDay(inst.dueDate);
      await markPaid(inst, new Date(due.getTime() + rand(0, 2) * 86400000), staff1, false);
    }
  }

  const featuredCustomers = [ramesh, neha, harish, meena];
  const usedNames = new Set(featuredCustomers.map((c) => c.fullName));

  // ---- Bulk customers -----------------------------------------------------
  const bulkCount = 48;
  const staffPool = [owner, staff1, staff2];
  const bulkCustomers = [];
  const rewardStates = ['eligible', 'pending', 'claimed', 'closed'];

  for (let i = 0; i < bulkCount; i++) {
    let fullName;
    do {
      fullName = `${pick(HONORIFICS)} ${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    const customer = await Customer.create({
      fullName,
      phone: makePhone(usedPhones),
      alternatePhone: rand(0, 4) === 0 ? makePhone(usedPhones) : '',
      address: pick(['', `${rand(1, 120)}, ${pick(['Gold Bazaar', 'Silver Street', 'Diamond Colony', 'Temple Road', 'MG Road'])}, ${pick(['Ahmedabad', 'Surat', 'Rajkot', 'Vadodara', 'Bhavnagar'])}`]),
      notes: pick(['', '', '', 'Prefers UPI', 'Call before visit', 'Loyal customer']),
      createdBy: pick(staffPool)._id,
    });

    const monthsAgo = rand(0, 13);
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, rand(3, 26));
    const scheme = pick(schemes);
    const isLongRunning = monthsAgo >= 12;
    const { enrollment, installments } = await createEnrollmentWithSchedule(
      customer,
      scheme,
      startDate,
      pick([5, 5, 5, 10, 15])
    );

    await welcomeLog(customer, enrollment, staffPool[rand(0, 2)]);

    if (isLongRunning) {
      for (const inst of installments) {
        const due = startOfDay(inst.dueDate);
        await markPaid(inst, new Date(due.getTime() + rand(0, 3) * 86400000), pick(staffPool), rand(0, 5) === 0);
      }
      const completed = await Enrollment.findById(enrollment._id);
      completed.rewardStatus = pick(rewardStates);
      if (completed.rewardStatus === 'claimed') {
        completed.redeemedDate = new Date(now.getTime() - rand(1, 40) * 86400000);
        completed.redeemedValue = completed.monthlyAmount;
        completed.redeemedBy = owner._id;
        completed.redemptionNotes = 'Redeemed against gold jewellery in-store';
      }
      await completed.save();
    } else {
      for (const inst of installments) {
        const due = startOfDay(inst.dueDate);
        if (due > today) break;
        const isCurrentMonth = due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
        const payChance = isCurrentMonth ? 0.75 : 0.85;
        if (Math.random() < payChance) {
          let payDate = new Date(due.getTime() + rand(0, 3) * 86400000);
          if (isCurrentMonth && payDate > today) payDate = today;
          await markPaid(inst, payDate, pick(staffPool), rand(0, 8) === 0);
        }
      }
    }

    bulkCustomers.push(customer);
  }

  // ---- A few cancelled enrollments ---------------------------------------
  for (const customer of bulkCustomers.slice(0, 3)) {
    const enrollment = await Enrollment.findOne({ customer: customer._id }).sort({ createdAt: -1 });
    if (!enrollment || enrollment.status === 'completed') continue;
    const paidCount = Math.min(enrollment.installmentsPaid, rand(1, 2));
    enrollment.status = 'cancelled';
    enrollment.installmentsPaid = paidCount;
    await enrollment.save();
    await Installment.updateMany(
      { enrollment: enrollment._id, installmentNumber: { $gt: paidCount } },
      { $set: { status: 'upcoming' } }
    );
  }

  // ---- Normalize unpaid statuses against today ----------------------------
  const unpaid = await Installment.find({ status: { $ne: 'paid' } });
  for (const inst of unpaid) {
    const enrollment = await Enrollment.findById(inst.enrollment);
    if (enrollment && enrollment.status !== 'active') continue;
    const due = startOfDay(inst.dueDate);
    if (due < today) inst.status = 'overdue';
    else if (due.getTime() === today.getTime()) inst.status = 'due_today';
    else inst.status = 'upcoming';
    await inst.save();
  }

  // ---- WhatsApp activity for featured customers ---------------------------
  const harishDueInst = await Installment.findOne({ customer: harish._id, status: 'due_today' });
  if (harishDueInst) {
    await WhatsAppLog.create({
      customer: harish._id,
      installment: harishDueInst._id,
      templateType: '5day_reminder',
      messageContent: `Dear ${harish.fullName}, your monthly installment of ₹${harishDueInst.amount} is due on ${harishDueInst.dueDate.toDateString()}. Kindly make your payment on time.`,
      status: 'sent',
      provider: 'stub',
      sentAt: new Date(today.getTime() - 5 * 86400000),
    });
  }

  const meenaOverdue = await Installment.findOne({ customer: meena._id, status: 'overdue' });
  if (meenaOverdue) {
    await WhatsAppLog.create({
      customer: meena._id,
      installment: meenaOverdue._id,
      templateType: 'pending_followup',
      messageContent: `Dear ${meena.fullName}, your installment of ₹${meenaOverdue.amount} (due ${meenaOverdue.dueDate.toDateString()}) is still pending. Kindly complete your payment to keep your scheme on track.`,
      status: 'sent',
      provider: 'stub',
      sentAt: new Date(today.getTime() - 2 * 86400000),
    });
  }

  // ---- Announcements ------------------------------------------------------
  await Announcement.create({
    title: 'Festive Offer',
    message: 'Dear customers, visit our store this week to view the new festive jewellery collection. Special exchange offers on this month!',
    audience: 'active',
    sentBy: owner._id,
    sentAt: new Date(today.getTime() - 6 * 86400000),
    deliveryCount: rand(30, 45),
  });

  await Announcement.create({
    title: 'Payment Reminder',
    message: 'Gentle reminder — please complete your monthly installment payment to keep your scheme on track.',
    audience: 'pending',
    sentBy: owner._id,
    sentAt: new Date(today.getTime() - 3 * 86400000),
    deliveryCount: rand(5, 15),
  });

  // ---- Audit trail --------------------------------------------------------
  const allCustomers = await Customer.countDocuments();
  await AuditLog.create({
    user: owner._id,
    action: 'CUSTOMER_CREATED',
    targetType: 'Customer',
    targetId: ramesh._id,
    details: { fullName: ramesh.fullName },
    timestamp: ramesh.createdAt,
  });
  await AuditLog.create({
    user: staff1._id,
    action: 'ENROLLMENT_CREATED',
    targetType: 'Enrollment',
    targetId: rameshEnr.enrollment._id,
    details: { customer: ramesh.fullName, scheme: '₹2,000 Monthly Plan' },
    timestamp: rameshEnr.enrollment.createdAt,
  });
  await AuditLog.create({
    user: staff1._id,
    action: 'PAYMENT_RECORDED',
    targetType: 'Installment',
    targetId: null,
    details: { customer: ramesh.fullName, amount: 2000, method: 'cash' },
    timestamp: today,
  });

  // ---- Summary ------------------------------------------------------------
  const summary = {
    users: await User.countDocuments(),
    customers: allCustomers,
    schemes: await Scheme.countDocuments(),
    enrollments: await Enrollment.countDocuments(),
    active: await Enrollment.countDocuments({ status: 'active' }),
    completed: await Enrollment.countDocuments({ status: 'completed' }),
    cancelled: await Enrollment.countDocuments({ status: 'cancelled' }),
    installments: await Installment.countDocuments(),
    paid: await Installment.countDocuments({ status: 'paid' }),
    pending: await Installment.countDocuments({ status: { $in: ['pending', 'due_today'] } }),
    overdue: await Installment.countDocuments({ status: 'overdue' }),
    whatsappLogs: await WhatsAppLog.countDocuments(),
    announcements: await Announcement.countDocuments(),
    auditLogs: await AuditLog.countDocuments(),
  };

  console.log('\n======================== SEED COMPLETE ========================');
  console.table(summary);
  console.log('\nLogin credentials:');
  console.log('  Owner : owner@demo.com / admin123');
  console.log('  Staff : staff@demo.com / staff123');
  console.log('  Staff2: staff2@demo.com / staff123');
  console.log('===============================================================');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
