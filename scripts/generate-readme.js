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

function getModArrayFromFile(inputFilePath) {
  let output = [];
  const fileContent = fs.readFileSync(inputFilePath, "utf8");
  const lines = fileContent.split("\n");
  lines.forEach((line) => {
    line = line.trim(); // Remove carriage return characters
    if (line) {
      const mod = parseModString(line);
      output.push(mod);
    }
  });
  output.sort((a, b) => a.name.localeCompare(b.name));
  return output;
}

// Currently unused, but a reminder to use this strategy later
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

//
function generateModSection(sectionName, modArray) {
  const urlPrefix = "https://valheim.thunderstore.io/package";
  let modList = `### ${sectionName}\n\n`;
  for (const mod of modArray) {
    if (mod) {
      const url = `${urlPrefix}/${mod.author}/${mod.name}/${mod.version}/`;
      modList += `- [${mod.name}@${mod.version}](${url})\n`;
    }
  }
  modList += "\n";
  return modList;
}

function main() {
  try {
    // Assign arguments to variables
    const modpackPath = path.join(__dirname, "../../modpack");
    // Convert command-line arguments to variables,
    const manifestPath = `${modpackPath}/manifest.json`;
    const greylistPath = `${modpackPath}/greylist.txt`;
    const dependenciesPath = `${modpackPath}/dependencies.txt`;
    const readmePath = `${modpackPath}/README.md`;

    const manifest = require(manifestPath);

    // Create arrays of mod objects
    const greylist = getModArrayFromFile(greylistPath);
    const dependencies = getModArrayFromFile(dependenciesPath);

    const modpackName = manifest.name;
    const description = manifest.description;
    const version = manifest.version_number;

    // Build the Readme
    console.log(`Building Readme for ${modpackName}...`);
    let readmeMarkdown = `# ${modpackName.replace(/_/g, " ")} \n\n ## Version ${version}\n\n ${description} \n\n`;
    readmeMarkdown += generateModSection("Mandatory Mods", dependencies);
    readmeMarkdown += generateModSection("Greylisted Mods", greylist);
    readmeMarkdown +=
      "\n> Note: When trying to join the official server, do not update mods beyond the version in this modpack.\n";
    fs.writeFileSync(readmePath, readmeMarkdown);

    // Catch errors just in case
  } catch (error) {
    console.log(error);
  }
}

main();
