#!/usr/bin/node

const minimist = require('minimist');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const AES = require('./implementation');
const encrypt = AES.encrypt;
const decrypt = AES.decrypt;

const directoryName = path.resolve(__dirname, '..');

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

  const keysize = getKeysize(process.env.AES_KEYSIZE || args.keysize);
  if (!keysize) {
    console.log();
    printUsage();
    return;
  }
  const mode = getMode(process.env.AES_MODE || args.mode);
  if (!mode) {
    console.log();
    printUsage();
    return;
  }

  const outputFilename = process.env.AES_OUTPUT_FILE ||
    args.outputfilename || 'output.txt';

  Promise.all([
    readFile(process.env.AES_KEY_FILE || args.keyfile),
    readFile(process.env.AES_INPUT_FILE || args.inputfile),
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
  console.log('Usage: node aes.js [options] [arguments | ' +
    '--keysize <AES_KEYSIZE=[128|256]> ' +
    '--keyfile <AES_KEY_FILE> ' +
    '--inputfile <AES_INPUT_FILE> ' +
    '--outputfile <AES_OUTPUT_FILE[output.txt]> ' +
    '--mode <AES_MODE=[encrypt|decrypt]>' +
    ']'
  );

  console.log();
  console.log('Options:');
  console.log(chalk.gray('-v, --version                ' +
    'print AES.js version'));
  console.log(chalk.gray('-h, --help                   ' +
    'print this help message'));

  console.log();
  console.log('Arguments:');
  console.log(chalk.gray('--keysize=<128|256>          ' +
    'size of the key for AES, either 128 or 256 bits'));
  console.log(chalk.gray('--keyfile                    ' +
    'filename containing a key of the specified size'));
  console.log(chalk.gray('--inputfile                  ' +
    'filename containing the input text'));
  console.log(chalk.gray('--outputfile=[output.txt]    ' +
    'filename for the result'));
  console.log(chalk.gray('--mode=<encrypt|decrypt>     ' +
    'mode in which to run the AES algorithm'));
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
    console.log(chalk.gray(process.version));
    console.log();
    console.log('AES.js');
    console.log(chalk.gray(`v${packageJSON.version}`));
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
