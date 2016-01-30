pubkey-value
============
Pubkey-value provides a logical core and wire protocol for replicating a single mutable signed value. Each update to the value must be signed by a private key, and updates can be verified with a public key.

Pubkey-value is transport-agnostic: it should work with any swarm. In `example.js`, it is used with [webrtc-swarm](https://github.com/mafintosh/webrtc-swarm).

In this example, `core1` creates a value and sends it to `core2`. `core1` has the private key, which is necessary for writing. `core2` has only the public key, which is necessary for reading. Each peer stream is a duplex stream. For an interactive example, see `example.js`.

```
var pkv = require('pubkey-value')

var keyPair = pkv.sign.keypair()
var core1 = pkv.Core({keypair: keyPair})
var core2 = pkv.Core({keypair: {publicKey: keyPair.publicKey}})

var ps1 = core1.peerStream()
var ps2 = core2.peerStream()

ps1.pipe(ps2).pipe(ps1)

core2.on('value', console.log)

core1.write(Buffer('sup'))
```

A value is only accepted if it has been signed with the public key.

The user can also add a custom verification function by setting `core.verify`. Incoming values are only stored and rebroadcast if they pass this verification function.

Each time a value is sent, it is sent with a sequence number. A new value is only accepted if its sequence number is strictly greater than the current local sequence number.

Since values are always sent with a sequence number and signature, the writer does not need to be part of the swarm in order for the value to replicate. As long as the recipient has the public key, an update from any member of the swarm can be verified.

This is similar to [BEP 44](www.bittorrent.org/beps/bep_0044.html), [r-value](https://github.com/dominictarr/r-value), and [secure-scuttlebutt](https://github.com/ssbc/secure-scuttlebutt).
