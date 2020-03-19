import { Writable } from 'stream';

const asJsonStream = function <TItem> (handleJson: ((item: TItem) => void)[], objectMode = false): Writable {
  let counter = 0;

  return new Writable({
    objectMode,

    write (chunk: object, _, callback: (error?: any) => void): void {
      let data;

      if (objectMode) {
        data = chunk;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        data = JSON.parse(chunk.toString());
      }

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
