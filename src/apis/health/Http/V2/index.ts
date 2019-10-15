import express from 'express';
import { Express } from 'express-serve-static-core';
import getHealth from './getHealth';

class V2 {
  public api: Express;

  public constructor ({ processId }: {
    processId: string;
  }) {
    this.api = express();

    this.api.get('/', getHealth({ processId }));
  }
}

export default V2;
