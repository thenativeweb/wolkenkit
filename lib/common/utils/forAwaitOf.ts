import { Readable } from 'stream';

type Iterator = (chunk: any) => Promise<void>;

const forAwaitOf = async function (stream: Readable, fn: Iterator): Promise<void> {
  return new Promise((resolve, reject): void => {
    let unsubscribe: () => void;
    const onData = async function (chunk: any): Promise<void> {
      stream.pause();
      try {
        await fn(chunk);
      } catch (ex) {
        unsubscribe();
        reject(ex);
      }
      stream.resume();
    };
    const onEnd = function (): void {
      unsubscribe();
      resolve();
    };
    const onError = function (err: Error): void {
      unsubscribe();
      reject(err);
    };

    unsubscribe = function (): void {
      stream.off('data', onData);
      stream.off('end', onEnd);
      stream.off('error', onError);
    };
    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);
  });
};

export { forAwaitOf };
