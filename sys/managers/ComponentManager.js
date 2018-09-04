goog.provide('dj.sys.managers.ComponentManager');

// goog
goog.require('goog.dom');
goog.require('goog.dom.dataset');
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
	 * @type {Array<dj.sys.components.AbstractComponent>}
	 */
	this.componentStack_ = [];

	/**
	 * @private
	 * @type {Array<dj.sys.components.AbstractComponent>}
	 */
	this.lastComponentStack_ = [];

	/**
	 * @private
	 * @type {Map<string, dj.sys.components.AbstractComponent>}
	 */
	this.components_ = new Map();

	/**
	 * @private
	 * @type {Map<string, dj.sys.models.ComponentModel>}
	 */
	this.componentModels_ = new Map();

	/**
	 * @private
	 * @type {Map<string, dj.sys.managers.ComponentManager.ComponentConfig>}
	 */
	this.componentConfig_ = new Map();

	/**
	 * @private
	 * @type {Array<dj.sys.managers.ComponentManager>}
	 */
	this.includedManagers_ = [];

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
 * @typedef {{
 *    name: string,
 *    class: Function,
 *    config: Array<dj.sys.models.config.AbstractConfigModel>,
 *    rules: number
 * }}
 */
dj.sys.managers.ComponentManager.ComponentConfig;

/**
 * @type {number}
 */
dj.sys.managers.ComponentManager.UID_COUNTER = 0;

/**
 * @enum {number}
 */
dj.sys.managers.ComponentManager.ComponentRules = {
	DENY_MULTIPLE: 1
};

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
 * @param {number=} optRules
 */
