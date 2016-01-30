var lpstream = require('length-prefixed-stream')
var duplexify = require('duplexify')
var inherits = require('inherits')
var EventEmitter = require('events')
var sign = require('./lib/sign')
var messages = require('./lib/messages')
var debug = require('debug')('pubkey-value')

var MAX_MESSAGE = 1024

function Protocol () {
  duplexify.call(this)

  this._reader = lpstream.decode({limit: MAX_MESSAGE})
  this._writer = lpstream.encode()

  this.setReadable(this._writer)
  this.setWritable(this._reader)
}
inherits(Protocol, duplexify)

Protocol.prototype.send = function (message) {
  if (message.signed === null) return

  this._writer.write(messages.State.encode(message))
}

function Core (opts) {
  if (!(this instanceof Core)) return new Core(opts)
  EventEmitter.call(this)

  this.peers = []
  this.keypair = opts.keypair
  this.state = opts.state || {
    signed: null,
    sequence: 0
  }

  this.verify = function (value, cb) { cb() }
}
inherits(Core, EventEmitter)

Core.prototype.broadcast = function () {
  var self = this

  this.peers.forEach(function (peer) {
    peer.send(self.state)
  })
}

Core.prototype.write = function (value, salt) {
  this.state = {
    signed: sign.sign(this.keypair, value),
    sequence: this.state.sequence + 1
  }

  debug('writing', value.toString('hex'), this.state.sequence, this.peers.length)

  this.broadcast()
}

Core.prototype.peerStream = function () {
  var self = this

  var protocol = new Protocol()
  protocol._reader.on('data', function (message) {
    var state = messages.State.decode(message)
    debug('incoming', state)

    if (state.signed === null) {
      return debug('empty value')
    }

    var opened = sign.open(self.keypair.publicKey, state.signed)
    debug('opened', opened.toString('hex'))
    if (!opened) return debug('crypto verification failed')

    self.verify(opened, function (err) {
      if (err) return debug('custom verify error', err)

      if (state.sequence <= self.state.sequence) {
        return debug('sequence too low', state.sequence, self.state.sequence)
      }

      self.state = state
      self.emit('value', Buffer(opened))

      // TODO: this will be inefficient for large swarms
      self.broadcast()
    })
  })

  protocol.send(this.state)

  this.peers.push(protocol)
  return protocol
}

module.exports.Core = Core
module.exports.messages = require('./lib/messages')
module.exports.sign = require('./lib/sign')
