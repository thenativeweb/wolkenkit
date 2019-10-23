handle (): void {
  // Intentionally left blank.
},

isAuthorized (
  _: AggregateApiForReadOnly,
  event: EventInternal,
  { client }: {
    client: ClientService;
  }
): boolean {
  return event.metadata.initiator.user.id === client.user.id;
}
