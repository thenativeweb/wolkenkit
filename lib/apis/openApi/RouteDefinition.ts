import { Schema } from '../../common/elements/Schema';

export interface RouteDefinition {
  description: string;
  path: string;

  request: {
    body?: Schema;
    query?: Schema;
  };
  response: {
    statusCodes: number[];
    stream?: boolean;
    body?: Schema;
  };
}
