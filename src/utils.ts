import {createRequire } from 'module';
import path from 'upath';
import fs from 'fs-extra';

export const require = createRequire(import.meta.url);

export function getPackageNameFromPatchFile(patchDir:string,patchFilePath:string){
    return path.relative(patchDir,patchFilePath).split('+')[0];
}

export async function getPackageParentDir(packageName:string){
  const packageDir = await getPackageDir(packageName);
  const packageRegex = new RegExp(`${packageName}$`);
  return packageDir.replace(packageRegex,'');
}

export async function getPackageDir(packageName:string){
    let packagePath:string = '';
    try{
      // Try to get package.json path directly via node resolve
      packagePath = path.dirname(require.resolve(`${packageName}/package.json`))
    }
    catch{
      // If package.json is not included in exports, try resolve the package 
      // and recursively check parent directory for package.json
      packagePath = path.dirname(require.resolve(packageName));
      let hasPackageJson = await fs.pathExists(path.join(packagePath,'package.json'));
      while(!hasPackageJson){
        packagePath = path.dirname(packagePath);
        hasPackageJson = await fs.pathExists(path.join(packagePath,'package.json'));
      }
    }
    return packagePath;
}

