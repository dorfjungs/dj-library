goog.provide('dj.ext.style');

// goog
goog.require('goog.string');

/**
 * @param {Element} element
 * @return {Object}
 */
dj.ext.style.getInlineStyles = function(element)
{
	var propertiesArr = element.style.cssText.split(';');
	var propertiesObj = {};

	for (var i = 0, len = propertiesArr.length; i < len; i++) {
		var property = propertiesArr[i];

		if (!goog.string.isEmptyOrWhitespace(property)) {
			var keyValue = property.split(':');
			var key = goog.string.trim(keyValue[0]).toLowerCase();
			var value = goog.string.trim(keyValue[1]).toLowerCase();

			propertiesObj[key] = value;
		}
	}

	return propertiesObj;
};
