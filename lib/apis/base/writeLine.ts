import { Response } from 'express';

const writeLine = function ({ res, data }: {
  res: Response;
  data: object;
}): void {
  try {
    res.write(`${JSON.stringify(data)}\n`);
  } catch (ex) {
    if (ex.code === 'ERR_STREAM_WRITE_AFTER_END') {
      // Ignore write after end errors. This simply means that the connection
      // was closed concurrently, and we can't do anything about it anyway.
      return;
    }

    throw ex;
  }
};

export { writeLine };
