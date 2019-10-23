export interface ViewStore<TDatabaseView> {
  type: string;

  setup (databaseView: TDatabaseView): void | Promise<void>;
}
