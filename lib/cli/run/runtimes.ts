const runtimes = [
  {
    id: 'single-process',
    name: 'singleProcess',
    processes: [
      { id: 'main', name: 'main' }
    ]
  },
  {
    id: 'microservice',
    name: 'microservice',
    processes: [
      { id: 'command', name: 'command' },
      { id: 'dispatcher', name: 'dispatcher' },
      { id: 'domain', name: 'domain' },
      { id: 'domain-event', name: 'domainEvent' },
      { id: 'domain-event-store', name: 'domainEventStore' },
      { id: 'publisher', name: 'publisher' }
    ]
  }
];

export { runtimes };
