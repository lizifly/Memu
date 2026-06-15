/**
 * 获取本周一的日期
 */
export function getMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取ISO周标识 如 "2024-W41"
 */
export function getWeekId(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 获取下周一
 */
export function getNextMonday(date: Date = new Date()): Date {
  const monday = getMonday(date);
  monday.setDate(monday.getDate() + 7);
  return monday;
}

/**
 * 获取周五日期(基于周一)
 */
export function getFriday(monday: Date): Date {
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  return friday;
}
