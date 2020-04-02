// cliBuildCommand: null,
//     cliBuildServerCmd: null,
const webpack = require('webpack');
const path = require('path');
const spawn = require('cross-spawn');

const initiateWatch = (parameters,developWithSSR, callback) => {

    const useWebPack = (parameters.webpackConfig);

    if(useWebPack){

        const compiler = (developWithSSR) ?
            webpack([parameters.webpackConfig, parameters.webpackServerConfig]) :
            webpack(parameters.webpackConfig);

        compiler.watch({
            ignored: [
                path.resolve(__dirname, 'dist'),
                path.resolve(__dirname, 'node_modules')
            ]
        }, callback);
    }else{
        const child = spawn(parameters.cliBuildCommand, parameters.cliBuildCommandArgs);
        child.stdout.on('data', (data) => {

            const stringified =`${data}`;
            console.log(stringified);
            if(stringified.includes(parameters.cliBuildCommandSuccessMsg)){
                callback();
            }
        });

        child.stderr.on('data', (data) => {
            const stringified =`${data}`;
            callback(stringified);
        });
    }
};

module.exports = initiateWatch;