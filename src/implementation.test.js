
/**
 * Unit test suite for the implementation js file
 */

const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const { assert } = require('chai');

describe('implementation.js', function() {
  const blockSize = 4;
  /**
   * @description - Helper function that uses proxyquire to retrieve and
   *  evaluate the implementation module
   * @param {Object} [overrides={}]
   * @return {Module}
   */
  function getImplemenation(overrides = {}) {
    return proxyquire('./implementation.js', overrides);
  }

  describe('rotateWord()', function() {
    it('Rotates a 4 length buffer object correctly', function() {
      const { rotateWord } = getImplemenation();
      const word = new Buffer([0x00, 0x01, 0x02, 0x03]);
      const expectedResult = new Buffer([0x01, 0x02, 0x03, 0x00]);

      rotateWord(word);
      assert(expectedResult.compare(word) == 0,
        `Rotation failed. Expected ${word.toString('hex')}` +
          ` to equal ${expectedResult.toString('hex')}`
      );
    });
  });

  describe('addRoundKey', function() {
    const state = [
      [0x00, 0x44, 0x88, 0xcc],
      [0x11, 0x55, 0x99, 0xdd],
      [0x22, 0x66, 0xaa, 0xee],
      [0x33, 0x77, 0xbb, 0xff],
    ];
    const expectedResult = [
      [0x00, 0x40, 0x80, 0xc0],
      [0x10, 0x50, 0x90, 0xd0],
      [0x20, 0x60, 0xa0, 0xe0],
      [0x30, 0x70, 0xb0, 0xf0],
    ];

    const key = new Buffer([
      0x00, 0x01, 0x02, 0x03,
      0x04, 0x05, 0x06, 0x07,
      0x08, 0x09, 0x0a, 0x0b,
      0x0c, 0x0d, 0x0e, 0x0f,
    ]);

    it('Correctly adds the current round\'s 128-bit key', function() {
      const { addRoundKey, keyExpansion } = getImplemenation();
      const keySchedule = keyExpansion(key, blockSize, 4, 10);

      const output = addRoundKey(copyState(state), keySchedule, 0, blockSize);
      assert.deepEqual(output, expectedResult,
        'addRoundKey() didn\'t add the round key correctly'
      );
    });
  });

  describe('subBytes()', function() {
    const state = [
      [0x00, 0x10, 0x20, 0x30],
      [0x40, 0x50, 0x60, 0x70],
      [0x80, 0x90, 0xa0, 0xb0],
      [0xc0, 0xd0, 0xe0, 0xf0],
    ];
    const expectedResult = [
      [0x63, 0xca, 0xb7, 0x04],
      [0x09, 0x53, 0xd0, 0x51],
      [0xcd, 0x60, 0xe0, 0xe7],
      [0xba, 0x70, 0xe1, 0x8c],
    ];

    it('Substitutes the bytes correctly', function() {
      const { subBytes } = getImplemenation();
      const output = subBytes(copyState(state), blockSize);

      assert.deepEqual(output, expectedResult,
        'subBytes() didn\'t correctly substitute the values');
    });

    it('Substitutes the bytes correctly in place', function() {
      const { subBytes } = getImplemenation();
      const stateCopy = copyState(state);

      subBytes(stateCopy, blockSize);

      assert.deepEqual(stateCopy, expectedResult,
        'subBytes() didn\'t correctly substitute the values'
      );
    });
  });

  describe('shiftRows()', function() {
    const state = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
    const expectedResult = [
      [1, 2, 3, 4],
      [6, 7, 8, 5],
      [11, 12, 9, 10],
      [16, 13, 14, 15],
    ];

    it('Shifts the rows of the given state in place properly', function() {
      const { shiftRows } = getImplemenation();
      const newState = copyState(state);

      shiftRows(newState, 4);
      assert.deepEqual(newState, expectedResult,
        'shiftRows() didn\'t correctly shift the state'
      );
    });

    it('Shifts the rows of the given state properly', function() {
      const { shiftRows } = getImplemenation();
      const newState = copyState(state);

      const shiftedState = shiftRows(newState, 4);
      assert.deepEqual(shiftedState, expectedResult,
        'shiftRows() didn\'t correctly shift the state'
      );
      assert.strictEqual(shiftedState, newState,
        'shiftRows() didn\'t return a reference to the original parameter'
      );
    });
  });

  describe('mixColumns()', function() {
    const input = new Buffer([
      0x63, 0x53, 0xe0, 0x8c,
      0x09, 0x60, 0xe1, 0x04,
      0xcd, 0x70, 0xb7, 0x51,
      0xba, 0xca, 0xd0, 0xe7,
    ]);
    const output = new Buffer([
      0x5f, 0x72, 0x64, 0x15,
      0x57, 0xf5, 0xbc, 0x92,
      0xf7, 0xbe, 0x3b, 0x29,
      0x1d, 0xb9, 0xf9, 0x1a,
    ]);

    it('Mixes the state columns correctly in place', function() {
      const { mixColumns } = getImplemenation();
      const state = copyInputToState(input);
      const expectedResult = copyInputToState(output);

      mixColumns(state);

      assert.deepEqual(state, expectedResult,
        'mixColumns() didn\'t produce the correct output'
      );
    });

    it('Mixes the state columns correctly', function() {
      const { mixColumns } = getImplemenation();
      const state = copyInputToState(input);
      const expectedResult = copyInputToState(output);

      const newState = mixColumns(state);

      assert.deepEqual(state, expectedResult,
        'mixColumns() didn\'t produce the correct output'
      );
      assert.strictEqual(state, newState,
        'mixColumns() returned a new array instead of the input'
      );
    });

    /**
     * @description - Copys an array of bytes to a 2D state
     * array
     * @param {Array|Buffer} input
     * @return {State}
     */
    function copyInputToState(input) {
      const state = [[], [], [], []];
      for (let row = 0; row < 4; ++row) {
        for (let column = 0; column < blockSize; ++column) {
          state[row].push(input[row + 4 * column]);
        }
      }

      return state;
    }
  });

  describe('keyExpansion()', function() {
    it('Correctly expands a 128-bit cipher key', function() {
      const cipherKey = new Buffer([
        0x2b, 0x7e, 0x15, 0x16,
        0x28, 0xae, 0xd2, 0xa6,
        0xab, 0xf7, 0x15, 0x88,
        0x09, 0xcf, 0x4f, 0x3c,
      ]);

      compareKey({
        cipherKey,
        expandedKey: expandedKey128Bit,
        blockSize: 4,
        keyLength: 4,
        numRounds: 10,
      });
    });

    it('Correctly expands a 256-bit cipher key', function() {
      const cipherKey = new Buffer([
        0x60, 0x3d, 0xeb, 0x10,
        0x15, 0xca, 0x71, 0xbe,
        0x2b, 0x73, 0xae, 0xf0,
        0x85, 0x7d, 0x77, 0x81,
        0x1f, 0x35, 0x2c, 0x07,
        0x3b, 0x61, 0x08, 0xd7,
        0x2d, 0x98, 0x10, 0xa3,
        0x09, 0x14, 0xdf, 0xf4,
      ]);

      compareKey({
        cipherKey,
        expandedKey: expandedKey256Bit,
        blockSize: 4,
        keyLength: 8,
        numRounds: 14,
      });
    });

    /**
     * @description - Uses the {@link keyExpansion} function to generate
     * an expanded key and compares it wit the given one
     * @param {Object} args
     * @param {Buffer} args.cipherKey
     * @param {Array} args.expandedKey
     * @param {Number} args.blockSize - For AES this should be 4
     * @param {Number} keyLength
     * @param {Number} numRounds
     */
    function compareKey({
      cipherKey, expandedKey, blockSize, keyLength, numRounds,
    }) {
      const { keyExpansion } = getImplemenation();
      const keySchedule = keyExpansion(
        cipherKey,
        blockSize,
        keyLength,
        numRounds
      );

      keySchedule.forEach((key, index) => {
        assert(key.compare(expandedKey[index]) === 0,
          `Invalid key '${key.toString('hex')} at index ${index}.` +
            ` Expected value: '${expandedKey[index].toString('hex')}`
        );
      });
    }
  });

  /**
   * @description - Deep copies a state array
   * @param {Array} state
   * @return {Array}
   */
  function copyState(state) {
    return state.map((row) => row.slice());
  }
});

