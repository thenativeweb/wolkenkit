const versions = {
  infrastructure: {
    nodejs: '14.16.0',
    'docker-compose': '3.7'
  },
  packages: {
    typescript: '4.7.4'
  },
  dockerImages: {
    minio: 'RELEASE.2019-10-12T01-39-57Z',
    mongodb: '4.4.3',
    postgres: '13.4-alpine',
    traefik: '2.3'
  }
};

export { versions };
