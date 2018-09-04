goog.provide('dj.ext.http.Request');

// goog
goog.require('goog.events.EventTarget');
goog.require('goog.net.XhrIo');
goog.require('goog.Promise');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.ext.http.Request = function()
{
	dj.ext.http.Request.base(this, 'constructor');
};

goog.inherits(
	dj.ext.http.Request,
	goog.events.EventTarget
);

/**
 * @param {string|goog.Uri} url Uri to make request to.
 * @param {string=} optMethod Send method, default: GET.
 * @param {ArrayBuffer|ArrayBufferView|Blob|Document|FormData|string=}
 *     optContent Body data.
 * @param {Object|goog.structs.Map=} optHeaders Map of headers to add to the
 *     request.
 * @return {goog.Promise}
 */
dj.ext.http.Request.send = function(url, optMethod, optContent, optHeaders)
{
	return new goog.Promise(function(resolve, reject){
		goog.net.XhrIo.send(url, function(event){
			var content = event.target.getResponse();

			// Check if response is in json format
			try {
				var jsonContent = JSON.parse(content);
			} catch(e) {}

			if (jsonContent) {
				content = jsonContent
			}

			resolve(content);
		}, optMethod, optContent, optHeaders);
	});
};