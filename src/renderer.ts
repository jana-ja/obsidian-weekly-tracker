export function renderWeeklyHabitTracker(habitData: Record<string, boolean>, year: number): string {
  const sortedWeeks = Object.entries(habitData)
    .map(([week, done]) => {
      const weekNumber = week.match(/W(\d{2})$/)?.[1] ?? "??";
      return { week, weekNumber, done };
    })
    .sort((a, b) => Number(a.weekNumber) - Number(b.weekNumber));

  const cells = sortedWeeks.map((entry, idx) => {
    const next = sortedWeeks[idx + 1];
    const showLine = entry.done && next?.done;

    return `
      <div class="weekly-tracker-cell" data-week="${entry.week}">
        <span class="weekly-tracker-blob ${entry.done ? 'filled' : 'outlined'}" title="${entry.week}">
          <span class="week-label">${entry.weekNumber}</span>
        </span>
        ${showLine ? '<span class="tracker-line active"></span>' : '<span class="tracker-spacer"></span>'}
      </div>
    `;
  }).join('');

  return `<div class="weekly-tracker-container" data-year="${year}">${cells}</div>`;
}