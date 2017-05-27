goog.provide('dj.ext.preloaders.ImagePreloader');

// goog
goog.require('goog.dom')
goog.require('goog.events');
goog.require('goog.Promise');

/**
 * @constructor
 * @param {Array.<string>=} optSrcs
 */
dj.ext.preloaders.ImagePreloader = function(optSrcs)
{
	/**
	 * @private
	 * @type {Array.<string>}
	 */
	this.sources_ = optSrcs || [];

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
 * @public
 * @param {string} src
 */
dj.ext.preloaders.ImagePreloader.prototype.addSource = function(src)
{
	var multiPattern = /\[[0-9]+-[0-9]+]/gi;

	if (multiPattern.test(src)) {
		var match = src.match(multiPattern)[0];
		var points = src.split('.');
		var ext = points[points.length-1];
		var path = src.replace(multiPattern, '').replace('.' + ext, '');

		if (match) {
			var start = parseInt(match.split('-')[0].replace('[', ''), 10);
			var end = parseInt(match.split('-')[1].replace(']', ''), 10);

			for (var i = start; i <= end; i++) {
				this.sources_.push(path + i + '.' + ext);
			}
		}
	}
	else {
		this.sources_.push(src);
	}
};

/**
 * @public
 * @param {Array<string>} srcs
 */
dj.ext.preloaders.ImagePreloader.prototype.addSources = function(srcs)
{
	for (var i = 0, len = srcs.length; i < len; i++) {
		this.addSource(srcs[i]);
	}
};

/**
 * @public
 * @param {Function=} optCallback
 * @param {Object=} optCtx
 * @return {goog.Promise}
 */
dj.ext.preloaders.ImagePreloader.prototype.preload = function(optCallback, optCtx)
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
 * @private
 * @param {string} src
 * @return {goog.Promise}
 */
dj.ext.preloaders.ImagePreloader.prototype.preloadSource_ = function(src)
{
	return new goog.Promise(function(resolve, reject){
		dj.ext.preloaders.ImagePreloader.preloadSource(src).then(function(image){
			resolve(image);
			this.sourceCounter_++;

			if (this.preloadCallback_) {
				this.preloadCallback_();
			}
		}, reject, this);
	}, this);
};

/**
 * @public
 * @return {number}
 */
dj.ext.preloaders.ImagePreloader.prototype.getProgress = function()
{
	return this.sourceCounter_ / this.maxSources_;
};

/**
 * @public
 * @param {string} src
 * @return {goog.Promise}
 */
dj.ext.preloaders.ImagePreloader.preloadSource = function(src)
{
	return new goog.Promise(function(resolve, reject){
		var image = goog.dom.createDom('img');

		goog.events.listen(image, goog.events.EventType.ERROR, function(){
            reject(image);
        });

		goog.events.listen(image, goog.events.EventType.LOAD, function(){
            resolve(image);
        });

		image['src'] = src;
	});
};