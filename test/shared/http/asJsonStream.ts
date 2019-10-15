import { Writable } from 'stream';

const asJsonStream = function (...handleJson: ((...args: any[]) => void)[]): Writable {
  let counter = 0;

  return new Writable({
    write (chunk: object, _, callback: (error?: any) => void): void {
      const data = JSON.parse(chunk.toString());

      if (counter > handleJson.length) {
        return callback(new Error(`Received ${counter + 1} items (${JSON.stringify(data)}), but only expected ${handleJson.length}.`));
      }

      handleJson[counter](data);

      counter += 1;
      callback();
    }
  });
};

export default asJsonStream;
