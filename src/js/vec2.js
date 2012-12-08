function Vec2(x,y)
{
this.x = x;
this.y = y;
}

Vec2.prototype = {
  /* vector * scalar */
  mulS: function (value){ return new Vec2(this.x*value, this.y*value); },
  /* vector * vector */
  mulV: function(vec_) { return new Vec2(this.x * vec_.x, this.y * vec_.y); },
  /* vector / scalar */
  divS: function(value) { return new Vec2(this.x/value,this.y/value); },
  /* vector + scalar */
  addS: function(value) { return new Vec2(this.x+value,this.y+value); },
  /* vector + vector */
  addV: function(vec_) { return new Vec2(this.x+vec_.x,this.y+vec_.y); },
  /* vector - scalar */
  subS: function(value) { return new Vec2(this.x-value, this.y-value); },
  /* vector - vector */
  subV: function(vec_) { return new Vec2(this.x-vec_.x,this.y-vec_.y); },
  /* vector absolute */
  abs: function() { return new Vec2(Math.abs(this.x),Math.abs(this.y)); },
  /* dot product */
  dot: function(vec_) { return (this.x*vec_.x+this.y*vec_.y); },
  /* vector length */
  length: function() { return Math.sqrt(this.dot(this)); },
  /* vector length, squared */
  lengthSqr: function() { return this.dot(this); },
  /*
  vector linear interpolation
  interpolate between two vectors.
  value should be in 0.0f - 1.0f space
  */
  lerp: function(vec_, value) {
  return new Vec2(
  this.x+(vec_.x-this.x)*value,
  this.y+(vec_.y-this.y)*value
  );
  },
  /* normalize THIS vector */
  normalize: function() {
  var vlen = this.length();
  this.x = this.x/ vlen;
  this.y = this.y/ vlen;
  }
}