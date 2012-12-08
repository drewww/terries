function TerriesGame() {
  
  // make a new map.
  // eventually we'll be loading maps out of some sort of file.
	this.map = new types.Map(null, {width:50, height: 50});
  this.map.createUnitAt(10, 10, 0);
  this.map.createUnitAt(30, 30, 1);
  
  setInterval(_.bind(this.tick, this), 50);
}

TerriesGame.prototype.tick = function() {
  
  // loop through each unit and tell it to move towards target.
  this.map.units.each(function(unit) {
    unit.moveTowardsTarget();
  });
  
}