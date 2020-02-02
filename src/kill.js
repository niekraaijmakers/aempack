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

const psTree = require('ps-tree');
const cp = require('child_process');
const isWin = /^win/.test(process.platform);

const kill = (pid, signal, callback)  => {
    signal   = signal || 'SIGKILL';
    callback = callback || function () {};
    const killTree = true;
    if(killTree) {
        psTree(pid, function (err, children) {
            [pid].concat(
                children.map(function (p) {
                    return p.PID;
                })
            ).forEach(function (tpid) {
                try { process.kill(tpid, signal) }
                catch (ex) { }
            });
            callback();
        });
    } else {
        try { process.kill(pid, signal) }
        catch (ex) { }
        callback();
    }
};

module.exports = function(pid, signal){
    return new Promise((resolve) => {
        if(!isWin) {
            kill(pid, signal, resolve);
        } else {
            cp.exec('taskkill /PID ' + pid + ' /T /F', function (error, stdout, stderr) {
                resolve();
            });
        }
    })

};

