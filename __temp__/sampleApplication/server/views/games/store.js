'use strict';

const store = {
  type: 'infrastructure/mongodb',

  async setup (games) {
    await games.createIndex('id');
  }
};

module.exports = { store };
