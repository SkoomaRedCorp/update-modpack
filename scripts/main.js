const core = require("@actions/core");
const fs = require("fs");
const path = require("path");

function parseModString(modString) {
  const parts = modString.split("-");
  const author = parts[0];
  const name = parts[1].split("-")[0];
  const version = parts[2];
  const mod = {
    author: author,
    name: name,
    version: version,
  };
  return mod;
}

function getModArrayFromManifest(manifest) {
  const modArray = manifest.dependencies;
  let output = [];
  modArray.forEach((modString) => {
    if (modString) {
      const mod = parseModString(modString);
      output.push(mod);
    }
  });
  output.sort((a, b) => a.name.localeCompare(b.name));
  return output;
}

try {
  const modpackpath = core.getInput("modpack");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(modpackpath, "/manifest.json"), "utf8"),
  );
  const dependencies = getModArrayFromManifest(manifest);
} catch (error) {
  console.log(error);
}
