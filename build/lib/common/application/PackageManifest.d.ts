export interface PackageManifest {
    name: string;
    version: string;
    description?: string;
    engines?: {
        node?: string;
    };
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}
