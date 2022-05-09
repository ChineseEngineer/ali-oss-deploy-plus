const path = require('path')
const chalk = require("chalk");
const semver = require("semver");
const inquirer = require("inquirer");
const minimist = require("minimist");
const execa = require("execa");
const fs = require('fs');

const pkg = require(path.resolve("package.json"));
const curVersion = pkg.version;

const publish = async () => {
  console.log(`npm publish...`);
  console.log(`Current version: ${chalk.yellow(curVersion)}`);

  execa("npm", ["publish"], { stdio: "inherit" })
};

publish().catch((err) => {
  console.log(err);
  process.exit(1); // 终止进程
});
