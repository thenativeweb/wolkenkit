export type Dictionary<K extends string, T> = {
  [key in K]?: T;
}
