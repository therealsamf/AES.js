'use strict';

/**
 * File containing the implementation of the AES algorithm
 */

/**
 * @description - Encrypts the input with the key with AES according to
 * the keysize. Outputs the result to the given filename
 * @param {Number} keysize - size of the key, either 128 or 256 bits
 * @param {Buffer} key - the key read in from the file
 * @param {Buffer} input - input read in from the input filename argument
 * @param {String} output - filename to output the results
 */
function encrypt(keysize, key, input, output) {

}

/**
 * @description - Decrypts the input with the key with AES according to
 * the keysize. Outputs the result to the given filename
 * @param {Number} keysize - size of the key, either 128 or 256 bits
 * @param {Buffer} key - the key read in from the file
 * @param {Buffer} input - input read in from the input filename argument
 * @param {Buffer} output - filename to output the results
 */
function decrypt(keysize, key, input, output) {

}

/**
 * @description - Encrypts a single buffer of 16 bytes
 * @param {Buffer} input
 * @param {Array} keySchedule - schedule of keys created with
 * {@link keyExpansion}
 * @param {Number} numberOfRounds - either 10 or 14 for 128-bit
 * or 256-bit keys respectively
 * @return {Buffer}
 */
function cipher(input, keySchedule, numberOfRounds) {
  const blockSize = 4; // this always is 4 for the AES algorithm

  const state = [[], [], [], []];
  for (let row = 0; row < 4; ++row) {
    for (let column = 0; column < blockSize; ++column) {
      state[row].push(input[row + 4 * column]);
    }
  }

  addRoundKey(state, keySchedule, 0, blockSize);

  for (let round = 1; round < numberOfRounds; ++round) {
    subBytes(state, blockSize);
    shiftRows(state, blockSize);
    mixColumns(state, blockSize);
    addRoundKey(state, keySchedule, round, blockSize);
  }

  subBytes(state, blockSize);
  shiftRows(state, blockSize);
  addRoundKey(state, keySchedule, numberOfRounds, blockSize);

  const output = new Buffer(4 * blockSize);
  for (let row = 0; row < 4; ++row) {
    for (let column = 0; column < blockSize; ++column) {
      output[row + 4 * column] = state[row][column];
    }
  }

  return output;
}

/**
 * @description - Performs addition on the state in place using the current
 * round key. In AES, addition is defined as XOR
 * @param {Array} state
 * @param {Array} keySchedule
 * @param {Number} round
 * @param {Number} [blockSize=4]
 * @return {Array}
 */
function addRoundKey(state, keySchedule, round, blockSize = 4) {
  for (let row = 0; row < 4; ++row) {
    for (let column = 0; column < blockSize; ++column) {
      state[row][column] ^= keySchedule[round * 4 + column][row];
    }
  }

  return state;
}

/**
 * @description - Performs multiplication on the state in place within
 * the Galois field. We use a substitution look up table instead of
 * any actual multiplication
 * @param {Array} state
 * @param {Number} [blockSize=4]
 * @return {Array}
 */
function subBytes(state, blockSize = 4) {
  for (let row = 0; row < 4; ++row) {
    for (let column = 0; column < blockSize; ++column) {
      state[row][column] = sBox[state[row][column]];
    }
  }

  return state;
}

/**
 * @description - Shifts the rows of the given state according to the AES spec.
 * Performs this operation in place
 * @param {Array} state
 * @param {Number} [blockSize=4]
 * @return {Array};
 */
function shiftRows(state, blockSize = 4) {
  const temp = new Array(4);
  for (let row = 1; row < 4; ++row) {
    for (let column = 0; column < blockSize; ++column) {
      temp[column] = state[row][(column + row) % blockSize];
    }
    for (let column = 0; column < blockSize; ++column) {
      state[row][column] = temp[column];
    }
  }
  return state;
}

/**
 * @description - Operates on the state in place column by column
 * @param {Array} state
 * @param {Number} [blockSize=4]
 * @return {Array}
 */
