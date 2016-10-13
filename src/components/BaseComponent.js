goog.provide('dj.components.BaseComponent');

// goog
goog.require('goog.ui.Component');
goog.require('goog.Promise');

/**
 * @constructor
 * @extends {goog.ui.Component}
 * @param {dj.managers.ComponentManager=} optManager
 */
dj.components.BaseComponent = function(optManager)
{
	goog.base(this);

	/**
	 * @private
	 * @type {dj.managers.ComponentManager|null}
	 */
	this.manager_ = optManager || null;

	/**
	 * @private
	 * @type {string}
	 */
	this.componentId_ = '';

	/**
	 * @private
	 * @type {string}
	 */
	this.identifier_ = '';

	/**
	 * @private
	 * @type {boolean}
	 */
	this.initialized_ = false;
};

goog.inherits(
	dj.components.BaseComponent,
	goog.ui.Component
);

/**
 * This will mostly called by the manager if a component is ready to be
 * initialized. If have initialized some child components in your
 * parent component you need to pass the manually initialized components
 * to the resolve function of the returned promise as an array, so the
 * manager knows which components needs to be entered first.
 *
 * @return {goog.Promise}
 */
dj.components.BaseComponent.prototype.init = function()
{
	return goog.Promise.resolve();
};

dj.components.BaseComponent.prototype.enterComponent = function()
{
	this.setInitalized(true);
};

/**
 * @param {boolean} initialized
 */
dj.components.BaseComponent.prototype.setInitalized = function(initialized)
{
	this.initialized_ = initialized;
};

/**
 * @return {boolean}
 */
dj.components.BaseComponent.prototype.isInitialized = function()
{
	return this.initialized_;
};

/**
 * @param {string} id
 */
dj.components.BaseComponent.prototype.setComponentId = function(id)
{
	this.componentId_ = id;
};

/**
 * @return {string}
 */
dj.components.BaseComponent.prototype.getComponentId = function()
{
	return this.componentId_;
};

/**
 * @param {string} identifier
 */
dj.components.BaseComponent.prototype.setComponentIdentifier = function(identifier)
{
	this.identifier_ = identifier;
};

/**
 * @return {string}
 */
dj.components.BaseComponent.prototype.getComponentIdentifier = function()
{
	return this.identifier_;
};

/**
 * @private
 * @return {boolean}
 */
dj.components.BaseComponent.prototype.checkManager_ = function()
{
	var ret = true;

	if ( ! this.manager_) {
		ret = false;
		throw new Error('You need to pass the manager as a constructor argument to use it');
	}

	return ret;
};

/**
 * @return {dj.managers.ComponentManager}
 */
dj.components.BaseComponent.prototype.getManager = function()
{
	this.checkManager_();

	return this.manager_;
};

/**
 * @param {Element} element
 * @return {dj.components.BaseComponent}
 */
dj.components.BaseComponent.prototype.getComponentByElement = function(element)
{
	this.checkManager_();

	return this.manager_.getComponentByElement(element);
};