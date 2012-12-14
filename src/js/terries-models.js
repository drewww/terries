
types = {};
types.TEAM_ONE = 1;
types.TEAM_ZERO = -1;
types.NEUTRAL = 0;

types.curMap = null;
types.curGame = null;
types.nextUnitId = 0;


types.Game = Backbone.Model.extend({
  defaults: {
    ownership: null,
    timeToMove: 0,
    gameTime: 0,
    duration: 0,
    score: null
  },
  
  initialize: function(attributes) {
    Backbone.Model.prototype.initialize.call(this, attributes);
    
    this.set("ownership", {});
    this.set("score", [0, 0]);
    // bind to the map for some events
    types.curMap.bind("zone:captured", function(zoneId, capturedBy) {
      // keep track of zone capture.
      var ownership = this.get("ownership");
      ownership[zoneId] = capturedBy;
      this.set("ownership", ownership);
      this.set("score", this.getScore());
    }, this);
    
    types.curGame = this;
  },
  
  zoneOwnedByPlayer: function(zone) {
    var ownership = this.get("ownership");
    if(zone in ownership) {
      return ownership[zone]==types.curMap.playingAsTeam;
    } else {
      // no one owns it
      return false;
    }
    
    return this.get("ownership")[zone]
  },
  
  getScore: function() {
    var score = [0, 0];
    console.log(JSON.stringify(this.get("ownership")));
    _.each(this.get("ownership"), function(val, key) {
      console.log("key: " + key + "; val: " + val);
      if(val==-1) {
        score[0] = score[0]+1;
      } else {
        score[1] = score[1]+1;
      }
    });
    
    return score;
  },
  
  startMovePeriod: function(duration) {
    this.set("timeToMove",duration);
    clearTimeout(this.timeout);
    
    this.timeout = setTimeout(_.bind(this.countdown, this), 1000);
    this.turnOver();
  },
  
  countdown: function() {
    var val = this.get("timeToMove")-1;
    this.set("timeToMove", val);
    
    if(val > 0) {
      this.timeout = setTimeout(_.bind(this.countdown, this), 1000);
    }
  },
  
  start: function(gameDuration) {
    // kick off the timeToMove time
    this.set("gameTime", 0);
    this.set("duration", gameDuration);
  },
  
  turnOver: function() {
    var turn = this.get("gameTime");
    
    turn++;
    
    if(turn==this.get("duration")) {
      console.log("GAME OVER");
      
      // disconnect the socket
      sock.close();
      
      this.trigger("gameover");
    } else {
      this.set("gameTime", turn);
    }
  }
  
});


types.Unit = Backbone.Model.extend({
  defaults: {
    team: types.NEUTRAL,
    targetX: null,
    targetY: null,
    x: null,
    y: null,
    disabled: 0
  },
  
  initialize: function(attributes) {
    Backbone.Model.prototype.initialize.call(this, attributes);
    this.id = types.nextUnitId;
    types.nextUnitId++;
    
    this.on("change", function() {
      // console.log("changed: "+ JSON.stringify(this.changedAttributes()));
    }, this);
    
    var tile;
    if("tile" in attributes) {
      tile = attributes["tile"];
    } else {
      tile = types.curMap.getTile(this.get("x"), this.get("y"));
    }
    
    tile.set("unitId", this.id);
  },
  
  
  moveBy: function(dX, dY) {
    var newTile = this.getTile().getAdjacentTile(dX, dY);
    
    // cancel the move if the tile is occupied. also, cancel the target.
    if(newTile.isOccupied()) {
      this.setTarget(null, null);
      return;
    }
    
    if(newTile.get("zone")!=this.getTile().get("zone")) {
      this.trigger("border-cross", this.getTile().get("zone"),
        newTile.get("zone"));
    }
    
    this.getTile().setUnit(null);
    this.set("tile", newTile);
    newTile.setUnit(this);
    this.set("x", newTile.get("x"));
    this.set("y", newTile.get("y"));
  },
  
  
  moveTowardsTarget: function() {
    if(this.get("x")==this.get("targetX") && this.get("y")==this.get("targetY")) {
      console.log("at target!");
      
      this.setTarget(null, null);
    }
    
    // if we're disabled, don't move, just work down the disabled counter.
    if(this.get("disabled")>0) {
      this.set("disabled", this.get("disabled")-1);
      return;
    }
    
    if(this.has("targetX") && this.has("targetY")) {
      
      
      // move towards the target. some vector math shit here.
      // draw a vector to the target, normalize it
      var target = new Vec2(this.get("targetX"), this.get("targetY"));
      var pos = new Vec2(this.get("x"), this.get("y"));
      
      if(target.x==pos.x && target.y==pos.y) return;
      
      target = target.subV(pos);
      
      target.normalize();
      this.moveBy(Math.round(target.x), Math.round(target.y));
    }
  },
  
  disableFor: function(ticks) {
    console.log("disabling unit");
    this.set("disabled", ticks);
  },
  
  getTile: function() {
    return types.curMap.getTile(this.get("x"), this.get("y"));
  },
  
  getTeamIndex: function() {
    if(this.get("team")==types.TEAM_ONE){
      return 1;
    } else {
      return 0;
    }
  },
  
  isInOwnedTerritory: function() {
    return this.getTile().get("zoneOwnership")==this.get("team");
  },
  
  setTarget: function(x, y) {
    
    if(!_.isNull(x) && !_.isNull(y)) {
      console.log("setting new target");
      // set target on the tile.
      var targetTile = types.curMap.getTile(x, y);
      targetTile.set("isTargetForTeam", this.get("team"));
    } else {
      console.log("clearing target");
      var targetX = this.get("targetX");
      var targetY = this.get("targetY");
      
      if(!_.isNull(targetX) && !_.isNull(targetY)) {
        var targetTile = types.curMap.getTile(targetX, targetY);
        targetTile.set("isTargetForTeam", null);
      }
    }
    
    this.set("targetX", x);
    this.set("targetY", y);
  }
});

