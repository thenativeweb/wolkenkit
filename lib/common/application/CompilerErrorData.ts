class CompilerErrorData {
  public fileName?: string;

  public line?: number;

  public column?: number;

  public message: string;

  public constructor ({ fileName, line, column, message }: {
    fileName?: string;
    line?: number;
    column?: number;
    message: string;
  }) {
    this.fileName = fileName;
    this.line = line;
    this.column = column;
    this.message = message;
  }
}

export { CompilerErrorData };
