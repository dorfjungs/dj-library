goog.provide('dj.managers.ComponentManager');

// goog
goog.require('goog.array');
goog.require('goog.ui.IdGenerator');
goog.require('goog.Promise');
goog.require('goog.structs.Map');
goog.require('goog.events.Event');
goog.require('goog.async.nextTick');

// dj
goog.require('dj.components.BaseComponent');

/**
 * @constructor
 */
dj.managers.ComponentManager = function()
{
	/**
	 * @private
	 * @type {Element|Document}
	 */
	this.parent_ = null;

	/**
	 * @private
	 * @type {goog.structs.Map.<string, dj.components.BaseComponent>}
	 */
	this.components_ = new goog.structs.Map();

	/**
	 * @private
	 * @type {goog.structs.Map.<string, Function>}
	 */
	this.classMap_ = new goog.structs.Map();

	/**
	 * @private
	 * @type {goog.structs.Map.<string, dj.components.BaseComponent>}
	 */
	this.componentStack_ = new goog.structs.Map();

	/**
	 * @private
	 * @type {boolean}
	 */
	this.initialized_ = false;
};

/**
 * @enum {string}
 */
dj.managers.ComponentManager.EventType = {
	COMPONENT_INITIALIZED: 'dj.managers.ComponentManager.EventType.COMPONENT_INITIALIZED'
};

/**
 * @private
 * @type {string}
 */
dj.managers.ComponentManager.prototype.identifier_ = 'component';

/**
 * @private
 * @type {string}
 */
dj.managers.ComponentManager.prototype.identifierId_ = 'component-id';

/**
 * @param {Element|Document=} optParent
 */
dj.managers.ComponentManager.prototype.init = function(optParent)
{
	this.initialized_ = true;
	this.parent_ = optParent || goog.dom.getDocument();

	this.addComponentElements_(
		/** @type {Array<Node>|NodeList} */ (
			this.parent_.querySelectorAll('[' + this.identifier_ +  ']')
		)
	);
};

/**
 * Updates all components which are not initialized yet
 */
dj.managers.ComponentManager.prototype.update = function()
{
	this.addComponentElements_(
		/** @type {Array<Node>|NodeList} */ (
			this.parent_.querySelectorAll('[' + this.identifier_ +  ']:not([' + this.identifierId_ + '])')
		)
	);
};

/**
 * @private
 * @param {Array<Node>|NodeList} elements
 */
dj.managers.ComponentManager.prototype.addComponentElements_ = function(elements)
{
	elements = /** {IArrayLike<(Element|null)>} */ (elements);

	goog.array.forEach(elements, this.initComponent_, this);
	goog.array.forEach(elements, this.decorateComponent_, this);

	goog.async.nextTick(function(){
		for (var i = 0, len = elements.length; i < len; i++) {
			var component = this.getComponentByElement(elements[i]);

			if (component) {
				this.componentStack_.set(component.getComponentId(), component);
			}
		}

		this.handleComponentStack_();
	}, this);
};

/**
 * @private
 */
dj.managers.ComponentManager.prototype.handleComponentStack_ = function()
{
	var keys = this.componentStack_.getKeys();

	if (keys[0]) {
		var component = this.componentStack_.get(keys[0]);

		this.enterComponent_(component).then(function(id){
			this.componentStack_.remove(id);
			this.handleComponentStack_();
		}.bind(this, keys[0]), null);
	}
};

/**
 * @private
 * @param {Element} element
 */
dj.managers.ComponentManager.prototype.initComponent_ = function(element)
{
	var identifier = element.getAttribute(this.identifier_);
	var constructor = this.classMap_.get(identifier);
	var uniqueId = goog.ui.IdGenerator.getInstance().getNextUniqueId();

	element.setAttribute(this.identifierId_, uniqueId);

	if ( ! this.classMap_.containsKey(identifier)) {
		console.warn('Constructor with identifier "' + identifier + '" was not found in the class map');
		return;
	}

	if ( ! constructor) {
		console.warn('Class for "' + identifier + '" was not found');
		return;
	}

	var instance = new constructor(this);

	if (instance instanceof dj.components.BaseComponent) {
		instance.setComponentIdentifier(identifier);
		instance.setComponentId(uniqueId);

		this.components_.set(uniqueId, instance);
	}
	else {
		console.warn('Component "' + instance.constructor.name + '" needs to inherit the base component class');
	}
};

/**
 * @private
 * @param {Element} element
 */
dj.managers.ComponentManager.prototype.decorateComponent_ = function(element)
{
	var id = element.getAttribute(this.identifierId_);
	var instance = this.components_.get(id);

	if (instance) {
		instance.decorate(element);
		instance.dispatchEvent(new goog.events.Event(
			dj.managers.ComponentManager.EventType.COMPONENT_INITIALIZED
		));
	}
	else {
		console.warn('Instance for "' + element.getAttribute(this.identifier_) + id + '" could not be found');
	}
};

/**
 * @private
 * @param {dj.components.BaseComponent} component
 * @return {goog.Promise}
 */
dj.managers.ComponentManager.prototype.enterComponent_ = function(component)
{
	return new goog.Promise(function(resolve, reject){
		if ( ! component.isInitialized()) {
			component.init().then(
				function(optPrevious) {
					// This will enter components initialized in the current
					// component first
					if (optPrevious && goog.typeOf(optPrevious) == 'array') {
						for (var i = 0, len = optPrevious.length; i < len; i++) {
							optPrevious[i].enterComponent();
						}
					}

					// Init current component
					component.enterComponent();

					// Initializing check
					if ( ! component.isInitialized()) {
						reject('You need to call the parent function '
							+ '"enterComponent" for your component: "'
							+ component.getComponentIdentifier() + '"');
					}
					else {
						resolve();
					}
				},
				function(err) {
					reject('Error while initializing component: ' + err);
				},
			this);
		}
		else {
			resolve();
		}
	}, this);
};

/**
 * @param {string} identifier
 * @param {Function} constructor
 */
dj.managers.ComponentManager.prototype.addComponent = function(identifier, constructor)
{
	this.classMap_.set(identifier, constructor);
};

/**
 * @param {Element} element
 * @return {dj.components.BaseComponent}
 */
dj.managers.ComponentManager.prototype.getComponentByElement = function(element)
{
	var component = null;

	this.components_.forEach(function(cmp){
		if (cmp.getElement() == element) {
			component = cmp;
			return;
		}
	});

	return component;
};