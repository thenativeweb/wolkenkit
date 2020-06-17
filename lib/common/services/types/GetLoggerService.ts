import { LoggerService } from '../LoggerService';
import { PackageManifest } from '../../application/PackageManifest';

export type GetLoggerService = (parameters: {
  fileName: string;
  packageManifest: PackageManifest;
}) => LoggerService;
