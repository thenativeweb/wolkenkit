import { CorsOrigin } from './CorsOrigin';

export interface GetApiBaseParameters {
  request: {
    headers: {
      cors: {
        origin: CorsOrigin;
      };
    };
    body: {
      parser: {
        sizeLimit: number;
      } | false;
    };
  };
  response: {
    headers: {
      cache: boolean;
    };
  };
}
