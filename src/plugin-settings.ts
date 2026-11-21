export enum NewNoteLocationMode {
  AskForCurrentNoteFolderFirst = 'Ask for current note folder first',
  DefaultLocation = 'Default location',
  PromptForFolder = 'Prompt for folder'
}

const DEFAULT_RECENT_FOLDER_COUNT = 5;

export class PluginSettings {
  public newNoteLocationMode: NewNoteLocationMode = NewNoteLocationMode.DefaultLocation;
  public recentFolderCount = DEFAULT_RECENT_FOLDER_COUNT;
}
