function TerriesGame() {
  
  // make a new map.
  // eventually we'll be loading maps out of some sort of file.
	this.map = new types.Map(null, {width:60, height: 60});
  this.map.createUnitAt(5, 5, -1);
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
        if(unit.get("team")==types.TEAM_ZERO) {
          ownershipIncrement = -0.1;
        }
        
        var newOwnership = tile.get("ownership")+ownershipIncrement;
        tile.set("ownership", newOwnership);
      }
      
      // check and see if there's an adjacent unit.
      if(tile.has("unitId") && unit.isInOwnedTerritory()) {
        var adjacentUnit = types.curMap.units.get(tile.get("unitId"));
        
        // check and see if adjacent unit is enemy
        if(adjacentUnit.get("team")!=unit.get("team")) {
          // check and see if they're in the same zone (to avoid border issues)
          
          if(adjacentUnit.getTile().get("zone")==unitTile.get("zone")) {
            console.log("REPEL!!!");
          }
        }
        
        
        
        
      }
      
    });
  });
  
  
}