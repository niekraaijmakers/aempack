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

const exec = require('child_process').exec;
const path = require('path');
const kill = require('./kill');

//reloading? how to do this
let activeChild;

let timeout;

const spawnPreRenderServer = (parameters) => {;

    if(timeout){
        clearTimeout(timeout);
    }
    return new Promise((resolve,reject) => {
        timeout = setTimeout(()=>{

            const processPath = (parameters.pathToServerJsFile) ? parameters.pathToServerJsFile : path.resolve(process.cwd(), parameters.webpackServerConfig.output.path + '/' + parameters.webpackServerConfig.output.filename);

            activeChild = exec('node ' + processPath);


            activeChild.stdout.on('data', function(data) {
                console.log('prerender: stout: ' + data);

                if(parameters.callbacks.onServerStdOutCallback){
                    parameters.callbacks.onServerStdOutCallback(this,data,resolve,reject);
                }

                if(data.startsWith(parameters.serverOutputSuccessMessage)){
                    resolve();
                }

            });
            activeChild.stderr.on('data', function(data) {

                if(parameters.callbacks.onServerStErrorOutCallback){
                    parameters.callbacks.onServerStErrorOutCallback(this,data,resolve,reject);
                }
                console.log('prerender: ', data);
            });
            activeChild.on('close', function(code) {
                if(parameters.callbacks.onServerCloseCallback){
                    parameters.callbacks.onServerCloseCallback(this,code,resolve,reject);
                }

                console.log('prerender: closing code: ' + code);
            });
        }, parameters.delays.serverSpawnDelay);
    });

};

const startPreRenderServer = (parameters) => {

    return new Promise((resolve,reject) => {

        if(!!activeChild){
            kill(activeChild.pid).then(() => {
                activeChild = null;
                spawnPreRenderServer(parameters).then(resolve).catch(reject);
            });
        }else{
            spawnPreRenderServer(parameters).then(resolve).catch(reject);
        }
    });
};

module.exports = startPreRenderServer;