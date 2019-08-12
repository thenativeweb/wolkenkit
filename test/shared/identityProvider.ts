import fs from 'fs';
import Limes from 'limes';
import path from 'path';

/* eslint-disable no-sync */
const identityProvider = new Limes.IdentityProvider({
  issuer: 'https://auth.thenativeweb.io',
  privateKey: fs.readFileSync(path.join(__dirname, 'keys', 'localhost', 'privateKey.pem')),
  certificate: fs.readFileSync(path.join(__dirname, 'keys', 'localhost', 'certificate.pem'))
});
/* eslint-enable no-sync */

export default identityProvider;