/* Results taken from
 * https://csrc.nist.gov/csrc/media/publications/fips/197/final/documents/fips-197.pdf */ //eslint-disable-line
const expandedKey128Bit = [
  new Buffer([0x2b, 0x7e, 0x15, 0x16]),
  new Buffer([0x28, 0xae, 0xd2, 0xa6]),
  new Buffer([0xab, 0xf7, 0x15, 0x88]),
  new Buffer([0x09, 0xcf, 0x4f, 0x3c]),
  new Buffer([0xa0, 0xfa, 0xfe, 0x17]),
  new Buffer([0x88, 0x54, 0x2c, 0xb1]),
  new Buffer([0x23, 0xa3, 0x39, 0x39]),
  new Buffer([0x2a, 0x6c, 0x76, 0x05]),
  new Buffer([0xf2, 0xc2, 0x95, 0xf2]),
  new Buffer([0x7a, 0x96, 0xb9, 0x43]),
  new Buffer([0x59, 0x35, 0x80, 0x7a]),
  new Buffer([0x73, 0x59, 0xf6, 0x7f]),
  new Buffer([0x3d, 0x80, 0x47, 0x7d]),
  new Buffer([0x47, 0x16, 0xfe, 0x3e]),
  new Buffer([0x1e, 0x23, 0x7e, 0x44]),
  new Buffer([0x6d, 0x7a, 0x88, 0x3b]),
  new Buffer([0xef, 0x44, 0xa5, 0x41]),
  new Buffer([0xa8, 0x52, 0x5b, 0x7f]),
  new Buffer([0xb6, 0x71, 0x25, 0x3b]),
  new Buffer([0xdb, 0x0b, 0xad, 0x00]),
  new Buffer([0xd4, 0xd1, 0xc6, 0xf8]),
  new Buffer([0x7c, 0x83, 0x9d, 0x87]),
  new Buffer([0xca, 0xf2, 0xb8, 0xbc]),
  new Buffer([0x11, 0xf9, 0x15, 0xbc]),
  new Buffer([0x6d, 0x88, 0xa3, 0x7a]),
  new Buffer([0x11, 0x0b, 0x3e, 0xfd]),
  new Buffer([0xdb, 0xf9, 0x86, 0x41]),
  new Buffer([0xca, 0x00, 0x93, 0xfd]),
  new Buffer([0x4e, 0x54, 0xf7, 0x0e]),
  new Buffer([0x5f, 0x5f, 0xc9, 0xf3]),
  new Buffer([0x84, 0xa6, 0x4f, 0xb2]),
  new Buffer([0x4e, 0xa6, 0xdc, 0x4f]),
  new Buffer([0xea, 0xd2, 0x73, 0x21]),
  new Buffer([0xb5, 0x8d, 0xba, 0xd2]),
  new Buffer([0x31, 0x2b, 0xf5, 0x60]),
  new Buffer([0x7f, 0x8d, 0x29, 0x2f]),
  new Buffer([0xac, 0x77, 0x66, 0xf3]),
  new Buffer([0x19, 0xfa, 0xdc, 0x21]),
  new Buffer([0x28, 0xd1, 0x29, 0x41]),
  new Buffer([0x57, 0x5c, 0x00, 0x6e]),
  new Buffer([0xd0, 0x14, 0xf9, 0xa8]),
  new Buffer([0xc9, 0xee, 0x25, 0x89]),
  new Buffer([0xe1, 0x3f, 0x0c, 0xc8]),
  new Buffer([0xb6, 0x63, 0x0c, 0xa6]),
];

