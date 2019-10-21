import { OwnedAuthorizationOptions } from '../../apis/file/Http/V2/isAuthorized/AuthorizationOptions';

export interface Metadata {
  id: string;
  fileName: string;
  contentType: string;
  contentLength: number;
  isAuthorized: OwnedAuthorizationOptions;
}
