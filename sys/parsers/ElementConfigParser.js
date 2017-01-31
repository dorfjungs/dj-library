goog.provide('dj.sys.parsers.ElementConfigParser');

// dj
goog.require('dj.sys.parsers.AbstractConfigParser');

/**
 * @constructor
 * @extends {dj.sys.parsers.AbstractConfigParser}
 */
dj.sys.parsers.ElementConfigParser = function()
{
	dj.sys.parsers.ElementConfigParser.base(this, 'constructor', 'element');
};

goog.inherits(
	dj.sys.parsers.ElementConfigParser,
	dj.sys.parsers.AbstractConfigParser
);

/**
 * @inheritDoc
 */
dj.sys.parsers.ElementConfigParser.prototype.parse = function(value, componentModel)
{
	var selector = this.getValue(value);
	var target = componentModel.element;

	if (this.hasParam('*', value)) {
		target = document.documentElement;
	}

	return /** @type {Element} */ (target.querySelector(this.getValue(value)));
};