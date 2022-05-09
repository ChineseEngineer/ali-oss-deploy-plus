const path = require('path')
const chalk = require("chalk");
const semver = require("semver");
const inquirer = require("inquirer");
const minimist = require("minimist");
const execa = require("execa");
const fs = require('fs');

const pkg = require(path.resolve("package.json"));
const curVersion = pkg.version;

const release = async () => {
  console.log(`版本发布...`);
  console.log(`Current version: ${chalk.yellow(curVersion)}`);

  const bumps = ["patch", "minor", "major", "prerelease"];
  const versions = {};
  bumps.forEach((b) => {
    versions[b] = semver.inc(curVersion, b);
  });
  const bumpChoices = bumps.map((b) => ({
    name: `${b} (${versions[b]})`,
    value: b,
  }));

  const cliOptions = minimist(process.argv);

  const { bump, customVersion } = cliOptions["local-registry"]
    ? { bump: "minor" }
    : await inquirer.prompt([
        {
          name: "bump",
          message: "Select release type:",
          type: "list",
          choices: [...bumpChoices, { name: "custom", value: "custom" }],
        },
        {
          name: "customVersion",
          message: "Input version:",
          type: "input",
          when: (answers) => answers.bump === "custom",
        },
      ]);

  const version = customVersion || versions[bump];

  console.log(`Release version: ${chalk.yellow(version)}`);

  const { yes } = cliOptions["local-registry"]
    ? { yes: true }
    : await inquirer.prompt([
        {
          name: "yes",
          message: `Confirm releasing ${version}?`,
          type: "confirm",
        },
      ]);
  if (yes) {
    console.log(chalk.green("yes"));
    console.log(chalk.yellow(version));

    try {
      console.log('npm run build ...')
      execa('npm run build', { stdio: "inherit" })
    } catch (error) {
      throw new Error(error)
    }

    // 修改package.json文件的version字段
    pkg.version = version
    try {
      fs.writeFileSync(path.resolve(__dirname, './package.json'), JSON.stringify(pkg, null, 2))
    } catch (error) {
      throw new Error(error)
    }
        
    try {
      await execa("git", ["add", "-A"], { stdio: "inherit" });
      await execa("git", ["commit", "-m", "chore: pre release sync"], {
        stdio: "inherit",
      });
      console.log(chalk.yellow("版本发布提交成功"));
    } catch (e) {
      // if it's a patch release, there may be no local deps to sync
    }
  }
};

release().catch((err) => {
  console.log(err);
  process.exit(1); // 终止进程
});