types.Tile = Backbone.Model.extend({
  defaults: {
    passable: true,
    empty: true,
    unitId: null,
    x: -1,
    y: -1,
    isTargetForTeam: null,
    flag: null,
    zone: null,
    ownership: 0,
    zoneOwnership: null,
    boundaries: null,
  },
  
  initialize: function(attributes) {
    Backbone.Model.prototype.initialize.call(this, attributes);
    this.set("id", this.get("x") + "x" + this.get("y"));
    
    this.set("boundaries", [false, false, false, false]);
    
    this.bind("change:ownership", function() {
      var ownership = this.get("ownership");
      
      if(ownership>1) this.set("ownership", 1);
      if(ownership<-1) this.set("ownership", -1);
      
      if(Math.abs(ownership)>=1) {
        // trigger a captured event.
        var capturedBy = types.NEUTRAL;
        if(ownership>=1) {
          capturedBy = types.TEAM_ONE;
          this.set("ownership", 1);
        }
        if(ownership<=-1) {
          capturedBy = types.TEAM_ZERO;
          this.set("ownership", -1);
        }
        console.log("CAPTURED");
        this.trigger("captured", capturedBy, this);
      } else if(ownership<0.05 && ownership>=-0.05) {
        // this is basically decapping
        this.set("ownership", 0);
        this.trigger("captured", types.NEUTRAL, this);
      }
      
    }, this);
  },
  
  setUnit: function(unit) {
    if(_.isNull(unit) || _.isUndefined(unit)) {
      this.set("unitId", null);
    } else {
      this.set("unitId", unit.id);
    }
  },
  
  isOccupied: function() {
    if(this.has("flag")) return true;
    if(this.has("unitId")) return true;
  },
  
  getAdjacentTile: function(dX, dY) {
    if(dX > 1) dX=1;
    if(dX < -1) dX=-1;
    if(dY > 1) dY=1;
    if(dY < -1) dY=-1;
    
    return types.curMap.getTile(this.get("x") + dX, this.get("y") + dY);
  },
  
  getAllAdjacentTiles: function() {
    var tiles = [];
    
    tiles.push(this.getAdjacentTile(1, 1));
    tiles.push(this.getAdjacentTile(1, 0));
    tiles.push(this.getAdjacentTile(0, 1));
    tiles.push(this.getAdjacentTile(-1,-1));
    tiles.push(this.getAdjacentTile(-1, 0));
    tiles.push(this.getAdjacentTile(0, -1));
    tiles.push(this.getAdjacentTile(-1, 1));
    tiles.push(this.getAdjacentTile(1, -1));
    
    return tiles;
  }
  
});

types.Zone = Backbone.Model.extend({
  defaults: {
    ownership: types.NEUTRAL,
  }
});

types.UnitCollection = Backbone.Collection.extend({
  model:types.Unit
});

types.ZoneCollection = Backbone.Collection.extend({
  model:types.Zone
});

