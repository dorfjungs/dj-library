goog.provide('dj.sys.models.ComponentModel');

// goog
goog.require('goog.structs.Map');

/**
 * @struct
 * @constructor
 * @param {string} id
 * @param {string} name
 * @param {Element} element
 * @param {Function} ctor
 * @param {Array<dj.sys.models.config.AbstractConfigModel>=} optStaticConfig
 * @param {number=} optRules
 */
dj.sys.models.ComponentModel = function(id, name, element, ctor, optStaticConfig, optRules)
{
	/**
	 * @public
	 * @type {string}
	 */
	this.id = id;

	/**
	 * @public
	 * @type {string}
	 */
	this.name = name;

	/**
	 * @public
	 * @type {Element}
	 */
	this.element = element;

	/**
	 * @public
	 * @type {Function}
	 */
	this.ctor = ctor;

	/**
	 * @public
	 * @type {boolean}
	 */
	this.ready = false;

	/**
	 * @public
	 * @type {boolean}
	 */
	this.initialized = false;

	/**
	 * @public
	 * @type {goog.Promise}
	 */
	this.pendingPromise = null;

	/**
	 * @public
	 * @type {dj.sys.models.ComponentModel}
	 */
	this.parent = null;

	/**
	 * @public
	 * @type {number}
	 */
	this.depth = 0;

	/**
	 * @public
	 * @type {Array<dj.sys.models.config.AbstractConfigModel>}
	 */
	this.staticConfig = optStaticConfig || [];

	/**
	 * @public
	 * @type {Object}
	 */
	this.dynamicConfig = {};

	/**
	 * @public
	 * @type {number}
	 */
	this.rules = isNaN(optRules) ? 0 : optRules;
};

/**
 * @public
 * @param {number} rule
 * @return {boolean}
 */
dj.sys.models.ComponentModel.prototype.hasRule = function(rule)
{
	return !!(this.rules & rule);
};