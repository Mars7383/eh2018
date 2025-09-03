const { app, BrowserWindow, clipboard } = require('electron');
const path = require("path");
const { GlobalKeyboardListener } = require("node-global-key-listener")
const listener = new GlobalKeyboardListener();

const createMainWindow = () => {
    let mainWindow;
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInSubFrames: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
        width: 365,
        height: 400,
        closable: true,
        maximizable: false,
        resizable: false,
        frame: false,
        transparent: true,
        hasShadow: false
    });

    const startURL = `file://${path.join(__dirname, 'window.html')}`;

    mainWindow.loadURL(startURL);
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); // mac
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    });

    mainWindow.on('close', () => {
        app.exit();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        app.exit();
    });

    return mainWindow;
};

let window;
app.whenReady().then(() => {
    window = createMainWindow();
});

// alt/option + c to toggle, v to reset, n to close
listener.addListener(function (e, down) {
    if (e.state == "DOWN" && (down["LEFT ALT"] || down["RIGHT ALT"])) {
        if (e.name == "C") {
            if (window.isVisible())
                window.hide();
            else
                window.show();
            
            // restore focus to previous window
            if (process.platform == "darwin") 
                app.hide();
            // else
            //     window.minimize();
        } else if (e.name == "V") {
            window.webContents.send('clipboard-update', "RESET");
        } else if (e.name == "N") {
            window.close();
        }
        return true;
    }
});

let lastText = clipboard.readText();
setInterval(() => {
    const currentText = clipboard.readText();
    if (currentText != lastText) {
        lastText = currentText;
        if (window.isVisible())
            window.webContents.send('clipboard-update', lastText);
    }
}, 250);
