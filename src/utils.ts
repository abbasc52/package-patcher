import {createRequire } from 'module';
import path from 'path';

export const require = createRequire(import.meta.url);

export function getPackageNameFromPatchFile(patchDir:string,patchFilePath:string){
    return path.posix.relative(patchDir,patchFilePath).split('+')[0];
}

export function getPackageParentDir(packageName:string){
    let packagePath = path.dirname(require.resolve(packageName));
    const packagePathIndex = packagePath.lastIndexOf(`${packageName}`);
    return packagePath.slice(0,packagePathIndex);
}