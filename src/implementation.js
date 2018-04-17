
/**
 * Folder containing the implementation of the AES algorithm
 */

/**
 * @description - Encrypts the input with the key with AES according to
 * the keysize. Outputs the result to the given filename
 * @param {Number} keysize - size of the key, either 128 or 256 bits
 * @param {String} key - the key read in from the file
 * @param {String} input - input read in from the input filename argument
 * @param {String} output - filename to output the results
 */
function encrypt(keysize, key, input, output) {

}

/**
 * @description - Decrypts the input with the key with AES according to
 * the keysize. Outputs the result to the given filename
 * @param {Number} keysize - size of the key, either 128 or 256 bits
 * @param {String} key - the key read in from the file
 * @param {String} input - input read in from the input filename argument
 * @param {String} output - filename to output the results
 */
function decrypt(keysize, key, input, output) {

}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
};
