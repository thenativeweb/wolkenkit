export interface ViewInitializer<TDatabaseView> {
  storeType: string;

  initialize (databaseView: TDatabaseView): void | Promise<void>;
}
