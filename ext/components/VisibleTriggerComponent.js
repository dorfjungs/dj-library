goog.provide('dj.ext.components.VisibleTriggerComponent');

// goog
goog.require('goog.async.nextTick');

// dj
goog.require('dj.sys.components.AbstractComponent');

/**
 * @constructor
 * @extends {dj.sys.components.AbstractComponent}
 */
dj.ext.components.VisibleTriggerComponent = function()
{
    dj.ext.components.VisibleTriggerComponent.base(this, 'constructor');

    /**
     * @private
     * @type {goog.math.Coordinate}
     */
    this.elementOffset_ = new goog.math.Coordinate();

    /**
     * @private
     * @type {goog.math.Size}
     */
    this.elementSize_ = new goog.math.Size(0, 0);

    /**
     * @private
     * @type {goog.math.Coordinate}
     */
    this.visibleOffset_ = new goog.math.Coordinate();

     /**
     * @private
     * @type {boolean}
     */
    this.visible_ = false;

    /**
     * @private
     * @type {boolean}
     */
    this.wasVisible_ = false;

    /**
     * @private
     * @type {number}
     */
    this.offsetUpdateRate_ = dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_INIT;

    /**
     * @private
     * @type {number}
     */
    this.sizeUpdateRate_ = dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_INIT;

    /**
     * @private
     * @type {number}
     */
    this.resetMode_ = dj.ext.components.VisibleTriggerComponent.ResetMode.BELOW;
};

goog.inherits(
    dj.ext.components.VisibleTriggerComponent,
	dj.sys.components.AbstractComponent
);

/**
 * @private
 * @type {string}
 */
dj.ext.components.VisibleTriggerComponent.prototype.visibleClass_ = 'visible';

/**
 * @enum {number}
 */
dj.ext.components.VisibleTriggerComponent.ResetMode = {
	NONE: 1,
	ABOVE: 2,
	BELOW: 4
};

/**
 * @enum {number}
 */
dj.ext.components.VisibleTriggerComponent.UpdateRate = {
	ON_INIT: 1,
	ON_RESIZE: 2,
	ON_SCROLL: 4
};

/** @export @inheritDoc */
dj.ext.components.VisibleTriggerComponent.prototype.ready = function()
{
	return this.baseReady(dj.ext.components.VisibleTriggerComponent, function(resolve, reject){
		this.offsetUpdateRate_ |= dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_RESIZE;
		this.sizeUpdateRate_ |= dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_RESIZE;

		// Set scroll update rate
		if (this.hasConfig('scroll-update')) {
			var scrollUpdate = this.getConfig('scroll-update');

			if ((/offset/gi).test(scrollUpdate)) {
				this.offsetUpdateRate_ |= dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_SCROLL;
			}

			if ((/size/gi).test(scrollUpdate)) {
				this.sizeUpdateRate_ |= dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_SCROLL;
			}
		}

		// Set visible offsets
		if (this.hasConfig('offset-y')) {
			this.visibleOffset_.y = parseInt(this.getConfig('offset-y'), 10);
		}

		// Initial update
		if (this.offsetUpdateRate_ & dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_INIT) {
			this.updateOffset_();
		}

		if (this.sizeUpdateRate_ & dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_INIT) {
			this.updateSize_();
		}

		goog.async.nextTick(resolve);
	});
};

/** @export @inheritDoc  */
dj.ext.components.VisibleTriggerComponent.prototype.init = function()
{
	return this.baseInit(dj.ext.components.VisibleTriggerComponent, function(resolve, reject){
		this.listenResize();
		this.listenScroll();

		goog.async.nextTick(this.updateVisiblity_, this);
		goog.async.nextTick(resolve, this);
	});
};

/**
 * @private
 */
dj.ext.components.VisibleTriggerComponent.prototype.updateOffset_ = function()
{
	this.elementOffset_ = goog.math.Coordinate.sum(
		goog.style.getPageOffset(this.getElement()),
		/** @type {!goog.math.Coordinate} */ (this.visibleOffset_)
	);
};

/**
 * @private
 */
dj.ext.components.VisibleTriggerComponent.prototype.updateSize_ = function()
{
	this.elementSize_ = goog.style.getSize(this.getElement());
};

