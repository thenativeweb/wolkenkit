declare const versions: {
    infrastructure: {
        nodejs: string;
        'docker-compose': string;
    };
    packages: {
        typescript: string;
    };
    dockerImages: {
        minio: string;
        mongodb: string;
        postgres: string;
        traefik: string;
    };
};
export { versions };
