import * as diff from 'diff';
import { getPackageNameFromPatchFile,getPackageParentDir } from './utils.js';
import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';




/**
 * 
 * @param {string} dirname 
 */
export function applyPatches(pattern = './patches/**/*.patch'){
    glob(pattern,async(err, matches)=>{
        if(err != null){
            throw `Failed to find patches - ${err}`;
        }
        for(let match of matches){
            await applyPatch(match);
        }
    });
}

/**
 * 
 * @param {string} patchFilePath 
 */
export async function applyPatch(patchFilePath){
    const packageName = getPackageNameFromPatchFile('./patches',patchFilePath);
    const packageParentDir = getPackageParentDir(packageName);
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
                    const filePath = path.posix.join(packageParentDir,file);
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

try{
    await applyPatches();
}
catch(err){
    console.error(err);
}