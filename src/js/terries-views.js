views = {};

views.UnitView = Backbone.View.extend({
  className: "unit",
  
  events: {
    "click":"clicked"
  },
  
  intialize: function(params) {
    Backbone.View.prototype.initialize.call(this, params);
  },
  
  render: function() {
    if(this.model.get("team")==0){
      this.$el.addClass("team0");
    } else {
      this.$el.addClass("team1");
    }
    
    return this;
  },
  
  clicked: function(event) {
    console.log("unit clicked");
  }
  
});

views.TileView = Backbone.View.extend({
  className: "tile",
  
  render: function() {
    this.$el.html();
    
    var unit = this.model.get("unit");
    if(!_.isNull(unit)) {
      console.log("found unit!");
      var unitView = new views.UnitView({model:unit});
      this.$el.append(unitView.render().el);
    }
    
    return this;
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