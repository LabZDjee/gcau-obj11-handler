/* jshint esversion: 9 */

import path from "path";
import fs from "fs";
import { app, dialog } from "electron";

import obj11Defaults from "../store/cfg11Defaults";
import { analyzeAgcFile, findInAgcFileStruct } from "@labzdjee/agc-util";
import { updateTitle } from "./background";

let currentPath = app.getPath("documents");

let persist = null;
const persistFilename = path.resolve(app.getPath("userData"), "persist.json");

try {
  if (fs.existsSync(persistFilename)) {
    persist = JSON.parse(fs.readFileSync(persistFilename));
    if (persist.defaultDir != undefined) {
      currentPath = persist.defaultDir;
    }
  }
} catch (e) {
  console.log(e);
  persist = null;
}
function writePersist(objectToAddOrUpdate) {
  if (objectToAddOrUpdate !== undefined) {
    if (persist === null) {
      persist = { ...objectToAddOrUpdate };
    } else {
      for (let p in objectToAddOrUpdate) {
        persist[p] = objectToAddOrUpdate[p];
      }
    }
  }
  fs.writeFileSync(persistFilename, JSON.stringify(persist));
}

const currentFile = {
  name: null,
  lines: null,
  struct: null,
  edited: false,
  // one of:
  //  no-file
  //  at-level-11
  //  upgraded-to-level-11
  type: "no-file",
  classVersion: null,
};

const insertionPoints = [
  { object: "SYSVAR", attribute: "EventEnable" },
  { object: "COMMUN2", attribute: "ModemType" },
  { object: "EVT_48", attribute: "LocalText" },
  { object: "EQ_16", attribute: "ModbusMultiplier" },
  { object: "EQCTRL", attribute: "OnCommonRelay" },
  { object: "SYSTEM", attribute: "InRevPol" },
];

// return class version or throws in case of failure in analysis
function analyzeConsitencyOfStruct(agcStruct) {
  let nbMatches = 0;
  let vTags = findInAgcFileStruct({ metaTag: "ClassVrs" }, agcStruct);
  if (vTags === null) {
    throw "AGC file has no $ClassVrs tag: fix this first";
  }
  const classVersionTag = vTags[0].value;
  const classVersion = Number(classVersionTag);
  if (classVersion < 1 || isNaN(classVersion)) {
    throw `Cannot process AGC file with $ClassVrs = "${classVersionTag}"`;
  }
  insertionPoints.forEach((insertionPoint) => {
    if (findInAgcFileStruct(insertionPoint, agcStruct) === null) {
      throw `Cannot process AGC file with $ClassVrs (missing ${insertionPoint.object}.${insertionPoint.attribute})`;
    }
  });
  for (let object in obj11Defaults) {
    if (object === "SYSVAR") {
      const eventEnable = findInAgcFileStruct({ object, attribute: "EventEnable" }, agcStruct);
      if (
        (eventEnable.value.length != 12 && classVersion < 11) ||
        (eventEnable.value.length != 14 && classVersion >= 11)
      ) {
        throw `Cannot process AGC file with $ClassVrs = "${classVersionTag}" (because of SYSVAR.eventEnable)`;
      }
    } else {
      for (let attribute in obj11Defaults[object]) {
        if (findInAgcFileStruct({ object, attribute }, agcStruct) === null) {
          if (nbMatches) {
            throw `AGC file is inconsistent (while checking ${object}.${attribute}): fix it first`;
          }
        } else {
          nbMatches++;
        }
      }
    }
  }
  if (classVersion < 11 && nbMatches) {
    throw "AGC $ClassVrs is inconsistent: should be 11 at least, fix this first";
  }
  if (classVersion >= 11 && nbMatches === 0) {
    throw "AGC $ClassVrs is inconsistent: should be less than 11, fix this first";
  }
  return classVersion;
}

export function displayFileProperties() {
  const edited = currentFile.edited ? "yes" : "no";
  const message =
    currentFile.name === null
      ? "No file currently loaded!"
      : `File name: ${currentFile.name}\nInitial class version: ${currentFile.classVersion}\nEdited value not saved: ${edited}`;
  dialog.showMessageBox({ type: "info", buttons: ["OK"], message, title: "AGC File Properties" });
}

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
    const fileName = files[0];
    const dirName = path.dirname(fileName);
    try {
      const rawContents = fs.readFileSync(fileName);
      currentPath = dirName;
      writePersist({ defaultDir: currentPath });
      const lines = rawContents.toString().split(/\r?\n/);
      const struct = analyzeAgcFile(lines);
      const classVersion = analyzeConsitencyOfStruct(struct);
      currentFile.name = fileName;
      currentFile.lines = lines;
      currentFile.struct = struct;
      currentFile.classVersion = classVersion;
      updateTitle(path.basename(fileName));
    } catch (e) {
      let message;
      if (e.explicit && e.category) {
        message = `Fatal error in analyzing ${fileName} at line ${e.line}\n Details: ${e.explicit}`;
      } else {
        message = `Fatal exception: ${e}`;
      }
      dialog.showMessageBoxSync({ type: "error", buttons: ["OK"], message, title: "Failure" });
    }
  }
}
