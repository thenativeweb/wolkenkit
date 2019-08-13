declare module buntstift {
  function forceColor(): void;

  function noColor(): void;

  function forceUtf(): void;

  function noUtf(): void;

  function error(message: string, args?: {
    prefix?: string;
  }): typeof buntstift;

  function warn(message: string, args?: {
    prefix?: string;
  }): typeof buntstift;

  function success(message: string, args?: {
    prefix?: string;
  }): typeof buntstift;

  function info(message: string, args?: {
    prefix?: string;
  }): typeof buntstift;

  function verbose(message: string, args?: {
    prefix?: string;
  }): typeof buntstift;

  function line(): typeof buntstift;

  function header(message: string, args?: {
    prefix?: string;

    indent?: number;
  }): typeof buntstift;

  function newline(): typeof buntstift;

  function table(arg: any[][]): typeof buntstift;

  function passThrough(message: string, args?: {
    prefix?: string;

    target?: string;
  }): typeof buntstift;

  function wait(): () => void;

  function ask(question: string, options: string | RegExp | {
    default: string;

    mask: RegExp;
  }): { answer: string };

  function confirm(message: string, value?: boolean): { isConfirmed: boolean };

  function select(question: string, choices: string[] | (() => string[])): { choice: string };

  function exit(code: number): void;
}

export default buntstift;
