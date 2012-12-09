
types = {};
types.TEAM_ONE = 1;
types.TEAM_ZERO = -1;
types.NEUTRAL = 0;

types.curMap = null;
types.nextUnitId = 0;
types.Unit = Backbone.Model.extend({
  defaults: {
    team: types.NEUTRAL,
    targetX: null,
    targetY: null,
    x: null,
    y: null,
  },
  
  initialize: function(attributes) {
    Backbone.Model.prototype.initialize.call(this, attributes);
    this.id = types.nextUnitId;
    types.nextUnitId++;
    
    this.on("change", function() {
      // console.log("changed: "+ JSON.stringify(this.changedAttributes()));
    }, this);
    
    var tile = types.curMap.getTile(this.get("x"), this.get("y"));
    tile.set("unitId", this.id);
  },
  
  
  moveBy: function(dX, dY) {
    // console.log("moving by: " + dX + "-" + dY);
    
    var newTile = this.getTile().getAdjacentTile(dX, dY);
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
      // this.set("targetX", null);
      // this.set("targetY", null);
      // 
      // var targetTile = types.curMap.getTile(this.get("x"), this.get("y"));
      // targetTile.set("isTargetForTeam", null);
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
  
  setTarget: function(x, y) {
    
    if(!_.isNull(x) && !_.isNull(y)) {
      console.log("setting new target");
      // set target on the tile.
      var targetTile = types.curMap.getTile(x, y);
      targetTile.set("isTargetForTeam", this.getTeamIndex());
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
  },
  
  initialize: function(attributes) {
    Backbone.Model.prototype.initialize.call(this, attributes);
    this.set("id", this.get("x") + "x" + this.get("y"));
    
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
  
  initialize: function(models, options) {
    Backbone.Collection.prototype.initialize.call(this, models, options);
    types.curMap = this;
    options = _.defaults(options, {width:200, height:400});
    
    this.zones = new types.ZoneCollection();
    
    this.width = options.width;
    this.height = options.height;
    
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
        
        newTile.bind("clicked", function(tile) {
          
          // if a unit is selected, make that its target.
          if(!_.isNull(this.unitSelected)) {
            this.unitSelected.setTarget(tile.get("x"), tile.get("y"));
          }
          
        }, this);
        
        newTile.bind("captured", function(capturedBy, tile) {
          // if this tile gets captured, flip ownership on its
          // zone object, and trigger a zone-captured event.
          var zone = this.zones.get(tile.get("zone"));
          
          if(zone.get("ownership")!=capturedBy) {
            zone.set("ownership", capturedBy)
            
            console.log("zone captured: " + zone.id);
            this.trigger("zone:captured", zone.id);
          }
        }, this);
        
        this.add(newTile);
      }
    }
    
    this.units = new types.UnitCollection();
    
    _.bindAll(this);
  },
  
  getTile: function(x, y) {
    return this.at(x + y*this.height);
  },
  
  createUnitAt: function(x, y, team) {
    var unit = new types.Unit({team:team, x:x, y:y});
    this.units.add(unit);
  },
  
  createFlagAt: function(x, y) {
    var tile = this.getTile(x, y);
    tile.set("flag", true);
  },
  
});