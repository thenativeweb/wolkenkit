import { Language } from '../types/Language';
import { PageTreeItem } from 'thenativeweb-ux';

type Navigation = Record<Language, PageTreeItem []>;

/* eslint-disable object-property-newline */
const navigation: Navigation = {
  'en-us': [
    { title: 'Getting started', children: [
      { title: 'Understanding wolkenkit', children: [
        { title: 'Why wolkenkit?' },
        { title: 'Use Cases' },
        { title: 'Core concepts' },
        { title: 'Data flow' },
        { title: 'Architecture' },
        { title: 'Getting help' }
      ]},
      { title: 'Installing wolkenkit', children: [
        { title: 'Veryfing system requirements' },
        { title: 'Installing on macOS' },
        { title: 'Installing on Linux' },
        { title: 'Installing on Windows' }
      ]},
      { title: 'Creating your first application', children: [
        { title: 'Setting the objective' },
        { title: 'Creating the application' }
      ]},
      { title: 'Updating wolkenkit', children: [
        { title: 'Changelog' },
        { title: 'Updating an application' }
      ]},
      { title: 'Contributing to wolkenkit', children: [
        { title: 'Overview' },
        { title: 'Developing ideas for contributions' },
        { title: 'Submitting a contribution' },
        { title: 'Sponsoring development' }
      ]}
    ]},
    { title: 'Guides', children: [
      { title: 'Creating an application from scratch', children: [
        { title: 'Why wolkenkit?' },
        { title: 'Use Cases' },
        { title: 'Core concpets' },
        { title: 'Data flow' },
        { title: 'Architecture' },
        { title: 'Getting help' }
      ]}
    ]},
    { title: 'Reference', children: []},
    { title: 'Media', children: [
      { title: 'Online resources', children: [
        { title: 'Articles' },
        { title: 'Blog posts' },
        { title: 'Videos' }
      ]},
      { title: 'Sample Applications', children: [
        { title: 'wolkenkit-boards' },
        { title: 'wolkenkit-geocaching' },
        { title: 'wolkenkit-nevercompletedgame' },
        { title: 'wolkenkit-template-chat' },
        { title: 'wolkenkit-todomvc' }
      ]}
    ]},
    { title: 'Legal', children: [
      { title: 'Imprint' }
    ]}
  ]
};
/* eslint-enable object-property-newline */

export { navigation };
