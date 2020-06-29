/* jshint esversion: 8 */

const { aboutFileFromPackageJson } = require("@labzdjee/about-from-json-package");

const packageJson = require("./package.json");

aboutFileFromPackageJson(
  packageJson,
  {
    name: null,
    version: null,
    description: null,
    author: {
      name: null,
    },
    dependencies: {
      "@labzdjee/agc-util": null,
      buefy: null,
      "core-js": null,
      vue: null,
      vuex: null,
    },
    devDependencies: {
      electron: null,
    },
  },
  "./src/electron-main/about.json"
);
