import { LoggerService } from './LoggerService';
import { PackageManifest } from '../application/PackageManifest';
declare const getLoggerService: ({ fileName, packageManifest }: {
    fileName: string;
    packageManifest: PackageManifest;
}) => LoggerService;
export { getLoggerService };
