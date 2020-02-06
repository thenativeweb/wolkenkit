import { errors } from '../errors';
import { ErrorService } from './ErrorService';

const getErrorService = function (): ErrorService {
  return {
    CommandRejected: errors.CommandRejected
  };
};

export {
  getErrorService
};
