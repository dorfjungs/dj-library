goog.provide('dj.async.VideoPreloader');

/**
 * @constructor
 * @param {Array<HTMLVideoElement>=} optVideoElements
 */
dj.async.VideoPreloader = function(optVideoElements)
{
	/**
	 * @private
	 * @type {Array<HTMLVideoElement>}
	 */
	this.videoElements_ = optVideoElements || [];
};

/**
 * @param {Array<HTMLVideoElement>} elements]
 */
dj.async.VideoPreloader.prototype.addVideoElements = function(elements)
{
	for (var i = 0, len = elements.length; i < len; i++) {
		this.videoElements_.push(elements[i]);
	}
};

/**
 * @return {goog.Promise}
 */
dj.async.VideoPreloader.prototype.preload = function()
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