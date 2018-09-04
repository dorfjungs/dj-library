goog.provide('dj.ext.dom.classlist');
goog.provide('dj.ext.dom.classlist.inline');

// dj
goog.require('dj.ext.style');

// goog
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.array');

/**
 * @private
 * @type {Map<string, Object>}
 */
dj.ext.dom.classlist.inline.classes_ = new Map();

/**
 * @private
 * @type {Map<string, Array<Element>>}
 */
dj.ext.dom.classlist.inline.states_ = new Map();

/**
 * @private
 * @type {Map<Element, Object>}
 */
dj.ext.dom.classlist.inline.restores_ = new Map();

/**
 * Registers a new "inline class" and it's properties
 *
 * @public
 * @param {string} name
 * @param {Object=} optProperties
 */
dj.ext.dom.classlist.inline.register = function(name, optProperties)
{
	dj.ext.dom.classlist.inline.classes_.set(name, optProperties || {});
};

/**
 * Unregisters a "inline class"
 *
 * @public
 * @param {string} name
 */
dj.ext.dom.classlist.inline.unregister = function(name)
{
	dj.ext.dom.classlist.inline.classes_.delete(name);
};

/**
 * Edit properties of a registered class
 *
 * @public
 * @param {string} name
 * @param {string} key
 * @param {string} value
 */
dj.ext.dom.classlist.inline.edit = function(name, key, value)
{
	dj.ext.dom.classlist.inline.checkClass_(name);
	dj.ext.dom.classlist.inline.classes_.get(name)[key] = value;
};

/**
 * @private
 * @param {string} name
 */
dj.ext.dom.classlist.inline.checkClass_ = function(name)
{
	goog.asserts.assert(dj.ext.dom.classlist.inline.classes_.has(name),
		"You need to register the class " + name + " first");
};

/**
 * @private
 */
dj.ext.dom.classlist.inline.apply_ = function()
{
	dj.ext.dom.classlist.inline.states_.forEach(function(elements, name){
		dj.ext.dom.classlist.inline.checkClass_(name);

		var properties = dj.ext.dom.classlist.inline.classes_.get(name);

		for (var i = 0, len = elements.length; i < len; i++) {
			goog.style.setStyle(elements[i], properties);
		}
	});
};

/**
 * @private
 * @param {Element} element
 */
dj.ext.dom.classlist.inline.restore_ = function(element)
{
	if (!dj.ext.dom.classlist.inline.restores_.has(element) &&
		!dj.ext.dom.classlist.inline.affected(element)) {
		var properties = dj.ext.style.getInlineStyles(element);

		if (!goog.object.isEmpty(properties)) {
			dj.ext.dom.classlist.inline.restores_.set(element, properties);
		}
	}
};

/**
 * @public
 * @param {Element} element
 * @param {string} name
 * @param {boolean} enable
 */
dj.ext.dom.classlist.inline.enable = function(element, name, enable)
{
	var contains = dj.ext.dom.classlist.inline.contains(element, name);

	if (contains && !enable) {
		dj.ext.dom.classlist.inline.remove(element, name);
	}
	else if (!contains && enable) {
		dj.ext.dom.classlist.inline.add(element, name);
	}
};

/**
 * @public
 * @param {Element} element
 * @param {string} name
 */
dj.ext.dom.classlist.inline.add = function(element, name)
{
	if (!dj.ext.dom.classlist.inline.states_.has(name)) {
		dj.ext.dom.classlist.inline.states_.set(name, []);
	}

	dj.ext.dom.classlist.inline.restore_(element);
	dj.ext.dom.classlist.inline.states_.get(name).push(element);
	dj.ext.dom.classlist.inline.apply_();
};

/**
 * @public
 * @param {Element} element
 * @param {string} name
 */
dj.ext.dom.classlist.inline.remove = function(element, name)
{
	if (dj.ext.dom.classlist.inline.classes_.has(name)) {
		dj.ext.dom.classlist.inline.checkClass_(name);

		var elements = dj.ext.dom.classlist.inline.states_.get(name);
		var properties = dj.ext.dom.classlist.inline.classes_.get(name);
		var defaultProperties = dj.ext.dom.classlist.inline.restores_.get(element);

		for (var key in properties) {
			key = key.toLowerCase();
			var value = '';

			if (defaultProperties && defaultProperties.hasOwnProperty(key)) {
				value = defaultProperties[key];
			}

			goog.style.setStyle(element, key, value);
		}

		goog.array.remove(elements, element);

		if (!dj.ext.dom.classlist.inline.affected(element)) {
			dj.ext.dom.classlist.inline.restores_.delete(element);
		}

		if (elements.length == 0) {
			dj.ext.dom.classlist.inline.states_.delete(name);
		}
		else {
			dj.ext.dom.classlist.inline.apply_();
		}
	}
};

/**
 * @public
 * @param {Element} element
 * @param {string} name
 * @return {boolean}
 */
dj.ext.dom.classlist.inline.contains = function(element, name)
{
	var elements = dj.ext.dom.classlist.inline.states_.get(name);
	
	return !!elements && elements.indexOf(element) > -1;
};

/**
 * @public
 * @param {Element} element
 * @return {boolean}
 */
dj.ext.dom.classlist.inline.affected = function(element)
{
	var affected = false;
	var elementLists = Array.from(dj.ext.dom.classlist.inline.states_.values());

	for (var i = 0, len = elementLists.length; i < len; i++) {
		affected = elementLists[i].indexOf(element) > -1;

		if (affected) {
			break;
		}
	}

	return affected;
};