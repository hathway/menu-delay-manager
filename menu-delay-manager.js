(function(factory) {
  var root = window;

  // common.js
  if (typeof exports !== 'undefined') {
    var $;
    try { $ = require('jquery'); } catch(e) {}
    factory(exports, $);

  // browser global.
  } else {
    root.MenuDelayManager = factory({}, root.jQuery || root.Zepto || root.ender || root.$);
  }

}(function(exports, $) {
  /**
   * Responsible to apply a class to a list of elements on hover.
   * waits for a timeout and provides grace for motion in one direction.
   * Currently hard coded to give grace to motions to the right (will only work with vertical navs oriented left).
   * @param {object|jQuery} opts - can be config with following props or a list of hoverItems
   * @param {jQuery} $hoverItems - jQuery objects to watch hover state.
   * @param {number} delay - timeout duration before allowing switch to happen - defaults to 500
   * @param {string} activeClass - defaults to `open`
   * @param {number} xSensitivity - to increase horizontal motion value
   * @param {number} ySensitivity - to increase vertical motion value
   * @constructor
   */
  function MenuDelayManager (opts) {
    opts = opts || {};

    if (opts instanceof $) {
      opts = {
        $hoverItems: opts
      };
    }

    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);

    this.delay = opts.delay || 500;
    this.activeClass = opts.activeClass || 'open';
    this.setHoverItems(opts.$hoverItems || $());

    this.mouseTracker = new MouseTracker({
      xSensitivity: opts.xSensitivity,
      ySensitivity: opts.ySensitivity
    });

    this.queue = [];
    this.$current = $();

    this.init(opts);
  }
  MenuDelayManager.prototype.init = function (opts) {

  };
  MenuDelayManager.prototype.setHoverItems = function ($items) {
    this._unbindHoverItems();
    this.$hoverItems = $items instanceof $ ? $items : $();
    this._bindToHoverItems();
  };
  MenuDelayManager.prototype._bindToHoverItems = function () {
    if (!this.hasHoverItems()) return;

    this.$hoverItems.on('mouseenter', this.handleMouseEnter);
    this.$hoverItems.on('mouseleave', this.handleMouseLeave);
  };
  MenuDelayManager.prototype._unbindHoverItems = function () {
    if (!this.hasHoverItems()) return;

    this.$hoverItems.off('mouseenter', this.handleMouseEnter);
    this.$hoverItems.off('mouseleave', this.handleMouseLeave);
  };
  MenuDelayManager.prototype.handleMouseEnter = function (e) {
    var $item = $(e.currentTarget);

    if (this.hasCurrent() && this.mouseTracker.isGoingRight()) {
      this.queue.push($item);
      setTimeout(function () {
        this._setActiveItem($item);
      }.bind(this), this.delay);
    } else {
      this._setActiveItem($item);
    }
  };
  MenuDelayManager.prototype.handleMouseLeave = function (e) {
    var $item = $(e.currentTarget);

    if ($item.is(this.$current)) {
      setTimeout(function () {
        if ($item.is(this.$current) && !this.queue.length) {
          this._unsetActiveItem($item);
        }
      }.bind(this), this.delay);
    }
  };
  MenuDelayManager.prototype._setActiveItem = function ($item) {
    $item = this.queue.shift() || $item;
    if (this.queue.length) return;

    this._unsetActiveItem();
    this.$current = $item;
    $item.addClass(this.activeClass);
  };
  MenuDelayManager.prototype._unsetActiveItem = function ($item) {
    $item = $item || this.$current;
    $item.removeClass(this.activeClass);
    this.$current = $();
  };
  MenuDelayManager.prototype.hasHoverItems = function () {
    return !!(this.$hoverItems && this.$hoverItems.length);
  };
  MenuDelayManager.prototype.hasCurrent = function () {
    return !!(this.$current && this.$current.length);
  };

  function MouseTracker (opts) {
    opts = opts || {};

    this.$trackingArea = opts.$trackingArea || $('body');
    this.trackingLimit = opts.trackingLimit || 10;
    this.positions = [];
    this.ySensitivity = opts.ySensitivity || 1;
    this.xSensitivity = opts.xSensitivity || 1;

    this._handleMouseMove = this._handleMouseMove.bind(this);
    setInterval(function () {
      this.positions.pop();
    }.bind(this), 60);

    this.init(opts);
  }
  MouseTracker.prototype.init = function (opts) {
    this._bindMouseMovement();
  };
  MouseTracker.prototype._bindMouseMovement = function () {
    if (!this.$trackingArea || !this.$trackingArea.length) return;

    this.$trackingArea.mousemove(this._handleMouseMove);
  };
  MouseTracker.prototype._handleMouseMove = function (e) {
    this.positions.unshift(new Coordinate(e.pageX, e.pageY));
    this.positions = this.positions.slice(0,this.trackingLimit);
    this._calculateDirection();
  };
  // This calculation could use a better formula.
  MouseTracker.prototype._calculateDirection = function () {
    this.horz = this.positions[0].x - this.positions[this.positions.length - 1].x;
    this.vert = this.positions[0].y - this.positions[this.positions.length - 1].y;
  };
  // Remeber as the mouse position goes down the y value increases.
  MouseTracker.prototype.isGoingUp = function () {
    return this.vert < 0 &&
           this.vert * this.ySensitivity < this.horz * this.xSensitivity;
  };
  MouseTracker.prototype.isGoingDown = function () {
    return this.vert > 0 &&
           this.vert * this.ySensitivity > this.horz * this.xSensitivity;
  };
  MouseTracker.prototype.isGoingLeft = function () {
    return this.horz < 0 &&
           this.horz * this.xSensitivity < this.vert * this.ySensitivity;
  };
  MouseTracker.prototype.isGoingRight = function () {
    return this.horz > 0 &&
           this.horz * this.xSensitivity > this.vert * this.ySensitivity;
  };

  function Coordinate (x, y) {
    this.x = x;
    this.y = y;
  }
  Coordinate.prototype.isValid = function () {
    return !!(this.x && this.y);
  };

  return exports = MenuDelayManager;

}));