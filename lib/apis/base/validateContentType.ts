import { errors } from '../../common/errors';
import { Request } from 'express';
import typer from 'content-type';

const validateContentType = function ({ expectedContentType, req }: {
  expectedContentType: string;
  req: Request;
}): void {
  let contentType;

  try {
    contentType = typer.parse(req);
  } catch (ex: unknown) {
    throw new errors.ContentTypeMismatch('Header content-type must be application/json.', { cause: ex });
  }

  if (contentType.type !== expectedContentType) {
    throw new errors.ContentTypeMismatch('Header content-type must be application/json.');
  }
};

export {
  validateContentType
};
