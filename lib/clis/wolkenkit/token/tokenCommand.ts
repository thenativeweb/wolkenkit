import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import fs from 'fs';
import { getAbsolutePath } from '../../../common/utils/path/getAbsolutePath';
import { getJwtSchema } from './getJwtSchema';
import { Parser } from 'validate-value';
import { TokenOptions } from './TokenOptions';
import { validateExpiration } from './validateExpiration';
import { IdentityProvider, Limes } from 'limes';
import * as errors from '../../../common/errors';

const jwtParser = new Parser(getJwtSchema());

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
      },
      {
        name: 'raw',
        alias: 'r',
        description: 'only output the token',
        type: 'boolean',
        isRequired: false,
        defaultValue: false
      }
    ],

    async handle ({ options: {
      verbose,
      issuer,
      'private-key': privateKeyPath,
      claims: claimsPath,
      expiration: expiresInMinutes,
      raw
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );

      let stopWaiting;

      if (!raw) {
        stopWaiting = buntstift.wait();
      }

      try {
        let claims,
            privateKey;

        const privateKeyAbsolutePath = getAbsolutePath({
          path: privateKeyPath,
          cwd: process.cwd()
        });

        try {
          privateKey = await fs.promises.readFile(privateKeyAbsolutePath);
        } catch {
          buntstift.info(`Private key file '${privateKeyAbsolutePath}' not found.`);
          throw new errors.FileNotFound();
        }

        const claimsAbsolutePath = getAbsolutePath({
          path: claimsPath,
          cwd: process.cwd()
        });

        try {
          claims = await fs.promises.readFile(claimsAbsolutePath, { encoding: 'utf8' });
        } catch {
          buntstift.info(`Claims file '${claimsAbsolutePath}' not found.`);
          throw new errors.FileNotFound();
        }

        try {
          claims = JSON.parse(claims);
        } catch {
          buntstift.info('Claims malformed.');
          throw new errors.ClaimsMalformed();
        }

        jwtParser.parse(
          claims,
          { valueName: 'jwt' }
        ).unwrapOrThrow(
          (err): Error => {
            buntstift.info('Claims malformed.');

            return err;
          }
        );

        const subject = claims.sub;
        const payload = { ...claims, sub: undefined };

        if (!raw) {
          buntstift.info('Issuing a token...');
        }

        const limes = new Limes({
          identityProviders: [ new IdentityProvider({ issuer, privateKey, expiresInMinutes }) ]
        });

        const token = limes.issueToken({ issuer, subject, payload });

        if (!raw) {
          buntstift.newLine();
          buntstift.line();
          buntstift.info(token);
          buntstift.line();
          buntstift.newLine();
          buntstift.success('Issued a token.');
        } else {
          // eslint-disable-next-line no-console
          console.log(token);
        }
      } catch (ex: unknown) {
        buntstift.error('Failed to issue a token.');

        throw ex;
      } finally {
        if (stopWaiting) {
          stopWaiting();
        }
      }
    }
  };
};

export { tokenCommand };
