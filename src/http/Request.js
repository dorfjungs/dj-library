goog.provide('dj.http.Request');

// goog
goog.require('goog.events.EventTarget');
goog.require('goog.net.XhrIo');
goog.require('goog.Promise');
goog.require('goog.json');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.http.Request = function()
{
	goog.base(this);
};

goog.inherits(
	dj.http.Request,
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
dj.http.Request.send = function(url, optMethod, optContent, optHeaders)
{
	return new goog.Promise(function(resolve, reject){
		goog.net.XhrIo.send(url, function(event){
			var content = event.target.getResponse();

			// Check if response is in json format
			if (goog.json.isValid(content)) {
				content = goog.json.parse(content);
			}

			resolve(content);
		}, optMethod, optContent, optHeaders);
	});
};