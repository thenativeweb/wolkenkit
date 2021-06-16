import { LoggerService } from '../LoggerService';
import { PackageManifest } from '../../application/PackageManifest';
export declare type GetLoggerService = (parameters: {
    fileName: string;
    packageManifest: PackageManifest;
}) => LoggerService;
