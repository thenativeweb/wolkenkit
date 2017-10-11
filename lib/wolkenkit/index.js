'use strict';

const commands = require('./commands');

// Pass through the commands object, so that you have wolkenkit.init() & co.
// from the outside. This way the user is only able to use the official
// commands, and is not able to use the internal helper functions (which is a
// good thing).
module.exports = commands;
