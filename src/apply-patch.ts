import * as diff from 'diff';
import { getPackageNameFromPatchFile,getPackageParentDir } from './utils.js';
import fs from 'fs-extra';
import path from 'upath';
import glob from 'glob';

export function applyPatches(pattern = './patches/**/*.patch'){
    return new Promise((resolve,reject) => {
      glob(pattern,async(err, matches)=>{
        if(err != null){
            reject(`Failed to find patches - ${err}`)
        }
        if(matches.length == 0){
          console.warn(`no files found for pattern ${pattern}`)
        }
        for(let match of matches){
            await applyPatch(match);
            console.log(`applied patch - ${match}`);
        }
        resolve({});
      });
    })
    
}

/**
 * 
 * @param {string} patchFilePath 
 */
export async function applyPatch(patchFilePath){
    const packageName = getPackageNameFromPatchFile('./patches',patchFilePath);
    const packageParentDir = await getPackageParentDir(packageName);
    const patch = await fs.readFile(patchFilePath,{ encoding:'utf-8'});
    return new Promise((resolve,reject) => {
        diff.applyPatches(patch,{
            loadFile(index,cb){
                let file = index.oldFileName;
                // To support existing patches from patch-package
                const patchPackagePrefix = 'a/node_modules';
                if(file.startsWith(patchPackagePrefix)){
                    file = file.substring(patchPackagePrefix.length);
                }
                if(path.normalize(file) == path.normalize('/dev/null')){
                    cb(null,'');
                }
                else{
                    const filePath = path.join(packageParentDir,file);
                    fs.readFile(filePath,'utf-8',cb);
                }

                
            },
            patched(index,content:string|boolean,cb){
                if(content == false){
                    cb(null);
                }
                let file = index.newFileName;
                // To support existing patches from patch-package
                const patchPackagePrefix = 'b/node_modules';
                if(file.startsWith(patchPackagePrefix)){
                    file = file.substring(patchPackagePrefix.length);
                }
                if(path.normalize(file) == path.normalize('/dev/null')){
                    cb(null);
                }
                else if(content != false){
                    const filePath = path.join(packageParentDir,file);
                    fs.mkdirpSync(path.dirname(filePath))
                    fs.writeFile(filePath,content,'utf-8',cb);
                        
                }

            },
            complete(err){
                if(err == null) resolve({});
                else reject(err);
            }
        })
    })
    
}