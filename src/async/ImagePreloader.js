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
};

/**
 * @param {string} src
 */
dj.async.ImagePreloader.prototype.addSource = function(src)
{
	this.sources_.push(src);
};

/**
 * @return {goog.Promise}
 */
dj.async.ImagePreloader.prototype.preload = function()
{
	var promises = [];

	for (var i = 0, len = this.sources_.length; i < len; i++) {
		promises.push(dj.async.ImagePreloader.preloadSource(this.sources_[i]));
	}

	return goog.Promise.all(promises);
};

/**
 * @param {string} src
 * @return {goog.Promise}
 */
dj.async.ImagePreloader.preloadSource = function(src)
{
	return new goog.Promise(function(resolve, reject){
		var image = goog.dom.createDom('img');

		goog.events.listen(image, goog.events.EventType.LOAD, resolve);
		goog.events.listen(image, goog.events.EventType.ERROR, reject);

		image['src'] = src;
	});
};