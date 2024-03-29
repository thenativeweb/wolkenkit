import { ErrorService } from './ErrorService';
import * as allErrors from '../errors';

const getErrorService = function <TKey extends keyof typeof allErrors> ({ errors }: {
  errors: TKey[];
}): ErrorService<TKey> {
  const errorService: Partial<ErrorService<TKey>> = {};

  for (const error of errors) {
    errorService[error] = allErrors[error];
  }

  return errorService as ErrorService<TKey>;
};

export { getErrorService };
