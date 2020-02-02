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

const generateToken = require('./generateToken');
const fs = require('fs');
const clone = require('clone');

const generateStandardOptions = (parameters) => {
    return {
        url: parameters.aemBaseUrl + parameters.clientLibRelativePath,
        method: 'POST',
        headers: {
            'Authorization': generateToken(parameters),
            'Content-Type': 'multipart/form-data'
        },
        formData: {}
    };
};

const gatherPayloads = (parameters, folder, payloadArray) => {


    const base = parameters.webpackConfig.output.path + "/" ;

    const contents = fs.readdirSync(base + folder);
    const currentPayload = clone(generateStandardOptions(parameters));
    currentPayload.url =  parameters.aemBaseUrl + parameters.clientLibRelativePath + folder + '?jcr:primaryType=nt:folder';

    contents.forEach((file) => {

        const filePath =  folder + "/" + file;
        const stat = fs.statSync(base + filePath);
        if(stat && stat.isDirectory()){
            currentPayload.formData['jcr:primaryType'] = 'nt:folder';
            gatherPayloads(parameters, filePath, payloadArray);
        }else{
            currentPayload.formData[file] = fs.createReadStream(base + filePath);
            currentPayload.formData[file + '@TypeHint'] = 'nt:file';
        }

    });
    payloadArray.push(currentPayload);

    if(parameters.callbacks.payloadsGathered){
        parameters.callbacks.payloadsGathered(payloadArray);
    }
};

module.exports = gatherPayloads;
