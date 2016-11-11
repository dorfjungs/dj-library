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
	 * @type {goog.math.Coordinate}
	 */
    this.lastScrollPosiiton_ = new goog.math.Coordinate();

	/**
	 * @private
	 * @type {Array<Function>}
	 */
	this.callacks_ = [];

    /**
     * @private
     * @type {boolean}
     */
    this.scrollingDisabled_ = false;

    /**
     * @private
     * @type {Element|Window}
     */
    this.scrollTarget_ = goog.dom.getWindow();

	// Set reisze listener
	goog.events.listen(this.scrollTarget_, goog.events.EventType.SCROLL,
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

/**
 * @param {goog.math.Coordinate} position
 */
dj.providers.ScrollProvider.prototype.scrollTo = function(position)
{
    if (this.scrollTarget_.hasOwnProperty('scrollTo')) {
        this.scrollTarget_['scrollTo'](position.x, position.y);
    }
};

/**
 * @param {boolean} disabled
 */
dj.providers.ScrollProvider.prototype.disableScrolling = function(disabled)
{
    var html = goog.dom.getElementsByTagNameAndClass('html')[0];

    this.scrollingDisabled_ = disabled;

    if (disabled) {
        this.scrollTo(this.scrollPosition_);
        this.lastScrollPosiiton_ = this.scrollPosition_.clone();
        goog.style.setStyle(html, 'overflow', 'hidden');
    }
    else {
        this.scrollTo(this.lastScrollPosiiton_);
        goog.style.setStyle(html, 'overflow', '');
    }
};