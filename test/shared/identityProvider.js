'use strict';

const fs = require('fs'),
      path = require('path');

const Limes = require('limes');

/* eslint-disable no-sync */
const identityProvider = new Limes.IdentityProvider({
  issuer: 'https://auth.thenativeweb.io',
  privateKey: fs.readFileSync(path.join(__dirname, 'keys', 'localhost', 'privateKey.pem')),
  certificate: fs.readFileSync(path.join(__dirname, 'keys', 'localhost', 'certificate.pem'))
});
/* eslint-enable no-sync */

module.exports = identityProvider;
