/* jshint esversion: 9 */
/* jshint -W014 */

import path from "path";
import fs from "fs";
import { app, dialog, ipcMain } from "electron";

import obj11Defaults from "../store/cfg11Defaults";
import { analyzeAgcFile, findInAgcFileStruct } from "@labzdjee/agc-util";
import { applicationMenu, updateTitle, win } from "./background";

let currentPath = app.getPath("documents");

let persist = null;
const persistFilename = path.resolve(app.getPath("userData"), "persist.json");

// nanagement of persistance

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

// static data
const currentFile = {
  name: null,
  lines: null,
  struct: null,
  edited: false,
  classVersion: null,
};

// interaction with Vue store
ipcMain.on("notify-of-new-values", function(e, arrayOfObjects) {
  if (currentFile.name === null) return;
  arrayOfObjects.forEach((object) => {
    for (let attributeName in object.objectValue) {
      if (object.objectName === "SYSVAR" && attributeName === "EventEnableMsb") {
        attributeName = "EventEnable";
      }
      const structObject = findInAgcFileStruct(
        { object: object.objectName, attribute: attributeName },
        currentFile.struct
      );
      if (structObject !== null) {
        if (object.objectName === "SYSVAR" && attributeName === "EventEnable") {
          currentFile.lines[structObject.line - 1] = `${object.objectName}.${
            structObject.readOnly ? "!" : ""
          }${attributeName} = "${object.objectValue.EventEnableMsb}${structObject.value.substring(2)}"`;
        } else {
          currentFile.lines[structObject.line - 1] = `${object.objectName}.${
            structObject.readOnly ? "!" : ""
          }${attributeName} = "${object.objectValue[attributeName]}"`;
        }
      }
    }
  });
});

function setStoreContents() {
  if (currentFile.struct === null) {
    return;
  }
  const objects = {};
  for (let object in obj11Defaults) {
    objects[object] = {};
    if (object === "SYSVAR") {
      objects[object].EventEnableMsb = findInAgcFileStruct(
        { object, attribute: "EventEnable" },
        currentFile.struct
      ).value.substring(0, 2);
    } else {
      for (let attribute in obj11Defaults[object]) {
        objects[object][attribute] = findInAgcFileStruct({ object, attribute }, currentFile.struct).value;
      }
    }
  }
  win.webContents.send("store-mutation", "storeFullConfig", objects);
}

// object/attribute of locations where to insert/update objects at level 11 (when missing)
const insertionPoints = [
  { object: "SYSVAR", attribute: "EventEnable" },
  { object: "COMMUN2", attribute: "ModemType" },
  { object: "EVT_48", attribute: "LocalText" },
  { object: "EQ_16", attribute: "ModbusMultiplier" },
  { object: "EQCTRL", attribute: "OnCommonRelay" },
  { object: "REGISTRY", attribute: "SpecialTemperatureProbe" },
  { object: "SYSTEM", attribute: "InRevPol" },
];

