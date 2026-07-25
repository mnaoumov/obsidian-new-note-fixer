export enum NewNoteLocationMode {
  AskForCurrentNoteFolderFirst = 'Ask for current note folder first',
  DefaultLocation = 'Default location',
  PromptForFolder = 'Prompt for folder'
}

export class PluginSettings {
  public newNoteLocationMode: NewNoteLocationMode = NewNoteLocationMode.DefaultLocation;
}
