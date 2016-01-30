var tape = require('tape')
var pkv = require('..')

tape('through', function (t) {
  // The update must travel from core1 through core2 to core3
  var keyPair = pkv.sign.keypair()
  var core1 = pkv.Core({keypair: keyPair})
  var core2 = pkv.Core({keypair: {publicKey: keyPair.publicKey}})
  var core3 = pkv.Core({keypair: {publicKey: keyPair.publicKey}})

  var ps12 = core1.peerStream()
  var ps21 = core2.peerStream()
  var ps23 = core2.peerStream()
  var ps32 = core3.peerStream()

  ps12.pipe(ps21).pipe(ps12)
  ps23.pipe(ps32).pipe(ps23)

  core3.on('value', function (value) {
    t.same(value, Buffer('sup'))
    t.end()
  })
  core1.write(Buffer('sup'))
})

tape('two updates', function (t) {
  var keyPair = pkv.sign.keypair()
  var core1 = pkv.Core({keypair: keyPair})
  var core2 = pkv.Core({keypair: {publicKey: keyPair.publicKey}})

  var ps1 = core1.peerStream()
  var ps2 = core2.peerStream()

  ps1.pipe(ps2).pipe(ps1)

  core2.once('value', function (value) {
    t.same(value, Buffer('one'))

    core2.on('value', function (value) {
      t.same(value, Buffer('two'))
      t.end()
    })
    core1.write(Buffer('two'))
  })
  core1.write(Buffer('one'))
})

tape('write then connect', function (t) {
  var keyPair = pkv.sign.keypair()
  var core1 = pkv.Core({keypair: keyPair})
  var core2 = pkv.Core({keypair: {publicKey: keyPair.publicKey}})

  var ps1 = core1.peerStream()
  var ps2 = core2.peerStream()

  core2.on('value', function (value) {
    t.same(value, Buffer('hello'))
    t.end()
  })

  ps1.pipe(ps2).pipe(ps1)

  core1.write(Buffer('hello'))
})

tape('custom verify', function (t) {
  var keyPair = pkv.sign.keypair()
  var core1 = pkv.Core({keypair: keyPair})
  var core2 = pkv.Core({keypair: {publicKey: keyPair.publicKey}})

  core2.verify = function (value, cb) {
    cb(!value.equals(Buffer('valid')))
  }

  var ps1 = core1.peerStream()
  var ps2 = core2.peerStream()

  ps1.pipe(ps2).pipe(ps1)

  core2.on('value', function (value) {
    t.same(value, Buffer('valid'))
    t.end()
  })

  core1.write(Buffer('invalid'))
  core1.write(Buffer('valid'))
})
