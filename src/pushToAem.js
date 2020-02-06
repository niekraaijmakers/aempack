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

const gatherPayloads = require("./gatherpayloads");
const request = require('request');
const cleanUpOldFiles = require('./cleanupoldfiles');

const pushToAemHandler = async (parameters, stats) => {

    cleanUpOldFiles(parameters, stats);
    const results = await commitToAem(parameters, stats);

    return new Promise((resolve, reject) => {
        resolve(results);
    });
};


const compare = (a, b) => {
    if (a.url.length < b.url.length) {
        return -1;
    }
    if (a.url.length > b.url.length) {
        return 1;
    }
    return 0;
};


const commitFN = async (value, parameters) => {
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            request(value, (err, response, body) => {
                if (err || response.statusCode === 500) {
                    console.log('error pushing folder ' + value.url + ' to aem!');

                    if(parameters.verbose){
                        console.log('body:', body)
                        console.log('response:', response)
                    }
                    reject(response);
                } else {

                    console.info('Pushed folder ' + value.url + ' to AEM');
                    resolve();
                }
            });
        }, parameters.delays.folderPushDelay)
    })
};



const commitToAem = async (parameters) => {
    const payloadArray = [];
    gatherPayloads(parameters, '', payloadArray);

    payloadArray.sort(compare);

    const results = [];

    for (const task of payloadArray) {
        if(parameters.callbacks.onAemPush){
            const result = parameters.callbacks.onAemPush(task);

            if(result !== false){
                results.push(await commitFN(task, parameters));
            }else if(parameters.verbose){
                console.log('Blocking task with url: ' + task.url);
            }
        }else{
            results.push(await commitFN(task, parameters));
        }

    }

    return results;
};

module.exports = pushToAemHandler;