/** @inheritDoc */
dj.ext.components.VisibleTriggerComponent.prototype.handleScroll = function()
{
    dj.ext.components.VisibleTriggerComponent.base(this, 'handleScroll');

	if (this.offsetUpdateRate_ & dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_SCROLL) {
		this.updateOffset_();
	}

	if (this.sizeUpdateRate_ & dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_SCROLL) {
		this.updateSize_();
	}

	this.updateVisiblity_();
};

/** @inheritDoc */
dj.ext.components.VisibleTriggerComponent.prototype.handleResize = function()
{
    dj.ext.components.VisibleTriggerComponent.base(this, 'handleResize');

	if (this.offsetUpdateRate_ & dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_RESIZE) {
		this.updateOffset_();
	}

	if (this.sizeUpdateRate_ & dj.ext.components.VisibleTriggerComponent.UpdateRate.ON_RESIZE) {
		this.updateSize_();
	}
};

/**
 * @private
 */
dj.ext.components.VisibleTriggerComponent.prototype.updateVisiblity_ = function()
{
	var scrollPosition = this.getScrollPosition();
	var windowSize = this.getWindowSize();
	var visible = this.elementOffset_.y - scrollPosition.y - windowSize.height <= 0;

	if (visible && ! this.wasVisible_) {
		this.wasVisible_ = true;
	}

	if (this.resetMode_ & dj.ext.components.VisibleTriggerComponent.ResetMode.NONE) {
		visible = this.wasVisible_ || visible;
	}
	else {
		var below = this.isElementBelow_(scrollPosition);
		var above = this.isElementAbove_(scrollPosition);

		if (this.resetMode_ & dj.ext.components.VisibleTriggerComponent.ResetMode.ABOVE) {
			if (this.wasVisible_ && above) {
				visible = false;
			}
			else if (this.wasVisible_ && below) {
				visible = true;
			}
		}

		if (this.resetMode_ & dj.ext.components.VisibleTriggerComponent.ResetMode.BELOW) {
			if (this.wasVisible_ && above) {
				visible = true;
			}
			else if (this.wasVisible_ && below) {
				visible = false;
			}
		}

		if (this.resetMode_ & dj.ext.components.VisibleTriggerComponent.ResetMode.BELOW &&
			this.resetMode_ & dj.ext.components.VisibleTriggerComponent.ResetMode.ABOVE) {
			if (above || below) {
				visible = false;
			}
		}
	}

	if (visible != this.visible_) {
		this.visiblityChanged(visible);
	}

	goog.dom.classlist.enable(this.getElement(), this.visibleClass_, this.visible_ = visible);
};

/**
 * @private
 * @param {goog.math.Coordinate} position
 * @return {boolean}
 */
dj.ext.components.VisibleTriggerComponent.prototype.isElementAbove_ = function(position)
{
	return position.y > this.elementOffset_.y + this.elementSize_.height;
};

/**
 * @private
 * @param {goog.math.Coordinate} position
 * @return {boolean}
 */
dj.ext.components.VisibleTriggerComponent.prototype.isElementBelow_ = function(position)
{
	var windowSize = this.getWindowSize();

	return position.y + windowSize.height < this.elementOffset_.y;
};

/**
 * @return {boolean}
 */
dj.ext.components.VisibleTriggerComponent.prototype.isVisible = function()
{
	return this.visible_;
};

/**
 * @return {boolean}
 */
dj.ext.components.VisibleTriggerComponent.prototype.wasVisible = function()
{
	return this.wasVisible_;
};

/**
 * @public
 * @return {goog.math.Coordinate}
 */
dj.ext.components.VisibleTriggerComponent.prototype.getVisibleOffset = function()
{
    return this.visibleOffset_;
};

/**
 * @public
 * @return {goog.math.Size}
 */
dj.ext.components.VisibleTriggerComponent.prototype.getVisibleSize = function()
{
    return this.elementSize_;
};

/**
 * @param {number} x
 * @param {number} y
 */
dj.ext.components.VisibleTriggerComponent.prototype.setVisibleOffset = function(x, y)
{
	this.visibleOffset_.x = x;
	this.visibleOffset_.y = y;

	this.updateOffset_();
};

/**
 * @public
 * @param {number} mode
 */
dj.ext.components.VisibleTriggerComponent.prototype.addResetMode = function(mode)
{
    this.resetMode_ |= mode;
};

/**
 * @protected
 * @param {boolean} visible
 */
dj.ext.components.VisibleTriggerComponent.prototype.visiblityChanged = function(visible)
{

};