/* jshint esversion: 9 */

import path from "path";
import { app, dialog } from "electron";

let currentPath = app.getPath("documents");
let currentFile = null;

export function openFile() {
  const files = dialog.showOpenDialogSync({
    properties: ["openFile"],
    filters: [
      { name: "AGC", extensions: ["agc"] },
      { name: "Text", extensions: ["txt", "text"] },
      { name: "All Files", extensions: ["*"] },
    ],
    defaultPath: currentPath,
  });
  if (files !== undefined) {
    currentFile = files[0];
    currentPath = path.dirname(currentFile);
    const message = `file selected: ${path.basename(currentFile)}\n [path: ${currentPath}]`;
    dialog
      .showMessageBox({ type: "info", buttons: ["OK", "Cancel"], message, title: "confirmation" })
      .then(({ response }) => {
        if (response === 0) {
          console.log(`=> selection of ${currentFile} confirmed...`);
        }
      });
  }
}
