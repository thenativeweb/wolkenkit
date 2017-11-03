# Integration test stories

The following list is a foundation for the stories we should test. Generally speaking, we should always test for the *output* and the *exit code*.

## applicationLifecycleTests.js

- application lifecycle
  - verifies the package.json configuration.
  - verifies the Docker installation.
  - verifies the Docker machine installation. (?)
  - verifies that the Docker server and host IP addresses match each other.
  - verifies the certificate.
  - install a version.
  - starts an application.
  - stops an application.
  - restarts an application.
  - reloads an application.

*Note: These tests need to be further specified.*

## persistenceLifecycleTests.js

- persistance lifecycle
  - disables persistance if no shared key is given.
  - enables persistence if a shared key is given.
  - resets persistence if --dangerously-destroy-data is given.

*Note: These tests need to be further specified.*

## applicationDebuggingTests.js

- application debugging
  - starts the application in debug mode.

*Note: These tests need to be further specified.*
