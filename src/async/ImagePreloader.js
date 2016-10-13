goog.provide('dj.async.ImagePreloader');

// goog
goog.require('goog.dom')
goog.require('goog.events');
goog.require('goog.Promise');

/**
 * @constructor
 * @param {Array.<string>=} opt_srcs
 */
dj.async.ImagePreloader = function(opt_srcs)
{
	/**
	 * @private
	 * @type {Array.<string>}
	 */
	this.sources_ = opt_srcs || [];

	/**
	 * @private
	 * @type {Function}
	 */
	this.preloadCallback_ = null;

	/**
	 * @private
	 * @type {number}
	 */
	this.maxSources_ = 0;

	/**
	 * @private
	 * @type {number}
	 */
	this.sourceCounter_ = 0;
};

/**
 * @param {string} src
 */
dj.async.ImagePreloader.prototype.addSource = function(src)
{
	this.sources_.push(src);
};

/**
 * @param {Array<string>} srcs
 */
dj.async.ImagePreloader.prototype.addSources = function(srcs)
{
	for (var i = 0, len = srcs.length; i < len; i++) {
		this.sources_.push(srcs[i]);
	}
};

/**
 * @param {Function=} optCallback
 * @param {Object=} optCtx
 * @return {goog.Promise}
 */
dj.async.ImagePreloader.prototype.preload = function(optCallback, optCtx)
{
	var promises = [];

	if (optCallback) {
		this.preloadCallback_ = goog.bind(optCallback, optCtx || optCallback);
	}

	for (var i = 0, len = this.sources_.length; i < len; i++) {
		promises.push(this.preloadSource_(this.sources_[i]));
	}

	this.maxSources_ = this.sources_.length;
	this.sourceCounter_  = 0;
	this.sources_ = [];

	return goog.Promise.all(promises);
};

/**
 * @param {string} src
 * @return {goog.Promise}
 */
dj.async.ImagePreloader.prototype.preloadSource_ = function(src)
{
	return new goog.Promise(function(resolve, reject){
		dj.async.ImagePreloader.preloadSource(src).then(function(){
			resolve();
			this.sourceCounter_++;

			if (this.preloadCallback_) {
				this.preloadCallback_();
			}
		}, reject, this);
	}, this);
};

/**
 * @return {number}
 */
dj.async.ImagePreloader.prototype.getProgress = function()
{
	return this.sourceCounter_ / this.maxSources_;
};

/**
 * @param {string} src
 * @return {goog.Promise}
 */
dj.async.ImagePreloader.preloadSource = function(src)
{
	return new goog.Promise(function(resolve, reject){
		var image = goog.dom.createDom('img');

		goog.events.listen(image, goog.events.EventType.ERROR, reject);
		goog.events.listen(image, goog.events.EventType.LOAD, function(){


			resolve();
		}, false, this);

		image['src'] = src;
	});
};