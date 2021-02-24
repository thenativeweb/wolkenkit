'use strict';

const hooks = {
  async addingFile ({ name }, { error }) {
    if (name === 'addingFile-unauthenticated') {
      throw new error.NotAuthenticated();
    }
    if (name === 'addingFile-failure') {
      throw new Error(`Failed to run 'addingFile' hook.`);
    }
  },

  async addedFile ({ name }) {
    if (name === 'addedFile-failure') {
      throw new Error(`Failed to run 'addedFile' hook.`);
    }
  },

  async gettingFile ({ name }, { error }) {
    if (name === 'gettingFile-unauthenticated') {
      throw new error.NotAuthenticated();
    }
    if (name === 'gettingFile-failure') {
      throw new Error(`Failed to run 'gettingFile' hook.`);
    }
  },

  async gotFile ({ name }) {
    if (name === 'gotFile-failure') {
      throw new Error(`Failed to run 'gotFile' hook.`);
    }
  },

  async removingFile ({ name }, { error }) {
    if (name === 'removingFile-unauthenticated') {
      throw new error.NotAuthenticated();
    }
    if (name === 'removingFile-failure') {
      throw new Error(`Failed to run 'removingFile' hook.`);
    }
  },

  async removedFile ({ name }) {
    if (name === 'removedFile-failure') {
      throw new Error(`Failed to run 'removedFile' hook.`);
    }
  }
};

module.exports = hooks;
