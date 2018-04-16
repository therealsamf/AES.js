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

  const keysize = getKeysize(args.keysize);
  if (!keysize) {
    console.log();
    printUsage();
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

/**
 * @description - Used to get the keysize argument while checking for errors
 * @param {String} arg - the arg passed in from `--keysize`
 * @returns {Number}
 */
function getKeysize(arg) {
  // check keysize argument
  if (!arg) {
    console.error(chalk.red('Error: Must specify a keysize of 128 or 256'));
    return null;
  }
  
  const keysize = Number(arg):
  if (isNaN(keysize)) {
    console.error(chalk.red('Error: Invalid keysize argument'));
    return null;
  }

  if (keysize !== 128 && keysize !== 256) {
    console.error(chalk.red('Error: Keysize must be either 128 or 256'));
    return null;
  }

  return keysize;
}

/**
 * @description - Helper method to validate and read a file into memory
 * @param {String} filename
 * @returns {String}
 */
function readFile(filename) {

}

const argv = minimist(process.argv.slice(2));
start(argv);
