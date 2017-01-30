goog.provide('dj.providers.ResizeProvider');

// goog
goog.require('goog.events.EventTarget');
goog.require('goog.math.Size');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.providers.ResizeProvider = function()
{
	goog.base(this);

	/**
	 * @private
	 * @type {goog.math.Size}
	 */
	this.windowSize_ = new goog.math.Size(0, 0);

	/**
	 * @private
	 * @type {Array<Function>}
	 */
	this.callacks_ = [];

	// Set reisze listener
	goog.events.listen(goog.dom.getWindow(), goog.events.EventType.RESIZE,
		this.handleResize_, false, this);

	// Initial resize on tick
	goog.async.nextTick(this.handleResize_, this);
};

goog.inherits(
	dj.providers.ResizeProvider,
	goog.events.EventTarget
);

goog.addSingletonGetter(
	dj.providers.ResizeProvider
);

/**
 * @private
 */
dj.providers.ResizeProvider.prototype.handleResize_ = function()
{
	this.windowSize_ = goog.dom.getViewportSize(goog.dom.getWindow());
	this.processListeners_();
};

/**
 *
 */
dj.providers.ResizeProvider.prototype.triggerResize = function()
{
	this.handleResize_();
};

/**
 * @private
 */
dj.providers.ResizeProvider.prototype.processListeners_ = function()
{
	for (var i = 0, len = this.callacks_.length; i < len; i++) {
		this.callacks_[i]();
	}
};

/**
 * @return {goog.math.Size}
 */
dj.providers.ResizeProvider.prototype.getWindowSize = function()
{
	return this.windowSize_;
};

/**
 * @param {Function} callback
 *
 */
dj.providers.ResizeProvider.prototype.onResize = function(callback, optContext)
{
	if (optContext) {
		callback = goog.bind(callback, optContext, this.windowSize_);
	}
	else {
		callback = goog.bind(callback, callback, this.windowSize_);
	}

	this.callacks_.push(callback);
};