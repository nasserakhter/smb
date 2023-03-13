import hasbin from 'hasbin';

export type InstallInstructions = {
  win32: string;
  linux: string;
  darwin: string;
} & Partial<Record<NodeJS.Platform, string>>;

export type Dependency = {
  bin: string;
  installInstructions: InstallInstructions;
};

export default function verifyBinaryDependencies(deps: Dependency[]) {
  deps.forEach((dep) => {
    if (!hasbin.sync(dep.bin)) {
      throw new Error(
        `Dependency ${dep.bin} not found. ${
          dep.installInstructions[process.platform] ?? ''
        }`
      );
    }
  });
}
