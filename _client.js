var shoe = require('shoe')
var through = require('through')

var stream = shoe('http://localhost:9999/sub')
stream.pipe(through((msg) => {
//    this.queue(String(Number(msg)^1));
  console.log(msg)
})).pipe(stream)

window.stream = stream
