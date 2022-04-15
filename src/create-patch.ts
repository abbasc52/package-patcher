import fs from 'fs-extra';
import path from 'path';
import { getPackageParentDir } from './utils.js';
import * as diff from 'diff';
import tar from 'tar-stream';
import got from 'got';
import glob from 'glob';
import zlib from 'zlib';


async function getPkgTarUrl(packageName:string, version:string){
    const packageUrl = `https://registry.npmjs.org/${packageName}/${version}`;
    const result:any = await got.get(packageUrl).json();
    return result.dist.tarball;
}

function generatePatch(packageName:string,packageVersion:string,url:string,packagePath:string){

    let localFiles:string[] = glob.sync(`${packagePath}/**/*`,{
        nodir:true,
        ignore:[
        `${packagePath}/node_modules/**/*`
    ]}).map((c:string) => path.normalize(path.relative(packagePath,c)));
    return new Promise(function(resolve, reject){
        const writeFilePath = `./patches/${packageName}+${packageVersion}.patch`;
        fs.mkdirp(path.dirname(writeFilePath));
        const writeStream = fs.createWriteStream(writeFilePath,{ encoding: 'utf-8'});
        const nullPath = path.normalize('/dev/null');

        got.stream(url)
            .pipe(zlib.createGunzip())
            .pipe(tar.extract())
            .on('entry',(headers:tar.Headers,stream,next)=>{
                let allChuncks = '';
                stream.on('data',function(chuck){
                    allChuncks += chuck;
                })
                stream.on('end', function() {
                    //console.log(headers.name);
                    const patch = getPatchForFile({
                        fileName:headers.name,
                        packageName: packageName,
                        packagePath: packagePath,
                        data: allChuncks,
                        localFiles: localFiles
                    })
                    localFiles = localFiles.filter(c => c != path.normalize(path.relative('package',headers.name)))

                    if(patch != null){
                        writeStream.write(patch);
                    }

                    allChuncks = '';
                    next() // ready for next entry
                });
            })
            .on('error',reject)
            .on('finish',() => {
                for(let file of localFiles){
                    const diffPath = path.join(packageName,file);
                    const currFile = fs.readFileSync(path.resolve(packagePath,file),'utf-8');
                    let patch = diff.createTwoFilesPatch(nullPath,diffPath,'',currFile);
                    writeStream.write(patch);
                }
                writeStream.end();
                resolve(null);
            })
    });
}

export async function createPatch(packageName){
    console.log(packageName);
    const packagePath = path.posix.join(getPackageParentDir(packageName),packageName);
    console.log(`Found package at ${packagePath}`);
    const packageInfo = await fs.readJSON(path.resolve(packagePath, 'package.json'));
    const packageVersion = packageInfo.version;
    const url = await getPkgTarUrl(packageName,packageVersion);
    await generatePatch(packageName,packageVersion,url, packagePath);
}






type PackageFile = {
    fileName: string,
    data: string,
    packageName: string,
    packagePath:string,
    localFiles: string[]
}

function getPatchForFile({fileName,data,packageName,packagePath,localFiles}:PackageFile){
    const downloadedFile = data;
    const relativeFilePath = path.posix.relative('package',fileName);
    const fileIdx = localFiles.indexOf(relativeFilePath)

    const diffPath = path.posix.join(packageName,relativeFilePath);
    const nullPath = path.posix.normalize('/dev/null');

    if(localFiles.findIndex(c => relativeFilePath == path.posix.normalize(c)) != -1){
        const packageFilePath = path.resolve(packagePath,relativeFilePath);

        const packageFile = fs.readFileSync(packageFilePath,{encoding:'utf-8'});
        let patch = diff.createPatch(diffPath,downloadedFile,packageFile);
        let patchJson = diff.parsePatch(patch)[0];
        if(patchJson?.hunks?.length > 0)
            return patch;
        else return null;
    }
    else{
        console.log("*",diffPath);
        let patch = diff.createTwoFilesPatch(diffPath,nullPath,downloadedFile,'');
        return patch;
    }
}

await createPatch('glob')