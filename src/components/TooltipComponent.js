goog.provide('dj.components.TooltipComponent');

// goog
goog.require('goog.style');
goog.require('goog.userAgent');

// dj
goog.require('dj.components.BaseComponent');

/**
 * @constructor
 * @extends {dj.components.BaseComponent}
 */
dj.components.TooltipComponent = function()
{
	goog.base(this);

	/**
	 * @private
	 * @type {Element}
	 */
	this.labelElement_ = null;

	/**
	 * @private
	 * @type {Element}
	 */
	this.contentElement_ = null;

	/**
	 * @private
	 * @type {boolean}
	 */
	this.active_ = false;

	/**
	 * @private
	 * @type {number}
	 */
	this.position_ = dj.components.TooltipComponent.Position.TOP;
};

goog.inherits(
	dj.components.TooltipComponent,
	dj.components.BaseComponent
);

/**
 * @private
 * @type {string}
 */
dj.components.TooltipComponent.prototype.activeClass_ = 'active';

/**
 * @private
 * @type {string}
 */
dj.components.TooltipComponent.prototype.inactiveClass_ = 'inactive';

/**
 * @enum {number}
 */
dj.components.TooltipComponent.Position = {
	TOP: 0,
	RIGHT: 1,
	BOTTOM: 2,
	LEFT: 3
};

/**
 * @inheritDoc
 */
dj.components.TooltipComponent.prototype.init = function()
{
	return new goog.Promise(function(resolve, reject){
		this.labelElement_ = this.getElementByClass('label');
		this.contentElement_ = this.getElementByClass('content');

		if ( ! this.labelElement_) {
			throw new Error('Please provide a label element');
		}

		if( ! this.contentElement_) {
			throw new Error('Please provide a content element');
		}

		if (goog.dom.classlist.contains(this.getElement(), 'align-left')) {
			this.position_ = dj.components.TooltipComponent.Position.LEFT;
		}
		else if (goog.dom.classlist.contains(this.getElement(), 'align-right')) {
			this.position_ = dj.components.TooltipComponent.Position.RIGHT;
		}
		else if (goog.dom.classlist.contains(this.getElement(), 'align-bottom')) {
			this.position_ = dj.components.TooltipComponent.Position.BOTTOM;
		}
		else if (goog.dom.classlist.contains(this.getElement(), 'align-top')) {
			this.position_ = dj.components.TooltipComponent.Position.TOP;
		}

		this.applyStyles_();
		this.enable(false);

		resolve();
	}, this);
};

/**
 * @inheritDoc
 */
dj.components.TooltipComponent.prototype.enterComponent = function()
{
	goog.base(this, 'enterComponent');

	if (goog.userAgent.MOBILE) {
		this.getHandler().listen(document, goog.events.EventType.TOUCHEND,
			this.handleDocumentTouchEnd_);
	}
	else {
		this.getHandler().listen(this.getElement(), goog.events.EventType.MOUSEOVER,
			this.handleMouseOver_);

		this.getHandler().listen(this.getElement(), goog.events.EventType.MOUSEOUT,
			this.handleMouseOut_);
	}
};

/**
 * @param {goog.events.BrowserEvent} event
 */
dj.components.TooltipComponent.prototype.handleDocumentTouchEnd_ = function(event)
{
	if (this.active_ && !goog.dom.contains(/** @type {Node} */ (this.contentElement_),
			/** @type {Node} */ (event.target))) {
		this.enable(false);
	}
	else if ( ! this.active_ && goog.dom.contains(/** @type {Node} */ (this.labelElement_),
			/** @type {Node} */ (event.target))) {
		this.enable(true);
	}
};

/**
 * @private
 */
dj.components.TooltipComponent.prototype.handleMouseOver_ = function()
{
	this.enable(true);
};

/**
 * @private
 */
dj.components.TooltipComponent.prototype.handleMouseOut_ = function()
{
	this.enable(false);
};

/**
 * @return {boolean}
 */
dj.components.TooltipComponent.prototype.toggle = function()
{
	if (this.active_) {
		this.enable(false);
	}
	else {
		this.enable(true);
	}

	return this.active_;
};

/**
 * @param {boolean} enabled
 */
dj.components.TooltipComponent.prototype.enable = function(enabled)
{
	this.active_ = enabled;

	goog.dom.classlist.enable(this.getElement(), this.activeClass_, enabled);
	goog.dom.classlist.enable(this.getElement(), this.inactiveClass_, !enabled);
};

/**
 * @private
 */
dj.components.TooltipComponent.prototype.applyStyles_ = function()
{
	goog.style.setStyle(this.getElement(), 'position', 'relative');
	goog.style.setStyle(this.contentElement_, 'position', 'absolute');

	switch (this.position_) {
		case dj.components.TooltipComponent.Position.TOP:
			goog.style.setStyle(this.contentElement_, {
				'left': '50%',
				'bottom': '100%',
				'transform': 'translate(-50%, 0)',
				'-webkit-transform': 'translate(-50%, 0)'
			});
			break;

		case dj.components.TooltipComponent.Position.RIGHT:
			goog.style.setStyle(this.contentElement_, {
				'left': '100%',
				'top': '50%',
				'transform': 'translate(0, -50%)',
				'-webkit-transform': 'translate(0, -50%)'
			});
			break;

		case dj.components.TooltipComponent.Position.BOTTOM:
			goog.style.setStyle(this.contentElement_, {
				'left': '50%',
				'top': '100%',
				'transform': 'translate(-50%, 0)',
				'-webkit-transform': 'translate(-50%, 0)'
			});
			break;

		case dj.components.TooltipComponent.Position.LEFT:
			goog.style.setStyle(this.contentElement_, {
				'right': '100%',
				'top': '50%',
				'transform': 'translate(0, -50%)',
				'-webkit-transform': 'translate(0, -50%)'
			});
			break;
	}
};