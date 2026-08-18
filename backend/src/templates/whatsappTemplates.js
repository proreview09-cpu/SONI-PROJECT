const defaultTemplates = {
  welcome:
    'Welcome to Suvarn Bachat Yojana, {{customerName}}! Your scheme has started with a monthly installment of ₹{{monthlyAmount}}, payable on the {{dueDay}} of every month for {{duration}} months. Thank you for joining us.',
  '5day_reminder':
    'Dear {{customerName}}, your monthly installment of ₹{{amount}} is due on {{dueDate}}. Kindly make your payment on time.',
  due_today:
    'Dear {{customerName}}, your installment of ₹{{amount}} is due today. Please make your payment at your earliest convenience.',
  pending_followup:
    'Dear {{customerName}}, your installment of ₹{{amount}} (due {{dueDate}}) is still pending. Kindly complete your payment to keep your scheme on track.',
  payment_confirmation:
    'Payment received: ₹{{amount}}\nInstallment {{installmentNumber}}/11 • Total paid ₹{{totalPaid}}\n\nYour installment has been successfully received. Thank you for continuing with Suvarn Bachat Yojana.',
  completion:
    'Congratulations {{customerName}}! You have completed all 11 installments of your Suvarn Bachat Yojana scheme. Your reward is now eligible — please visit the store for details.',
  announcement: '{{message}}',
  custom: '{{message}}',
};

const TEMPLATE_KEYS = [
  'welcome',
  '5day_reminder',
  'due_today',
  'pending_followup',
  'payment_confirmation',
  'completion',
];

function renderTemplate(template, data) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (match, key) =>
    data[key] !== undefined && data[key] !== null ? String(data[key]) : match
  );
}

module.exports = { defaultTemplates, TEMPLATE_KEYS, renderTemplate };