// helpers for load file dialog
function injectObj11IntoAgcStructAndLines(agcStruct, lines) {
  const alterationPoints = insertionPoints.reduce(function(result, findHint) {
    result[findHint.object] = findInAgcFileStruct(findHint, agcStruct);
    if (result[findHint.object] === null) {
      throw `unexpected failure in injectObj11IntoAgcStructAndLines:findInAgcFileStruct for ${findHint}`;
    }
    return result;
  }, {});
  function injectArrayAtLine(array, line) {
    lines.splice(line, 0, ...array);
    for (let objectName in alterationPoints) {
      const attribute = alterationPoints[objectName];
      if (attribute.line > line) {
        attribute.line += array.length;
      }
    }
  }
  if (typeof currentFile.classVersion !== "number") {
    throw "injectObj11IntoAgcStruct called when currentFile version was not defined";
  }
  if (currentFile.classVersion >= 11) {
    return null;
  }
  let classVrsLine = findInAgcFileStruct({ metaTag: "ClassVrs" }, agcStruct)[0].line;
  lines[classVrsLine - 1] = `$ClassVrs = "11"`;
  classVrsLine = findInAgcFileStruct({ section: "GCAUCalibrationData", metaTag: "ClassVrs" }, agcStruct)[0].line;
  lines[classVrsLine - 1] = `$ClassVrs = "11"`;
  let arrayToInject;
  let alter;
  // SYSVAR and ANIX
  alter = alterationPoints.SYSVAR;
  lines[alter.line - 1] = `SYSVAR.${alter.name} = "${obj11Defaults.SYSVAR.EventEnableMsb}${alter.value}"`;
  arrayToInject = [];
  for (let instanceNb = 1; instanceNb <= 4; instanceNb++) {
    arrayToInject.push("");
    const obj = `ANIX_${instanceNb}`;
    for (let attr in obj11Defaults[obj]) {
      arrayToInject.push(`${obj}.${attr} = "${obj11Defaults[obj][attr]}"`);
    }
  }
  injectArrayAtLine(arrayToInject, alter.line);
  // SYSTEX
  arrayToInject = [""];
  alter = alterationPoints.SYSTEM;
  for (let attr in obj11Defaults.SYSTEX) {
    arrayToInject.push(`SYSTEX.${attr} = "${obj11Defaults.SYSTEX[attr]}"`);
  }
  injectArrayAtLine(arrayToInject, alter.line);
  // EQCTRL
  arrayToInject = [];
  alter = alterationPoints.EQCTRL;
  for (let attr in obj11Defaults.EQCTRL) {
    arrayToInject.push(`EQCTRL.${attr} = "${obj11Defaults.EQCTRL[attr]}"`);
  }
  injectArrayAtLine(arrayToInject, alter.line);
  // EVT_49
  arrayToInject = [];
  alter = alterationPoints.EVT_48;
  for (let instanceNb = 49; instanceNb <= 56; instanceNb++) {
    arrayToInject.push("");
    const obj = `EVT_${instanceNb}`;
    for (let attr in obj11Defaults[obj]) {
      arrayToInject.push(`${obj}.${attr} = "${obj11Defaults[obj][attr]}"`);
    }
  }
  injectArrayAtLine(arrayToInject, alter.line);
  // EQ_17
  arrayToInject = [];
  alter = alterationPoints.EQ_16;
  for (let instanceNb = 17; instanceNb <= 24; instanceNb++) {
    arrayToInject.push("");
    const obj = `EQ_${instanceNb}`;
    for (let attr in obj11Defaults[obj]) {
      arrayToInject.push(`${obj}.${attr} = "${obj11Defaults[obj][attr]}"`);
    }
  }
  injectArrayAtLine(arrayToInject, alter.line);
  // COMMUN2
  alter = alterationPoints.COMMUN2;
  injectArrayAtLine([`COMMUN2.AltAsciiModbusParity = "${obj11Defaults.COMMUN2.AltAsciiModbusParity}"`], alter.line);
  // REGISTRY
  alter = alterationPoints.REGISTRY;
  injectArrayAtLine([`REGISTRY.ProjectReference = "${obj11Defaults.REGISTRY.ProjectReference}"`], alter.line);

  return analyzeAgcFile(lines);
}

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
          if (classVersion >= 11) {
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
      : `File name: ${currentFile.name}\nInitial class version: ${currentFile.classVersion}\nEdited value(s) not saved: ${edited}`;
  dialog.showMessageBox({ type: "info", buttons: ["OK"], message, title: "AGC File Properties" });
}

const /* file dialog */ filters = [
    { name: "AGC", extensions: ["agc"] },
    { name: "Text", extensions: ["txt", "text"] },
    { name: "All Files", extensions: ["*"] },
  ];

export function openFile() {
  const files = dialog.showOpenDialogSync({
    properties: ["openFile"],
    filters,
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
      let agcStruct = analyzeAgcFile(lines);
      const classVersion = analyzeConsitencyOfStruct(agcStruct);
      currentFile.name = fileName;
      currentFile.lines = lines;
      currentFile.struct = agcStruct;
      currentFile.classVersion = classVersion;
      agcStruct = injectObj11IntoAgcStructAndLines(agcStruct, lines);
      if (agcStruct !== null) {
        currentFile.struct = agcStruct;
      } else {
        agcStruct = currentFile.struct;
      }
      const projectRef = findInAgcFileStruct({ object: "REGISTRY", attribute: "ProjectReference" }, agcStruct);
      if (projectRef.value === "") {
        const idNum = findInAgcFileStruct({ metaTag: "IDNum" }, agcStruct)[0];
        if (idNum !== null) {
          projectRef.value = idNum.value;
          lines[projectRef.line - 1] = `REGISTRY.ProjectReference = "${idNum.value}"`;
        }
      }
      setStoreContents();
      updateTitle(path.basename(fileName));
      applicationMenu.getMenuItemById("saveAgc").enabled = true;
      applicationMenu.getMenuItemById("agcProperties").enabled = true;
    } catch (e) {
      let message;
      if (e.explicit && e.category) {
        message = `Fatal error in analyzing ${fileName} at line ${e.line}\n Details: ${e.explicit}`;
      } else {
        message = `Fatal exception: ${e}`;
      }
      dialog.showMessageBoxSync(win, { type: "error", buttons: ["OK"], message, title: "Failure" });
    }
  }
}

export function save() {
  try {
    const data = currentFile.lines.join("\r\n");
    fs.writeFileSync(currentFile.name, data);
  } catch (e) {
    const message = e.toString();
    dialog.showMessageBoxSync(win, { type: "error", buttons: ["OK"], message, title: "Failure" });
  }
}

export function saveAs() {
  // Checks here, please!!!
  const file = dialog.showSaveDialogSync(win, {
    title: "Save AGC as... Pick or type a file name",
    filters,
    dontAddToRecent: true,
  });
  if (typeof file === "string") {
    try {
      const data = currentFile.lines.join("\r\n");
      fs.writeFileSync(file, data);
    } catch (e) {
      const message = e.toString();
      dialog.showMessageBoxSync(win, { type: "error", buttons: ["OK"], message, title: "Failure" });
    }
  }
}

export function testIfCannotQuit() {
  return (
    dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["Yes", "No"],
      message: "Edited data not saved. Quit anyway?",
      title: "Need confirmation...",
    }) === 1
  );
}
