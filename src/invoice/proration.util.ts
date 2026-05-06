export function proratedAmount(
  monthlyRent: number,
  startDate: Date,
  endDate: Date,
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalDaysInMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    0,
  ).getDate();

  const occupiedDays =
    Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const dailyRate = monthlyRent / totalDaysInMonth;

  return Math.round(dailyRate * occupiedDays);
}
