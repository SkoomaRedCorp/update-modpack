const axios = require("axios");
const rateLimit = require("axios-rate-limit");
const chalk = require("chalk");

class ThunderstoreApi {
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
    const thunderstore = rateLimit(axios.create(), {
      maxRequests: 1,
      perMilliseconds: 1000,
    });
    const response = await thunderstore.get(
      `${this.#modPackage}/${mod.namespace}/${mod.name}/`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    return response.data;
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
        console.log(chalk.green(`Index fetched, ${res.data.length} entries`));
        let arr = res.data
          .split("\n")
          .map((str) => {
            try {
              return JSON.parse(str);
            } catch (error) {
              console.error(`Failed to parse JSON: ${str}`);
              return null;
            }
          })
          .filter((item) => item !== null);
        console.log(arr);
        return arr;
      })
      .catch((error) => {
        console.error(error);
      });
    return response;
  }
  // -> index of packages

  async fetchDependencies(deps) {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    if (deps.length === 0) {
      console.log(chalk.red("deps is empty"));
      return;
    }
    for (const dep of deps) {
      try {
        const mod = await this.fetchModData(dep);
        if (mod.latest.version_number === dep.version_number) {
          console.log(
            chalk.cyan(`${mod.name}: version matches: ${dep.version_number}`),
          );
        } else {
          console.log(
            chalk.yellow(
              `${mod.name}: new version available: ${dep.version_number} -> ${mod.latest.version_number}`,
            ),
          );
        }
      } catch (error) {
        if (
          error.response &&
          error.response.status === this.#rateLimitErrorCode
        ) {
          console.log(chalk.red("Rate limit exceeded, waiting for 60 seconds"));
          await delay(this.#oneminute); // Wait for 60 seconds
        } else {
          console.error(error);
        }
      }
    }
  }
}
