import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// in time, took 5 minutes
export function compareTime(a_time: string, b_time: string) {
  const a = dayjs(a_time);
  const b = dayjs(b_time);

  const difference = b.diff(a);

  if (dayjs.duration(difference).asHours() > 24) {
    return dayjs.duration(difference).format("D[d] H[h] m[m] s[s]");
  } else if (dayjs.duration(difference).asHours() > 1) {
    return dayjs.duration(difference).format("H[h] m[m] s[s]");
  } else if (dayjs.duration(difference).asMinutes() > 1) {
    return dayjs.duration(difference).format("m[m] s[s]");
  } else {
    return dayjs.duration(difference).format("s[s]");
  }
}

export function relative_time(date: Date) {
  return dayjs(date).fromNow();
}
