const core = require("@actions/core");
const fs = require("fs");
const path = require("path");
const { ThunderstoreApi } = require("./thunderstoreApi.js");

const thunderstore = new ThunderstoreApi();

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

async function main() {
  try {
    // const modpackpath = core.getInput("modpack");
    // const manifest = JSON.parse(
    // fs.readFileSync(path.join(modpackpath, "/manifest.json"), "utf8"),
    // );
    // const dependencies = getModArrayFromManifest(manifest);
    // thunderstore.fetchDependencies(dependencies);
    const index = await thunderstore.fetchIndex();
    // console.log(JSON.stringify(index, null, 2)); // Debug Information uncomment to see index structure
  } catch (error) {
    console.log(error);
  }
}

main();
