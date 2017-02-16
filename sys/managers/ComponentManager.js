goog.provide('dj.sys.managers.ComponentManager');

// goog
goog.require('goog.dom');
goog.require('goog.json');
goog.require('goog.dom.dataset');
goog.require('goog.structs.Map');
goog.require('goog.asserts');
goog.require('goog.Promise');
goog.require('goog.dom.classlist');
goog.require('goog.crypt.base64');
goog.require('goog.events.EventTarget');

// dj
goog.require('dj.sys.models.ComponentModel');
goog.require('dj.sys.parsers.ElementConfigParser');
goog.require('dj.sys.parsers.ElementsConfigParser');
goog.require('dj.sys.models.config.ConfigParserModel');
goog.require('dj.sys.components.AbstractComponent');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.sys.managers.ComponentManager = function()
{
	dj.sys.managers.ComponentManager.base(this, 'constructor');

	/**
	 * @private
	 * @type {Element}
	 */
	this.rootElement_ = null;

	/**
	 * @private
	 * @type {string}
	 */
	this.attributeName_ = 'data-cmp';

	/**
	 * @private
	 * @type {string}
	 */
	this.attributeId_ = 'data-cmp-id';

	/**
	 * @private
	 * @type {string}
	 */
	this.attributeConfig_ = 'data-cmp-config';

	/**
	 * @private
	 * @type {number}
	 */
	this.uidCounter_ = 0;

	/**
	 * @private
	 * @type {Array<dj.sys.components.AbstractComponent>}
	 */
	this.componentStack_ = [];

	/**
	 * @private
	 * @type {goog.structs.Map<string, dj.sys.components.AbstractComponent>}
	 */
	this.components_ = new goog.structs.Map();;

	/**
	 * @private
	 * @type {goog.structs.Map<string, dj.sys.models.ComponentModel>}
	 */
	this.componentModels_ = new goog.structs.Map();

	/**
	 * @private
	 * @type {goog.structs.Map<string, {
	 *    name: string,
	 *    class: Function,
	 *    config: Array<dj.sys.models.config.AbstractConfigModel>
	 * }>}
	 */
	this.componentConfig_ = new goog.structs.Map();

	/**
	 * @private
	 * @type {number}
	 */
	this.iniitalizationOrder_ = dj.sys.managers.ComponentManager.InitializationOrder.BOTTOM_TO_TOP;

	/**
	 * @private
	 * @type {number}
	 */
	this.iniitalizationMethod_ = dj.sys.managers.ComponentManager.InitializationMethod.ASYNCHRONOUS;
};

goog.inherits(
	dj.sys.managers.ComponentManager,
	goog.events.EventTarget
);

/**
 * @enum {number}
 */
dj.sys.managers.ComponentManager.InitializationOrder = {
	BOTTOM_TO_TOP: 1,
	TOP_TO_BOTTOM: 2
};

/**
 * @enum {number}
 */
dj.sys.managers.ComponentManager.InitializationMethod = {
	ASYNCHRONOUS: 1,
	SEQUENTIAL: 2
};

/**
 * @param {string} name
 * @param {Function} ctor
 * @param {Array<dj.sys.models.config.AbstractConfigModel>=} optConfig
 */
