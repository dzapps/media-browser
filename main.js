const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const dialog = electron.dialog;

// Keep a global reference of the window object
let mainWindow

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarStyle: 'hidden'
    });

    // Load the index.html
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object
        mainWindow = null;
    });
}

// Create the window when the app is ready
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // Leave application and menu bar active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // Re-create a window in the app when dock icon is clicked and there are no other windows open
    if (mainWindow === null) {
        createWindow();
    }
});

// Open the file dialog when triggered
ipc.on('open-file-dialog-sheet', (e) => {
    const window = BrowserWindow.fromWebContents(e.sender);

    dialog.showOpenDialog(window, {
        properties: ['openDirectory']
    }, function(files) {
        if (files) e.sender.send('selected-directory', files)
    });
});
