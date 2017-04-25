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

	if (this.hasParam('**', value)) {
		// Advanced search by the highest parent element
		var parent = goog.dom.getParentElement(target);

		while (parent) {
			var current = goog.dom.getParentElement(parent);

			if (!current) {
				break;
			}
			else {
				parent = current;
			}
		}

		target = parent;
	}
	else if (this.hasParam('*', value)) {
		// Search in document element
		target = document.documentElement;
	}

	return /** @type {Element} */ (target.querySelector(this.getValue(value)));
};