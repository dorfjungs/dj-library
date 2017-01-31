goog.provide('dj.ext.preloaders.VideoPreloader');

/**
 * @constructor
 * @param {Array<HTMLVideoElement>=} optVideoElements
 */
dj.ext.preloaders.VideoPreloader = function(optVideoElements)
{
	/**
	 * @private
	 * @type {Array<HTMLVideoElement>}
	 */
	this.videoElements_ = optVideoElements || [];
};

/**
 * @public
 * @param {Array<HTMLVideoElement>} elements]
 */
dj.ext.preloaders.VideoPreloader.prototype.addVideoElements = function(elements)
{
	for (var i = 0, len = elements.length; i < len; i++) {
		this.videoElements_.push(elements[i]);
	}
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.ext.preloaders.VideoPreloader.prototype.preload = function()
{
	if (this.videoElements_.length == 0) {
		return goog.Promise.resolve();
	}
	else {
		var promises = [];

		for (var i = 0, len = this.videoElements_.length; i < len; i++) {
			var element = this.videoElements_[i];
			var promise = new goog.Promise(function(resolve, reject){
				goog.events.listenOnce(element, goog.events.EventType.CANPLAYTHROUGH, resolve);
			}, this);

			promises.push(promise);
		}

		this.videoElements_ = [];

		return goog.Promise.all(promises);
	}
};