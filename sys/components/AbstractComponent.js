goog.provide('dj.sys.components.AbstractComponent');

// goog
goog.require('goog.Promise');
goog.require('goog.asserts');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');

// dj
goog.require('dj.ext.object');
goog.require('dj.ext.providers.ResizeProvider');
goog.require('dj.ext.providers.ScrollProvider');

/**
 * @abstract
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.sys.components.AbstractComponent = function()
{
	dj.sys.components.AbstractComponent.base(this, 'constructor');

	/**
	 * @protected
	 * @type {dj.sys.models.ComponentModel}
	 */
	this.model = null;

	/**
	 * @protected
	 * @type {dj.sys.managers.ComponentManager}
	 */
	this.manager = null;

	/**
	 * @private
	 * @type {goog.events.EventHandler}
	 */
	this.handler = new goog.events.EventHandler(this);

	/**
	 * @private
	 * @type {dj.ext.providers.ResizeProvider}
	 */
	this.resizeProvider = null;

	/**
	 * @private
	 * @type {dj.ext.providers.ScrollProvider}
	 */
	this.scrollProvider = null;
};

goog.inherits(
	dj.sys.components.AbstractComponent,
	goog.events.EventTarget
);

/**
 * @export
 * @return {goog.Promise}
 */
dj.sys.components.AbstractComponent.prototype.ready = function()
{
	return goog.Promise.resolve();
};

/**
 * @export
 * @return {goog.Promise}
 */
dj.sys.components.AbstractComponent.prototype.init = function()
{
	return goog.Promise.resolve();
};

/**
 * @public
 */
dj.sys.components.AbstractComponent.prototype.dispose = function()
{
	this.handler.removeAll();
};

/**
 * @protected
 */
dj.sys.components.AbstractComponent.prototype.initResizeProvider = function()
{
	if (goog.isNull(this.resizeProvider)) {
		this.resizeProvider = dj.ext.providers.ResizeProvider.getInstance();
	}

	if ( ! this.resizeProvider.isInitialized()) {
		this.resizeProvider.init();
	}
};

/**
 * @protected
 */
dj.sys.components.AbstractComponent.prototype.initScrollProvider = function()
{
	if (goog.isNull(this.scrollProvider)) {
		this.scrollProvider = dj.ext.providers.ScrollProvider.getInstance();
	}

	if ( ! this.scrollProvider.isInitialized()) {
		this.scrollProvider.init();
	}
};

/**
 * @protected
 */
dj.sys.components.AbstractComponent.prototype.listenScroll = function()
{
	this.initScrollProvider();

	this.handler.listen(this.scrollProvider, dj.ext.providers.ScrollProvider.EventType.SCROLL,
		this.handleScroll);
};

/**
 * @protected
 */
dj.sys.components.AbstractComponent.prototype.listenResize = function()
{
	this.initResizeProvider();

	this.handler.listen(this.resizeProvider, dj.ext.providers.ResizeProvider.EventType.RESIZE,
		this.handleResize);
};

/**
 * @protected
 */
dj.sys.components.AbstractComponent.prototype.unlistenScroll = function()
{
	this.handler.unlisten(this.scrollProvider, dj.ext.providers.ScrollProvider.EventType.SCROLL,
		this.handleScroll);
};

/**
 * @protected
 */
dj.sys.components.AbstractComponent.prototype.unlistenResize = function()
{
	this.handler.unlisten(this.resizeProvider, dj.ext.providers.ResizeProvider.EventType.RESIZE,
		this.handleResize);
};

/**
 * @protected
 */
dj.sys.components.AbstractComponent.prototype.handleResize = function()
{
};

/**
 * @protected
 */
dj.sys.components.AbstractComponent.prototype.handleScroll = function()
{
};

/**
 * @protected
 * @return {goog.math.Size}
 */
dj.sys.components.AbstractComponent.prototype.getWindowSize = function()
{
	goog.asserts.assert(this.resizeProvider && this.resizeProvider.isInitialized(),
		'You need to initialize the resize provider first');

	return this.resizeProvider.getWindowSize();
};

/**
 * @protected
 * @return {goog.math.Coordinate}
 */
dj.sys.components.AbstractComponent.prototype.getScrollPosition = function()
{
	goog.asserts.assert(this.scrollProvider && this.scrollProvider.isInitialized(),
		'You need to initialize the scroll provider first');

	return this.scrollProvider.getScrollPosition();
};

/**
 * @protected
 * @param {string|Object} selector
 * @param {Element=} optRoot
 * @return {dj.sys.components.AbstractComponent}
 */
dj.sys.components.AbstractComponent.prototype.queryComponent = function(selector, optRoot)
{
	var rootElement = optRoot || this.model.element;
	var idAttribute = this.manager.getAttributeId();
	var foundComponent;

	if (typeof selector == 'function') {
		this.manager.getComponents().forEach(function(component){
			if (component instanceof /** @type {!Object} */ (selector) && !foundComponent) {
				foundComponent = component;
			}
		});
	}
	else {
		var componentElement = /** @type {Element} */ (rootElement.querySelector(/** @type {string} */ (selector)));

		goog.asserts.assert(componentElement,
			'Could not find component with query ' + selector);
		goog.asserts.assert(componentElement.hasAttribute(idAttribute),
			'Queried element is not initialized ' + selector);

		var componentId = componentElement.getAttribute(idAttribute);
		foundComponent = this.manager.getComponent(componentId);
	}

	return foundComponent;
};

/**
 * @protected
 * @param {string|Object} selector
 * @param {Element=} optRoot
 * @return {Array<dj.sys.components.AbstractComponent>}
 */
