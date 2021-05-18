import { Request } from 'express';
import typer from 'content-type';
import * as errors from '../../common/errors';

const validateContentType = function ({ expectedContentType, req }: {
  expectedContentType: string;
  req: Request;
}): void {
  let contentType;

  try {
    contentType = typer.parse(req);
  } catch (ex: unknown) {
    throw new errors.ContentTypeMismatch({ message: `Header content-type must be ${expectedContentType}.`, cause: ex });
  }

  if (contentType.type !== expectedContentType) {
    throw new errors.ContentTypeMismatch(`Header content-type must be ${expectedContentType}.`);
  }
};

export {
  validateContentType
};
