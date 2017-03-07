goog.provide('dj.ext.components.DropdownComponent');

// goog
goog.require('goog.dom');
goog.require('goog.array');
goog.require('goog.json');
goog.require('goog.style');
goog.require('goog.dom.classlist');
goog.require('goog.async.nextTick');
goog.require('goog.dom.dataset');

// dj
goog.require('dj.sys.components.AbstractComponent');
goog.require('dj.ext.models.DropdownModel');
goog.require('dj.ext.events.DropdownEvent');

/**
 * @constructor
 * @extends {dj.sys.components.AbstractComponent}
 */
dj.ext.components.DropdownComponent = function()
{
	goog.base(this);

	/**
	 * @private
	 * @type {goog.structs.Map<string, dj.ext.models.DropdownModel>}
	 */
	this.options_ = new goog.structs.Map();

	/**
	 * @private
	 * @type {string}
	 */
	this.label_ = '';

	/**
	 * @private
	 * @type {boolean}
	 */
	this.disabled_ = false;

	/**
	 * @private
	 * @type {boolean}
	 */
	this.active_ = false;

    /**
     * @private
     * @type {boolean}
     */
    this.selectActive_ = false;

    /**
     * @private
     * @type {Element}
     */
    this.selectInput_ = null;

	/**
	 * @private
	 * @type {dj.ext.models.DropdownModel}
	 */
	this.selected_ = null;

	/**
	 * @private
	 * @type {Element}
	 */
	this.activeElement_ = null;

	/**
	 * @private
	 * @type {Element}
	 */
	this.optionWrapper_ = null;

    /**
     * @private
     * @type {Array<Element>}
     */
    this.triggers_ = [];

    /**
     * @private
     * @type {Array<string>}
     */
    this.optionClasses_ = [];
};

goog.inherits(
	dj.ext.components.DropdownComponent,
	dj.sys.components.AbstractComponent
);

/**
 * @inheritDoc
 */
dj.ext.components.DropdownComponent.prototype.ready = function()
{
	return this.baseReady(dj.ext.components.DropdownComponent, function(resolve, reject){
		var options = goog.json.parse(goog.dom.dataset.get(this.getElement(), 'options'));

		this.label_ = /** @type {string} */ (goog.dom.dataset.get(this.getElement(), 'label'));
		this.activeElement_ = this.getElementByClass('active');
		this.optionWrapper_ = this.getElementByClass('option-wrapper');
        this.triggers_ = /** @type {Array<Element>} */ (this.getElementsByClass('trigger'));

        var provideSelect = goog.dom.dataset.get(this.getElement(), 'provideSelect');
        var optionClasses = goog.dom.dataset.get(this.getElement(), 'optionClass');

        if (provideSelect) {
            this.selectActive_ = true;

            this.createSelect_(provideSelect, options);
        }

        if (optionClasses) {
            this.optionClasses_ = optionClasses.split(' ');
        }

        this.createOptions_(options);

        goog.async.nextTick(function(){
            if (this.label_) {
                this.setLabel_(this.label_);
            }
            else {
                // Active first option
                var keys = this.options_.getKeys();
                this.activateOption_(this.options_.get(keys[0]));
            }

            resolve();
        }, this);
	});
};

/**
 * @inheritDoc
 */
dj.ext.components.DropdownComponent.prototype.init = function()
{
	return this.baseInit(dj.ext.components.DropdownComponent, function(resolve, reject){
		// Listen for active click
		goog.array.forEach(this.triggers_, function(trigger){
	        this.getHandler().listen(trigger, goog.events.EventType.CLICK,
	    		this.handleActiveClick_);
	    }, this);

		// Listen for all options click
		this.options_.forEach(function(option){
			this.getHandler().listen(option.element, goog.events.EventType.CLICK,
				this.handleOptionClick_);
		}, this);

		// Check for initial selection
		if (goog.dom.dataset.has(this.getElement(), 'selected')) {
			var name = goog.dom.dataset.get(this.getElement(), 'selected');
			this.activateOption_(this.options_.get(name));
		}

		// Update states
		goog.async.nextTick(function(){
			this.updateStates_();
			resolve();
		}, this);
	});
};

/**
 * @private
 */
dj.ext.components.DropdownComponent.prototype.updateStates_ = function()
{
	// Check if options are empty
	var disabled = goog.dom.dataset.get(this.getElement(), 'disabled');
	this.disabled_ = this.options_.isEmpty() || ((disabled && disabled == 'true') ? true : false);

	goog.dom.classlist.enable(this.getElement(), 'disabled', this.disabled_);
};

/**
 * @private
 * @param {goog.events.BrowserEvent} event
 */
dj.ext.components.DropdownComponent.prototype.handleOptionClick_ = function(event)
{
	if ( ! this.disabled_) {
		this.activateOption_(this.getOptionByElement_(event.currentTarget));
	}
};

/**
 * @private
 * @param {goog.events.BrowserEvent} event
 */
dj.ext.components.DropdownComponent.prototype.handleActiveClick_ = function(event)
{
	if ( ! this.disabled_) {
		this.active_ = this.toggleActiveState_();
        this.enableTriggers_(this.active_);
	}
};

