declare type SourceType = 'api' | 'api-client' | 'runtime' | 'store' | 'common' | 'cli' | 'messaging';
interface LogMetadata {
    sourceType: SourceType;
    sourceName: string;
}
declare const withLogMetadata: (sourceType: SourceType, sourceName: string, metadata?: object) => LogMetadata & Record<string, any>;
export { withLogMetadata };