const expandedKey256Bit = [
  new Buffer([0x60, 0x3d, 0xeb, 0x10]),
  new Buffer([0x15, 0xca, 0x71, 0xbe]),
  new Buffer([0x2b, 0x73, 0xae, 0xf0]),
  new Buffer([0x85, 0x7d, 0x77, 0x81]),
  new Buffer([0x1f, 0x35, 0x2c, 0x07]),
  new Buffer([0x3b, 0x61, 0x08, 0xd7]),
  new Buffer([0x2d, 0x98, 0x10, 0xa3]),
  new Buffer([0x09, 0x14, 0xdf, 0xf4]),
  new Buffer([0x9b, 0xa3, 0x54, 0x11]),
  new Buffer([0x8e, 0x69, 0x25, 0xaf]),
  new Buffer([0xa5, 0x1a, 0x8b, 0x5f]),
  new Buffer([0x20, 0x67, 0xfc, 0xde]),
  new Buffer([0xa8, 0xb0, 0x9c, 0x1a]),
  new Buffer([0x93, 0xd1, 0x94, 0xcd]),
  new Buffer([0xbe, 0x49, 0x84, 0x6e]),
  new Buffer([0xb7, 0x5d, 0x5b, 0x9a]),
  new Buffer([0xd5, 0x9a, 0xec, 0xb8]),
  new Buffer([0x5b, 0xf3, 0xc9, 0x17]),
  new Buffer([0xfe, 0xe9, 0x42, 0x48]),
  new Buffer([0xde, 0x8e, 0xbe, 0x96]),
  new Buffer([0xb5, 0xa9, 0x32, 0x8a]),
  new Buffer([0x26, 0x78, 0xa6, 0x47]),
  new Buffer([0x98, 0x31, 0x22, 0x29]),
  new Buffer([0x2f, 0x6c, 0x79, 0xb3]),
  new Buffer([0x81, 0x2c, 0x81, 0xad]),
  new Buffer([0xda, 0xdf, 0x48, 0xba]),
  new Buffer([0x24, 0x36, 0x0a, 0xf2]),
  new Buffer([0xfa, 0xb8, 0xb4, 0x64]),
  new Buffer([0x98, 0xc5, 0xbf, 0xc9]),
  new Buffer([0xbe, 0xbd, 0x19, 0x8e]),
  new Buffer([0x26, 0x8c, 0x3b, 0xa7]),
  new Buffer([0x09, 0xe0, 0x42, 0x14]),
  new Buffer([0x68, 0x00, 0x7b, 0xac]),
  new Buffer([0xb2, 0xdf, 0x33, 0x16]),
  new Buffer([0x96, 0xe9, 0x39, 0xe4]),
  new Buffer([0x6c, 0x51, 0x8d, 0x80]),
  new Buffer([0xc8, 0x14, 0xe2, 0x04]),
  new Buffer([0x76, 0xa9, 0xfb, 0x8a]),
  new Buffer([0x50, 0x25, 0xc0, 0x2d]),
  new Buffer([0x59, 0xc5, 0x82, 0x39]),
  new Buffer([0xde, 0x13, 0x69, 0x67]),
  new Buffer([0x6c, 0xcc, 0x5a, 0x71]),
  new Buffer([0xfa, 0x25, 0x63, 0x95]),
  new Buffer([0x96, 0x74, 0xee, 0x15]),
  new Buffer([0x58, 0x86, 0xca, 0x5d]),
  new Buffer([0x2e, 0x2f, 0x31, 0xd7]),
  new Buffer([0x7e, 0x0a, 0xf1, 0xfa]),
  new Buffer([0x27, 0xcf, 0x73, 0xc3]),
  new Buffer([0x74, 0x9c, 0x47, 0xab]),
  new Buffer([0x18, 0x50, 0x1d, 0xda]),
  new Buffer([0xe2, 0x75, 0x7e, 0x4f]),
  new Buffer([0x74, 0x01, 0x90, 0x5a]),
  new Buffer([0xca, 0xfa, 0xaa, 0xe3]),
  new Buffer([0xe4, 0xd5, 0x9b, 0x34]),
  new Buffer([0x9a, 0xdf, 0x6a, 0xce]),
  new Buffer([0xbd, 0x10, 0x19, 0x0d]),
  new Buffer([0xfe, 0x48, 0x90, 0xd1]),
  new Buffer([0xe6, 0x18, 0x8d, 0x0b]),
  new Buffer([0x04, 0x6d, 0xf3, 0x44]),
  new Buffer([0x70, 0x6c, 0x63, 0x1e]),
];
