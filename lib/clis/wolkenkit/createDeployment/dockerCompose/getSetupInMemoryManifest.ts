import { versions } from '../../../../versions';

const getSetupInMemoryManifest = function (): string {
  return `
    version: '${versions.infrastructure['docker-compose']}'

     build: '../../'
       command: >
         sh -c "
           node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup infrastructure
         "
       init: true   services:
  `;
};

export { getSetupInMemoryManifest };
