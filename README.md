
AES.js
======

A CLI tool for encryption/decryption with 128-bit and 256-bit AES.

Tested on [NodeJS](https://nodejs.org/en/) version 5.12.0

---

## Installation

After cloning this repository or unzipping it, run

```
npm install
```

This will install the necessary dependencies for AES.js to run

## Usage

To use the program, run

```
node aes.js [options] [arguments]
```

or,

```
npm start -- [options] [arguments]
```

### Options:

| Flag | Description |
|:---|:---|
| -h, --help | Prints out a help message to the console |
| -v, --version | Prints out the version of AES.js |

### Arguments:

| Argument | Type | Description |
|:---|:---|:---|
| --keysize | number | Size of the key for AES, either `128` or `256` bits |
| --keyfile | filename | Filename containing the of the specified size |
| --inputfile | filename | Filename of the file containing the input text |
| --outputfile | filename | Filename where the result will be written. Defaults to `output.txt` |
| --mode | string | mode in which to run AES. Either `encrypt` or `decrypt` |