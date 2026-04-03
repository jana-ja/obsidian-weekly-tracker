import {
	getWeeklyNoteSettings,
} from "obsidian-daily-notes-interface";
import { Notice, Plugin} from 'obsidian';
// import {DEFAULT_SETTINGS, WeeklyTrackerSettings, WeeklyTrackerSettingTab} from "./settings";
import { settings, weeklyNotes } from "./ui/stores";
import { getWeeklyHabitData } from "./logic";
import { renderWeeklyHabitTracker } from "./renderer";
import type { Unsubscriber } from "svelte/store";

function parseTrackerParams(source: string): { year: number; color: string } {
	const params: Record<string, string> = {};
	const lines = source.trim().split('\n');
	for (const line of lines) {
		const [key, ...valueParts] = line.split(':');
		if (key && valueParts.length > 0) {
			params[key.trim()] = valueParts.join(':').trim();
		}
	}
	const year = parseInt(params.year || '2026');
	const color = params.color || '#4CAF50';
	return { year, color };
}

export default class WeeklyTrackerPlugin extends Plugin {
	// public options: WeeklyTrackerSettings;
	private weeklyNotesUnsub: Unsubscriber | null = null;
	
	async onload() {
		console.log('loading plugin')
		
		// await this.loadSettings();
		
		// Initialize the weekly notes store after layout is ready (ensures plugins are loaded)
		this.app.workspace.onLayoutReady(() => {
			weeklyNotes.reindex();
			
			// Register markdown code block processor for weekly-tracker after reindex
			this.registerMarkdownCodeBlockProcessor('weekly-tracker', (source, el, ctx) => {
				// Force synchronous reflow to settle layout before rendering
				void el.offsetWidth;
				const { year, color } = parseTrackerParams(source);
				const habitData = getWeeklyHabitData(year);
				const html = renderWeeklyHabitTracker(habitData, year, color);
				el.innerHTML = html;
				console.log("rendered width:", el.getBoundingClientRect().width);
			});
			
			this.weeklyNotesUnsub = weeklyNotes.subscribe(() => {
				refreshRenderedTrackers();
				// updateRenderedTrackers();
			});
		});
		
		function refreshRenderedTrackers() {
			document.querySelectorAll<HTMLElement>('.weekly-tracker-container').forEach(container => {
				const year = parseInt(container.dataset.year ?? '2026');
				const color = container.dataset.color ?? '#4CAF50';
				const habitData = getWeeklyHabitData(year);
				
				container.querySelectorAll<HTMLElement>('.weekly-tracker-blob').forEach(blob => {
					const week = blob.dataset.week!;
					const shouldFill = Boolean(habitData[week]);
					blob.classList.toggle('filled', shouldFill);
					blob.classList.toggle('outlined', !shouldFill);
					// blob.style.backgroundColor = shouldFill ? color : 'transparent';
					// blob.style.borderColor = color;
				});
				
				// container.querySelectorAll<HTMLElement>('.tracker-line').forEach(line => {
				// 	line.style.backgroundColor = color;
				// });
			});
		}
		
		// Reindex when weekly notes are created, deleted, or renamed
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file.path.includes(getWeeklyNoteSettings()?.folder || '')) {
					weeklyNotes.reindex();
				}
			})
		);
		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				console.log(getWeeklyNoteSettings()?.folder)
				if (file.path.includes(getWeeklyNoteSettings()?.folder || '')) {
					weeklyNotes.reindex();
				}
			})
		);
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				if (oldPath.includes(getWeeklyNoteSettings()?.folder || '') || file.path.includes(getWeeklyNoteSettings()?.folder || '')) {
					weeklyNotes.reindex();
				}
			})
		);
		
		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new WeeklyTrackerSettingTab(this.app, this));
		
		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			new Notice("Click");
		});
		
		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		
	}
	
	onunload() {
		this.weeklyNotesUnsub?.();
	}
	
	// async loadSettings() {
	// 	this.options = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<WeeklyTrackerSettings>);
	// }
	
	// async saveSettings() {
	// 	await this.saveData(this.options);
	// }
}
