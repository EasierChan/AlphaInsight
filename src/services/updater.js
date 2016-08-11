

(function () {
    'use strict';

    const autoUpdater = require('electron').autoUpdater;

    autoUpdater.on('error', function (error) {
        if (error) throw error;
    })
    // Sets the  url  and initialize the auto updater.
    autoUpdater.setFeedURL("https://github.com/EasierChan/AlphaInsight");;
    // Asks the server whether there is an update. You must call  setFeedURL  before using this API.
    //autoUpdater.checkForUpdates();

    autoUpdater.on('checking-for-update', function () {
        console.log("check for update");
    });

    autoUpdater.on('update-available', function () {
        console.log("have new version.");
    });

    autoUpdater.on('update-not-available', function () {
        console.log("Current is the newest.")
    });

    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateURL) {
        console.log("the update is downloaded.");
        console.log(releaseName);
    });

    if (require('electron-squirrel-startup')) return;


    const app = require('electron').app;
    // NB: This prevents Win10 from showing dupe items in the taskbar 
    app.setAppUserModelId('com.squirrel.alphainsight.alphainsight'); 

    // // this should be placed at top of main.js to handle setup events quickly
    // if (handleSquirrelEvent()) {
    //     // squirrel event handled and app will exit in 1000ms, so don't do anything else
    //     return;
    // }
    handleStartupEvent();
    // squirrel
    function handleStartupEvent() {
        if (process.argv.length === 1) {
            return false;
        }

        const ChildProcess = require('child_process');
        const path = require('path');

        const appFolder = path.resolve(process.execPath, '..');
        const rootAtomFolder = path.resolve(appFolder, '..');
        const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
        const exeName = path.basename(process.execPath);

        const spawn = function (command, args) {
            let spawnedProcess, error;

            try {
                spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
            } catch (error) { }

            return spawnedProcess;
        };

        const spawnUpdate = function (args) {
            return spawn(updateDotExe, args);
        };

        const squirrelEvent = process.argv[1];
        switch (squirrelEvent) {
            case '--squirrel-install':
            case '--squirrel-updated':
                // Optionally do things such as:
                // - Add your .exe to the PATH
                // - Write to the registry for things like file associations and
                //   explorer context menus

                // Install desktop and start menu shortcuts
                spawnUpdate(['--createShortcut', app.getName()]);

                setTimeout(app.quit, 1000);
                return true;

            case '--squirrel-uninstall':
                // Undo anything you did in the --squirrel-install and
                // --squirrel-updated handlers

                // Remove desktop and start menu shortcuts
                spawnUpdate(['--removeShortcut', app.getName()]);

                setTimeout(app.quit, 1000);
                return true;

            case '--squirrel-obsolete':
                // This is called on the outgoing version of your app before
                // we update to the new version - it's the opposite of
                // --squirrel-updated

                app.quit();
                return true;
        }
    };
}).call(this);