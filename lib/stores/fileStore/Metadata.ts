import { OwnedAuthorizationOptions } from '../../apis/getFile/http/v2/isAuthorized/AuthorizationOptions';

export interface Metadata {
  id: string;
  fileName: string;
  contentType: string;
  contentLength: number;
  isAuthorized: OwnedAuthorizationOptions;
}
