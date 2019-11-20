import { CorsOrigin } from 'get-cors-origin';

export interface GetApiBaseParameters {
  request: {
    headers: {
      cors: {
        origin: CorsOrigin;
      } | false;
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
