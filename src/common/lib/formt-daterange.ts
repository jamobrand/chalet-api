import { add, endOfYear, format } from 'date-fns';

interface AvailabilityRange {
  startDate: Date;
  endDate: Date;
  displayText: string;
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  const startMonth = format(startDate, 'MMM');
  const endMonth = format(endDate, 'MMM');
  const startDay = format(startDate, 'dd');
  const endDay = format(endDate, 'dd');

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

export function findNextAvailableRange(
  startDate: Date,
  unavailableDates: Date[],
  bookedDates: Date[],
  minimumDays: number = 3, // Minimum consecutive available days required
): AvailabilityRange | null {
  let currentDate = startDate;
  const endDate = endOfYear(new Date()); // Look up to end of current year
  let consecutiveAvailableDays = 0;
  let rangeStartDate: Date | null = null;

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const isUnavailable = unavailableDates.some((date) => format(date, 'yyyy-MM-dd') === dateStr);
    const isBooked = bookedDates.some((date) => format(date, 'yyyy-MM-dd') === dateStr);

    if (!isUnavailable && !isBooked) {
      if (rangeStartDate === null) {
        rangeStartDate = currentDate;
      }
      consecutiveAvailableDays++;

      if (consecutiveAvailableDays >= minimumDays) {
        return {
          startDate: rangeStartDate,
          endDate: add(rangeStartDate, { days: consecutiveAvailableDays - 1 }),
          displayText: formatDateRange(
            rangeStartDate,
            add(rangeStartDate, { days: consecutiveAvailableDays - 1 }),
          ),
        };
      }
    } else {
      rangeStartDate = null;
      consecutiveAvailableDays = 0;
    }

    currentDate = add(currentDate, { days: 1 });
  }

  return null;
}
