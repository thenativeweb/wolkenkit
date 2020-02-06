import { CustomError } from 'defekt';

export interface ErrorService {
  CommandRejected: new(
    message?: string,
    metadata?: {
      cause?: Error;
      data?: any;
    }
  ) => CustomError;
}
