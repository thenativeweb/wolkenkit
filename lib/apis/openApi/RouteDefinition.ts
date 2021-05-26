import { GraphqlIncompatibleSchema } from '../../common/elements/Schema';

export interface RouteDefinition {
  description: string;
  path: string;

  request: {
    headers?: GraphqlIncompatibleSchema;
    body?: GraphqlIncompatibleSchema;
    query?: GraphqlIncompatibleSchema;
  };

  response: {
    statusCodes: number[];
    stream?: boolean;
    headers?: GraphqlIncompatibleSchema;
    body?: GraphqlIncompatibleSchema;
  };
}
