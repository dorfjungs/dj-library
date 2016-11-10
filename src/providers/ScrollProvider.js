goog.provide('dj.providers.ScrollProvider');

// goog
goog.require('goog.events.EventTarget');
goog.require('goog.math.Size');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.providers.ScrollProvider = function()
{
	goog.base(this);

	/**
	 * @private
	 * @type {goog.math.Coordinate}
	 */
	this.scrollPosition_ = new goog.math.Coordinate();

	/**
	 * @private
	 * @type {Array<Function>}
	 */
	this.callacks_ = [];

	// Set reisze listener
	goog.events.listen(goog.dom.getWindow(), goog.events.EventType.SCROLL,
		this.handleScroll_, false, this);

	// Initial resize on tick
	goog.async.nextTick(this.handleScroll_, this);
};

goog.inherits(
	dj.providers.ScrollProvider,
	goog.events.EventTarget
);

goog.addSingletonGetter(
	dj.providers.ScrollProvider
);

/**
 * @private
 */
dj.providers.ScrollProvider.prototype.handleScroll_ = function()
{
	this.scrollPosition_ = goog.dom.getDocumentScroll();

	this.processListeners_();
};

/**
 * @private
 */
dj.providers.ScrollProvider.prototype.processListeners_ = function()
{
	for (var i = 0, len = this.callacks_.length; i < len; i++) {
		this.callacks_[i](this.scrollPosition_);
	}
};

/**
 * @return {goog.math.Coordinate}
 */
dj.providers.ScrollProvider.prototype.getScrollPosition = function()
{
	return this.scrollPosition_;
};

/**
 * @param {Function} callback
 *
 */
dj.providers.ScrollProvider.prototype.onScroll = function(callback, optContext)
{
	if (optContext) {
		callback = goog.bind(callback, optContext);
	}
	else {
		callback = goog.bind(callback, callback);
	}

	this.callacks_.push(callback);
};