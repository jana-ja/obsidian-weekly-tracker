import { getWeeklyNote } from "obsidian-daily-notes-interface";
import { weeklyNotes } from "./ui/stores";
import { get } from "svelte/store";

export function getWeeklyHabitData(year: number): Record<string, boolean> {
  const habitData: Record<string, boolean> = {};
  const moment = window.moment;

  // ISO weeks: year has 52 or 53 weeks
  const startOfYear = moment(`${year}-01-01`);
  const endOfYear = moment(`${year}-12-31`);
  let currentWeek = startOfYear.clone().startOf('isoWeek');

  while (currentWeek.isSameOrBefore(endOfYear, 'isoWeek')) {
    const weekKey = currentWeek.format('gggg-[W]ww'); // e.g., 2026-W01
    const note = getWeeklyNote(currentWeek, get(weeklyNotes));
    habitData[weekKey] = !!note; // true if note exists
    currentWeek.add(1, 'week');
  }

  return habitData;
}