import {
	getDateFromFile,
	getWeeklyNote,
	getWeeklyNoteSettings,
} from "obsidian-daily-notes-interface";
import {App, Editor, MarkdownView, Modal, Notice, Plugin, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, WeeklyTrackerSettings, WeeklyTrackerSettingTab} from "./settings";
import { settings, weeklyNotes } from "./ui/stores";
import WeeklyTrackerView, { VIEW_TYPE_WEEKLY_TRACKER } from "./view";
import { getWeeklyHabitData } from "./logic";
import { renderWeeklyHabitTracker } from "./renderer";
import { get } from "svelte/store";
import type { Unsubscriber } from "svelte/store";

export default class WeeklyTrackerPlugin extends Plugin {
	public options: WeeklyTrackerSettings;
	private weeklyNotesUnsub: Unsubscriber | null = null;
	
	async onload() {
		console.log('loading plugin')
		
		await this.loadSettings();
		
		this.registerView(VIEW_TYPE_WEEKLY_TRACKER, (leaf) => new WeeklyTrackerView(leaf));
		
		// Initialize the weekly notes store after layout is ready (ensures plugins are loaded)
		this.app.workspace.onLayoutReady(() => {
			weeklyNotes.reindex();
			
			// Register markdown code block processor for weekly-tracker after reindex
			this.registerMarkdownCodeBlockProcessor('weekly-tracker', (source, el, ctx) => {
				// Force synchronous reflow to settle layout before rendering
				void el.offsetWidth;
				const year = parseInt(source.trim() || '2026');
				const habitData = getWeeklyHabitData(year);
				const html = renderWeeklyHabitTracker(habitData, year);
				el.innerHTML = html;
				console.log("rendered width:", el.getBoundingClientRect().width);
			});
			
			this.weeklyNotesUnsub = weeklyNotes.subscribe(() => {
				refreshRenderedTrackers();
				// updateRenderedTrackers();
			});
		});
		
		// Function to update rendered weekly trackers
		// const updateRenderedTrackers = () => {
		// 	document.querySelectorAll('.weekly-tracker-container').forEach(el => {
		// 		// Force synchronous reflow to settle layout
		// 		void el.offsetWidth;
		// 		const year = parseInt(el.getAttribute('data-year') || '2026');
		// 		const habitData = getWeeklyHabitData(year);
		// 		const html = renderWeeklyHabitTracker(habitData, year);
		// 		el.innerHTML = html;
		// 	});
		// };
		
		function refreshRenderedTrackers() {
			const notes = get(weeklyNotes);
			document.querySelectorAll<HTMLElement>('.weekly-tracker-container').forEach(container => {
				const year = parseInt(container.dataset.year ?? '2026');
				const habitData = getWeeklyHabitData(year);
				
				container.querySelectorAll<HTMLElement>('.weekly-tracker-blob').forEach(blob => {
					const week = blob.dataset.week!;
					const shouldFill = Boolean(habitData[week]);
					blob.classList.toggle('filled', shouldFill);
					blob.classList.toggle('outlined', !shouldFill);
				});
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
		
		// This creates an icon in the left ribbon.
		this.addRibbonIcon('dice', 'Sample', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			let date = window.moment('2026-04-03');
			const note = getWeeklyNote(date, get(weeklyNotes));
			console.log(get(weeklyNotes));
			console.log(date);
			console.log('note for week of 2026-04-03' + (note? 'exists' : 'does not exist'));
			
			// new Notice('note for week of 2026-04-03' + (note? 'exists' : 'does not exist'));
			new Notice('note for week of 2026-04-03' + weeklyNotes);
			
		});
		
		
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');
		
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Open modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'replace-selected',
			name: 'Replace selected content',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection('Sample editor command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-modal-complex',
			name: 'Open modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}
					
					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
				return false;
			}
		});
		
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WeeklyTrackerSettingTab(this.app, this));
		
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
	
	async activateView() {
		const { workspace } = this.app;
		
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_WEEKLY_TRACKER);
		
		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_WEEKLY_TRACKER, active: true });
		}
		
		workspace.revealLeaf(leaf);
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<WeeklyTrackerSettings>);
	}
	
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}
	
	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}
	
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