types.Map = Backbone.Collection.extend({
  model:types.Tile,
  
  width:0,
  height:0,
  units: null,
  zones: null,
  unitSelected: null,
  playingAsTeam: 0,
  zonesOccupied: null,
  
  initialize: function(models, options) {
    Backbone.Collection.prototype.initialize.call(this, models, options);
    types.curMap = this;
    
    options = _.defaults(options, {});
    
    this.zones = new types.ZoneCollection();
    this.zonesOccupied = {};
    
    if("width" in options && "height" in options) {
      // take this as a sign to auto-generate a set of base tiles.
      this.generateBaseMap(options.width, options.height);
    }
    
    this.units = new types.UnitCollection();
    
    _.bindAll(this);
  },
  
  generateBaseMap: function(width, height) {
    this.width = width;
    this.height = height;
    
    var zoneWidth = Math.floor(this.width/3);
    var zoneHeight = Math.floor(this.height/3);

    // now generate tiles.
    for(var y=0; y<this.height; y++) {
      for(var x=0; x<this.width; x++) {
        
        var zoneX = Math.floor(x/zoneWidth);
        var zoneY = Math.floor(y/zoneHeight);
        var zone = zoneX + 3*zoneY;
        
        if(_.isUndefined(this.zones.get(zone))) {
          var newZone = new types.Zone({id:zone});
          this.zones.add(newZone);
        }
        
        var newTile = new types.Tile({x:x, y:y, zone:zone});
        this.addTile(newTile);
      }
    }
    
    this.postProcessMap();
  },
  
  addTile: function(tile) {
    
    tile.bind("clicked", function(tile) {
      
      // if a unit is selected, make that its target.
      if(!_.isNull(this.unitSelected)) {
        this.unitSelected.setTarget(tile.get("x"), tile.get("y"));
      }
      
    }, this);
    
    tile.bind("captured", function(capturedBy, tile) {
      // if this tile gets captured, flip ownership on its
      // zone object, and trigger a zone-captured event.
      var zone = this.zones.get(tile.get("zone"));
      
      if(zone.get("ownership")!=capturedBy) {
        zone.set("ownership", capturedBy)
        
        console.log("zone captured: " + zone.id);
        this.trigger("zone:captured", zone.id, capturedBy);
      }
    }, this);
    
    this.add(tile);
  },
  
  loadMap: function(mapString) {
    
    var x = 0;
    var y = 0;
    var curTile = new types.Tile({x:x, y:y});
    
    _.each(mapString, _.bind(function(char) {
      switch(char) {
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case "0":
          var zoneId = parseInt(char);
          
          if(_.isUndefined(this.zones.get(zoneId))) {
            var newZone = new types.Zone({id:zoneId});
            this.zones.add(newZone);
          }
          
          curTile.set("zone", parseInt(char));
          break;
        case ",":
          this.addTile(curTile);
          console.log("finished tile: " + JSON.stringify(curTile.toJSON()));
          x++;
          curTile = new types.Tile({x:x, y:y});
          break;
        case "x":  // carriage return
          console.log("NEW ROW");
          this.width = x;
          this.height = y+1;
          x = 0;
          y++;
          curTile = new types.Tile({x:x, y:y});
          break;
        case "f":
          curTile.set("flag", true);
          break;
        case "a":
          this.createUnitInTile(curTile, -1);
          break;
        case "b":
          this.createUnitInTile(curTile, 1);
          break;
      }
    }, this));
    
    console.log("dimensions: " + this.width + "x" + this.height);
    this.postProcessMap();
  },
  
  postProcessMap: function() {
    // figure out zone boundaries for visual purposes. Loop through after
    // the whole map is constructed. 
    for(var y=0; y<this.height; y++) {
      for(var x=0; x<this.width; x++) {
        var tile = this.getTile(x, y);
        
        // for both of these, it's top, right, bottom, left ala CSS
        var boundaries = [false, false, false, false];
        
        // check adjacency for zone transitions;
        var adjacentTiles = [
          tile.getAdjacentTile(0, -1),
          tile.getAdjacentTile(1, 0),
          tile.getAdjacentTile(0, 1),
          tile.getAdjacentTile(-1, 0),
        ];
        
        var i=0;
        _.each(adjacentTiles, function(adjacentTile) {
          // console.log(adjacentTile);
          if(_.isUndefined(adjacentTile) || _.isNull(adjacentTile)) {
            boundaries[i] = true;
          } else {
            boundaries[i] = tile.get("zone") != adjacentTile.get("zone");
          }
          i++;
        });
        
        tile.set('boundaries', boundaries);
        // console.log(x + "," + y + ":" + JSON.stringify(boundaries));
      }
    }
  },
  
  getTile: function(x, y) {
    var result = this.get(x + "x" + y);
    // console.log(x + "x" + y+":" + result);
    // console.log(result);
    return result;
  },
  
  createUnitAt: function(x, y, team) {
    this.createUnitInTile(this.getTile(x, y), team);
  },
  
  createUnitInTile: function(tile, team) {
    var params = {team:team, x:tile.get("x"), y:tile.get("y"), tile:tile};
    var unit = new types.Unit(params);
    this.units.add(unit);
    
    var zoneAddedTo = tile.get("zone");
    
    // keep track of unit movements.
    unit.bind("border-cross", function(fromZone, toZone) {
      if(team==this.playingAsTeam) {
        // then do zone occupancy updating
        this.zonesOccupied[fromZone] = this.zonesOccupied[fromZone]-1;
        
        if(this.zonesOccupied[fromZone]==0) {
          delete this.zonesOccupied[fromZone];
        }
        
        var curOccupancy = 0;
        if(toZone in this.zonesOccupied) {
          curOccupancy = this.zonesOccupied[toZone];
        }
        
        curOccupancy++;
        this.zonesOccupied[toZone] = curOccupancy;
        
      } else {
        // it's enemy movement. check and see if it should trigger a
        // notification.
        this.trigger("enemy-border-cross", toZone);
      }
      
      
    }, this);
  },
  
  createFlagAt: function(x, y) {
    var tile = this.getTile(x, y);
    tile.set("flag", true);
  },
  
});