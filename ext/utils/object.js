goog.provide('dj.ext.object');

/**
 * @private
 * @type {Object}
 */
dj.ext.object.valuePathCache_ = {};

/**
 * @private
 * @type {Object}
 */
dj.ext.object.pathObjectMap_ = {};

/**
 * Combines an existing object with the path of
 * the given string to get the right value of
 * the existing object
 *
 * @param {Object} obj
 * @param {string} str
 * @return {*}
 */
dj.ext.object.getByValueByPath = function(obj, str)
{
	if (dj.ext.object.pathObjectMap_.hasOwnProperty(str) &&
		dj.ext.object.pathObjectMap_[str] == obj &&
		dj.ext.object.valuePathCache_.hasOwnProperty(str)) {
		return dj.ext.object.valuePathCache_[str];
	}

	var path = str.split('.');
	var result;

	for (var i = 0, len = path.length; i < len; i++) {
		result = result ? result[path[i]] : obj[path[i]];
	}

	if (result) {
		dj.ext.object.pathObjectMap_[str] = obj;
		dj.ext.object.valuePathCache_[str] = result;
	}

	return result;
};