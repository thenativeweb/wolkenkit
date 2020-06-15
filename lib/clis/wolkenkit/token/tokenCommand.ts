import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { errors } from '../../../common/errors';
import fs from 'fs';
import { getJwtSchema } from './getJwtSchema';
import { TokenOptions } from './TokenOptions';
import { validateExpiration } from './validateExpiration';
import { Value } from 'validate-value';
import { IdentityProvider, Limes } from 'limes';

const tokenCommand = function (): Command<TokenOptions> {
  return {
    name: 'token',
    description: 'Issue a token.',

    optionDefinitions: [
      {
        name: 'issuer',
        alias: 'i',
        description: 'set the issuer',
        type: 'string',
        parameterName: 'url',
        isRequired: true
      },
      {
        name: 'private-key',
        alias: 'k',
        description: 'set the private key file',
        type: 'string',
        parameterName: 'path',
        isRequired: true
      },
      {
        name: 'claims',
        alias: 'c',
        description: 'set the claims file',
        type: 'string',
        parameterName: 'path',
        isRequired: true
      },
      {
        name: 'expiration',
        alias: 'e',
        description: 'set the expiration time',
        type: 'number',
        parameterName: 'minutes',
        isRequired: false,
        defaultValue: 60 * 24 * 365,
        validate: validateExpiration
      }
    ],

    async handle ({ options: {
      verbose,
      issuer,
      'private-key': privateKeyPath,
      claims: claimsPath,
      expiration: expiresInMinutes
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        let claims,
            privateKey;

        try {
          privateKey = await fs.promises.readFile(privateKeyPath);
        } catch (ex) {
          buntstift.info('Private key not found.');
          throw new errors.FileNotFound();
        }

        try {
          claims = await fs.promises.readFile(claimsPath, { encoding: 'utf8' });
        } catch (ex) {
          buntstift.info('Claims file not found.');
          throw new errors.FileNotFound();
        }

        try {
          claims = JSON.parse(claims);
        } catch (ex) {
          buntstift.info('Claims malformed.');
          throw new errors.ClaimsMalformed();
        }

        const value = new Value(getJwtSchema());

        try {
          value.validate(claims);
        } catch (ex) {
          buntstift.info('Claims malformed.');
          throw ex;
        }

        const subject = claims.sub;
        const payload = { ...claims, sub: undefined };

        buntstift.info('Issuing a token...');

        const limes = new Limes({
          identityProviders: [ new IdentityProvider({ issuer, privateKey, expiresInMinutes }) ]
        });

        const token = limes.issueToken({ issuer, subject, payload });

        buntstift.newLine();
        buntstift.line();
        buntstift.info(token);
        buntstift.line();
        buntstift.newLine();
        buntstift.success('Issued a token.');
      } catch (ex) {
        buntstift.error('Failed to issue a token.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { tokenCommand };
