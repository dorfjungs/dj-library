goog.provide('dj.sys.parsers.ElementsConfigParser');

// goog
goog.require('goog.array');

// dj
goog.require('dj.sys.parsers.AbstractConfigParser');

/**
 * @constructor
 * @extends {dj.sys.parsers.AbstractConfigParser}
 */
dj.sys.parsers.ElementsConfigParser = function()
{
	dj.sys.parsers.ElementsConfigParser.base(this, 'constructor', 'elements');
};

goog.inherits(
	dj.sys.parsers.ElementsConfigParser,
	dj.sys.parsers.AbstractConfigParser
);

/**
 * @inheritDoc
 */
dj.sys.parsers.ElementsConfigParser.prototype.parse = function(value, componentModel)
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

	var elements = /** @type {Array<Element>} */ (
		goog.array.slice(target.querySelectorAll(this.getValue(value)), 0)
	);

	return elements.length > 0 ? elements : null;
};