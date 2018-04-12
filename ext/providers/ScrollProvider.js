goog.provide('dj.ext.providers.ScrollProvider');

// goog
goog.require('goog.events.EventTarget');
goog.require('goog.userAgent');
goog.require('goog.math.Size');
goog.require('goog.style');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.ext.providers.ScrollProvider = function()
{
	dj.ext.providers.ScrollProvider.base(this, 'constructor');

	/**
     * @private
     * @type {!Window}
     */
    this.target_ = goog.dom.getWindow();

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
     * @type {boolean}
     */
    this.scrollingDisabled_ = false;

    /**
     * @private
     * @type {boolean}
     */
    this.initialized_ = false;
};

goog.inherits(
	dj.ext.providers.ScrollProvider,
	goog.events.EventTarget
);

goog.addSingletonGetter(
	dj.ext.providers.ScrollProvider
);

/**
 * @enum {string}
 */
dj.ext.providers.ScrollProvider.EventType = {
	SCROLL: 'dj.scroll'
};

/**
 * @public
 */
dj.ext.providers.ScrollProvider.prototype.init = function()
{
	if ( ! this.initialized_) {
		// Set reisze listener on target
		goog.events.listen(this.target_, goog.events.EventType.SCROLL,
			this.handleScroll_, false, this);

		// Initial update
		this.updateScrollPosition_();

		// Prevent from re-initialization
		this.initialized_ = true;
	}
};

/**
 * @private
 */
dj.ext.providers.ScrollProvider.prototype.handleScroll_ = function()
{
	this.updateScrollPosition_();
	this.dispatchEvent(dj.ext.providers.ScrollProvider.EventType.SCROLL);
};

/**
 * @private
 */
dj.ext.providers.ScrollProvider.prototype.updateScrollPosition_ = function()
{
	this.scrollPosition_ = goog.dom.getDocumentScroll();
};

/**
 * @public
 * @param {goog.math.Coordinate} position
 */
dj.ext.providers.ScrollProvider.prototype.scrollTo = function(position)
{
    if (this.target_.hasOwnProperty('scrollTo')) {
        this.target_['scrollTo'](position.x, position.y);
    }
};

/**
 * @public
 * @param {boolean=} optRestore
 * @param {boolean} disabled
 */
dj.ext.providers.ScrollProvider.prototype.disableScrolling = function(disabled, optRestore)
{
	if (this.scrollingDisabled_ != disabled) {
        var htmlElement = /** @type {!Element} */ (document.querySelector('html'));
        var bodyElement = /** @type {!Element} */ (document.querySelector('body'));

	    if (this.scrollingDisabled_ = disabled) {
	    	if (optRestore && optRestore == true) {
	        	this.scrollTo(this.scrollPosition_);
	        }

            goog.style.setStyle(htmlElement, 'overflow', 'hidden');

            if (goog.userAgent.MOBILE) {
                goog.style.setStyle(bodyElement, {
                    'position': 'fixed',
                    'overflow': 'hidden',
                    'left': '0',
                    'top': -this.scrollPosition_.y + 'px',
                    'right': '0',
                    'bottom': '0'
                });
            }

	        this.lastScrollPosiiton_ = this.scrollPosition_.clone();
	    }
	    else {
            goog.style.setStyle(htmlElement, 'overflow', '');

            if (goog.userAgent.MOBILE) {
                goog.style.setStyle(bodyElement, {
                    'position': '',
                    'overflow': '',
                    'left': '',
                    'top': '',
                    'right': '',
                    'bottom': ''
                });
            }

            if (optRestore && optRestore == true) {
                setTimeout(function(){
                    this.scrollTo(this.lastScrollPosiiton_);
                }.bind(this), 0);
	    	}
	    }
    }
};

/**
 * @public
 * @return {goog.math.Coordinate}
 */
dj.ext.providers.ScrollProvider.prototype.getScrollPosition = function()
{
	return this.scrollPosition_;
};

/**
 * @public
 * @return {boolean}
 */
dj.ext.providers.ScrollProvider.prototype.isInitialized = function()
{
	return this.initialized_;
};