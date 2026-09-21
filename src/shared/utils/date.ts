import dayjs from "dayjs";

export function formatDateTime(d: Date | string | number): string {
  return dayjs(d).format("YYYY-MM-DD HH:mm:ss");
}

export function startOfDay(d: Date = new Date()): Date {
  return dayjs(d).startOf("day").toDate();
}

export function addDays(d: Date, n: number): Date {
  return dayjs(d).add(n, "day").toDate();
}

export function daysBetween(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / 86400000;
}
