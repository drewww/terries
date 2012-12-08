types = {};

types.curMap = null;
types.nextUnitId = 0;
types.Unit = Backbone.Model.extend({
  defaults: {
    team: 0,
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
      console.log("changed: "+ JSON.stringify(this.changedAttributes()));
    }, this);
    
    var tile = types.curMap.getTile(this.get("x"), this.get("y"));
    tile.set("unitId", this.id);
  },
  
  
  moveBy: function(dX, dY) {
    console.log("moving by: " + dX + "-" + dY);
    
    var newTile = this.getTile().getAdjacentTile(dX, dY);
    this.getTile().setUnit(null);
    this.set("tile", newTile);
    newTile.setUnit(this);
    this.set("x", newTile.get("x"));
    this.set("y", newTile.get("y"));
  },
  
  
  moveTowardsTarget: function() {
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
  
  setTarget: function(x, y) {
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
  },
  
  initialize: function(attributes) {
    Backbone.Model.prototype.initialize.call(this, attributes);
    this.set("id", this.get("x") + "x" + this.get("y"));
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
  }
});

types.UnitCollection = Backbone.Collection.extend({
  model:types.Unit
});

types.Map = Backbone.Collection.extend({
  model:types.Tile,
  
  width:0,
  height:0,
  units: null,
  unitSelected: null,
  
  initialize: function(models, options) {
    Backbone.Collection.prototype.initialize.call(this, models, options);
    types.curMap = this;
    options = _.defaults(options, {width:200, height:400});
    
    this.width = options.width;
    this.height = options.height;
    // now generate tiles.
    for(var y=0; y<this.height; y++) {
      for(var x=0; x<this.width; x++) {
        var newTile = new types.Tile({x:x, y:y});
        
        newTile.bind("clicked", function(tile) {
          
          // if a unit is selected, make that its target.
          if(!_.isNull(this.unitSelected)) {
            this.unitSelected.setTarget(tile.get("x"), tile.get("y"));
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
  }
  
});