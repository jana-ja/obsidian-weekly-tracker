export function renderWeeklyHabitTracker(habitData: Record<string, boolean>, year: number): string {
  const blobs = Object.entries(habitData).map(([week, done]) => {
    return `<span class="weekly-tracker-blob ${done ? 'filled' : 'outlined'}" data-week="${week}" title="${week}"></span>`;
  }).join('');

  return `<div class="weekly-tracker-container" data-year="${year}">${blobs}</div>`;
}