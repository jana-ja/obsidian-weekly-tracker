import type { TFile } from "obsidian";
import {
    getAllWeeklyNotes,
    getWeeklyNoteSettings,
} from "obsidian-daily-notes-interface";
import { writable } from "svelte/store";

import { DEFAULT_SETTINGS, WeeklyTrackerSettings } from "../settings";

// import { getDateUIDFromFile } from "./utils";

function createWeeklyNotesStore() {
    let hasError = false;
    const store = writable<Record<string, TFile>>(null);
    return {
        reindex: () => {
            // const periodicNotes = (<any>window.app).plugins.getPlugin("periodic-notes");
            // console.log("[WeeklyTracker] Periodic Notes plugin:", periodicNotes);
            // if (periodicNotes) {
            //     console.log("[WeeklyTracker] Weekly enabled:", periodicNotes.settings?.weekly?.enabled);
            //     console.log("[WeeklyTracker] Weekly settings:", periodicNotes.settings?.weekly);
            // }
            try {
                console.log("[WeeklyTracker] Reindexing weekly notes...");
                const settings = getWeeklyNoteSettings();
                console.log("[WeeklyTracker] Weekly note settings:", settings);
                const weeklyNotes = getAllWeeklyNotes();
                console.log("[WeeklyTracker] Found weekly notes:", Object.keys(weeklyNotes).length, "notes");
                store.set(weeklyNotes);
                hasError = false;
            } catch (err) {
                if (!hasError) {
                    // Avoid error being shown multiple times
                    console.log("[WeeklyTracker] Failed to find weekly notes folder", err);
                }
                store.set({});
                hasError = true;
            }
        },
        ...store,
    };
}

export const settings = writable<WeeklyTrackerSettings>(DEFAULT_SETTINGS);
export const weeklyNotes = createWeeklyNotesStore();

// function createSelectedFileStore() {
//   const store = writable<string>(null);

//   return {
//     setFile: (file: TFile) => {
//       const id = getDateUIDFromFile(file);
//       store.set(id);
//     },
//     ...store,
//   };
// }

// export const activeFile = createSelectedFileStore();