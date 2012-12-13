views = {};

views.selectedUnitView = null;
views.curMap = null;
views.setSelectedUnitView = function(unitView) {
  
  var team;
  
  if(!_.isNull(views.selectedUnitView)) {
    
    if(views.selectedUnitView.model.get("team")<0) {
      team=0;
    } else {
      team=1;
    }
    
    views.selectedUnitView.selected = false;
    views.selectedUnitView.render();
    
    
    views.curMap.toggleTileMouseovers(false, team);
  }
  
  views.selectedUnitView = unitView;
  
  if(!_.isNull(unitView)) {
    unitView.selected = true;
    unitView.model.setTarget(null, null);
    unitView.render();
    
    if(unitView.model.get("team")<0) {
      team=0;
    } else {
      team=1;
    }
    
    views.curMap.toggleTileMouseovers(true, team);
  }
}

views.UnitView = Backbone.View.extend({
  className: "unit",
  selected: false,
  events: {
    "click":"clicked"
  },
  
  initialize: function(params) {
    Backbone.View.prototype.initialize.call(this, params);
    this.model.bind("change:disabled", function() {
      this.render();
    }, this);
  },
  
  render: function() {
    
    // this is where we'll figure out about visibility on the unit level.
    // the rules are this:
    // 1. you can see anything in a zone where you have a unit.
    // (2). zones flash when enemies enter them.
    
    // to do this, we'll compose a list of "zones we have vision in" and only
    // render ENEMY units when they're in one of those zones.  that will
    // come from the map level.
    
    // check with the map. if we have don't have zone occupancy, then hide.
    // otherwise, show.
    if(types.curMap.playingAsTeam != 0) {
      if(this.model.get("team")!=types.curMap.playingAsTeam) {
        // if it's an enemy, then check visibility.
      
        var zone = this.model.getTile().get("zone");
      
        if(!(zone in types.curMap.zonesOccupied)) {
          // drop out
          this.$el.hide();
          console.log("hiding enemy unit");
          return this;
        } else {
          this.$el.show();
        }
      }
    }
    
    if(this.model.get("team")==types.TEAM_ZERO){
      this.$el.addClass("team0");
    } else {
      this.$el.addClass("team1");
    }
    
    if(this.selected) {
      this.$el.addClass("selected");
    } else {
      this.$el.removeClass("selected");
    }
    
    this.$el.css({opacity:1.0-(0.9*(this.model.get("disabled")/5))});
    
    return this;
  },
  
  clicked: function(event) {
    
    // check and see if we're on the right team and allowed to select those
    // units.
    if(types.curMap.playingAsTeam==this.model.get("team")) {
      
      if(this.model.get("disabled")==0) {
        this.trigger("clicked", this);
        views.setSelectedUnitView(this);
      }
      
      event.stopPropagation();
    }
  }
  
});

views.TileView = Backbone.View.extend({
  className: "tile",
  ownership: null,
  
  events: {
    "click":"clicked"
  },
  
  initialize: function(params) {
    Backbone.View.prototype.initialize.call(this, params);
    this.model.bind("change", function() {
      // console.log("changed: " + JSON.stringify(this.model.changedAttributes()));
      // console.log("render: " + this.model.get("x") + "x" + this.model.get("y"));
      this.render();
    }, this);
  },
  
  render: function() {
    this.$el.html("");
    
    if(this.model.has("unitId")) {
      console.log("rendering unit in tile: " + this.model.get("x") + " " + this.model.get("y"));
      var unit = types.curMap.units.get(this.model.get("unitId"));
      if(!_.isNull(unit)) {
        var unitView = new views.UnitView({model:unit});
        this.$el.append(unitView.render().el);
      }
    }
    
    if(this.model.has("isTargetForTeam") && 
      this.model.get("isTargetForTeam")==types.curMap.playingAsTeam) {
      var team = this.model.get("isTargetForTeam");
      if(team==1) {
        this.$el.addClass("target-1");
      } else {
        this.$el.addClass("target-0");
      }
      
    } else {
      this.$el.removeClass("target-1");
      this.$el.removeClass("target-0");
    }
    
    if(this.model.has("zone")) {
      this.$el.addClass("zone-" + this.model.get("zone"));
    }
    
    if(this.model.has("flag")) {
      this.$el.addClass("flag");
    }
    
    // sort of weird; tile ownership is tied to the flag,
    // ownership in the view is tied to the zone. should
    // probably sort that out at some point.
    var ownership = this.model.get("ownership");
    var fraction = 0;
    
    if(ownership!=0) {
      var ownershipDiv = $('<div class="ownership"></div>');
      
      if(ownership > 0) {
        ownershipDiv.addClass("team1");
      } else if (ownership < 0) {
        ownershipDiv.addClass("team0");
      }
      
      ownershipDiv.css("top", 20-20*(Math.abs(ownership)));
      this.$el.append(ownershipDiv);
    }
    
    var zoneOwnership = this.model.get("zoneOwnership");
    if(zoneOwnership==types.TEAM_ONE) {
      this.$el.addClass("zone-owned-1");
    } else if(zoneOwnership==types.TEAM_ZERO) {
      this.$el.addClass("zone-owned-0");
    } else {
      this.$el.removeClass("zone-owned-0");
      this.$el.removeClass("zone-owned-1");
    }
    
    var boundaries = this.model.get("boundaries");
    var direction = ["Top", "Right", "Bottom", "Left"];
    for(var i=0; i<4; i++) {
      // console.log(this.model.get("x") + "," + this.model.get("y") + ":" + JSON.stringify(boundaries));
      if(boundaries[i]) {
        this.$el.css("border" + direction[i], "1px solid black");
      }
    }
    
    
    
    return this;
  },
  
  clicked: function() {
    this.trigger("clicked", this);
    
    // if there's a selected unit, set its target.
    if(!_.isNull(views.selectedUnitView)) {
      var curTargetTile = types.curMap.getTile(
        views.selectedUnitView.model.get("targetX"),
        views.selectedUnitView.model.get("targetY"));
      
      if(!_.isUndefined(curTargetTile)) {
        curTargetTile.set("isTargetForTeam", null);
      }
      
      views.selectedUnitView.model.setTarget(this.model.get("x"),
        this.model.get("y"));
        
      // SEND THE DATA TO THE SERVER
      sock.send(JSON.stringify({type:"move", id:views.selectedUnitView.model.id,
        target:{x:this.model.get("x"), y:this.model.get("y")}}));
        
        
      views.setSelectedUnitView(null);
    }
  }
});

