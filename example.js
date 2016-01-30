var swarm = require('webrtc-swarm')
var signalhub = require('signalhub')
var wrtc = require('wrtc')
var through2Map = require('through2-map')
var split = require('split')
var pkv = require('.')

var keypair
if (process.argv[2]) {
  keypair = {'publicKey': Buffer(process.argv[2], 'hex')}
} else {
  keypair = pkv.sign.keypair()
}

var pubkeyHex = Buffer(keypair.publicKey).toString('hex')
console.log('pubkey', pubkeyHex)

var hub = signalhub(pubkeyHex, ['https://signalhub.mafintosh.com'])

var sw = swarm(hub, {
  wrtc: wrtc // you don't need this if you use it in the browser
})

var core = pkv.Core({keypair: keypair})

sw.on('peer', function (peer, id) {
  console.log('connected to a new peer:', id)
  console.log('total peers:', sw.peers.length)
  var peerStream = core.peerStream()
  peerStream.pipe(peer).pipe(peerStream)
})

if (keypair.secretKey) {
  process.stdin.pipe(split()).pipe(through2Map(function (data) {
    core.write(Buffer(data))
  }))
} else {
  core.on('value', function (value) {
    console.log(value.toString())
  })
}
