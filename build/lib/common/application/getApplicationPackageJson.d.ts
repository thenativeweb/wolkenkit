import { PackageManifest } from './PackageManifest';
declare const getApplicationPackageJson: ({ directory }: {
    directory: string;
}) => Promise<PackageManifest>;
export { getApplicationPackageJson };
