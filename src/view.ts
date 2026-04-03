import {
    getDateFromFile,
    getWeeklyNote,
    getWeeklyNoteSettings,
} from "obsidian-daily-notes-interface";
import { weeklyNotes, settings } from "./ui/stores";
import { WeeklyTrackerSettings } from "settings";
import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_WEEKLY_TRACKER = 'weekly-tracker-view';

export default class WeeklyTrackerView extends ItemView{
    // private settings: WeeklyTrackerSettings;
    
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        // settings.subscribe((newSettings) => {
        //     this.settings = newSettings;
        // });
    }

    getViewType() {
        return VIEW_TYPE_WEEKLY_TRACKER;
    }

    getDisplayText() {
        return "Weekly Tracker";
    }

    async onOpen(){
        const container = this.contentEl;
        container.empty();
        container.createEl("h1", { text: "Weekly Tracker" });
    }

    async onClose() {
        // Nothing to clean up.
    }
    // const note = getWeeklyNote(date, get(weeklyNotes));


}