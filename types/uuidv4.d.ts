declare function uuidv4(): string;

/* eslint-disable no-redeclare */
declare module uuidv4 {
  function empty(): string;

  function is(value: string): boolean;

  function fromString(text: string): string;

  const regex: {
    v4: RegExp;
    v5: RegExp;
  };
}
/* eslint-enable no-redeclare */

export default uuidv4;