function mixColumns(state, blockSize = 4) {
  for (let column = 0; column < blockSize; ++column) {
    const copy = new Array(blockSize);
    const shift = new Array(blockSize);

    for (let row = 0; row < 4; ++row) {
      copy[row] = state[row][column];
      // In the case of overflow, add value
      shift[row] = state[row][column] & 0x80 ?
        state[row][column] << 1 ^ 0x011b :
        state[row][column] << 1;
    }
    state[0][column] = shift[0] ^ copy[1] ^ shift[1] ^ copy[2] ^ copy[3];
    state[1][column] = copy[0] ^ shift[1] ^ copy[2] ^ shift[2] ^ copy[3];
    state[2][column] = copy[0] ^ copy[1] ^ shift[2] ^ copy[3] ^ shift[3];
    state[3][column] = copy[0] ^ shift[0] ^ copy[1] ^ copy[2] ^ shift[3];
  }

  return state;
}

/**
 * @description - Takes in the given cipher key and creates an
 * expanded key schedule intended for use with the AES algorithm
 * @param {Buffer} key
 * @param {Number} blockSize - for AES this should always be 4
 * @param {Number} keyLength - the number of words within the key.
 *  This is either 4 or 8 for 128 or 256 bit keys respectively
 * @param {Number} numberOfRounds - Number of rounds for the algorithm,
 *  determines how many keys to expand
 * @return {Array}
 */
function keyExpansion(key, blockSize, keyLength, numberOfRounds) {
  const keySchedule = new Array(blockSize * (numberOfRounds + 1));

  // Set the first keyLength words in the key schedule to the given key
  for (let i = 0; i < keyLength; ++i) {
    const cipherKeyWord = new Buffer([
      key[4 * i],
      key[4 * i + 1],
      key[4 * i + 2],
      key[4 * i + 3],
    ]);
    keySchedule[i] = cipherKeyWord;
  }

  let temp = new Buffer(blockSize);
  // expand the rest of the key
  for (let i = keyLength; i < keySchedule.length; ++i) {
    keySchedule[i] = new Buffer(blockSize);
    for (let t = 0; t < 4; ++t) {
      temp[t] = keySchedule[i - 1][t];
    }

    /* apply transformation for words in a position that
     * is a multiple of the keylength */
    if (i % keyLength === 0) {
      temp = subWord(rotateWord(temp));
      for (let t = 0; t < temp.length; ++t) {
        temp[t] ^= roundConstant[i / keyLength][t];
      }
    } else if (keyLength > 6 && i % keyLength === 4) {
      temp = subWord(temp);
    }

    for (let t = 0; t < 4; ++t) {
      keySchedule[i][t] = keySchedule[i - keyLength][t] ^ temp[t];
    }
  }

  return keySchedule;
}

/**
 * @description - Applies the sBox to every byte within the word in place
 *  and returns it
 * @param {Buffer|Array} word
 * @return {Buffer|Array}
 */
function subWord(word) {
  for (let i = 0; i < word.length; ++i) {
    word[i] = sBox[word[i]];
  }

  return word;
}

/**
 * @description - Rotates a word to the left one byte in place and returns it
 * @param {Buffer|Array} word
 * @return {Buffer|Array}
 */
function rotateWord(word) {
  const first = word[0];

  for (let i = 0; i < word.length - 1; ++i) {
    word[i] = word[i + 1];
  }

  word[word.length - 1] = first;
  return word;
}

/* Precomputed multiplication in the AES algorithm.
 * This represents the multiplicative inverse in the Galois Field(2^8) */
const sBox = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe,
  0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4,
  0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7,
  0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3,
  0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09,
  0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3,
  0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe,
  0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85,
  0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92,
  0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c,
  0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19,
  0x73, 0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14,
  0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2,
  0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5,
  0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25,
  0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86,
  0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e,
  0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42,
  0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
];

/* This is used for key expansion. The first column is 2^(r - 1)
 * (0, 1, 2, 4, 8, ...) in The Galois Field(2^8) */
const roundConstant = [
  [0x00, 0x00, 0x00, 0x00],
  [0x01, 0x00, 0x00, 0x00],
  [0x02, 0x00, 0x00, 0x00],
  [0x04, 0x00, 0x00, 0x00],
  [0x08, 0x00, 0x00, 0x00],
  [0x10, 0x00, 0x00, 0x00],
  [0x20, 0x00, 0x00, 0x00],
  [0x40, 0x00, 0x00, 0x00],
  [0x80, 0x00, 0x00, 0x00],
  [0x1b, 0x00, 0x00, 0x00],
  [0x36, 0x00, 0x00, 0x00],
];

module.exports = {
  encrypt,
  decrypt,
  cipher,
  rotateWord,
  subBytes,
  addRoundKey,
  shiftRows,
  mixColumns,
  keyExpansion,
};
