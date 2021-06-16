declare const adjustPackageJson: ({ packageJson, name, addTypeScript }: {
    packageJson: string;
    name: string;
    addTypeScript: boolean;
}) => Promise<void>;
export { adjustPackageJson };
