declare function uuidv4(): string;

/* eslint-disable no-redeclare */
declare module uuidv4 {
  function empty(): string;

  const regex: {
    v4: {
      toString(): string;
    };
  };
}
/* eslint-enable no-redeclare */

export default uuidv4;
