/* jshint esversion: 8 */

import { app, protocol, BrowserWindow, Menu, ipcMain, dialog } from "electron";
import {
  createProtocol,
  /* installVueDevtools */
} from "vue-cli-plugin-electron-builder/lib";

import { openFile } from "./process";

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);

function createWindow() {
  // Create the browser window
  win = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false,
  });

  ipcMain.on("set-title", function(e, t) {
    win.setTitle(t);
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    // if (!process.env.IS_TEST) {
    //   win.webContents.openDevTools();
    // }
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  win.once("ready-to-show", () => {
    win.show();
  });

  win.on("closed", () => {
    win = null;
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

const env = process.env;
const aboutStr = `${env.npm_package_name} v${env.npm_package_version}
Description: ${env.npm_package_description}
______________
Author: Gérard Gauthier
Main resources:
 Electron: ${env.npm_package_devDependencies_electron.substring(1)}
 Vue: ${env.npm_package_dependencies_vue.substring(1)}
 Vuex: ${env.npm_package_dependencies_vuex.substring(1)}
 Buefy: ${env.npm_package_dependencies_buefy.substring(1)}
`;

const template = [
  {
    label: "File",
    submenu: [
      {
        label: "Load AGC...",
        click() {
          openFile();
        },
      },
    ],
  },
  {
    label: "Edit",
    submenu: [
      {
        label: "Copy",
        accelerator: "CommandOrControl+C",
        role: "copy",
      },
      {
        label: "Paste",
        accelerator: "CommandOrControl+V",
        role: "paste",
      },
      {
        label: "Default everything",
        click() {
          win.webContents.send("store-mutation", "setDefault", "/.*/");
        },
      },
    ],
  },
  {
    label: "About...",
    click() {
      dialog.showMessageBox({ message: aboutStr, title: "about...", type: "info", buttons: ["ok"] });
    },
  },
];

if (process.env.NODE_ENV !== "production") {
  template.push({
    label: "Developer Tools",
    submenu: [
      {
        role: "reload",
      },
      {
        label: "Toggle DevTools",
        accelerator: "Ctrl+I",
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        },
      },
    ],
  });
}

const applicationMenu = Menu.buildFromTemplate(template);

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  Menu.setApplicationMenu(applicationMenu);

  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
