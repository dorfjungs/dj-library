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
 * @param {goog.structs.Map=} optStaticConfig
 */
dj.sys.models.ComponentModel = function(id, name, element, ctor, optStaticConfig)
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
	 * @type {goog.structs.Map<string, *>}
	 */
	this.staticConfg = new goog.structs.Map(optStaticConfig);

	/**
	 * @public
	 * @type {goog.structs.Map<string, *>}
	 */
	this.dynamicConfig = new goog.structs.Map();
};