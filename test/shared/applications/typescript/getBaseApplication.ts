import { Application } from '../../../../lib/common/application/Application';
import path from 'path';
import sampleAggregate from './base/server/domain/sampleContext/sampleAggregate';
import sampleView from './base/server/views/sampleView';
import { withSystemDomainEvents } from '../../../../lib/tools/withSystemDomainEvents';

const getBaseApplication = function (): Application {
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
    infrastructure: {
      ask: {},
      tell: {}
    },
    views: {
      sampleView
    }
  });
};

export {
  getBaseApplication
};
