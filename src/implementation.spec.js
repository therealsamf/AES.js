
/**
 * Integration test suite for implementation.js
 */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
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

  describe('cipher()', function() {
    it('Correctly encrypts with a 128-byte key', function() {
      const { keyExpansion, cipher } = getImplemenation();
      const keySchedule = keyExpansion(key128, blockSize, 4, 10);

      const output = cipher(input, keySchedule, 10);
      assert(output.compare(expectedResult128) === 0,
        'cipher() didn\'t return the correct output. ' +
        ` Expected ${output.toString('hex')} to equal ` +
        `${expectedResult128.toString('hex')}`
      );
    });

    it('Correctly encrypts with a 256-byte key', function() {
      const { keyExpansion, cipher } = getImplemenation();
      const keySchedule = keyExpansion(key256, blockSize, 8, 14);

      const output = cipher(input, keySchedule, 14);
      assert(output.compare(expectedResult256) === 0,
        'cipher() didn\'t return the correct output. ' +
        ` Expected ${output.toString('hex')} to equal ` +
        `${expectedResult256.toString('hex')}`
      );
    });
  });

  describe('inverseCipher', function() {
    it('Correctly decrypts with a 128-byte key', function() {
      const { keyExpansion, inverseCipher } = getImplemenation();
      const keySchedule = keyExpansion(key128, blockSize, 4, 10);

      const output = inverseCipher(expectedResult128, keySchedule, 10);
      assert(output.compare(input) === 0,
        'inverseCipher() didn\'t return the correct output. ' +
        ` Expected ${output.toString('hex')} to equal ` +
        `${input.toString('hex')}`
      );
    });

    it('Correctly decrypts with a 256-byte key', function() {
      const { keyExpansion, inverseCipher } = getImplemenation();
      const keySchedule = keyExpansion(key256, blockSize, 8, 14);

      const output = inverseCipher(expectedResult256, keySchedule, 14);
      assert(output.compare(input) === 0,
        'inverseCipher() didn\'t return the correct output. ' +
        ` Expected ${output.toString('hex')} to equal ` +
        `${input.toString('hex')}`
      );
    });
  });

  const input = new Buffer([
    0x00, 0x11, 0x22, 0x33,
    0x44, 0x55, 0x66, 0x77,
    0x88, 0x99, 0xaa, 0xbb,
    0xcc, 0xdd, 0xee, 0xff,
  ]);

  const expectedResult128 = new Buffer([
    0x69, 0xc4, 0xe0, 0xd8,
    0x6a, 0x7b, 0x04, 0x30,
    0xd8, 0xcd, 0xb7, 0x80,
    0x70, 0xb4, 0xc5, 0x5a,
  ]);

  const expectedResult256 = new Buffer([
    0x8e, 0xa2, 0xb7, 0xca,
    0x51, 0x67, 0x45, 0xbf,
    0xea, 0xfc, 0x49, 0x90,
    0x4b, 0x49, 0x60, 0x89,
  ]);

  const key128 = new Buffer([
    0x00, 0x01, 0x02, 0x03,
    0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]);

  const key256 = new Buffer([
    0x00, 0x01, 0x02, 0x03,
    0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
    0x10, 0x11, 0x12, 0x13,
    0x14, 0x15, 0x16, 0x17,
    0x18, 0x19, 0x1a, 0x1b,
    0x1c, 0x1d, 0x1e, 0x1f,
  ]);
});
