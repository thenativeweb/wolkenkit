declare function isolated({ files, preserveTimestamps }?: {
  files: string | string[];
  preserveTimestamps?: boolean;
}): Promise<string>;

export default isolated;
