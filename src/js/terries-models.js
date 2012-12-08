types = {};

types.Unit = Backbone.Model.extend({
  defaults: {
    team: 0,
    tile: null,
    targetX: -1,
    targetY: -1
  },
  
  moveBy: function(dX, dY) {
    var newTile = this.tile.getAdjacentTile(dX, dY);
    this.tile.setUnit(null);
    this.set("tile", newTile);
    newTile.setUnit(this);
  },
  
  moveTowardsTarget: function() {
    // move towards the target. some vector math shit here.
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

types.Map = Backbone.Collection.extend({
  model:types.Tile,
  
  width:0,
  height:0,
  
  initialize: function(models, options) {
    Backbone.Collection.prototype.initialize.call(this, models, options);
    
    options = _.defaults(options, {width:200, height:400});
    
    this.width = options.width;
    this.height = options.height;
    // now generate tiles.
    for(var y=0; y<this.height; y++) {
      for(var x=0; x<this.width; x++) {
        var newTile = new types.Tile({x:x, y:y});
        this.add(newTile);
      }
    }
    
    _.bindAll(this);
  },
  
  getTile: function(x, y) {
    return this.at(x + y*this.height);
  }
});