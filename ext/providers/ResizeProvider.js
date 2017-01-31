goog.provide('dj.ext.providers.ResizeProvider');

// goog
goog.require('goog.events.EventTarget');
goog.require('goog.math.Size');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.ext.providers.ResizeProvider = function()
{
	dj.ext.providers.ResizeProvider.base(this, 'constructor');

	/**
	 * @private
	 * @type {!Window}
	 */
	this.target_ = goog.dom.getWindow();

	/**
	 * @private
	 * @type {goog.math.Size}
	 */
	this.windowSize_ = new goog.math.Size(0, 0);

	/**
	 * @private
	 * @type {goog.math.Size}
	 */
	this.lastWindowSize_ = this.windowSize_.clone();

	/**
	 * @private
	 * @type {boolean}
	 */
	this.initialized_ = false;
};

goog.inherits(
	dj.ext.providers.ResizeProvider,
	goog.events.EventTarget
);

goog.addSingletonGetter(
	dj.ext.providers.ResizeProvider
);

/**
 * @enum {string}
 */
dj.ext.providers.ResizeProvider.EventType = {
	RESIZE: 'dj.resize'
};

/**
 * @public
 */
dj.ext.providers.ResizeProvider.prototype.init = function()
{
	if ( ! this.initialized_) {
		this.upateWindowSize_();

		// Set reisze listener on target
		goog.events.listen(this.target_, goog.events.EventType.RESIZE,
			this.handleResize_, false, this);

		// Set initialized flag to prevent multitple initializations
		this.initialized_ = true;
	}
};

/**
 * @private
 */
dj.ext.providers.ResizeProvider.prototype.upateWindowSize_ = function()
{
	// Save last window size
	this.lastWindowSize_ = this.windowSize_.clone();

	// Set new window size. Using the function "getViewportSize" here to
	// ensure the scrollbar is subtracted from the window width and height.
	// This happens because the clientWidth is used instead of the innerWidth.
	this.windowSize_ = goog.dom.getViewportSize(goog.dom.getWindow());
};

/**
 * @private
 */
dj.ext.providers.ResizeProvider.prototype.handleResize_ = function()
{
	this.upateWindowSize_();

	// Dispatch custom resize event
	this.dispatchEvent(dj.ext.providers.ResizeProvider.EventType.RESIZE);
};

/**
 * @public
 */
dj.ext.providers.ResizeProvider.prototype.triggerResize = function()
{
	this.handleResize_();
};

/**
 * @public
 * @return {boolean}
 */
dj.ext.providers.ResizeProvider.prototype.isLandscape = function()
{
	return this.windowSize_.width > this.windowSize_.height;
};

/**
 * @public
 * @return {boolean}
 */
dj.ext.providers.ResizeProvider.prototype.isPortrait = function()
{
	return !this.isLandscape();
};

/**
 * @return {boolean}
 */
dj.ext.providers.ResizeProvider.prototype.isInitialized = function()
{
	return this.initialized_;
};

/**
 * @return {goog.math.Size}
 */
dj.ext.providers.ResizeProvider.prototype.getWindowSize = function()
{
	return this.windowSize_;
};

/**
 * @return {goog.math.Size}
 */
dj.ext.providers.ResizeProvider.prototype.getLastWindowSize = function()
{
	return this.lastWindowSize_;
};