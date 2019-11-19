
  public async prepareDomainEvent ({
    connectionId,
    domainEvent,
    aggregatesService,
    loggerService
  }: {
    connectionId: string;
    domainEvent: DomainEventWithState<DomainEventData, State>;
    aggregatesService: AggregatesService;
    loggerService: LoggerService;
  }): Promise<DomainEvent<DomainEventData> | undefined> {
    const connection = this.connectionsForGetDomainEvents.get(connectionId);

    // Maybe the connection has been removed in the background, so we can not
    // assume that it definitely exists. If we try to access a non-existing
    // connection, simply ignore it.
    if (!connection) {
      return;
    }

    const { req } = connection;

    let clientMetadata;

    try {
      clientMetadata = new ClientMetadata({ req });
    } catch (ex) {
      // It can happen that the connection gets closed in the background, and
      // hence the underlying socket does not have a remote address any more.
      // We can't detect this using an if statement, because connection handling
      // is done by Node.js in a background thread, and we may have a race
      // condition here. So, we decided to actively catch this exception, and
      // take it as an indicator that the connection has been closed meanwhile.
      if (ex.message === 'Remote address is missing.') {
        return;
      }

      throw ex;
    }

    const queryFilter = req.query || {};

    validateDomainEventWithState({ domainEvent, applicationDefinition: this.applicationDefinition });

    if (!partOf(queryFilter, domainEvent)) {
      return;
    }

    const services = {
      aggregates: aggregatesService,
      client: getClientService({ clientMetadata }),
      logger: loggerService
    };

    const aggregateInstance = await this.repository.loadCurrentAggregateState({
      contextIdentifier: domainEvent.contextIdentifier,
      aggregateIdentifier: domainEvent.aggregateIdentifier
    });

    const domainEventHandler: DomainEventHandler<State, DomainEventData> =
      this.applicationDefinition.domain[domainEvent.contextIdentifier.name]![domainEvent.aggregateIdentifier.name]!.domainEventHandlers[domainEvent.name]!;

    try {
      const clonedDomainEvent = cloneDeep(domainEvent);
      const isDomainEventAuthorized =
        await domainEventHandler.isAuthorized(aggregateInstance.state, clonedDomainEvent, services);

      if (!isDomainEventAuthorized) {
        return;
      }
    } catch (ex) {
      services.logger.error('Is authorized failed.', { domainEvent, clientMetadata, ex });

      return;
    }

    if (domainEventHandler.filter) {
      try {
        const clonedDomainEvent = cloneDeep(domainEvent);
        const keepDomainEvent =
          await domainEventHandler.filter(aggregateInstance.state, clonedDomainEvent, services);

        if (!keepDomainEvent) {
          return;
        }
      } catch (ex) {
        services.logger.error('Filter failed.', { event: domainEvent, clientMetadata, ex });

        return;
      }
    }

    let mappedDomainEvent = domainEvent;

    if (domainEventHandler.map) {
      try {
        const clonedDomainEvent = cloneDeep(domainEvent);

        mappedDomainEvent =
          await domainEventHandler.map(aggregateInstance.state, clonedDomainEvent, services);
      } catch (ex) {
        services.logger.error('Map failed.', { domainEvent, clientMetadata, ex });

        return;
      }
    }

    return mappedDomainEvent.withoutState();
  }

  public async publishDomainEvent ({ domainEvent }: {
    domainEvent: DomainEventWithState<DomainEventData, State>;
  }): Promise<void> {
    const aggregatesService = getAggregatesService({ applicationDefinition: this.applicationDefinition, repository: this.repository });
    const loggerService = getLoggerService({
      fileName: join(this.applicationDefinition.rootDirectory, `server/domain/${domainEvent.contextIdentifier.name}/${domainEvent.aggregateIdentifier.name}/index.js`),
      packageManifest: this.applicationDefinition.packageManifest
    });

    for (const connectionId of this.connectionsForGetDomainEvents.keys()) {
      let preparedDomainEvent;

      try {
        preparedDomainEvent = await this.prepareDomainEvent({ connectionId, domainEvent, aggregatesService, loggerService });
      } catch (ex) {
        loggerService.error('Preparing domain event failed.', { domainEvent, ex });

        continue;
      }

      if (!preparedDomainEvent) {
        continue;
      }

      this.writeLine({ connectionId, data: preparedDomainEvent });
    }
  }
