views = {};

views.selectedUnitView = null;
views.curMap = null;
views.setSelectedUnitView = function(unitView) {
  
  if(!_.isNull(views.selectedUnitView)) {
    views.selectedUnitView.selected = false;
    views.selectedUnitView.render();
    
    views.curMap.toggleTileMouseovers(false, views.selectedUnitView.model.get("team"));
  }
  
  views.selectedUnitView = unitView;
  
  if(!_.isNull(unitView)) {
    unitView.selected = true;
    unitView.model.setTarget(null, null);
    unitView.render();
    
    views.curMap.toggleTileMouseovers(true, unitView.model.get("team"));
  }
}

views.UnitView = Backbone.View.extend({
  className: "unit",
  selected: false,
  events: {
    "click":"clicked"
  },
  
  intialize: function(params) {
    Backbone.View.prototype.initialize.call(this, params);
    this.model.bind("change", this.render, this);
  },
  
  render: function() {
    if(this.model.get("team")==0){
      this.$el.addClass("team0");
    } else {
      this.$el.addClass("team1");
    }
    
    if(this.selected) {
      this.$el.addClass("selected");
    } else {
      this.$el.removeClass("selected");
    }
    
    return this;
  },
  
  clicked: function(event) {
    this.trigger("clicked", this);
    
    views.setSelectedUnitView(this);
    event.stopPropagation();
  }
  
});

views.TileView = Backbone.View.extend({
  className: "tile",
  
  events: {
    "click":"clicked"
  },
  
  initialize: function(params) {
    Backbone.View.prototype.initialize.call(this, params);
    this.model.bind("change", function() {
      console.log("changed: " + JSON.stringify(this.model.changedAttributes()));
      console.log("render: " + this.model.get("x") + "x" + this.model.get("y"));
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
    
    if(this.model.has("isTargetForTeam")) {
      var team = this.model.get("isTargetForTeam");
      this.$el.addClass("target-" + team);
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
    
    var ownership = this.model.get("ownership");
    var fraction = 0;
    
    if(ownership!=0) {
      var ownershipDiv = $('<div class="ownership"></div>');
      
      if(ownership > 0) {
        ownershipDiv.addClass("team1");
      } else if (ownership < 0) {
        ownershipDiv.addClass("team0");
      }
      
      ownershipDiv.css("top", 10-10*(Math.abs(ownership)));
      this.$el.append(ownershipDiv);
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
      curTargetTile.set("isTargetForTeam", null);
      
      views.selectedUnitView.model.setTarget(this.model.get("x"),
        this.model.get("y"));
      views.setSelectedUnitView(null);
    }
  }
});

views.MapView = Backbone.View.extend({
  
  className: "map",
  
  initialize: function(params) {
    Backbone.View.prototype.initialize.call(this, params);
    views.curMap = this;
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
  }
});