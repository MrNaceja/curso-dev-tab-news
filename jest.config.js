const nextJest = require("next/jest");
const env = require("dotenv");

env.config({
  path: ".env.development",
});

const withNextPowers = nextJest({
  dir: ".",
});
const jestConfig = withNextPowers({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = jestConfig;
