'use strict';

class Handler {
  async handle ({ command, metadata }) {
    try {
      // ...
      return events;
    } catch (ex) {
      throw new Error();
    }


    // try
    //   Command-Validator
    //   Aggregate laden (Repository)
    //   isAuthorized prüfen
    //   handle
    //   Aggregate speichern (Repository)
    // catch
    //   Fehler-Events (Failed, Rejected)
    //   Auf den Event-Bus
    //   return

    // Auf den Event-Bus
    // Als gepublished markieren
  }
}

module.exports = Handler;
