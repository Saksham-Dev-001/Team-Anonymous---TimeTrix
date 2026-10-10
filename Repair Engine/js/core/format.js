// File: /js/core/format.js
// Date, IST Time and Formatting Utilities

export function formatDateIST(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatTimeIST(timeInput) {
  if (!timeInput) return '';
  return timeInput.substring(0, 5); // Returns HH:MM
}

export function getTodayIST() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  return formatter.format(now); // Returns YYYY-MM-DD
}

export function getWeekdayName(weekdayNum) {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[weekdayNum] || '';
}

