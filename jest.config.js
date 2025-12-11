const nextJest = require("next/jest");
const env = require("dotenv");

const MAX_TEST_TIMEOUT_IN_SECONDS = 60;

env.config({
  path: ".env.development",
});

const withNextPowers = nextJest({
  dir: ".",
});
const jestConfig = withNextPowers({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: MAX_TEST_TIMEOUT_IN_SECONDS * 1000,
});

module.exports = jestConfig;
