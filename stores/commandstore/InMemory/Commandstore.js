'use strict';

const { InMemory: Lockstore } = require('../../lockstore');

class Commandstore {
  async initialize ({ expirationDuration }) {
    if (!expirationDuration) {
      throw new Error('Expiration duration is missing.');
    }

    this.database = { commands: []};

    this.expirationDuration = expirationDuration;
    this.lockstore = new Lockstore();

    await this.lockstore.initialize();
  }

  async saveCommand ({ command }) {
    if (!command) {
      throw new Error('Command is missing.');
    }

    this.database.commands.push(command);
  }

  async getUnhandledCommand () {
    for (const command of this.database.commands) {
      try {
        await this.lockstore.acquireLock({
          namespace: 'aggregates',
          value: { aggregateId: command.aggregate.id },
          expiresAt: Date.now() + this.expirationDuration
        });
      } catch {
        continue;
      }

      const firstCommandForLockedAggregate = this.database.commands.find(
        cmd => cmd.aggregate.id === command.aggregate.id
      );

      if (firstCommandForLockedAggregate) {
        return firstCommandForLockedAggregate;
      }

      await this.lockstore.releaseLock({
        namespace: 'aggregates',
        value: { aggregateId: command.aggregate.id }
      });
    }

    throw new Error('Failed to get unhandled command.');
  }

  async progressCommand ({ commandId }) {
    if (!commandId) {
      throw new Error('Command id is missing.');
    }

    const command = this.database.commands.find(
      cmd => cmd.id === commandId
    );

    if (!command) {
      throw new Error('Command not found.');
    }

    await this.lockstore.renewLock({
      namespace: 'aggregates',
      value: { aggregateId: command.aggregate.id },
      expiresAt: Date.now() + this.expirationDuration
    });
  }

  async removeCommand ({ commandId }) {
    if (!commandId) {
      throw new Error('Command id is missing.');
    }

    const index = this.database.commands.findIndex(
      cmd => cmd.id === commandId
    );

    if (index === -1) {
      throw new Error('Command not found.');
    }

    const [ command ] = this.database.commands.splice(index, 1);

    await this.lockstore.releaseLock({
      namespace: 'aggregates',
      value: { aggregateId: command.aggregate.id }
    });
  }

  async destroy () {
    this.database = { commands: []};

    await this.lockstore.destroy();
  }
}

module.exports = Commandstore;