dj.sys.components.AbstractComponent.prototype.queryComponents = function(selector, optRoot)
{
	var rootElement = optRoot || this.model.element;
	var idAttribute = this.manager.getAttributeId();
	var foundComponents = [];

	if (typeof selector == 'function') {
		this.manager.getComponents().forEach(function(component){
			if (component instanceof /** @type {!Object} */ (selector)) {
				foundComponents.push(component);
			}
		});
	}
	else {
		var componentElements = /** @type {Array<Element>} */ (goog.array.slice(rootElement.querySelectorAll(/** @type {string} */ (selector)), 0));

		for (var i = 0, len = componentElements.length; i < len; i++) {
			var componentElement = componentElements[i];

			goog.asserts.assert(componentElement,
				'Could not find component with query ' + selector);
			goog.asserts.assert(componentElement.hasAttribute(idAttribute),
				'Queried element is not initialized ' + selector);

			foundComponents.push(this.manager.getComponent(
				componentElement.getAttribute(idAttribute)
			));
		}

	}

	return foundComponents;
};

/**
 * @protected
 * @param {dj.sys.components.AbstractComponent} component
 * @return {goog.Promise}
 */
dj.sys.components.AbstractComponent.prototype.initComponent = function(component)
{
	return this.manager.initComponent(component);
};

/**
 * @protected
 * @param {Array<dj.sys.components.AbstractComponent>} components
 * @return {goog.Promise}
 */
dj.sys.components.AbstractComponent.prototype.initComponents = function(components)
{
	var promises = [];

	for (var i = 0, len = components.length; i < len; i++) {
		promises.push(this.initComponent(components[i]));
	}

	return goog.Promise.all(promises);
};

/**
 * @protected
 * @param {Function} ctor
 * @param {Function} callback
 * @return {goog.Promise}
 */
dj.sys.components.AbstractComponent.prototype.baseInit = function(ctor, callback)
{
	return this.baseCall_('init', ctor, callback);
};

/**
 * @protected
 * @param {Function} ctor
 * @param {Function} callback
 * @return {goog.Promise}
 */
dj.sys.components.AbstractComponent.prototype.baseReady = function(ctor, callback)
{
	return this.baseCall_('ready', ctor, callback);
};

/**
 * @private
 * @param {string} name
 * @param {Function} ctor
 * @param {Function} callback
 */
dj.sys.components.AbstractComponent.prototype.baseCall_ = function(name, ctor, callback)
{
	var resolver = goog.Promise.withResolver();
	var fncPromise = ctor.base(this, name);

	goog.asserts.assert(fncPromise instanceof goog.Promise,
		'function ' + name + ' needs to return a promise for ' + this.model.name);

	fncPromise.then(function(){
		callback.apply(this, [resolver.resolve, resolver.reject]);
	}, null, this);

	return resolver.promise;
};

/**
 * @public
 * @param {dj.sys.models.ComponentModel} model
 */
dj.sys.components.AbstractComponent.prototype.setModel = function(model)
{
	this.model = model;
};

/**
 * @public
 * @param {dj.sys.managers.ComponentManager} manager
 */
dj.sys.components.AbstractComponent.prototype.setManager = function(manager)
{
	this.manager = manager;
};

/**
 * @public
 * @param {boolean} ready
 */
dj.sys.components.AbstractComponent.prototype.setReady = function(ready)
{
	this.model.ready = ready;
};

/**
 * @public
 * @param {boolean} initalized
 */
dj.sys.components.AbstractComponent.prototype.setInitialized = function(initalized)
{
	this.model.initialized = initalized;
};

/**
 * @public
 * @param {goog.Promise} promise
 */
dj.sys.components.AbstractComponent.prototype.setPendingPromise = function(promise)
{
	this.model.pendingPromise = promise;
};

/**
 * @public
 * @param {string|Function} property
 * @return {*}
 */
dj.sys.components.AbstractComponent.prototype.getConfig = function(property)
{
	if (typeof property == 'function') {
		for (var i = 0, len = this.model.staticConfig.length; i < len; i++) {
			if (this.model.staticConfig[i] instanceof property) {
				return this.model.staticConfig[i];
			}
		}
	}
	else if (typeof property == 'string') {
		return dj.ext.object.getByValueByPath(this.model.dynamicConfig, property);
	}

	return null;
};

/**
 * @public
 * @param {string} path
 * @return {boolean}
 */
dj.sys.components.AbstractComponent.prototype.hasConfig = function(path)
{
	return goog.isDefAndNotNull(this.getConfig(path));
};

/**
 * @public
 * @return {string}
 */
dj.sys.components.AbstractComponent.prototype.getName = function()
{
	return this.model.name;
};

/**
 * @public
 * @return {string}
 */
dj.sys.components.AbstractComponent.prototype.getId = function()
{
	return this.model.id;
};

/**
 * @public
 * @return {Element}
 */
dj.sys.components.AbstractComponent.prototype.getElement = function()
{
	return this.model.element;
};

/**
 * @public
 * @return {boolean}
 */
dj.sys.components.AbstractComponent.prototype.isInitialized = function()
{
	return this.model.initialized;
};

/**
 * @public
 * @return {boolean}
 */
dj.sys.components.AbstractComponent.prototype.isReady = function()
{
	return this.model.ready;
};

/**
 * @public
 * @return {boolean}
 */
dj.sys.components.AbstractComponent.prototype.isPending = function()
{
	return this.model.pendingPromise != null;
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.sys.components.AbstractComponent.prototype.waitPending = function()
{
	return this.model.pendingPromise;
};