dj.sys.managers.ComponentManager.prototype.add = function(name, ctor, optConfig, optRules)
{
	this.componentConfig_.set(name, {
		name: name,
		class: ctor,
		config: optConfig || [],
		rules: optRules || 0
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
 * @param {Array<Function>=} optClasses
 * @param {Element=} optScopeElement
 * @return {goog.Promise}
 */
dj.sys.managers.ComponentManager.prototype.update = function(optClasses, optScopeElement)
{
	var rootElement = optScopeElement || this.getRootElement();
	var componentModels = [];

	// Remove old components
	this.components_.forEach(function(component, id){
		if (!goog.dom.contains(rootElement, component.getElement())) {
			component.dispose();
			this.components_.delete(id);
		}
	}, this);

	// Parse all elements to create the component models
	this.componentConfig_.forEach(function(config, name){
		if (optClasses && optClasses.indexOf(config.class) < 0) {
			return;
		}

		var elements = this.queryComponentElements_(rootElement, name);

		// Creating the component models
		goog.array.forEach(elements, function(element){
			var model = this.parseComponentElement_(name, element);

			if (model.hasRule(dj.sys.managers.ComponentManager.ComponentRules.DENY_MULTIPLE)) {
				if (this.getModelsByName(name).size >= 1) {
					throw new Error('The component "' + name + '" can\'t exist multiple times');
				}
			}

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
		this.lastComponentStack_ = goog.array.slice(this.componentStack_, 0);
	}

	// Load current stack
	return new goog.Promise(function(resolve, reject){
		this.loadComponentStack_(this.iniitalizationMethod_).then(function(){
			resolve(this.lastComponentStack_);
		}, reject, this);
	}, this);
};

/**
 * @public
 * @param {Array<Element|Function>} selector
 * @param {Element=} optScope
 * @return {Array<dj.sys.components.AbstractComponent>}
 */
dj.sys.managers.ComponentManager.prototype.prepare = function(selector, optScope)
{
    var components = [];
    var rootElement = optScope || this.getRootElement();

    goog.asserts.assert(goog.isArray(selector), "Prepare selector needs to be an array");

    // Collect components
    for (var i = 0, len = selector.length; i < len; i++) {
        if (typeof selector[i] == 'function') {
            var config = this.getConfigByClass_(selector[i]);
            var elements = this.queryComponentElements_(rootElement, config.name);

            for (var ii = 0, len1 = elements.length; ii < len1; ii++) {
                components.push(this.prepareElement_(elements[ii]));
            }
        }
        else {
            if (goog.dom.contains(rootElement, selector[i])) {
                components.push(this.prepareElement_(selector[i]));
            }
        }
    }

    // Notify components, that they were prepared
    for (var i = 0, len = components.length; i < len; i++) {
        components[i].prepared();
    }

    return components;
};

/**
 * @private
 * @param {Element} element
 * @return {dj.sys.components.AbstractComponent}
 */
dj.sys.managers.ComponentManager.prototype.prepareElement_ = function(element)
{
    var name = element.getAttribute(this.attributeName_);
    var config = this.componentConfig_.get(name);

    goog.asserts.assert(config, 'Config for component "' + name + '" not found');

    var model = this.parseComponentElement_(name, element);

    element.setAttribute(this.attributeId_, model.id);

    this.componentModels_.set(model.id, model);
    this.componentModels_.forEach(function(model){
        this.setParentModel_(model);
    }, this);

    var component = this.instatiateComponentByModel_(model);

    this.components_.set(model.id, component);
    this.componentStack_.push(component);
    this.lastComponentStack_.push(component);

    return component;
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
						if (this.componentStack_.indexOf(component) > -1) {
							goog.array.remove(this.componentStack_, component);
						}

						component.setInitialized(true);
						component.setPendingPromise(null);
						resolver.resolve();
					},
					resolver.reject,
					this
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
 * @param {Element} element
 * @param {string} name
 * @return {Array<Element>}
 */
dj.sys.managers.ComponentManager.prototype.queryComponentElements_ = function(element, name)
{
    var regExp = /^q\((.*)\)$/i;
    var query = '[' + this.attributeName_ + '="' + name + '"]:not([' + this.attributeId_ + '])';

    if (regExp.test(name)) {
        var matches = name.match(regExp);

        if (matches.length == 2 &&
            matches.hasOwnProperty(1) &&
            matches[1] != name) {
            query = matches[1];
        }
    }

    return /** @type {Array<Element>} */ (goog.array.slice(element.querySelectorAll(query), 0));
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
	var depthOrder = new Map();
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
	var parentId = '-1';

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
	return (++dj.sys.managers.ComponentManager.UID_COUNTER).toString();
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
 * @return {dj.sys.models.ComponentModel}
 */
dj.sys.managers.ComponentManager.prototype.parseComponentElement_ = function(name, element)
{
	var componentConfig = this.componentConfig_.get(name);
	var dynamicConfig = element.getAttribute(this.attributeConfig_);
	var componentModel = new dj.sys.models.ComponentModel(
		this.getNextUid_(),
		name,
		element,
		componentConfig.class,
		componentConfig.config,
		componentConfig.rules
	);

	if (dynamicConfig) {
		if (this.isBase64_(dynamicConfig)) {
			dynamicConfig = goog.crypt.base64.decodeString(dynamicConfig);
		}
		
		// Remove trailing commas from json, since we're using the 
		// native parser. The previous parse method from google closure 
		// (which is now depcrecated) allowed trailing commas in the 
		// json structure. To ensure maximum compatibility with old instances
		// We're killing them here.
		dynamicConfig = dynamicConfig.replace(/\,(?!\s*?[\{\[\"\'\w])/g, '');

		// Parse json natively
		try {
			componentModel.dynamicConfig = /** @type {Object} */ (JSON.parse(dynamicConfig));
		} catch(err) {
			throw new Error(
				`[Extlib][ComponentManager] Invalid component config given for "${name}": ${err}`
			);
		}
	}

	this.parseStaticConfig_(componentModel, componentConfig.config);

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
 * @private
 * @param {Function} ctor
 * @return {dj.sys.managers.ComponentManager.ComponentConfig|null}
 */
dj.sys.managers.ComponentManager.prototype.getConfigByClass_ = function(ctor)
{
    var configs = Array.from(this.componentConfig_.values());

    for (var i = 0, len = configs.length; i < len; i++) {
        if (configs[i].class == ctor) {
            return configs[i];
        }
    }

    return null;
};

/**
 * @public
 * @param {dj.sys.managers.ComponentManager} manager
 * @return {dj.sys.managers.ComponentManager}
 */
dj.sys.managers.ComponentManager.prototype.include = function(manager)
{
	this.includedManagers_.push(manager);

	return this;
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
 * @param {string} slug
 * @param {string=} optPrefix
 */
dj.sys.managers.ComponentManager.prototype.setAttributeSlug = function(slug, optPrefix)
{
    var prefix = optPrefix || 'data-';

    this.setAttributeName(prefix + slug);
    this.setAttributeId(prefix + slug);
    this.setAttributeConfig(prefix + slug);
};

/**
 * @public
 * @param {string} slug
 */
dj.sys.managers.ComponentManager.prototype.setAttributeName = function(slug)
{
	this.attributeName_ = slug;
};

/**
 * @public
 * @param {string} slug
 */
dj.sys.managers.ComponentManager.prototype.setAttributeId = function(slug)
{
    this.attributeId_ = slug + '-id';
};

/**
 * @public
 * @param {string} slug
 */
dj.sys.managers.ComponentManager.prototype.setAttributeConfig = function(slug)
{
    this.attributeConfig_ = slug + '-config';
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
 * @param {boolean=} optNoIncludes
 * @return {Map<string, dj.sys.models.ComponentModel>}
 */
dj.sys.managers.ComponentManager.prototype.getModels = function(optNoIncludes)
{
	var models = this.componentModels_;

	if (!optNoIncludes) {
		var includedModels = this.getIncludedModels();

		dj.ext.utils.map.merge(includedModels, models);

		models = includedModels;
	}

	return models;
};

/**
 * @public
 * @param {string} id
 * @param {boolean=} optNoIncludes
 * @return {dj.sys.models.ComponentModel}
 */
dj.sys.managers.ComponentManager.prototype.getModelById = function(id, optNoIncludes)
{
	var models = this.getModels(optNoIncludes);

	return models.get(id);
};

/**
 * @public
 * @param {string} name
 * @param {boolean=} optNoIncludes
 * @return {Map<string, dj.sys.models.ComponentModel>}
 */
dj.sys.managers.ComponentManager.prototype.getModelsByName = function(name, optNoIncludes)
{
	var models = this.getModels(optNoIncludes);

	return dj.ext.utils.map.create(
		goog.object.filter(
			dj.ext.utils.map.toObject(models), 
			function(model){
				return model.name == name;
			}
		)
	);
};


/**
 * @public
 * @return {Map<string, dj.sys.models.ComponentModel>}
 */
dj.sys.managers.ComponentManager.prototype.getIncludedModels = function()
{
	var models = new Map();

	for (var i = 0, len = this.includedManagers_.length; i < len; i++) {
		dj.ext.utils.map.merge(models, this.includedManagers_[i].getModels());
	}

	return models;
};

/**
 * @public
 * @deprecated
 * @param {string} id
 * @param {boolean=} optNoIncludes
 * @return {dj.sys.components.AbstractComponent}
 */
dj.sys.managers.ComponentManager.prototype.getComponent = function(id, optNoIncludes)
{
	return this.getComponentById(id, optNoIncludes);
};

/**
 * @public
 * @param {string} id
 * @param {boolean=} optNoIncludes
 * @return {dj.sys.components.AbstractComponent}
 */
dj.sys.managers.ComponentManager.prototype.getComponentById = function(id, optNoIncludes)
{
	var components = this.getComponents(optNoIncludes);

	return components.get(id);
};

/**
 * @public
 * @param {string} name
 * @param {boolean=} optNoIncludes
 * @return {Map<string, dj.sys.components.AbstractComponent>}
 */
dj.sys.managers.ComponentManager.prototype.getComponentsByName = function(name, optNoIncludes)
{
	var components = this.getComponents(optNoIncludes);

	return dj.ext.utils.map.create(
		goog.object.filter(
			dj.ext.utils.map.toObject(components), 
			function(component){
				return component.getName() == name;
			}
		)
	);
};

/**
 * @public
 * @param {Element} element
 * @param {boolean=} optNoIncludes
 * @return {dj.sys.components.AbstractComponent}
 */
dj.sys.managers.ComponentManager.prototype.getComponentByElement = function(element, optNoIncludes)
{
    var components = Array.from(this.getComponents(optNoIncludes).values());

    for (var i = 0, len = components.length; i < len; i++) {
        if (components[i].getElement() == element) {
            return components[i];
        }
    }

    return null;
};

/**
 * @public
 * @param {boolean=} optNoIncludes
 * @return {Map<string, dj.sys.components.AbstractComponent>}
 */
dj.sys.managers.ComponentManager.prototype.getComponents = function(optNoIncludes)
{
	var components = this.components_;

	if (!optNoIncludes) {
		var includedComponents = this.getIncludedComponents();

		dj.ext.utils.map.merge(includedComponents, components);

		components = includedComponents;
	}

	return components;
};

/**
 * @public
 * @return {Map<string, dj.sys.components.AbstractComponent>}
 */
dj.sys.managers.ComponentManager.prototype.getIncludedComponents = function()
{
	var components = new Map();

	for (var i = 0, len = this.includedManagers_.length; i < len; i++) {
		dj.ext.utils.map.merge(components, this.includedManagers_[i].getComponents());
	}

	return components;
};