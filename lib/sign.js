var assert = require('assert')
var nacl = require('tweetnacl')
var toU8 = require('buffer-to-uint8array')

module.exports.keypair = function () {
  return nacl.sign.keyPair()
}

module.exports.sign = function (keypair, message, salt) {
  assert(!salt)
  return Buffer(nacl.sign(toU8(Buffer.concat([Buffer([0]), message])), keypair.secretKey))
}

module.exports.open = function (pubkey, message, salt) {
  assert(!salt)
  assert(message)
  var opened = Buffer(nacl.sign.open(toU8(message), pubkey))
  assert(opened[0] === 0)
  return opened.slice(1)
}

