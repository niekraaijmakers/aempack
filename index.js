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

'use strict';
const checkAccess = require('./src/checkaccess');
const startPreRenderServer = require('./src/renderserver');
const pushToAemHandler = require('./src/pushToAem');
const defaultOptions = require('./src/defaults');
const startBrowserSync = require('./src/initBrowserSync');
const initiateWatch = require('./src/initiateWatch');
const fs = require('fs-extra');

const reloadBrowser = (parameters, server) => {
    if(parameters.browserSync.enabled){
        if (parameters.callbacks.onBrowserRefresh) {
            parameters.callbacks.onBrowserRefresh(server);
        }

        server.reload('*.html');
        console.log('reloading browsers');
    }else{
        console.log('done');
    }
};

const captureError = (parameters, error) => {
    console.error(error);
    if(parameters.callbacks.onError){
        parameters.callbacks.onError(error);
    }
};

let timeout;


const copyOverServiceWorker = (parameters) => {
     fs.copySync(parameters.serviceWorker.absoluteSrcPath, parameters.serviceWorker.absoluteDestPath);
};

const initiateSync = (parameters) => {

    if(!parameters.clientLibRelativePath){
        throw new Error("clientLibRelativePath not configured! This is mandatory!");
    }

    if(!parameters.clientLibAbsolutePath){
        throw new Error("clientLibAbsolutePath not configured! This is mandatory!");
    }

    if(!parameters.webpackConfig && !parameters.cliBuildCommand){
        throw new Error("webpackConfig and cliBuildCommand  not configured! You need to provide one of either!");
    }

    const aemBaseUrl = parameters.aemProtocol + '://' + parameters.aemHost + ':' + parameters.aemPort;
    parameters.aemBaseUrl = aemBaseUrl;
    const developWithSSR = !!parameters.webpackServerConfig && !parameters.disableServerSideRendering;

    let server;
    if(parameters.browserSync.enabled){
        server = startBrowserSync(parameters);
    }

    initiateWatch(parameters,developWithSSR, (error) => {

        if(error == null){

            if(parameters.verbose){
                console.log('compiled client-side code');
            }

            if(parameters.serviceWorker.enabled === true){
                copyOverServiceWorker(parameters);
            }

            if(timeout){
                clearTimeout(timeout);
            }

            timeout = setTimeout(()=> {

                if (developWithSSR !== false) {
                    startPreRenderServer(parameters)
                        .then(() => pushToAemHandler(parameters))
                        .then(() => {
                            reloadBrowser(parameters, server);
                        }).catch((err) => {
                            captureError(parameters, err);
                        })
                } else {
                    pushToAemHandler(parameters).then(() => {
                        reloadBrowser(parameters, server);
                    }).catch((err) => {
                        captureError(parameters, err);
                    })
                }

            }, parameters.delays.postCompiledDebounceDelay);

        }else{
            captureError(parameters, error);
        }
    });
};


const AEMPack = (options) => {
    const parameters = Object.assign({}, defaultOptions, options);

    checkAccess(parameters.clientLibAbsolutePath).then(
        () => initiateSync(parameters)
    );
};

module.exports = AEMPack;
