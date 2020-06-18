/*
 *  Copyright 2020 Adobe
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const fs = require('fs');

function perfObjectValues(manifest){

    let values;
    if(manifest['files']){
        values = Object.values(manifest['files']);
    }else if(manifest['assetsByChunkName']){
        values = Object.values(manifest['assetsByChunkName']);
    }else{
        values = Object.values(manifest);
    }

    if(Array.isArray(values)){
        let newArr = [];
        for(var i = 0; i < values.length; i++)
        {
            newArr = newArr.concat(values[i]);
        }
        return newArr;

    }else{
        return values;
    }
}

function _inManifestCheck(parameters, manifest, filePathRelative){

    if(perfObjectValues(manifest).indexOf(filePathRelative) > -1){
        return true;
    }

    if( filePathRelative.indexOf(parameters.clientLibRelativePath) > -1 &&
        perfObjectValues(manifest).indexOf(filePathRelative.slice(parameters.clientLibRelativePath.length)) > -1
    ){
        return true;
    }

    if( filePathRelative.indexOf(parameters.clientLibRelativePath) > -1 &&
        perfObjectValues(manifest).indexOf(filePathRelative.slice(parameters.clientLibRelativePath.length + 1)) > -1
    ){
        return true;
    }


    return false;
}

function inManifest(parameters, manifest, filePathRelative) {

    if(filePathRelative.startsWith('/apps/')){
        //also check with /etc.clientlibs
        if(_inManifestCheck(parameters, manifest, filePathRelative.replace('/apps/','/etc.clientlibs/'))){
            return true;
        }
    }else if(filePathRelative.startsWith('/libs/')){
        if(_inManifestCheck(parameters, manifest, filePathRelative.replace('/libs/', '/etc.clientlibs/'))){
            return true;
        }
    }

    return _inManifestCheck(parameters, manifest, filePathRelative);
}

const cleanupLoop = (parameters, folder, eligibleForCleanUpRegex,manifest) => {

    const dir = parameters.clientLibAbsolutePath + folder;
    const files = fs.readdirSync(dir);

    for (const c in files) {
        const fileName = files[c];

        const filePathRelative = parameters.clientLibRelativePath  + folder + '/' + fileName;
        const filePathAbsolute = parameters.clientLibAbsolutePath  + folder + '/' + fileName;

        const isDir = fs.statSync(filePathAbsolute).isDirectory();

        if(isDir){
            cleanupLoop(parameters, (folder + '/' + fileName), eligibleForCleanUpRegex,manifest);
        }
        else if(parameters.serviceWorker.enabled === true && filePathAbsolute === parameters.serviceWorker.absoluteDestPath){
            if(parameters.verbose){
                console.info('service worker added: ' + filePathAbsolute);
            }
        }
        else if(parameters.customCleanUpEligibilityCheck && parameters.customCleanUpEligibilityCheck(folder,fileName, eligibleForCleanUpRegex)){
            if(parameters.verbose){
                console.info('removed for cleanup: ' + filePathAbsolute);
            }
            fs.unlinkSync(filePathAbsolute);
        }else if(eligibleForCleanUpRegex.test(fileName) && !inManifest(parameters, manifest, filePathRelative)){
            if(parameters.verbose){
                console.info('removed for cleanup: ' + filePathAbsolute);
            }
            fs.unlinkSync(filePathAbsolute);
        }else if(parameters.verbose){
            console.info('found in manifest ' + filePathAbsolute);
        }
    }

};


module.exports = (parameters) => {

    if(parameters.disableCleanup){
        return;
    }

    const eligibleForCleanUpRegex = new RegExp(parameters.eligibleForCleanUpRegex);

    const assetManifestPath = (parameters.assetManifestPath) ? parameters.assetManifestPath : parameters.clientLibAbsolutePath + "/asset-manifest.json";
    const manifestStream = fs.readFileSync(assetManifestPath);
    const manifest = JSON.parse(String(manifestStream));

    cleanupLoop(parameters, '', eligibleForCleanUpRegex,manifest);
};