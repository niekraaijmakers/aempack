# AEMPACK

A plugin that integrates your webpack configuration seamlessly with Adobe Experience Manager (AEM).
This is meant for speedy, daily front-end development against AEM with webpack, with support for the latest front-end features.
Features

* Utilizes webpack watch
* Pushes changes directly to AEM using http post requests
* Compatible with chunking, sourcemaps, hot module replacement, typescript / EcmaScript 6,7,
* Fires up a live reload proxy (BrowserSync) to AEM that can acts as dispatcher. (https supported)
* Support for a server webpack configuration for server side rendering or other things as needed
* Server output javascript (if present) get's executed using nodejs and restarted before each live reload



## Requirements

For this to work, there are a few requirements to your setup.

* The webpack output file has to point to a 'clientlib' in /etc . So for example: <b>/etc/company/clientlibs/yourlib</b>
* A asset-manifest.json must be generated using "webpack-manifest-plugin" and generated in the root of the clientlib folder.

For a full fledged example go visit my version of the wknd tutorial : https://github.com/niekraaijmakers/aem-guides-wknd/tree/feature/aempack-use-example/ui.frontend
Why generate the JS/CSS files to a clientlib in ui.apps? This is for making the sourcemaps and chunking working smooth without hacks.

#### How to use


##### Configure webpack: webpack.aem-dev.js

```javascript

const ManifestPlugin = require('webpack-manifest-plugin');
const webpackConf = {
    output: {
        path: '<resolve the clientlib path here>',
        filename: 'js/[name].bundle.js',
        chunkFilename: 'js/[name].[hash:8].js',
        publicPath: '/etc/company/clientlibs/yourlib',
    },
    plugins: [
            new ManifestPlugin({
                fileName: 'asset-manifest.json'
            })
    ]
}
```

##### Make sure your system has write privileges to the clientLibrary path

You might need to CHMOD / icacls the clientlib folder so the script can write.
If it cannot it will throw an error.

##### Add an NPM script:

Package.json:
```json5
{
    "scripts":{
        "start-aempack": "node scripts/aempack.js",
        "start-aempack-pub": "cross-env PROXYHOST=local.yoursite.com AEMPORT=4503 cross-env NODE_ENV=development npm-run-all -p start-aempack"
    },
    "devDependencies": {
        "aempack": "^1.0.2",
        "cross-env": "^5.2.0",
        "npm-run-all": "^4.1.5",
        "webpack-manifest-plugin": "2.0.4",
    }
}
```

scripts/aempack.js:
```javascript

'use strict';
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const paths = require('../paths');
const aemPack = require('aempack');

const webpackConfig = require('./../webpack.aem-dev');

const user = process.env.AEMUSER  || 'admin';
const password = process.env.AEMPW || 'admin';

const aemPort = process.env.AEMPORT || 4502;
const aemHost = process.env.AEMHOST || 'localhost';


const proxyHost = process.env.PROXYHOST || 'localhost';
const proxyPort = process.env.PROXYPORT || 443;

const computeProxyUrl = () => {

    const port = proxyPort === 80 ? '' : ':' + aemPort;
    return 'http://' + proxyHost + port;
};


aemPack({
    browserSync: {
        https: true,
        enabled: true,
        sendDispatcherHeader: true,
        proxyUrl: computeProxyUrl(),
        proxyPort: proxyPort
    },
    webpackConfig: webpackConfig,
    aemProtocol: 'http',
    aemHost: aemHost,
    aemPort: aemPort,
    aemUser: user,
    aemPassword: password,

    verbose: true,

    clientLibRelativePath: paths.clientLibRelativePath,
    clientLibAbsolutePath: paths.clientLibRoot,

});

```


##### Make sure the 'clientLibrary' is allowed in the filters.xml and load in the 'critical' chunks server-side

What we are pushing to AEM is not really a real clientLibrary, it's just a folder containing the files generated by webpack.
So how do we load in the JS/CSS files in AEM ? Because they have a hash, and the js.txt / css.txt cannot know these hashes!
Well, we won't be using the js.txt or the css.txt.

What we need to do is write a service (again example on wknd branch above) that loads in the asset-manifest.json file and outputs the scripts in the body.
You only need to put in the critical chunks, the other chunks will be loaded in automatically by webpack.

In case of server-side rendering, for example with adobeIo:

-You'll want to put the needed chunks directly into HTML so they can start loading immediately
-Use flushChunks / chunkCollector to collect chunks for the requested page
-Return these in the return json, load these in and output these in the HTML

