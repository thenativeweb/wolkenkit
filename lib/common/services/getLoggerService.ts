import { flaschenpost } from 'flaschenpost';
import { LoggerService } from './LoggerService';
import { PackageManifest } from '../application/PackageManifest';

const getLoggerService = function ({ fileName, packageManifest }: {
  fileName: string;
  packageManifest: PackageManifest;
}): LoggerService {
  const logger = flaschenpost.getLogger(fileName, packageManifest);

  return logger;
};

export { getLoggerService };
