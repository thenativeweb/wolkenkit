import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getFileStoreOptionsSchema } from '../../../shared/schemas/getFileStoreOptionsSchema';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      fileStoreOptionsSchema = getFileStoreOptionsSchema(),
      identityProviderSchema = getIdentityProviderSchema(),
      portSchema = getPortSchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  applicationDirectory: {
    environmentVariable: 'APPLICATION_DIRECTORY',
    defaultValue: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    schema: {
      type: 'string',
      minLength: 1
    }
  },
  fileCorsOrigin: {
    environmentVariable: 'FILE_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  fileStoreOptions: {
    environmentVariable: 'FILE_STORE_OPTIONS',
    defaultValue: { type: 'InMemory' },
    schema: fileStoreOptionsSchema
  },
  enableOpenApiDocumentation: {
    environmentVariable: 'ENABLE_OPEN_API_DOCUMENTATION',
    defaultValue: false,
    schema: { type: 'boolean' }
  },
  healthCorsOrigin: {
    environmentVariable: 'HEALTH_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  healthPort: {
    environmentVariable: 'HEALTH_PORT',
    defaultValue: 3001,
    schema: portSchema
  },
  identityProviders: {
    environmentVariable: 'IDENTITY_PROVIDERS',
    defaultValue: [{
      issuer: 'https://token.invalid',
      certificate: path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
    }],
    schema: identityProviderSchema
  },
  port: {
    environmentVariable: 'PORT',
    defaultValue: 3000,
    schema: portSchema
  }
};

export { configurationDefinition };
