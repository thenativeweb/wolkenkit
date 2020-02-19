import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { RequestHandler } from 'express';
import typer from 'content-type';
import { validateSnapshot } from '../../../../common/validators/validateSnapshot';

const storeSnapshot = function ({
  domainEventStore
}: {
  domainEventStore: DomainEventStore;
}): RequestHandler {
  return async function (req, res): Promise<any> {
    let contentType: typer.ParsedMediaType;

    try {
      contentType = typer.parse(req);
    } catch {
      const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

      return res.status(415).json({
        code: ex.code,
        message: ex.message
      });
    }

    if (contentType.type !== 'application/json') {
      const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

      return res.status(415).json({
        code: ex.code,
        message: ex.message
      });
    }

    const snapshot = req.body;

    try {
      validateSnapshot({ snapshot });
    } catch (ex) {
      return res.status(400).json({
        code: ex.code ?? 'EUNKNOWNERROR',
        message: ex.message
      });
    }

    try {
      await domainEventStore.storeSnapshot({ snapshot });
    } catch (ex) {
      return res.status(400).json({
        code: ex.code ?? 'EUNKNOWNERROR',
        message: ex.message
      });
    }

    res.status(200).end();
  };
};

export { storeSnapshot };
