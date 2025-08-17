export function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 16);
}

export function getNextBookingDates(count = 8): string[] {
  const result: string[] = [];
  const allowedDays = [4, 5, 6, 0]; // Thu, Fri, Sat, Sun (0 is Sunday)
  let date = new Date();
  date.setHours(0, 0, 0, 0);
  while (result.length < count) {
    if (allowedDays.includes(date.getDay())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      result.push(`${day}.${month}`);
    }
    date.setDate(date.getDate() + 1);
  }
  return result;
}

export function getBookingTimes(dateStr?: string): string[] {
  const times: string[] = [];
  let hour = 19;
  let minute = 0;
  const now = new Date();
  let isToday = false;
  if (dateStr) {
    const [day, month] = dateStr.split('.').map(Number);
    const today = now.getDate() === day && now.getMonth() + 1 === month;
    isToday = today;
  }
  // Add times from 19:00 to 23:30
  while (hour < 24) {
    if (
      !isToday ||
      hour > now.getHours() ||
      (hour === now.getHours() && minute > now.getMinutes())
    ) {
      times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour++;
    }
  }
  // Add times from 00:00 to 02:00 (inclusive)
  hour = 0;
  minute = 0;
  while (hour < 3) {
    if (hour === 2 && minute > 0) break; // Only include up to 02:00
    times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour++;
    }
  }
  return times;
}

export function combineDateAndTimeToISO(dateStr: string, timeStr: string): string {
  // dateStr: 'DD.MM', timeStr: 'HH:mm'
  const [day, month] = dateStr.split('.').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const now = new Date();
  let year = now.getFullYear();
  let bookingDate = new Date(year, month - 1, day, hour, minute);
  if (bookingDate < now) {
    bookingDate = new Date(year + 1, month - 1, day, hour, minute);
  }
  return bookingDate.toISOString();
}
