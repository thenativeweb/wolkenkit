import { errors } from '../../errors';

type SourceType = 'api' | 'api-client' | 'runtime' | 'store' | 'common' | 'cli' | 'messaging';

interface LogMetadata {
  sourceType: SourceType;
  sourceName: string;
}

const withLogMetadata = function (
  sourceType: SourceType,
  sourceName: string,
  metadata: object = {}
): LogMetadata & Record<string, any> {
  if (sourceName.length === 0) {
    throw new errors.InvalidOperation('Source name needs to be at least 1 character long. But it really should be more.');
  }

  return {
    sourceType,
    sourceName,
    ...metadata
  };
};

export { withLogMetadata };
