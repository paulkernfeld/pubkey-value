var tape = require('tape')
var sign = require('..').sign

tape('encode decode', function (t) {
  var keypair = sign.keypair()
  var signed = sign.sign(keypair, Buffer('meow'))
  t.ok(signed)
  var opened = sign.open(keypair.publicKey, signed)
  t.same(opened, Buffer('meow'))
  t.end()
})
