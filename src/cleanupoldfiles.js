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

function _inManifestCheck(manifest, filePathRelative){
    return Object.values(manifest).indexOf(filePathRelative) > -1;
}

function inManifest(manifest, filePathRelative) {

    if(filePathRelative.startsWith('/apps/')){
        //also check with /etc.clientlibs
        if(_inManifestCheck(manifest, filePathRelative.replace('/apps/','/etc.clientlibs/'))){
            return true;
        }
    }else if(filePathRelative.startsWith('/libs/')){
        if(_inManifestCheck(manifest, filePathRelative.replace('/libs/', '/etc.clientlibs/'))){
            return true;
        }
    }

    return _inManifestCheck(manifest, filePathRelative);
}

const cleanupLoop = (parameters, folder, eligibleForCleanUpRegex,stats) => {

    const dir = parameters.clientLibAbsolutePath + folder;

    const assetManifestPath = (parameters.assetManifestPath) ? parameters.assetManifestPath : parameters.clientLibAbsolutePath + "/asset-manifest.json";

    const manifestStream = fs.readFileSync(assetManifestPath);
    const manifest = JSON.parse(String(manifestStream));
    const files = fs.readdirSync(dir);

    for (const c in files) {
        const fileName = files[c];

        const filePathRelative = parameters.clientLibRelativePath  + folder + '/' + fileName;
        const filePathAbsolute = parameters.clientLibAbsolutePath  + folder + '/' + fileName;

        const isDir = fs.statSync(filePathAbsolute).isDirectory();

        if(isDir){
            cleanupLoop(parameters, (folder + '/' + fileName), eligibleForCleanUpRegex, stats);
        }else if(parameters.customCleanUpEligibilityCheck && parameters.customCleanUpEligibilityCheck(folder,fileName, eligibleForCleanUpRegex,stats)){
            if(parameters.verbose){
                console.info('removed for cleanup: ' + filePathAbsolute);
            }
            fs.unlinkSync(filePathAbsolute);
        }else if(eligibleForCleanUpRegex.test(fileName) && !inManifest(manifest, filePathRelative)){
            if(parameters.verbose){
                console.info('removed for cleanup: ' + filePathAbsolute);
            }
            fs.unlinkSync(filePathAbsolute);
        }else if(parameters.verbose){
            console.info('found in manifest ' + filePathAbsolute);
        }
    }

};


module.exports = (parameters,stats) => {

    if(parameters.disableCleanup){
        return;
    }

    const eligibleForCleanUpRegex = new RegExp(parameters.eligibleForCleanUpRegex);

    cleanupLoop(parameters, '', eligibleForCleanUpRegex,stats);

};