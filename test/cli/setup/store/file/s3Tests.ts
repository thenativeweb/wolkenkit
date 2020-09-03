import { assert } from 'assertthat';
import { Client } from 'minio';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import path from 'path';
import shell from 'shelljs';
import { v4 } from 'uuid';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store file s3', function (): void {
  this.timeout(30_000);

  test(`sets up a s3 for the file store.`, async (): Promise<void> => {
    const {
      hostName,
      port,
      accessKey,
      secretKey,
      encryptConnection
    } = connectionOptions.minio;

    const bucketName = v4();

    const setupS3FileStoreCommand = `node ${cliPath} --verbose setup store file s3 --host-name ${hostName} --port ${port} ${encryptConnection ? '--encryptConnection' : ''} --access-key ${accessKey} --secret-key ${secretKey} --bucket-name ${bucketName}`;
    const { stdout } = shell.exec(setupS3FileStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the S3 file store.');

    const client = new Client({
      endPoint: hostName,
      port,
      useSSL: encryptConnection,
      accessKey,
      secretKey
    });

    assert.that(await client.bucketExists(bucketName)).is.true();
  });
});
