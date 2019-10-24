import express from 'express';
import { Express } from 'express-serve-static-core';
import { getHealth } from './getHealth';

class V2 {
  public api: Express;

  public constructor () {
    this.api = express();

    this.api.get('/', getHealth());
  }
}

export { V2 };