##### Execute!

Make your your AEM instance is started.

For the author you will be good to go, just execute "npm run start-aempack".

For working on the publisher I recommend to work as close to a production 'mode' as possible.

* For this, configure your hostfile to include a local, fake domain. In this case we use the fake domain local.yoursite.com.
* Use https if need be (usually that is a yes these days) in browserSync as shown above.
* Add sling mappings (example can be used from the wknd branch I linked above) so you get mapped URL's.
* Access the URL in your browser: https://local.yoursite.com/page.html  , go past the SSL error
* Your good to go!


### Options

Default values are given in below json and are fully configurable. 

```json5
{
    /** Delays to control the flow of the plugin **/
    delays: {
        postCompiledDebounceDelay: 1000, // delay before pushing to aem after webpack has finished compiling.
        serverSpawnDelay: 500, // delay before (re)spawning the server
        folderPushDelay: 250, // delay in MS between each folder 'push'. 
    },
    /** Callbacks that can be hooked in. Put in a function and it will be executed **/
    callbacks: {
        //before pushing a folder (argument: task) . if you return false it won't push.
        onAemPush: null, 
        onBrowserRefresh: null, //after refreshing browser
        onError: null, // arguments: error
        payloadsGathered: null, //arguments, combined payloads array
        onServerStdOutCallback: null, 
        onServerStErrorOutCallback: null,
        onServerCloseCallback: null
    },
    // Default specified browserSync options. 
    browserSync: {  
        enabled: true,
        overrides: {
            /** Put your options from  https://browsersync.io/docs/options
            * in here to override / extend the default options.**/
        },
        https: false,
        //send a dispatcher header over in the requests to simulate the dispatcher
        sendDispatcherHeader: true,
        proxyPort: 443
    },
    /** Your client webpack configuration. Required. **/
    webpackConfig: {
        devtool: 'inline-source-map'
    },
     /** Your client webpack configuration. Optional. **/
    webpackServerConfig: null,
    
     /** Disable server side rendering even though webpackServerConfig is present. 
     ** Useful for process parameters. **/
    disableServerSideRendering: false,

    /** Specify a custom assetManifestPath. Optional. **/
    
    assetManifestPath: null,
    
    /** Disable cleanup of old generated files 
    ** (this can cause a lot of files to be generated and pushed to AEM) 
    **/
    disableCleanup: false,
    
    /** Regex statement that will be executed on files that are not found in the asset-manifest, 
     * on whether they should be deleted by the cleanup run. 
    **/
    
    eligibleForCleanUpRegex: '(.*)(\\.(js|css))$',
    /** A function that can be passed to determine whether a file should be cleaned up or not. 
    * Must return true or false. Arguments: folder,fileName, eligibleForCleanUpRegex,stats
    **/
    customCleanUpEligibilityCheck: null,

    /** Underlying protocol on which AEM can be reached to push the files**/
    aemProtocol: 'http',
    aemHost: 'localhost',
    aemPort: 4502,

    /** Proxy URL. This is what browserSync will use to access the site. 
    ** You can use your fake local domain to simulate the dispatcher.
    **/
    proxyUrl: null,

    aemUser: 'admin',
    aemPassword: 'admin',

    // Prints out all statements
    verbose: false,

    // Relative path of the clientlib: '/etc/company/clientlibs/yourlib'. Required!
    clientLibRelativePath: null,
    
    // Absolute path of the clientlib to which nodejs has read / write access to. 
    clientLibAbsolutePath: null,
    
    /* Success message that your server script will output if the server is running.
    ** If the script detects this message it will know 
    ** the server is ready so the browser can be reloaded. */
    serverOutputSuccessMessage: 'listening on port',
    
    /* Custom explicit, absolute path to the javascript file. 
    * If not configured, will use webpackServerConfig to resolve the path.
    */
    pathToServerJsFile: null
}
```
 ### Demo
 
[![Demo](https://img.youtube.com/vi/TMkUJHDk10g/0.jpg)](https://www.youtube.com/watch?v=TMkUJHDk10g)


LEGAL DISCLAIMER: I (the author) am a employee from Adobe, and Adobe holds the full rights over this plugin.
However, this plugin is not a officially supported Adobe plugin.
Adobe is not liable for any (indirect) damages, development downtime, or otherwise that might incur.
Adobe cannot and will not guarantee that the plugin will be maintained and compatible with latest software developments.
Use at your own risk.