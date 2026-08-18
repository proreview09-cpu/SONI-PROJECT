function buildDueDates(startDate, dueDay, totalInstallments) {
  const start = new Date(startDate);
  const day = Math.min(Math.max(Number(dueDay) || 1, 1), 28);

  let firstDue = new Date(start.getFullYear(), start.getMonth(), day);
  if (firstDue < start) {
    firstDue = new Date(start.getFullYear(), start.getMonth() + 1, day);
  }

  const dueDates = [];
  for (let i = 0; i < totalInstallments; i++) {
    dueDates.push(new Date(firstDue.getFullYear(), firstDue.getMonth() + i, day));
  }
  return dueDates;
}

module.exports = { buildDueDates };
