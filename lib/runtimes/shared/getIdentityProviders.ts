import fs from 'fs';
import { IdentityProvider } from 'limes';
import { IdentityProvidersEnvironmentVariable } from './IdentityProvidersEnvironmentVariable';
import path from 'path';

const getIdentityProviders = async function ({ identityProvidersEnvironmentVariable }: {
  identityProvidersEnvironmentVariable: IdentityProvidersEnvironmentVariable;
}): Promise<IdentityProvider[]> {
  const identityProviders: IdentityProvider[] = [];

  for (const identityProviderDescription of identityProvidersEnvironmentVariable) {
    const { issuer, certificate: certificateDirectory } = identityProviderDescription;

    const certificatePath = path.join(certificateDirectory, 'certificate.pem');
    const certificate = await fs.promises.readFile(certificatePath);

    const identityProvider = new IdentityProvider({
      issuer,
      certificate
    });

    identityProviders.push(identityProvider);
  }

  return identityProviders;
};

export { getIdentityProviders };
