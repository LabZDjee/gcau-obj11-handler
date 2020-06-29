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

// management of persistance

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
  initial: true,
  classVersion: null,
  initialSnap: null,
  lastSavedSnap: null,
};

// interaction with Vue store
ipcMain.on("notify-of-new-values", async function(e, arrayOfObjects) {
  if (currentFile.name === null) {
    return;
  }
  arrayOfObjects.forEach((object) => {
    for (let attributeName in object.objectValue) {
      if (object.objectName === "SYSVAR" && attributeName === "EventEnableMsb") {
        attributeName = "EventEnable";
      }
      const structObject = findInAgcFileStruct(
        { object: object.objectName, attribute: attributeName },
        currentFile.struct
      );
      let value;
      if (object.objectName === "SYSVAR" && attributeName === "EventEnable") {
        value = `${object.objectValue.EventEnableMsb}${structObject.value.substring(2)}`;
      } else {
        value = object.objectValue[attributeName];
      }
      currentFile.lines[structObject.line - 1] = `${object.objectName}.${
        structObject.readOnly ? "!" : ""
      }${attributeName} = "${value}"`;
      structObject.value = value;
    }
  });
  const snap = snapCls11Objects();
  currentFile.edited = compareCls11Snaps(currentFile.lastSavedSnap, snap).length > 0;
  currentFile.initial = compareCls11Snaps(currentFile.initialSnap, snap).length === 0;
  applicationMenu.getMenuItemById("undoToLastSavedValues").enabled = currentFile.edited;
  applicationMenu.getMenuItemById("undoToInitialValues").enabled = !currentFile.initial;
  updateFlagsAndMenuAndTitle();
});

export async function undoToLastSavedValues() {
  applyCls11Snap(currentFile.lastSavedSnap);
  updateFlagsAndMenuAndTitle();
}

