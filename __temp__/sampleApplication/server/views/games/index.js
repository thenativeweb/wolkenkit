'use strict';

const { handler: All } = require('./queries/All');
const { handler: PlayingGameOpened } = require('./projections/PlayingGameOpened');
const { handler: Top50 } = require('./queries/Top50');
const { store } = require('./store');

module.exports = {
  store,
  projections: { PlayingGameOpened },
  queries: { All, Top50 }
};
