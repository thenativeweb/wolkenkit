'use strict';

const artefacts = {
  base: [
    { repository: 'wolkenkit-box-node', image: 'wolkenkit-box-node' }
  ],

  infrastructure: [
    { repository: 'wolkenkit-box-mongodb', image: 'wolkenkit-mongodb' },
    { repository: 'wolkenkit-box-postgres', image: 'wolkenkit-postgres' },
    { repository: 'wolkenkit-box-rabbitmq', image: 'wolkenkit-rabbitmq' },
    { repository: 'wolkenkit-proxy', image: 'wolkenkit-proxy' }
  ],

  application: [
    { repository: 'wolkenkit-box-node-modules', image: 'wolkenkit-node-modules' },
    { repository: 'wolkenkit-broker', image: 'wolkenkit-broker' },
    { repository: 'wolkenkit-core', image: 'wolkenkit-core' },
    { repository: 'wolkenkit-depot', image: 'wolkenkit-depot' },
    { repository: 'wolkenkit-flows', image: 'wolkenkit-flows' }
  ],

  clientSdks: [
    { repository: 'wolkenkit-client-js' },
    { repository: 'wolkenkit-depot-client-js' }
  ],

  documentation: [
    { repository: 'wolkenkit-documentation', image: 'wolkenkit-documentation' }
  ],

  documentationSamples: [
    { repository: 'wolkenkit-client-template-spa-vanilla-js' }
  ],

  cli: [
    { repository: 'wolkenkit' }
  ],

  website: [
    { repository: 'wolkenkit.io', image: 'wolkenkit.io' }
  ],

  kubernetes: [
    { repository: 'infrastructure' }
  ],

  virtualMachines: [
    { repository: 'wolkenkit-vm' }
  ],

  vagrantfile: [
    { repository: 'wolkenkit-vagrant' }
  ]
};

artefacts.all = Object.keys(artefacts).reduce(
  (all, artefactName) => [ ...all, ...artefacts[artefactName] ],
  []
);

module.exports = artefacts;
