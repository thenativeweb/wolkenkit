import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import path from 'path';
import sampleAggregate from './base/server/domain/sampleContext/sampleAggregate';
import sampleView from './base/server/views/sampleView';
import { withSystemDomainEvents } from '../../../../lib/tools/withSystemDomainEvents';

const getBaseApplicationDefinition = function (): ApplicationDefinition {
  return withSystemDomainEvents({
    rootDirectory: __dirname,
    packageManifest: {
      name: path.basename(__dirname),
      version: '1.0.0'
    },
    domain: {
      sampleContext: {
        sampleAggregate
      }
    },
    views: {
      sampleView
    }
  });
};

export {
  getBaseApplicationDefinition
};
