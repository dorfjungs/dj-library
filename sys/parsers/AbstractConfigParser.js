goog.provide('dj.sys.parsers.AbstractConfigParser');

// goog
goog.require('goog.string');

/**
 * @abstract
 * @constructor
 * @param {name} string
 */
dj.sys.parsers.AbstractConfigParser = function(name)
{
	/**
	 * @private
	 * @type {string}
	 */
	this.name_ = name;

	/**
	 * @private
	 * @type {string}
	 */
	this.inputPattern_ = '^\\[' + this.name_ + '\\b\\(?(.*?)\\)?\\]<-\\((.*)\\)$';
};

/**
 * @param {string} value
 * @return {boolean}
 */
dj.sys.parsers.AbstractConfigParser.prototype.test = function(value)
{
	return new RegExp(this.inputPattern_).test(value);
};

/**
 * @public
 * @return {*}
 * @param {string} value
 * @param {dj.sys.models.ComponentConfigModel} componentModel
 */
dj.sys.parsers.AbstractConfigParser.prototype.parse = function(value, componentModel)
{
	return goog.abstractMethod();
};

/**
 * @protected
 * @param {string} value
 * @return {string}
 */
dj.sys.parsers.AbstractConfigParser.prototype.getValue = function(value)
{
	var regexp = new RegExp(this.inputPattern_);
	var matches = regexp.exec(value);

	return matches ? matches[2] : '';
};

/**
 * @protected
 * @param {string} value
 * @return {Arra<string>}
 */
dj.sys.parsers.AbstractConfigParser.prototype.getParams = function(value)
{
	var regexp = new RegExp(this.inputPattern_);
	var matches = regexp.exec(value);
	var params = [];

	if (matches && matches.hasOwnProperty(1)) {
		var paramArr = matches[1].split(',');

		for (var i = 0, len = paramArr.length; i < len; i++) {
			params.push(goog.string.trim(paramArr[i]));
		}
	}

	return params
};

/**
 * @protected
 * @param {string} name
 * @return {boolean}
 */
dj.sys.parsers.AbstractConfigParser.prototype.hasParam = function(name, value)
{
	var params = this.getParams(value);

	for (var i = 0, len = params.length; i < len; i++) {
		if (params[i] == name) {
			return true;
		}
	}

	return false;
};