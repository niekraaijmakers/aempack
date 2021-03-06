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

module.exports = {

    serviceWorker: {
        enabled: false
    },
    delays: {
        postCompiledDebounceDelay: 1000,
        serverSpawnDelay: 500,
        folderPushDelay: 250
    },
    callbacks: {
        onAemPush: null,
        onBrowserRefresh: null,
        onError: null,
        payloadsGathered: null,
        onServerStdOutCallback: null,
        onServerStErrorOutCallback: null,
        onServerCloseCallback: null
    },
    browserSync: {},

    isInClientLibRoot: true,
    cliBuildCommand: null,
    cliBuildCommandArgs: [],
    cliBuildCommandSuccessMsg: 'succes',

    webpackConfig: null,
    webpackServerConfig: null,
    disableServerSideRendering: false,

    assetManifestPath: null,
    disableCleanup: false,
    eligibleForCleanUpRegex: '(.*)(\\.(js|css))$',
    customCleanUpEligibilityCheck: null,

    aemProtocol: 'http',
    aemHost: 'localhost',
    aemPort: 4502,

    proxyUrl: null,

    aemUser: 'admin',
    aemPassword: 'admin',

    verbose: false,

    clientLibRelativePath: null,
    clientLibAbsolutePath: null,

    serverOutputSuccessMessage: 'listening on port',
    pathToServerJsFile: null
};