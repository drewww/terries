function TerriesGame() {
  
  // make a new map.
  // eventually we'll be loading maps out of some sort of file.
	this.map = new types.Map(null, {width:60, height: 60});
  this.map.createUnitAt(5, 5, 0);
  this.map.createUnitAt(30, 30, 1);
  
  this.map.createFlagAt(10, 10);
  this.map.createFlagAt(30, 10);
  this.map.createFlagAt(50, 10);
  
  setInterval(_.bind(this.tick, this), 500);
}

TerriesGame.prototype.tick = function() {
  
  // loop through each unit and tell it to move towards target.
  this.map.units.each(function(unit) {
    unit.moveTowardsTarget();
    
    // now check and see if there is an adjacent flag to any of the units.
    var unitTile = unit.getTile();
    _.each(unitTile.getAllAdjacentTiles(), function(tile) {
      if(tile.has("flag")) {
        var ownershipIncrement = 0.1;
        if(unit.get("team")==0) {
          ownershipIncrement = -0.1;
        }
        
        var newOwnership = tile.get("ownership")+ownershipIncrement;
        tile.set("ownership", newOwnership);
      }
    });
  });
  
  
}