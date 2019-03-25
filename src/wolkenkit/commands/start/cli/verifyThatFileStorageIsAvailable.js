'use strict';

const Minio = require('minio');

const errors = require('../../../../errors');

const verifyThatFileStorageIsAvailable = async function ({ configuration }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { fileStorage } =
    configuration.packageJson.environments[configuration.environment];

  if (!fileStorage) {
    return;
  }
  if (!fileStorage.provider) {
    return;
  }

  switch (fileStorage.provider.type) {
    case 'fileSystem': {
      return;
    }
    case 's3': {
      const { endpoint, region, bucketName, accessKey, secret } =
        fileStorage.provider.options;

      const client = new Minio.Client({
        endPoint: endpoint,
        region,
        accessKey,
        secretKey: secret
      });

      let existsBucket;

      try {
        existsBucket = await client.bucketExists(bucketName);
      } catch (ex) {
        if (ex.code === 'AccessDenied') {
          progress({ message: 'File storage not accessible.', type: 'info' });
          throw new errors.FileStorageNotAccessible();
        }

        throw ex;
      }

      if (!existsBucket) {
        progress({ message: 'File storage bucket not found.', type: 'info' });
        throw new errors.FileStorageBucketNotFound();
      }

      break;
    }
    default: {
      throw new Error('Invalid operation.');
    }
  }
};

module.exports = verifyThatFileStorageIsAvailable;
