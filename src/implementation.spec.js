
/**
 * Integration test suite for implementation.js
 */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { assert } = require('chai');
const stream = require('stream');

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

  describe('encrypt()', function() {
    const testCases16Byte = [
      {
        key: '00000000000000000000000000000000',
        plainText: 'ffffffffffffffffffffffffffffff80',
        cipherText: 'd1788f572d98b2b16ec5d5f3922b99bc',
      },
      {
        key: '10a58869d74be5a374cf867cfb473859',
        plainText: '00000000000000000000000000000000',
        cipherText: '6d251e6944b051e04eaa6fb4dbf78465',
      },
      {
        key: 'ffffffffffffffffffe0000000000000',
        plainText: '00000000000000000000000000000000',
        cipherText: '1b0d02893683b9f180458e4aa6b73982',
      },
      {
        key: 'fffffffffffffffffffffffffffffffffffffffffffff8000000000000000000',
        plainText: '00000000000000000000000000000000',
        cipherText: '4570a5a18cfc0dd582f1d88d5c9a1720',
      },
      {
        key: '0000000000000000000000000000000000000000000000000000000000000000',
        plainText: 'fffffffffffffffffffffff000000000',
        cipherText: '83a63402a77f9ad5c1e931a931ecd706',
      },
    ];

    // test cases with 24 byte plain texts
    const testCases24Byte = [
      {
        key: '00000000000000000000000000000000',
        plainText: 'fffe00000000000000000000000000001122334455667788',
        cipherText: '64B4D629810FDA6BAFDF08F3B0D8D2C58FB3E06A29F06558BBD8DF7220982AD5', //eslint-disable-line
      },
      {
        key: '10a58869d74be5a374cf867cfb473859',
        plainText: '000000000000000000000000000000001122334455667788',
        cipherText: '6D251E6944B051E04EAA6FB4DBF784658F74959DAEB6D04E82F8C59FDF46D66D', //eslint-disable-line
      },
      {
        key: 'ffffffffffffffffffe0000000000000',
        plainText: '000000000000000000000000000000001122334455667788',
        cipherText: '1B0D02893683B9F180458E4AA6B73982308D5A40B51DC67DA50F505D6C1AD62C', //eslint-disable-line
      },
      {
        key: '0000000000000000000000000000000000000000000000000000000000000000', //eslint-disable-line
        plainText: 'fffffffffffffffffc000000000000001122334455667788',
        cipherText: '811441CE1D309EEE7185E8C752C075573AD4C0415F5AC874EAEEB71205C93D09', //eslint-disable-line
      },
      {
        key: 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffe00000000',
        plainText: '000000000000000000000000000000001122334455667788',
        cipherText: '1E38E759075BA5CAB6457DA51844295AAAADC62FBA7EB7E8010345A00EB4E109', //eslint-disable-line
      },
    ];

    testCases16Byte.forEach(testEncrypt);
    testCases24Byte.forEach(testEncrypt);

    /**
     * @description - Helper furnction for testing 'decrypt()'
     * @param {Object} testCase
     */
    function testEncrypt(testCase) {
      const key = new Buffer(testCase.key, 'hex');
      const plainText = new Buffer(testCase.plainText, 'hex');
      const expected = new Buffer(testCase.cipherText, 'hex');
      it(`Correctly encrypts ${plainText.length}-byte ` +
        `input for ${key.length * 8}-bit key`,
        function(done) {
          const writeStream = new FakeWriteStream();
          const { encrypt } = getImplemenation({
            fs: Object.assign(require('fs'), {
              createWriteStream: () => {
                return writeStream;
              },
              open: (path, flag, callback) => {
                callback(null);
              },
            }),
          });

          encrypt(key.length * 8, key, plainText, '')
            .then(function() {
              let output = writeStream.getOutput();
              // don't worry about padding if multiple of state size
              if (plainText.length % 16 === 0) {
                output = output.slice(0, output.length - 16);
              }

              assert(output.compare(expected) === 0,
                `encrypt() didn't return expected output. ` +
                `Expected ${output.toString('hex')} ` +
                `to equal ${expected.toString('hex')}`
              );
            })
            .catch(function(err) {
              return Promise.resolve(err);
            })
            .then(done);
        }
      );
    }
  });

  describe('decrypt()', function() {
    // Note that the cipherText has the padding added on
    const testCases16Byte = [
      {
        key: '00000000000000000000000000000000',
        plainText: 'ffffffffffffffffffffffffffffff80',
        cipherText: 'd1788f572d98b2b16ec5d5f3922b99bc58b2431bc0bede02550f40238969ec78', //eslint-disable-line
      },
      {
        key: '10a58869d74be5a374cf867cfb473859',
        plainText: '00000000000000000000000000000000',
        cipherText: '6d251e6944b051e04eaa6fb4dbf78465698828729740e94e3b7e71fb4f503110', //eslint-disable-line
      },
      {
        key: 'ffffffffffffffffffe0000000000000',
        plainText: '00000000000000000000000000000000',
        cipherText: '1b0d02893683b9f180458e4aa6b739826c46fedbce041c0edab1246a2a1d2417', //eslint-disable-line
      },
      {
        key: 'fffffffffffffffffffffffffffffffffffffffffffff8000000000000000000',
        plainText: '00000000000000000000000000000000',
        cipherText: '4570a5a18cfc0dd582f1d88d5c9a1720',
      },
      {
        key: '0000000000000000000000000000000000000000000000000000000000000000',
        plainText: 'fffffffffffffffffffffff000000000',
        cipherText: '83a63402a77f9ad5c1e931a931ecd706',
      },
    ];

    // test cases with 24 byte plain texts
    const testCases24Byte = [
      {
        key: '00000000000000000000000000000000',
        plainText: 'fffe00000000000000000000000000001122334455667788',
        cipherText: '64B4D629810FDA6BAFDF08F3B0D8D2C58FB3E06A29F06558BBD8DF7220982AD5', //eslint-disable-line
      },
      {
        key: '10a58869d74be5a374cf867cfb473859',
        plainText: '000000000000000000000000000000001122334455667788',
        cipherText: '6D251E6944B051E04EAA6FB4DBF784658F74959DAEB6D04E82F8C59FDF46D66D', //eslint-disable-line
      },
      {
        key: 'ffffffffffffffffffe0000000000000',
        plainText: '000000000000000000000000000000001122334455667788',
        cipherText: '1B0D02893683B9F180458E4AA6B73982308D5A40B51DC67DA50F505D6C1AD62C', //eslint-disable-line
      },
      {
        key: '0000000000000000000000000000000000000000000000000000000000000000', //eslint-disable-line
        plainText: 'fffffffffffffffffc000000000000001122334455667788',
        cipherText: '811441CE1D309EEE7185E8C752C075573AD4C0415F5AC874EAEEB71205C93D09', //eslint-disable-line
      },
      {
        key: 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffe00000000',
        plainText: '000000000000000000000000000000001122334455667788',
        cipherText: '1E38E759075BA5CAB6457DA51844295AAAADC62FBA7EB7E8010345A00EB4E109', //eslint-disable-line
      },
    ];

    testCases16Byte.forEach(testDecrypt);
    testCases24Byte.forEach(testDecrypt);

    /**
     * @description - Helper furnction for testing 'decrypt()'
     * @param {Object} testCase
     */
    function testDecrypt(testCase) {
      const key = new Buffer(testCase.key, 'hex');
      const cipherText = new Buffer(testCase.cipherText, 'hex');
      const expected = new Buffer(testCase.plainText, 'hex');
      it(`Correctly decrypts ${expected.length}-byte ` +
        `input for ${key.length * 8}-bit key`,
        function(done) {
          const writeStream = new FakeWriteStream();
          const { decrypt } = getImplemenation({
            fs: Object.assign(require('fs'), {
              createWriteStream: () => {
                return writeStream;
              },
              open: (path, flag, callback) => {
                callback(null);
              },
            }),
          });

          decrypt(key.length * 8, key, cipherText, '')
            .then(function() {
              const output = writeStream.getOutput();
              assert(output.compare(expected) === 0,
                `decrypt() didn't return expected output. ` +
                `Expected ${output.toString('hex')} ` +
                `to equal ${expected.toString('hex')}`
              );
            })
            .catch(function(err) {
              return Promise.resolve(err);
            })
            .then(done);
        }
      );
    }
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

/**
 * A stub of the Writable stream class in order to allow testing of 'encrypt()'
 * and 'decrypt()' without having to write files
 */
class FakeWriteStream extends stream.Writable {
  /**
   * @constructor
   */
  constructor() {
    super();

    this.output = new Buffer(0);
  }

  /**
   * @description - Fake write stream to check output
   * @param {Buffer} output
   * @param {Function} callback
   */
  write(output, callback) {
    this.output = Buffer.concat([this.output, output]);
    callback(null);
  }

  /**
   * @description - Getter method for the output
   * @return {Buffer}
   */
  getOutput() {
    return this.output;
  }
}
