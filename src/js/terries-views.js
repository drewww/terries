views = {};

views.selectedUnitView = null;

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
    
    if(!_.isNull(views.selectedUnitView)) {
      views.selectedUnitView.selected = false;
      views.selectedUnitView.render();
    }
    
    this.selected = true;
    views.selectedUnitView = this;
    this.render();
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
    return this;
  },
  
  clicked: function() {
    this.trigger("clicked", this);
    
    // if there's a selected unit, set its target.
    if(!_.isNull(views.selectedUnitView)) {
      views.selectedUnitView.model.set("targetX", this.model.get("x"));
      views.selectedUnitView.model.set("targetY", this.model.get("y"));
    }
  }
});

views.MapView = Backbone.View.extend({
  
  className: "map",
  
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
  }
  
});