views.GameView = Backbone.View.extend({
  className: "scoreboard",
  
  template: _.template('<div class="score team0"><%=score[0]%></div>\
<div class="score team1"><%=score[1]%></div>\
<div class="gameTime"><%=gameTime%></div><div class="turnTime"><%=timeToMove%><div class="indicator"></div></div>'),
  
  initialize: function(params) {
    Backbone.View.prototype.initialize.call(this, params);
    this.model.bind("change", function() {
      this.render();
    }, this);
  },
  
  render: function() {
    var json = this.model.toJSON();
    // json["score"] = this.model.getScore();
    this.$el.html(this.template(json));
    
    this.$el.find(".indicator").css({width:((this.model.get("timeToMove")/15.0)*100 + "%")});
    
    return this;
  }
});

views.MapView = Backbone.View.extend({
  
  className: "map",
  
  initialize: function(params) {
    Backbone.View.prototype.initialize.call(this, params);
    views.curMap = this;
    
    this.collection.bind("zone:captured", function(zoneId) {
      var zone = this.collection.zones.get(zoneId);
      // mark all the tiles in that zone as captured.
      var zoneTiles = this.getTilesForZone(zoneId);
      _.each(zoneTiles, function(tile) {
        tile.set("zoneOwnership", zone.get("ownership"));
      });
      
    }, this);
    
    this.collection.bind("enemy-border-cross", function(intoZone) {
      // flash the tiles in this zone.
      
      // TODO check if it should be visible
      console.log("ENEMY BORDER CROSS IN ZONE: " + intoZone);
      if(types.curGame.zoneOwnedByPlayer(intoZone)) {
        this.$el.find(".zone-"+intoZone).addClass("trespassing");
        console.log("ENEMY BORDER CROSS IN ZONE WE OWN: " + intoZone);
      }
    }, this);
    
  },
  
  clearTrespassing: function() {
    console.log("CLEAR TRESPASSING");
    $(".trespassing").removeClass("trespassing");
  },
  
  render: function() {
    this.$el.html();
    
    var startEven = true;
    var curToggle;
    for(var y=0; y<this.collection.height; y++) {
      curToggle = startEven;
      for(var x=0; x<this.collection.width; x++) {
        var tile = this.collection.getTile(x, y);
        var view = new views.TileView({model:tile});
        this.$el.append(view.render().el);
        
        if(curToggle) {
          view.$el.addClass("even");
        } else {
          view.$el.addClass("odd");
        }
        
        curToggle = !curToggle;
      }
      this.$el.append($('<br class="clear">'));
      startEven = !startEven;
    }
    
    return this;
  },
  
  toggleTileMouseovers: function(enable, team) {
    if(enable) {
      this.$el.find(".tile").addClass("mouseover-" + team);
    } else {
      this.$el.find(".tile").removeClass("mouseover-" + team);
    }
  },
  
  getTilesForZone: function(zone) {
    return this.collection.filter(function(tile) {
      if(tile.get("zone")==zone) return true;
    });
  }
  
});