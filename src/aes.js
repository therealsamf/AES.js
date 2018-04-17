#!/usr/bin/node

const minimist = require('minimist');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const AES = require('./implementation');
const encrypt = AES.encrypt;
const decrypt = AES.decrypt;

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
  const mode = getMode(args.mode);
  if (!mode) {
    console.log();
    printUsage();
    return;
  }

  const outputFilename = args.outputfilename || 'output.txt';

  Promise.all([
    readFile(args.keyfile),
    readFile(args.inputfile),
  ])
    .then(function(key, input) {
      if (mode === 'encrypt') {
        return encrypt(keysize, key, input, outputFilename);
      } else if (mode === 'decrypt') {
        return decrypt(keysize, key, input, outputFilename);
      }
    })
    .catch(function(err) {
      console.error(chalk.red(err.stack));
    });
}

/**
 * @description - Prints the usage for the user
 */
function printUsage() {
  console.log('Usage: node aes.js [arguments]');
  console.log();
  console.log('Arguments:');
  console.log(chalk.yellow('-v, --version                ' +
    'print AES.js version'));
  console.log(chalk.yellow('-h, --help                   ' +
    'print this help message'));
  console.log(chalk.yellow('--keysize=<128|256>          ' +
    'size of the key for AES, either 128 or 256 bits'));
  console.log(chalk.yellow('--keyfile                    ' +
    'filename containing a key of the specified size'));
  console.log(chalk.yellow('--inputfile                  ' +
    'filename containing the input text'));
  console.log(chalk.yellow('--outputfile=[output.txt]    ' +
    'filename for the result'));
  console.log(chalk.yellow('--mode=<encrypt|decrypt>     ' +
    'mode to run the AES algorithm'));
}

/**
 * @description - Prints the version number for AES.js
 */
function printVersion() {
  try {
    const packageFile = fs.readFileSync(
      path.resolve(directoryName, 'package.json')
    );
    const packageJSON = JSON.parse(packageFile);

    console.log('NodeJS');
    console.log(chalk.yellow(process.version));
    console.log();
    console.log('AES.js');
    console.log(chalk.yellow(`v${packageJSON.version}`));
  } catch (err) {
    console.error(chalk.red(err.stack));
  }
}

/**
 * @description - Used to get the keysize argument while checking for errors
 * @param {String} arg - the arg passed in from `--keysize`
 * @return {Number}
 */
function getKeysize(arg) {
  // check keysize argument
  if (!arg) {
    console.error(chalk.red('Error: Must specify a keysize of 128 or 256'));
    return null;
  }

  const keysize = Number(arg);
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
 * @description - Used to retrieve the mode from the arguments list
 * @param {String} arg
 * @return {String}
 */
function getMode(arg) {
  if (!arg) {
    console.error(
      chalk.red('Error: Must specify a mode-- either `encrypt` or `decrypt`')
    );
    return null;
  }

  const mode = arg.toLowerCase();
  if (mode !== 'encrypt' && mode !== 'decrypt') {
    console.error(chalk.red(`Error: Invalid mode '${arg}'`));
    return null;
  }
  return mode;
}

/**
 * @description - Helper method to validate and read a file into memory
 * @param {String} filename
 * @return {String}
 */
function readFile(filename) {
  if (!filename) {
    throw new Error(`Error: Invalid filename '${filename}'`);
  }

  return new Promise(function(resolve, reject) {
    fs.readFile(path.resolve(filename), function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

const argv = minimist(process.argv.slice(2));
start(argv);
