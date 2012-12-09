var express = require('express'),
    program = require('commander'),
    os = require('os'),
    sockjs_lib = require('sockjs'),
    http = require('http'),
    _ = require('underscore')._;
    
var app = express();
var httpServer = http.createServer(app);

program.version('0.1')
  .option('-p, --port <port>', 'Sets the port to bind to (default 8080)')
  .option('-h, --host <host>', 'Sets the io server host name (default os.hostname())')
  .parse(process.argv);
  
var options = {};

if(program.port) {
  options["port"] = program.port;
}

options = _.defaults(options, {"port":7070, "host":os.hostname() });

app.use(app.router);
app.use("/static", express.static(__dirname + '/src'));
app.set('views', __dirname + "/src/html");

app.get('/game', function(req, res) {
  res.render("game.ejs", options);
});

var sockjs = sockjs_lib.createServer();
sockjs.installHandlers(httpServer, {prefix:"/sock"});

httpServer.listen(options.port);


sockjs.on('connection', function(conn) {
  console.log("client connected");
  
  conn.on("close", function() {
    console.log("client closed");
  });
})

