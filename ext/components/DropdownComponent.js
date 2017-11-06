goog.provide('dj.ext.components.DropdownComponent');

// goog
goog.require('goog.dom');
goog.require('goog.array');
goog.require('goog.json');
goog.require('goog.style');
goog.require('goog.dom.classlist');
goog.require('goog.async.nextTick');
goog.require('goog.dom.dataset');
goog.require('goog.ui.Popup');
goog.require('goog.positioning.Corner');
goog.require('goog.positioning.Overflow');
goog.require('goog.positioning.AnchoredPosition');

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
	dj.ext.components.DropdownComponent.base(this, 'constructor');

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

    /**
     * @private
     * @type {boolean}
     */
    this.externalOptionWrapper_ = false;

    /**
     * @private
     * @type {goog.ui.Popup}
     */
    this.wrapperPopup_ = null;
};

goog.inherits(
	dj.ext.components.DropdownComponent,
	dj.sys.components.AbstractComponent
);

/** @export @inheritDoc */
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
        var optionWrapperClasses = goog.dom.dataset.get(this.getElement(), 'optionWrapperClasses');

        if (!this.optionWrapper_) {
        	this.optionWrapper_ = this.createOptionWrapper_(optionWrapperClasses);
        	this.externalOptionWrapper_ = true;
        }

        if (provideSelect) {
            this.selectActive_ = true;
            this.createSelect_(provideSelect, options, this.queryElement('select'));
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

/** @export @inheritDoc */
dj.ext.components.DropdownComponent.prototype.init = function()
{
	return this.baseInit(dj.ext.components.DropdownComponent, function(resolve, reject){
		this.listenResize();

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

		if (this.wrapperPopup_) {
			this.handler.listen(this.wrapperPopup_, goog.ui.PopupBase.EventType.HIDE,
				this.handleWrapperPopupHide_);
		}

		// Update states
		goog.async.nextTick(function(){
			this.updateStates_();

			if (this.externalOptionWrapper_) {
				this.updateWrapperSize_();
			}

			resolve();
		}, this);
	});
};

/** @inheritDoc */
dj.ext.components.DropdownComponent.prototype.handleResize = function()
{
	dj.ext.components.DropdownComponent.base(this, 'handleResize');

	if (this.externalOptionWrapper_) {
		this.updateWrapperSize_();
	}

	if (this.wrapperPopup_) {
		this.wrapperPopup_.reposition();
	}
};

/**
 * @private
 */
dj.ext.components.DropdownComponent.prototype.handleWrapperPopupHide_ = function()
{
    this.enableActiveState_(false);
};

/**
 * @private
 * @param {string=} optClasses
 * @return {Element}
 */
dj.ext.components.DropdownComponent.prototype.createOptionWrapper_ = function(optClasses)
{
	var wrapper = goog.dom.createDom('div', 'dj-dropdown-option-wrapper ' + (optClasses || ''));
	goog.dom.appendChild(document.body, wrapper);

	this.wrapperPopup_ = new goog.ui.Popup(wrapper, new goog.positioning.AnchoredPosition(
		this.activeElement_, goog.positioning.Corner.BOTTOM_START,
          (goog.positioning.Overflow.ADJUST_X_EXCEPT_OFFSCREEN |
           goog.positioning.Overflow.ADJUST_Y_EXCEPT_OFFSCREEN)
	));

	return wrapper;
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
 * @public
 * @return {goog.structs.Map<string, dj.ext.models.DropdownModel>}
 */
dj.ext.components.DropdownComponent.prototype.getOptions = function()
{
    return this.options_;
};

/**
 * @private
 */
dj.ext.components.DropdownComponent.prototype.updateWrapperSize_ = function()
{
	var activeItemSize = goog.style.getSize(this.activeElement_);

	goog.style.setWidth(this.optionWrapper_, activeItemSize.width);
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
        if (this.selectInput_) {
            this.selectInput_.click();
        }

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
	var enabled = goog.dom.classlist.toggle(this.optionWrapper_, 'active');

	if (this.wrapperPopup_) {
		this.wrapperPopup_.setVisible(enabled);
	}

	return goog.dom.classlist.toggle(this.getElement(), 'active');
};

/**
 * @private
 * @param {boolean} enabled
 */
dj.ext.components.DropdownComponent.prototype.enableActiveState_ = function(enabled)
{
	goog.dom.classlist.enable(this.getElement(), 'active', this.active_ = enabled);
	goog.dom.classlist.enable(this.optionWrapper_, 'active', enabled);

	if (this.wrapperPopup_) {
		this.wrapperPopup_.setVisible(enabled);
	}

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

	// Set selected class on acticated option.
	// Also disable it on all other options
	this.options_.forEach(function(opt){
		goog.dom.classlist.enable(opt.element, 'selected', option.name == opt.name);
	});

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
 * @param {Element=} optElement
 * @private
 */
dj.ext.components.DropdownComponent.prototype.createSelect_ = function(name, options, optElement)
{
    var domHelper = goog.dom.getDomHelper();
    var optionElements = [];

    goog.object.forEach(options, function(name, value){
        if (optElement && this.queryElement('option[value="' + value + '"]', optElement)) {
            return;
        }

        optionElements.push(domHelper.createDom('option', {'value': value}, name));
    }, this);

    if (optElement) {
        this.selectInput_ = optElement;
        this.selectInput_.setAttribute('name', name);


        for (var i = 0, len = optionElements.length; i < len; i++) {
    		goog.dom.appendChild(this.selectInput_, optionElements[i]);
    	}
    }
    else {
    	this.selectInput_ = domHelper.createDom('select', {'name': name}, optionElements);
    }

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
        key = key == '_empty_' ? '' : key;

        var option = this.createOptionElement_(key, value);
		var model = new dj.ext.models.DropdownModel(key, value, option);

		goog.dom.appendChild(this.optionWrapper_, option);
		this.options_.set(key, model);
	}, this);
};

/**
 * @public
 * @param {Object} config
 */
dj.ext.components.DropdownComponent.prototype.setOptions = function(config)
{
    this.options_.clear();
    goog.dom.removeChildren(this.optionWrapper_);
    this.createOptions_(config);

    this.options_.forEach(function(option){
        this.getHandler().listen(option.element, goog.events.EventType.CLICK,
            this.handleOptionClick_);
    }, this);

    if (this.selectActive_) {
        goog.dom.removeChildren(this.selectInput_);
        this.createSelectOptions_();
    }
};

/**
 * @private
 */
dj.ext.components.DropdownComponent.prototype.createSelectOptions_ = function()
{
    this.options_.forEach(function(value, name){
        goog.dom.appendChild(
            this.selectInput_,
            goog.dom.createDom('option', {'value': name}, value.content)
        );
    }, this);
};

/**
 * @private
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