function TerriesGame(sock) {
  
  this.enabled = false;
  
  // make a new map.
  // eventually we'll be loading maps out of some sort of file.
	this.map = new types.Map(null, {width:60, height: 60});
  this.map.createUnitAt(5, 5, -1);
  this.map.createUnitAt(10, 5, -1);
  this.map.createUnitAt(5, 10, -1);

  this.map.createUnitAt(55, 55, 1);
  this.map.createUnitAt(50, 55, 1);
  this.map.createUnitAt(55, 50, 1);
  
  this.map.createFlagAt(10, 10);
  this.map.createFlagAt(30, 10);
  this.map.createFlagAt(50, 10);
  this.map.createFlagAt(10, 30);
  this.map.createFlagAt(30, 30);
  this.map.createFlagAt(50, 30);
  this.map.createFlagAt(10, 50);
  this.map.createFlagAt(30, 50);
  this.map.createFlagAt(50, 50);
  
  // wait for a start command
  sock.onmessage = _.bind(function(e) {
    var msg = JSON.parse(e.data);
    // console.log("msg data: " + JSON.stringify(msg));
    
    switch(msg.type) {
      case "welcome":
        // set which units we're allowed to control.
        this.team = msg.team;
        this.map.playingAsTeam = this.team;
        
        this.map.units.each(function(unit) {
          var team = unit.get("team");
          var zoneAddedTo = unit.getTile().get("zone");
          
          // update zone occupation data
          if(team==this.playingAsTeam) {
            var curOccupancy = 0;
            if(zoneAddedTo in this.zonesOccupied) {
              curOccupancy = this.zonesOccupied[zoneAddedTo];
            }

            curOccupancy++;
            this.zonesOccupied[zoneAddedTo] = curOccupancy;
          }
        }, this.map);
        
        
        console.log("set to team " + this.team);
        break;
      
      case "start":
        console.log("GAME ON");
        
        
        
        // allow selection now.
        this.setSelectionEnabled(true);
        break;
      case "update":
        this.setSelectionEnabled(false);
        // update all the units with their new targets
        _.each(msg.units, _.bind(function(value, key) {
          var unit = this.map.units.get(value.id);
          unit.setTarget(value.target.x, value.target.y);
        }, this));
        
        // run the simulation 5 ticks
        for(var i=0; i<5; i++) {
          setTimeout(_.bind(this.tick, this), 200*i);
        }
        
        setTimeout(_.bind(this.setSelectionEnabled, this), 5*200, true);
        
        break;
    }
	}, this);
	
  // we're going to wait for a 
  // setInterval(_.bind(this.tick, this), 500);
}

TerriesGame.prototype.setSelectionEnabled = function(enabled) {
  if(this.enabled!=enabled) {
    
    if(enabled) {
      $(".selection-block").hide();
    } else {
      $(".selection-block").show();
    }
    
    this.enabled = enabled;
  }
}

TerriesGame.prototype.tick = function() {
  
  // check zone occupancy list
  console.log(JSON.stringify(this.map.zonesOccupied));
  
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
            // the question now is, what do we do in a fight?
            // 1. disable the losing unit
            // 2. push the unit somewhere:
            //      some fixed distance away
            //      move in a direction until it hits a friendly zone
            //        (this is risky, it could be a super-long distance)
            //      moves to the nearest friendly zone
            //        (I like this best, but it's a bit tricky to calculate)
            //      moves to where it was 5 moves ago
            //        (this has some interesting counterplay options, but also
            //         might make it impossible to get away?)
            //
            // for now, we'll do a disable and play with these mechanics later
            // only disable if they're not ALREADY disabled.
            if(adjacentUnit.get("disabled")==0) {
              adjacentUnit.disableFor(5);
            }
          }
        }
        
        
        
        
      }
      
    });
  });
  
  
}