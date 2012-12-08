types = {};

types.Unit = Backbone.Model.extend({
  defaults: {
    team: 0,
    x: 0,
    y: 0
  }
});

types.Tile = Backbone.Model.extend({
  defaults: {
    passable: true,
    empty: true,
    unit: null,
    x: -1,
    y: -1,
  },
  
  intialize: function(attributes) {
    Backbone.Model.prototype.initialize.call(this, attributes);
    this.set("id", this.get("x") + "x" + this.get("y"));
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
    for(var y=0; y<this.width; y++) {
      for(var x=0; x<this.height; x++) {
        var newTile = new types.Tile({x:x, y:y});
        this.add(newTile);
        console.log("added tile: " + newTile.id);
      }
    }
    
    _.bindAll(this);
  },
  
  getTile: function(x, y) {
    return this.at(x + y*this.height);
  }
});