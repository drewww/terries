function TerriesGame() {
  
  // make a new map.
  // eventually we'll be loading maps out of some sort of file.
	this.map = new types.Map(null, {width:50, height: 50});
	this.map.getTile(10, 10).set("unit", new types.Unit({team:0}));
	this.map.getTile(30, 30).set("unit", new types.Unit({team:1}));
}

TerriesGame.prototype.tick = function() {
  
  // loop through each unit and tell it to move towards target.
  this.map.units.each(function(unit) {
    unit.moveTowardsTarget();
  });
  
}