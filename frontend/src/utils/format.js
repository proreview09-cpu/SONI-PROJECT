const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatINR(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatLakh(amount) {
  const n = Number(amount) || 0;
  if (n >= 100000) {
    const lakh = n / 100000;
    const display = lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2);
    return `₹${display}L`;
  }
  return formatINR(n);
}

export function formatShortDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${formatShortDate(d)} ${d.getFullYear()}`;
}

export function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good Night';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

export function methodLabel(method) {
  const labels = {
    cash: 'Cash',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    other: 'Other',
  };
  return labels[method] || method || '—';
}

export function rewardLabel(status) {
  const labels = {
    not_applicable: 'Not applicable yet',
    eligible: 'Eligible',
    pending: 'Pending',
    claimed: 'Claimed',
    closed: 'Closed',
  };
  return labels[status] || status;
}

export function bonusDescription(scheme) {
  if (!scheme) return '';
  if (scheme.bonusType === 'free_installment') {
    const multiplier = scheme.bonusValue || 1;
    return `Reward: ${formatINR(multiplier * scheme.monthlyAmount)} value on completion`;
  }
  if (scheme.bonusType === 'fixed_amount') {
    return `Reward: ${formatINR(scheme.bonusValue)} fixed amount on completion`;
  }
  if (scheme.bonusType === 'percentage') {
    return `Reward: ${scheme.bonusValue}% of total paid on completion`;
  }
  return '';
}
