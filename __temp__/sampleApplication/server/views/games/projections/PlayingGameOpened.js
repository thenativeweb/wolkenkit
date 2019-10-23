'use strict';

const handler = {
  selector: 'playing.game.Opened',

  async handle (games, event) {
    await games.insertOne({
      level: event.data.level,
      riddle: event.data.riddle
    });
  }
};

module.exports = { handler };
