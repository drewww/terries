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


// SET UP GAME STATE HERE

var players = [];
var teamMap = [-1, 1];

var units = {
  0:{id:0, target:{x:null, y:null}},
  1:{id:1, target:{x:null, y:null}},
  2:{id:2, target:{x:null, y:null}},
  3:{id:3, target:{x:null, y:null}},
  4:{id:4, target:{x:null, y:null}},
  5:{id:5, target:{x:null, y:null}}
};

// SET UP EVENT HANDLERS HERE

sockjs.on('connection', function(conn) {
  console.log("client connected");
  conn.metadata = {};
  
  // assign them a team.
  if(players.length==2) {
    console.log("got a connection, but slots are full.");
    conn.close();
  } else {
    conn.metadata["team"] = teamMap[players.length];
    players.push(conn);
    
    write(conn, {type:"welcome", team:conn.metadata["team"]});
    
    if(players.length==2) {
      // START A GAME!
      write(conn, {type:"start"});
      
      setInterval(function() {
        // every ten seconds, dump current unit states.
        console.log("BROADCAST");
        broadcast(units);
      }, 10000);
    }
  }
  
  
  conn.on("data", function(e) {
    var msg = JSON.parse(e);
    console.log("got target message: " + e);
    // messages should be of the form:
    // {type:"move", id:num, target:{x:10, y:20}}
    // unpack those and shove them into the current unit states.
    units[msg.id].target = msg.target;
    
  });
  
  
  conn.on("close", function() {
    console.log("client closed");
  });
})

function write(conn, obj) {
  conn.write(JSON.stringify(obj));
}

function broadcast(obj) {
  _.each(players, function(conn) {
    write(conn, obj);
  });
}
