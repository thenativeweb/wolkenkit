import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import path from 'path';
import streamToString from 'stream-to-string';
import { uuid } from 'uuidv4';
import { createReadStream, ReadStream } from 'fs';

/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createFileStore }: {
  createFileStore (): Promise<FileStore>;
}): void {
  const contentType = 'application/json',
        name = 'someFile.json';

  let content: string,
      contentLength: number,
      fileStore: FileStore,
      id: string,
      stream: ReadStream;

  setup(async (): Promise<void> => {
    id = uuid();

    const filePath = path.join(__dirname, '..', '..', '..', 'shared', 'files', 'someFile.json');

    content = await streamToString(createReadStream(filePath));
    contentLength = content.length;
    stream = createReadStream(filePath);
  });

  suite('addFile', (): void => {
    setup(async (): Promise<void> => {
      fileStore = await createFileStore();
    });

    test('does not throw an error.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await fileStore.addFile({ id, name, contentType, stream });
      }).is.not.throwingAsync();
    });

    test('returns the metadata.', async (): Promise<void> => {
      const metadata = await fileStore.addFile({ id, name, contentType, stream });

      assert.that(metadata).is.equalTo({ id, name, contentType, contentLength });
    });

    test('throws an error if the id is already being used.', async (): Promise<void> => {
      await fileStore.addFile({ id, name, contentType, stream });

      await assert.that(async (): Promise<void> => {
        await fileStore.addFile({ id, name, contentType, stream });
      }).is.throwingAsync((ex: Error): boolean => (ex as CustomError).code === errors.FileAlreadyExists.code);
    });
  });

  suite('getMetadata', (): void => {
    setup(async (): Promise<void> => {
      fileStore = await createFileStore();
    });

    test('throws an error if the id does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await fileStore.getMetadata({ id });
      }).is.throwingAsync((ex: Error): boolean => (ex as CustomError).code === errors.FileNotFound.code);
    });

    test('returns the metadata.', async (): Promise<void> => {
      await fileStore.addFile({ id, name, contentType, stream });

      const metadata = await fileStore.getMetadata({ id });

      assert.that(metadata).is.equalTo({ id, name, contentType, contentLength });
    });
  });

  suite('getFile', (): void => {
    setup(async (): Promise<void> => {
      fileStore = await createFileStore();
    });

    test('throws an error if the id does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await fileStore.getFile({ id });
      }).is.throwingAsync((ex: Error): boolean => (ex as CustomError).code === errors.FileNotFound.code);
    });

    test('returns the file stream.', async (): Promise<void> => {
      await fileStore.addFile({ id, name, contentType, stream });

      const fileStream = await fileStore.getFile({ id });
      const fileData = await streamToString(fileStream);

      assert.that(fileData).is.equalTo(content);
    });
  });

  suite('removeFile', (): void => {
    setup(async (): Promise<void> => {
      fileStore = await createFileStore();
    });

    test('throws an error if the id does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await fileStore.removeFile({ id });
      }).is.throwingAsync((ex: Error): boolean => (ex as CustomError).code === errors.FileNotFound.code);
    });

    test('does not throw an error.', async (): Promise<void> => {
      await fileStore.addFile({ id, name, contentType, stream });

      await assert.that(async (): Promise<void> => {
        await fileStore.removeFile({ id });
      }).is.not.throwingAsync();
    });
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
