import { Writable } from 'stream';

const asJsonStream = function <TItem> (handleJson: ((item: TItem) => void)[], objectMode = false): Writable {
  let counter = 0;

  return new Writable({
    objectMode,

    write (chunk: object | Buffer, encoding, callback: (error?: any) => void): void {
      const data = objectMode ? chunk : JSON.parse((chunk as Buffer).toString());

      // Ignore any messages after all handlers have been applied.
      if (counter >= handleJson.length) {
        return;
      }

      handleJson[counter](data);

      counter += 1;
      callback();
    }
  });
};

export { asJsonStream };
