const axios = require("axios");
const rateLimit = require("axios-rate-limit");

class ThunderstoreApi {
  #index = null;
  #thunderstore;
  #rateLimitErrorCode = 429;
  #oneminute = 60000;
  #baseUrl = "https://thunderstore.io/c/valheim"; // base url for Valheim thunderstore
  #modPackage = `${this.#baseUrl}/api/experimental/package`; // This is the url for a single package
  #indexUrl = `${this.#baseUrl}/api/v1/package`; // very large index. 160k entries;

  constructor() {
    this.#thunderstore = rateLimit(axios.create(), {
      maxRequests: 1,
      perMilliseconds: 1000,
    });
  }

  async fetchModData(mod) {
    const response = await this.#thunderstore.get(
      `${this.#modPackage}/${mod.namespace}/${mod.name}/`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    return response.data;
  }

  parseModString(modString) {
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

  // Initially written for experimental API, can be seriously simplified
  async fetchIndex() {
    const response = await this.#thunderstore
      .get(this.#indexUrl, {
        headers: {
          "Accept-Encoding": "gzip",
        },
      })
      .then((res) => {
        console.log(`Index fetched, ${res.data.length} entries`);
        // console.log(JSON.stringify(res.data, null, 2)); // Debugging info, uncomment to view res.data as JSON (or any other format you like);
        this.#index = res.data;
        return;
      })
      .catch((error) => {
        console.error(error);
      });
    return response;
  }
  // -> index of packages
  async checkforUpdate(mod) {
    if (this.#index === null) {
      // Guard clause to ensure that index is fetched
      await this.fetchIndex();
    }

    // TODO: implement mapKey() in array filtering (if needed, might just skip with indexEntry.k === mod.k)

    // function mapKey(key) {
    //   const keyMap = {
    //     name: "name",
    //     owner: "author",
    //   };
    // }

    // TODO: search index for mod, mod has {name, author, version}, index has {name, owner, versions[version_number]}
    const modIndex = this.#index.find(
      (indexEntry) =>
        indexEntry.name === mod.name && indexEntry.owner === mod.author,
      // TODO: add logic to check if package is up to date
    );
  }

  async fetchDependencies(deps) {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    if (deps.length === 0) {
      console.log("Error: No Dependencies");
      return;
    }
    for (const modString of deps) {
      try {
        const mod = this.parseModString(modString);
        const data = await this.fetchModData(mod);
        if (data.latest.version_number === mod.version_number) {
          console.log(`${mod.name}: version matches: ${mod.version_number}`);
        } else {
          console.log(
            `${mod.name}: new version available: ${mod.version_number} -> ${data.latest.version_number}`,
          );
        }
      } catch (error) {
        if (
          error.response &&
          error.response.status === this.#rateLimitErrorCode
        ) {
          console.log("Rate limit exceeded, waiting for 60 seconds");
          await delay(this.#oneminute); // Wait for 60 seconds
        } else {
          console.error(error);
        }
      }
    }
  }
}
exports.ThunderstoreApi = ThunderstoreApi;
