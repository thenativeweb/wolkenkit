const versions = {
  infrastructure: {
    nodejs: '14.15.4',
    'docker-compose': '3.7'
  },
  packages: {
    typescript: '4.1.4'
  },
  dockerImages: {
    minio: 'RELEASE.2019-10-12T01-39-57Z',
    mongodb: '4.4.3',
    postgres: '13.1-alpine',
    traefik: '2.3'
  }
};

export { versions };