export async function undoToInitialValues() {
  applyCls11Snap(currentFile.initialSnap);
  updateFlagsAndMenuAndTitle();
}

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
function analyzeConsistencyOfStruct(agcStruct) {
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

// snap management (snap is a copy of objects/attributes and their values)
function snapCls11Objects() {
  const result = {};
  for (let object in obj11Defaults) {
    result[object] = {};
    for (let attribute in obj11Defaults[object]) {
      if (object === "SYSVAR" && attribute === "EventEnableMsb") {
        attribute = "EventEnable";
      }
      const structObject = findInAgcFileStruct({ object, attribute }, currentFile.struct);
      result[object][attribute] = structObject.value;
    }
  }
  return result;
}

// sync everything (currentFile.lines, currentFile.struct, and Vue store) with parameter 'snap'
function applyCls11Snap(snap) {
  for (let object in snap) {
    for (let attribute in snap[object]) {
      const structObject = findInAgcFileStruct({ object, attribute }, currentFile.struct);
      structObject.value = snap[object][attribute];
      currentFile.lines[structObject.line - 1] = `${object}.${structObject.readOnly ? "!" : ""}${attribute} = "${
        structObject.value
      }"`;
    }
  }
  setStoreContents();
}

// compares Cls11snaps
// returns an object with the following props:
//  length: number of differences
//  objects: an object composed of object names as props
//           and an array of attribute names which are found different
function compareCls11Snaps(snap1, snap2) {
  const differences = { length: 0, objects: {} };
  for (let objectName in snap1) {
    for (let attributeName in snap1[objectName]) {
      if (snap1[objectName][attributeName] !== snap2[objectName][attributeName]) {
        if (differences[objectName] === undefined) {
          differences.objects[objectName] = [];
        }
        differences.objects[objectName].push(attributeName);
        differences.length++;
      }
    }
  }
  return differences;
}

export function displayFileProperties() {
  const edited = currentFile.edited ? "yes" : "no";
  const initial = currentFile.initial ? "yes" : "no";
  const message =
    currentFile.name === null
      ? "No file currently loaded!"
      : `File name: ${currentFile.name}
Initial class version: ${currentFile.classVersion}
Edited value(s) not yet saved: ${edited}
Contents same as initially loaded file contents: ${initial}`;
  dialog.showMessageBox({ type: "info", buttons: ["OK"], message, title: "AGC File Properties" });
}

const /* file dialog */ filters = [
    { name: "AGC", extensions: ["agc"] },
    { name: "Text", extensions: ["txt", "text"] },
    { name: "All Files", extensions: ["*"] },
  ];

export function openFile() {
  if (currentFile.edited) {
    if (
      dialog.showMessageBoxSync(win, {
        type: "question",
        buttons: ["Yes", "No"],
        message: "Edited data not saved. Throw them away?",
        title: "Need confirmation...",
      }) === 1
    ) {
      return false;
    }
  }
  const files = dialog.showOpenDialogSync({
    properties: ["openFile"],
    title: "Open AGC file...",
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
      const lines = rawContents.toString("latin1").split(/\r?\n/);
      let agcStruct = analyzeAgcFile(lines);
      const classVersion = analyzeConsistencyOfStruct(agcStruct);
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
      applicationMenu.getMenuItemById("agcProperties").enabled = true;
      applicationMenu.getMenuItemById("saveAgc").enabled = true;
      applicationMenu.getMenuItemById("saveAgcAs").enabled = true;
      applicationMenu.getMenuItemById("undoToLastSavedValues").enabled = false;
      applicationMenu.getMenuItemById("undoToInitialValues").enabled = false;
      currentFile.initialSnap = snapCls11Objects();
      currentFile.lastSavedSnap = snapCls11Objects();
      currentFile.edited = false;
      currentFile.initial = true;
    } catch (e) {
      let message;
      if (e.explicit && e.category) {
        message = `Fatal error in analyzing ${fileName} at line ${e.line}\n Details: ${e.explicit}`;
      } else {
        message = `Fatal exception: ${e}`;
      }
      dialog.showMessageBoxSync(win, { type: "error", buttons: ["OK"], message, title: "Failure" });
      return false;
    }
    return true;
  }
  return false;
}

export function save() {
  try {
    const data = currentFile.lines.join("\r\n");
    fs.writeFileSync(currentFile.name, data, "latin1");
    currentFile.edited = false;
    currentFile.lastSavedSnap = snapCls11Objects();
    updateTitle(path.basename(currentFile.name));
    applicationMenu.getMenuItemById("undoToLastSavedValues").enabled = false;
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
      fs.writeFileSync(file, data, "latin1");
      currentFile.name = file;
      currentFile.edited = false;
      currentFile.lastSavedSnap = snapCls11Objects();
      currentFile.classVersion = 11;
      updateTitle(path.basename(file));
      applicationMenu.getMenuItemById("undoToLastSavedValues").enabled = false;
      applicationMenu.getMenuItemById("undoToInitialValues").enabled = true;
    } catch (e) {
      const message = e.toString();
      dialog.showMessageBoxSync(win, { type: "error", buttons: ["OK"], message, title: "Failure" });
    }
  }
}

async function updateFlagsAndMenuAndTitle() {
  const currentSnap = snapCls11Objects();
  currentFile.edited = compareCls11Snaps(currentFile.lastSavedSnap, currentSnap).length !== 0;
  currentFile.initial = compareCls11Snaps(currentFile.initialSnap, currentSnap).length === 0;
  applicationMenu.getMenuItemById("undoToLastSavedValues").enabled = currentFile.edited;
  applicationMenu.getMenuItemById("undoToInitialValues").enabled = !currentFile.initial;
  win.webContents.send("query-is-default");
  const isDefault = await new Promise((resolve) => {
    ipcMain.once("reply-is-default", (e, result) => {
      resolve(result);
    });
  });
  let editionMark = "";
  if (currentFile.edited) {
    editionMark = isDefault ? " ▼" : " ▲";
  }
  updateTitle(`${path.basename(currentFile.name)}${editionMark}`);
}

export function testIfCannotQuit() {
  if (currentFile.name !== null) {
    if (currentFile.edited === false) {
      return false;
    }
  } else {
    return false;
  }
  return (
    dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["Yes", "No"],
      message: "Edited data not saved. Quit anyway?",
      title: "Need confirmation...",
    }) === 1
  );
}
