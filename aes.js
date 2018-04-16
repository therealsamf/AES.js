#!/usr/bin/node

const minimist = require('minimist');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const directoryName = path.resolve(__dirname);

/**
 * @description - Starts the AES process
 * @param {Object} args
 */
function start(args) {
  if (args.h || args.help) {
    printUsage();
    return;
  }

  if (args.v || args.version) {
    printVersion();
    return;
  }
}

/**
 * @description - Prints the usage for the user
 */
function printUsage() {
  console.log('Usage: node aes.js [arguments]');
  console.log();
  console.log('Arguments:');
  console.log(chalk.yellow('-v, --version                print AES.js version'));
  console.log(chalk.yellow('-h, --help                   print this help message'));
  console.log(chalk.yellow('--keysize=[128|256]          size of the key for AES, either 128 or 256 bits'));
  console.log(chalk.yellow('--keyfile                    file containing a key of the specified size'));
  console.log(chalk.yellow('--inputfile                  file containing the message text'));
  console.log(chalk.yellow('--outputfile=[output.txt]    filename for the encrypted result'));
  console.log(chalk.yellow('--mode=[encrypt|decrypt]     mode to run the AES algorithm'));
}

/**
 * @description - Prints the version number for AES.js
 */
function printVersion() {
  try {
    const packageFile = fs.readFileSync(path.resolve(directoryName, 'package.json'));
    const packageJSON = JSON.parse(packageFile);

    console.log('AES.js');
    console.log(chalk.yellow(`v${packageJSON.version}`));
  }
  catch (err) {
    console.error(chalk.red(err.stack));
  }
}

const argv = minimist(process.argv.slice(2));
start(argv);
