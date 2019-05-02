'use strict';

const metadata = {};

metadata.versions = {
  cli: '1.2.0',
  docker: '17.09',
  node: '8.9.1',

  chrome: '62',
  firefox: '57',
  safari: '10.1',
  opera: '44.0',
  edge: '14',
  ie: '11',

  clientSdkJs: '1.2.0'
};

/* eslint-disable object-property-newline */
metadata.navigation = [
  { title: 'Getting started', children: [
    { title: 'Understanding wolkenkit', children: [
      { title: 'Why wolkenkit?' },
      { title: 'Core concepts' },
      { title: 'Architecture' },
      { title: 'Getting help' }
    ]},
    { title: 'Installing wolkenkit', children: [
      { title: 'Verifying system requirements' },
      { title: 'Installing on macOS' },
      { title: 'Installing on Linux' },
      { title: 'Installing on Windows' },
      { title: 'Installing using Docker Machine' }
    ]},
    { title: 'Updating wolkenkit', children: [
      { title: 'Changelog' },
      { title: 'Updating the CLI' },
      { title: 'Updating an application' }
    ]}
  ]},
  { title: 'Guides', children: [
    { title: 'Creating your first application', children: [
      { title: 'Setting the objective' },
      { title: 'Creating the application' }
    ]},
    { title: 'Creating an application from scratch', children: [
      { title: 'Setting the objective' },
      { title: 'Modeling with your team' },
      { title: 'Creating the write model' },
      { title: 'Creating the read model' },
      { title: 'Creating the client' }
    ]}
  ]},
  { title: 'Reference', children: [
    { title: 'Initializing an application', children: [
      { title: 'Using a template' },
      { title: 'Starting from scratch' }
    ]},
    { title: 'Creating the write model', children: [
      { title: 'Overview' },
      { title: 'Defining contexts' },
      { title: 'Defining aggregates' },
      { title: 'Defining the initial state' },
      { title: 'Defining commands' },
      { title: 'Defining events' },
      { title: 'Using command middleware' },
      { title: 'Using command services' },
      { title: 'Collecting IoT events' },
      { title: 'Configuring authorization' }
    ]},
    { title: 'Creating the read model', children: [
      { title: 'Overview' },
      { title: 'Defining lists' },
      { title: 'Defining fields' },
      { title: 'Handling events' },
      { title: 'Writing where clauses' },
      { title: 'Writing update statements' },
      { title: 'Finding items' },
      { title: 'Using services' },
      { title: 'Configuring authorization' }
    ]},
    { title: 'Creating stateless flows', children: [
      { title: 'Overview' },
      { title: 'Defining flows' },
      { title: 'Handling events' },
      { title: 'Using services' }
    ]},
    { title: 'Creating stateful flows', children: [
      { title: 'Overview' },
      { title: 'Defining flows' },
      { title: 'Identifying flows' },
      { title: 'Defining the initial state' },
      { title: 'Handling events' },
      { title: 'Reacting to transitions' },
      { title: 'Using services' }
    ]},
    { title: 'Configuring an application', children: [
      { title: 'Naming an application' },
      { title: 'Pinning the runtime' },
      { title: 'Setting the host and port' },
      { title: 'Allowing client domains' },
      { title: 'Using custom certificates' },
      { title: 'Enabling authentication' },
      { title: 'Assigning a Docker Machine' },
      { title: 'Using environments' },
      { title: 'Setting the Node.js environment' }
    ]},
    { title: 'Using the CLI', children: [
      { title: 'Controlling the lifecycle' },
      { title: 'Protecting an application' },
      { title: 'Storing data permanently' },
      { title: 'Using environments' }
    ]},
    { title: 'Building a client', children: [
      { title: 'Connecting to an application' },
      { title: 'Sending commands' },
      { title: 'Receiving events' },
      { title: 'Reading lists' },
      { title: 'Handling application events' },
      { title: 'Using authentication' },
      { title: 'Sending IoT events' },
      { title: 'Storing files' }
    ]},
    { title: 'Debugging an application', children: [
      { title: 'Attaching a debugger' },
      { title: 'Viewing log messages' },
      { title: 'Using Docker' }
    ]},
    { title: 'Data structures', children: [
      { title: 'Commands' },
      { title: 'Events' }
    ]}
  ]},
  { title: 'Downloads', children: [
    { title: 'Brochure' },
    { title: 'Cheatsheet' }
  ]},
  { title: 'Legal', children: [
    { title: 'Imprint' }
  ]}
];
/* eslint-enable object-property-newline */

module.exports = metadata;