dj.sys.managers.ComponentManager.prototype.add = function(name, ctor, optConfig)
{
	this.componentConfig_.set(name, {
		name: name,
		class: ctor,
		config: optConfig || []
	});
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.sys.managers.ComponentManager.prototype.init = function()
{
	return this.update();
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.sys.managers.ComponentManager.prototype.update = function()
{
	var rootElement = this.getRootElement();
	var componentModels = [];

	// Remove old components
	this.components_.forEach(function(component, id){
		if (!goog.dom.contains(rootElement, component.getElement())) {
			component.dispose();
			this.components_.remove(id);
		}
	}, this);

	// Parse all elements to create the component models
	this.componentConfig_.forEach(function(config, name){
		var elements = rootElement.querySelectorAll('[' + this.attributeName_ + '="' + name + '"]:not([' + this.attributeId_ + '])');

		// Creating the component models
		goog.array.forEach(elements, function(element){
			var model = this.parseComponentElement_(name, element, config.class, config.config);

			element.setAttribute(this.attributeId_, model.id);
			componentModels.push(model);

			this.componentModels_.set(model.id, model);
		}, this);
	}, this);

	// (Re)set new and old parent models
	this.componentModels_.forEach(function(model){
		this.setParentModel_(model);
	}, this);

	// Place the initialized components on the stack
	var stackModels = this.createStackByModels_(componentModels, this.iniitalizationOrder_);

	// Fill component stack and add components
	for (var i = 0, len = stackModels.length; i < len; i++) {
		var model = stackModels[i];
		var component = this.instatiateComponentByModel_(model);

		this.components_.set(model.id, component);
		this.componentStack_.push(component);
	}

	// Load current stack
	return this.loadComponentStack_(this.iniitalizationMethod_);
};

/**
 * @return {goog.Promise}
 */
dj.sys.managers.ComponentManager.prototype.initComponent = function(component)
{
	var resolver = goog.Promise.withResolver();

	if (component.isReady() || component.isInitialized()) {
		resolver.resolve();
	}
	else if (component.isPending()) {
		component.waitPending().then(
			resolver.resolve,
			resolver.reject
		);
	}
	else {
		var ready = component.ready();

		goog.asserts.assert(ready instanceof goog.Promise,
			'Ready function needs to return a promise for ' + component.getName());

		component.setPendingPromise(resolver.promise);

		ready.then(function(){
			component.setReady(true);

			if (component.isInitialized()) {
				resolver.resolve();
			}
			else {
				component.init().then(
					function(){
						component.setInitialized(true);
						component.setPendingPromise(null);
						resolver.resolve();
					},
					resolver.reject
				);
			}
		}, null, this);
	}

	return resolver.promise;
};

/**
 * @private
 * @return {goog.Promise}
 */
dj.sys.managers.ComponentManager.prototype.loadNextComponent_ = function()
{
	var component;

	if (component = this.componentStack_.shift()) {
		return this.initComponent(component).then(
			this.loadNextComponent_, null, this);
	}

	return goog.Promise.resolve();
};

/**
 * @public
 * @param {number} method
 * @return {goog.Promise}
 */
dj.sys.managers.ComponentManager.prototype.loadComponentStack_ = function(method)
{
	if (method == dj.sys.managers.ComponentManager.InitializationMethod.ASYNCHRONOUS) {
		var component = null;
		var promises = [];

		while (component = this.componentStack_.shift()) {
			promises.push(this.initComponent(component));
		}

		return goog.Promise.all(promises);
	}
	else if (method == dj.sys.managers.ComponentManager.InitializationMethod.SEQUENTIAL) {
		return this.loadNextComponent_();

	}

	return goog.Promise.resolve();
};

/**
 * @private
 * @param {dj.sys.models.ComponentModel} model
 * @return {dj.sys.components.AbstractComponent}
 */
dj.sys.managers.ComponentManager.prototype.instatiateComponentByModel_ = function(model)
{
	var componentConfig = this.componentConfig_.get(model.name);
	var componentObject = new componentConfig.class();

	componentObject.setModel(model);
	componentObject.setManager(this);

	return componentObject;
};

/**
 * @private
 * @param {Array<dj.sys.models.ComponentModel>} models
 * @param {number} order
 * @return {Array<dj.sys.models.ComponentModel>}
 */
dj.sys.managers.ComponentManager.prototype.createStackByModels_ = function(models, order)
{
	var depthArray = [];
	var depthOrder = new goog.structs.Map();
	var depthBuckets = goog.array.bucket(models, function(model){
		return model.depth;
	});

	for (var depth in depthBuckets) {
		var index = parseInt(depth, 10);
		var bucket = depthBuckets[depth];

		if (order == dj.sys.managers.ComponentManager.InitializationOrder.BOTTOM_TO_TOP) {
			bucket.reverse();
		}

		depthOrder.set(index, bucket);
	}

	depthOrder.forEach(function(value, key){
		depthArray.push(value);
	});

	if (order == dj.sys.managers.ComponentManager.InitializationOrder.BOTTOM_TO_TOP) {
		depthArray.reverse();
	}

	return goog.array.flatten(depthArray);
};

/**
 * @private
 * @param {dj.sys.models.ComponentModel} model
 */
dj.sys.managers.ComponentManager.prototype.setParentModel_ = function(model)
{
	var parentElement = goog.dom.getParentElement(model.element);
	var rootElement = this.getRootElement();
	var parentModel = null;
	var elementDepth = 0;
	var parentId = -1;

	while (parentElement && goog.dom.contains(rootElement, parentElement)) {
		if (parentElement.hasAttribute(this.attributeId_)) {
			if (parentId == -1) {
				parentId = parentElement.getAttribute(this.attributeId_);
			}

			elementDepth++;
		}

		parentElement = goog.dom.getParentElement(parentElement);
	}

	if (parentModel = this.componentModels_.get(parentId)) {
		model.parent = parentModel;
		model.depth = elementDepth;
	}
};

/**
 * @private
 * @return {string}
 */
dj.sys.managers.ComponentManager.prototype.getNextUid_ = function()
{
	return (++this.uidCounter_).toString();
};

/**
 * @private
 * @param {string} str
 * @return {boolean}
 */
dj.sys.managers.ComponentManager.prototype.isBase64_ = function(str)
{
	return (/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/).test(str);
};

/**
 * @private
 * @param {Element} element
 * @param {string} name
 * @param {Array<dj.sys.models.config.AbstractConfigModel>} config
 * @return {dj.sys.models.ComponentModel}
 */
dj.sys.managers.ComponentManager.prototype.parseComponentElement_ = function(name, element, ctor, config)
{
	var componentModel = new dj.sys.models.ComponentModel(this.getNextUid_(), name, element, ctor, config);
	var dynamicConfig = element.getAttribute(this.attributeConfig_);

	if (dynamicConfig) {
		if (this.isBase64_(dynamicConfig)) {
			dynamicConfig = goog.crypt.base64.decodeString(dynamicConfig);
		}

		goog.asserts.assert(goog.json.isValid(dynamicConfig),
			'Invalid config for ' + name + ' component');

		componentModel.dynamicConfig = goog.json.parse(dynamicConfig);
	}

	this.parseStaticConfig_(componentModel, config);

	return componentModel;
};

/**
 * @private
 * @param {dj.sys.models.ComponentModel} model
 * @param {Array<dj.sys.models.config.AbstractConfigModel>} staticConfig
 */
dj.sys.managers.ComponentManager.prototype.parseStaticConfig_ = function(model, staticConfig)
{
	for (var i = 0, len = staticConfig.length; i < len; i++) {
		var config = staticConfig[i];

		if (config instanceof dj.sys.models.config.ConfigParserModel) {
			config = /** @type {dj.sys.models.config.ConfigParserModel} */ (config);

			if ( ! goog.object.isEmpty(model.dynamicConfig)) {
				model.dynamicConfig = this.parseComponentConfigParsers_(
					model.dynamicConfig, model, config.parsers);
			}
		}
	}
};

/**
 * @param {Object} config
 * @param {dj.sys.models.ComponentModel} model
 * @param {Array<dj.sys.parsers.AbstractConfigParser>} parsers
 * @return {Object}
 */
dj.sys.managers.ComponentManager.prototype.parseComponentConfigParsers_ = function(config, model, parsers)
{
	for (var x in config) {
		if (goog.isString(config[x])) {
			for (var i = 0, len = parsers.length; i < len; i++) {
				if (parsers[i].test(config[x])) {
					config[x] = parsers[i].parse(config[x], model);
				}
			}
		}
	}

	return config;
};

/**
 * @public
 * @return {Element}
 */
dj.sys.managers.ComponentManager.prototype.getRootElement = function()
{
	return this.rootElement_ || /** @type {Element} */ (document.documentElement);
};

/**
 * @public
 * @param {Element} element
 */
dj.sys.managers.ComponentManager.prototype.setRootElement = function(element)
{
	this.rootElement_ = element;
};

/**
 * @public
 * @param {string} name
 */
dj.sys.managers.ComponentManager.prototype.setAttributeName = function(name)
{
	this.attributeName_ = name;
};

/**
 * @public
 * @return {string}
 */
dj.sys.managers.ComponentManager.prototype.getAttributeId = function()
{
	return this.attributeId_;
};

/**
 * @public
 * @param {string} id
 */
dj.sys.managers.ComponentManager.prototype.getComponent = function(id)
{
	return this.components_.get(id);
};