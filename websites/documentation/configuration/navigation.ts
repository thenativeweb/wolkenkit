import { Language } from '../types/Language';
import { PageTreeItem } from 'thenativeweb-ux';

type Navigation = Record<Language, PageTreeItem []>;

/* eslint-disable object-property-newline */
const navigation: Navigation = {
  'en-us': [
    { title: 'Introduction', children: [
      { title: 'What is wolkenkit?', children: [
        { title: 'Overview', keywords: [ 'CQRS', 'event-sourcing', 'framework', 'Node.js', 'JavaScript', 'TypeScript' ]},
        { title: 'Primary features', keywords: [ 'scalability', 'scale', 'learn', 'past', 'insights', 'http', 'graphql' ]},
        { title: 'Basic architecture', keywords: [ 'runtime', 'process' ]},
        { title: 'Compatibility to databases', keywords: [ 'PostgreSQL', 'MariaDB', 'MySQL', 'SQL Server', 'MongoDB', 'in-memory' ]},
        { title: 'Use cases' }
      ]},
      { title: 'wolkenkit vs other software', children: [
        { title: 'Axon' },
        { title: 'Meteor' },
        { title: 'Firebase' },
        { title: 'Hoodie' },
        { title: 'Parse' },
        { title: 'Custom solutions' }
      ]},
      { title: 'Core concepts', children: [
        { title: 'CQRS', keywords: [ 'cqs', 'command', 'query', 'separation', 'read', 'write', 'model', 'side', 'projection', 'cap' ]},
        { title: 'Event-sourcing', keywords: [ 'event-store', 'eventstore', 'replay', 'state', 'delta', 'history', 'fact', 'snapshot' ]},
        { title: 'Domain-driven design (DDD)', keywords: [ 'command', 'event', 'aggregate', 'bounded', 'context', 'domain' ]}
      ]}
    ]}
  ]
};
/* eslint-enable object-property-newline */

export { navigation };
