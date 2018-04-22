
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

---

## Usage

To use the program, run

```
node aes.js [options] [arguments]
```

or

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

---

## Explanation

The `aes.js` file is responsible for validating input, user interface, and loading up the initial files. The AES algorithm itself is implemented in `src/implementation.js`.

There are two main methods in this file, `encrypt()` and `decrypt()`. These are mainly responsible for two things:
 1. Creating the key schedule with `keyExpansion()`
 2. Breaking up the input into chunks of 16 bytes and calling `cipher()` and `inverseCipher()` respectively, and then writing the output to the given filename.

`cipher()` and `inverseCipher()` are implemented very closely to the pseudo-code [here](https://csrc.nist.gov/csrc/media/publications/fips/197/final/documents/fips-197.pdf).

---

### `cipher()`

The `cipher()` function begins by copying the given input of 16 bytes into a 4 x 4 array. It then calls `addRoundKey()` for the first round.

The algorithm then goes into a loop for either 10 or 14 rounds for 128-bit or 256-bit keys respectively. The loop calls these functions in order every iteration:
 1. `subBytes()`
 2. `shiftRows()`
 3. `mixColumns()`
 4. `addRoundKey()`

Finally, for the last round, `cipher()` then calls `subBytes()`, `shiftRows()`, and `addRoundKey()` in that order. The function ends after copying the 4 x 4 array to a buffer for the output.

I'll explain each function in turn:

#### `addRoundKey()`

Simply adds the round's key within the key schedule to the state using the XOR operation.

#### `subBytes()`

Performs a substitution for each byte in the state with a substitution table defined within `src/implemenation.js`.

#### `shiftRows()`

Shifts each row in the state array 0, 1, 2, or 3 indices according to the index of each row in the state.

#### `mixColumns()`

This is the most complicated step. It performs matrix multiplication on the columns of the state. For the `mixColumns()` function, the matrix it uses is defined [here](https://en.wikipedia.org/wiki/Rijndael_MixColumns#Step_3:_matrix_representation). This function doesn't use the proper multiplication as defined by [finite field arithmetic](https://en.wikipedia.org/wiki/Finite_field_arithmetic#Multiplication), but instead uses an optimization for multiplying by 2 and 3 by using bit shifts and overflow checks. The implementation for this was inspired from [here](https://en.wikipedia.org/wiki/Rijndael_MixColumns#Implementation_example).

---

### `inverseCipher()`

The `inverseCipher()` function is very similar to the `cipher()` function. It mainly does all the same steps except in reverse. It begins by calling `addRoundKey()` for the key within the last round (10 or 14 for 128-bit or 256-bit keys respectively).

Similar to `cipher()`, the function then goes into a loop