/**
 * @private
 * @return {boolean}
 */
dj.ext.components.DropdownComponent.prototype.toggleActiveState_ = function()
{
	return goog.dom.classlist.toggle(this.getElement(), 'active');
};

/**
 * @private
 * @param {boolean} enabled
 */
dj.ext.components.DropdownComponent.prototype.enableActiveState_ = function(enabled)
{
	goog.dom.classlist.enable(this.getElement(), 'active', this.active_ = enabled);
    this.enableTriggers_(enabled);
};

/**
 * @private
 * @param {boolean} enbaled
 */
dj.ext.components.DropdownComponent.prototype.enableTriggers_ = function(enbaled)
{
    goog.array.forEach(this.triggers_, function(trigger){
        goog.dom.classlist.enable(trigger, 'active', enbaled);
    }, this);
};

/**
 * @private
 * @param {dj.ext.models.DropdownModel} option
 */
dj.ext.components.DropdownComponent.prototype.activateOption_ = function(option)
{
	this.selected_ = option;
	this.setLabel_(option.content);
	this.enableActiveState_(false);

    // Handle change on native select input
    if (this.selectActive_) {
        var options = this.selectInput_['options'];

        this.selectInput_['selectedIndex'] = -1;

        for (var i = 0, len = options.length; i < len; i++) {
            if (options[i].getAttribute('value') == option.name) {
                this.selectInput_['selectedIndex'] = i;
                break;
            }
        }
    }

    // Ensures that all elements are rendered correctly
    // before sending the event
	goog.async.nextTick(this.dispatchChange_, this);
};

/**
 * @private
 */
dj.ext.components.DropdownComponent.prototype.dispatchChange_ = function()
{
	this.dispatchEvent(new dj.ext.events.DropdownEvent(
		dj.ext.events.DropdownEvent.EventType.CHANGE,
		this.selected_
	));
};

/**
 * @private
 * @return {dj.ext.models.DropdownModel}
 */
dj.ext.components.DropdownComponent.prototype.getOptionByElement_ = function(element)
{
	var activeOption = null;

	this.options_.forEach(function(option){
		if (option.element == element) {
			activeOption = option;
		}
	}, this);

	return activeOption;
};

/**
 * @private
 * @param {string} label
 */
dj.ext.components.DropdownComponent.prototype.setLabel_ = function(label)
{
	this.label_ = label;

	goog.dom.setTextContent(this.activeElement_, this.label_);
};

/**
 * @param {string} name
 * @param {Object} options
 * @private
 */
dj.ext.components.DropdownComponent.prototype.createSelect_ = function(name, options)
{
    var domHelper = goog.dom.getDomHelper();
    var optionElements = [];

    goog.object.forEach(options, function(name, value){
        optionElements.push(domHelper.createDom('option', {'value': value}, name));
    });

    this.selectInput_ = domHelper.createDom('select', {'name': name}, optionElements);
    goog.style.setStyle(this.selectInput_, 'display', 'none');

    goog.dom.appendChild(this.getElement(), this.selectInput_);
};

/**
 * @param {Object} options
 * @private
 */
dj.ext.components.DropdownComponent.prototype.createOptions_ = function(options)
{
	goog.object.forEach(options, function(value, key){
		var option = this.createOptionElement_(key, value);
		var model = new dj.ext.models.DropdownModel(key, value, option);

		goog.dom.appendChild(this.optionWrapper_, option);
		this.options_.set(key, model);
	}, this);
};

/**
 * @param {string} name
 * @param {string} value
 * @return {Element}
 */
dj.ext.components.DropdownComponent.prototype.createOptionElement_ = function(name, value)
{
    var classStr = this.optionClasses_.join(' ');
	var domHelper = goog.dom.getDomHelper();
	var element = domHelper.createDom('div', 'option ' + classStr, [
		domHelper.createDom('span', null, value)
	]);

	goog.dom.dataset.set(element, 'name', name);

	return element;
};

/**
 * @public
 * @param {string} content
 */
dj.ext.components.DropdownComponent.prototype.enableByContent = function(content)
{
    this.options_.forEach(function(option){
        if (option.content == content) {
            this.activateOption_(option);
        }
    }, this);
};

/**
 * @public
 * @param {string} name
 */
dj.ext.components.DropdownComponent.prototype.enableByName = function(name)
{
    this.options_.forEach(function(option){
        if (option.name == name) {
            this.activateOption_(option);
        }
    }, this);
};

/**
 * @public
 * @return {dj.ext.models.DropdownModel}
 */
dj.ext.components.DropdownComponent.prototype.getSelected = function()
{
	return this.selected_;
};

/**
 * @public
 * @return {boolean}
 */
dj.ext.components.DropdownComponent.prototype.isDisabled = function()
{
	return this.disabled_;
};

/**
 * @public
 * @return {boolean}
 */
dj.ext.components.DropdownComponent.prototype.hasSelected = function()
{
	return this.selected_ != null;
};