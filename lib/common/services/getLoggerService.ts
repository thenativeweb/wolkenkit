import flaschenpost from 'flaschenpost';
import { LoggerService } from './LoggerService';

const getLoggerService = function ({ fileName }: {
  fileName: string;
}): LoggerService {
  const logger = flaschenpost.getLogger(fileName);

  return logger;
};

export default getLoggerService;
