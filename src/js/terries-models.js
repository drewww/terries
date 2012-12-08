types = {};

types.Unit = Backbone.Model.extend({
  defaults: {
    team: 0,
    tile: null,
    targetX: null,
    targetY: null,
    selected: false
  },
  
  intialize: function(attributes) {
    Backbone.Model.prototype.initialize.call(this, attributes);
    this.on("change", function() {
      console.log("changed: "+ JSON.stringify(this.changedAttributes));
    }, this);
  },
  
  
  moveBy: function(dX, dY) {
    console.log("moving by: " + dX + "-" + dY);
    
    var newTile = this.tile.getAdjacentTile(dX, dY);
    this.tile.setUnit(null);
    this.set("tile", newTile);
    newTile.setUnit(this);
  },
  
  
  moveTowardsTarget: function() {
    if(this.has("targetX") && this.has("targetY")) {
    
      // move towards the target. some vector math shit here.
      // draw a vector to the target, normalize it
      var target = new Vec2(this.get("targetX"), this.get("targetY"));
      var pos = new Vec2(this.tile.get("x"), this.tile.get("y"));
    
      target.subV(pos);
      target.normalize();
      this.moveBy(Math.round(target.x), Math.round(target.y));
    }
  }
  
});

types.Tile = Backbone.Model.extend({
  defaults: {
    passable: true,
    empty: true,
    unit: null,
    x: -1,
    y: -1,
    map: null,
  },
  
  intialize: function(attributes) {
    Backbone.Model.prototype.initialize.call(this, attributes);
    this.set("id", this.get("x") + "x" + this.get("y"));
  },
  
  setUnit: function(unit) {
    this.set("unit", unit);
    
    // gotta give it a starting reference. Move command will update this
    // reference.
    unit.set("tile", this);
  },
  
  getAdjacentTile: function(dX, dY) {
    if(dX > 1) dX=1;
    if(dX < -1) dX=-1;
    if(dY > 1) dY=1;
    if(dY < -1) dY=-1;
    
    return this.map.getTile(this.x + dX, this.y + dY);
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
            this.unitSelected.set("targetX", tile.get("x"));
            this.unitSelected.set("targetY", tile.get("y"));
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
    var unit = new types.Unit({team:team});
    var tile = this.getTile(x, y);
    this.units.add(unit);
    tile.set("unit", unit);
  }
  
});