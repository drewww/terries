var express = require('express'),
    program = require('commander'),
    os = require('os'),
    _ = require('underscore')._;
    
var app = express();

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

app.listen(options.port);