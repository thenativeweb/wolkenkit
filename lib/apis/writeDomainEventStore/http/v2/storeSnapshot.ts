import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express-serve-static-core';
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
      return res.status(415).send('Header content-type must be application/json.');
    }

    if (contentType.type !== 'application/json') {
      return res.status(415).send('Header content-type must be application/json.');
    }

    const snapshot = req.body;

    try {
      validateSnapshot({ snapshot });
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    await domainEventStore.storeSnapshot({ snapshot });

    res.status(200).end();
  };
};

export { storeSnapshot };
