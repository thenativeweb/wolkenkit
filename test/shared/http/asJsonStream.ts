import { Writable } from 'stream';

const asJsonStream = function <TItem> (...handleJson: ((item: TItem) => void)[]): Writable {
  let counter = 0;

  return new Writable({
    write (chunk: object, _, callback: (error?: any) => void): void {
      const data = JSON.parse(chunk.toString());

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
