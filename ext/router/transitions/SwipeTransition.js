goog.provide('dj.ext.router.transitions.SwipeTransition');

// goog
goog.require('goog.style');

// dj
goog.require('dj.ext.dom.classlist.inline');

// dj.ext
goog.require('dj.ext.router.transitions.AbstractTransition');

/**
 * @constructor
 * @param {dj.ext.router.Router} router
 * @param {string} namespace
 * @extends {dj.ext.router.transitions.AbstractTransition}
 */
dj.ext.router.transitions.SwipeTransition = function(router, namespace)
{
	dj.ext.router.transitions.SwipeTransition.base(this, 'constructor', router, namespace);

	/**
	 * @private
	 * @type {number}
	 */
	this.defaultTime_ = 1000;

	/**
	 * @private
	 * @type {number}
	 */
	this.time_ = this.defaultTime_;

	/**
	 * @private
	 * @type {string}
	 */
	this.defaultEasing_ = 'ease-out';

	/**
	 * @private
	 * @type {string}
	 */
	this.easing_ = this.defaultEasing_;

	/**
	 * @private
	 * @type {string}
	 */
	this.defaultDirection_ = dj.ext.router.transitions.SwipeTransition.Direction.LEFT_TO_RIGHT;

	/**
	 * @private
	 * @type {string}
	 */
	this.direction_ = this.defaultDirection_;

	/**
	 * @private
	 * @type {Array<number>}
	 */
	this.timeouts_ = [];
};

goog.inherits(
	dj.ext.router.transitions.SwipeTransition,
	dj.ext.router.transitions.AbstractTransition
);

/**
 * @const
 * @type {string}
 */
dj.ext.router.transitions.SwipeTransition.prototype.classNs_ = 'dj.ext.router.transition.';

/**
 * @const
 * @enum {string}
 */
dj.ext.router.transitions.SwipeTransition.Direction = {
	LEFT_TO_RIGHT: 'ltr',
	RIGHT_TO_LEFT: 'rtl',
	TOP_TO_BOTTOM: 'ttb',
	BOTTOM_TO_TOP: 'btt'
};

/** @inheritDoc */
dj.ext.router.transitions.SwipeTransition.prototype.init = function()
{
	dj.ext.router.transitions.SwipeTransition.base(this, 'init');

	// Register inline classes for transition
	dj.ext.dom.classlist.inline.register(this.classNs_ + 'hide');
	dj.ext.dom.classlist.inline.register(this.classNs_ + 'ready', {
		'position': 'fixed',
		'overflow': 'hidden',
		'width': '100%',
		'height': '100%',
		'z-index': '5',
		'left': '0',
		'top': '0',
	});

	dj.ext.dom.classlist.inline.register(this.classNs_ + 'animate', {
		'transform': 'translate3d(0, 0, 0)'
	});

	// Set default values
	this.updateDirection_();
	this.updateCssTransition_();
};

/**
 * @private
 */
dj.ext.router.transitions.SwipeTransition.prototype.updateDirection_ = function()
{
	switch (this.direction_) {
		case dj.ext.router.transitions.SwipeTransition.Direction.LEFT_TO_RIGHT:
			dj.ext.dom.classlist.inline.edit(this.classNs_ + 'hide', 'transform', 'translate3d(30vw, 0, 0)');
			dj.ext.dom.classlist.inline.edit(this.classNs_ + 'ready', 'transform', 'translate3d(-100vw, 0, 0)');
			break;

		case dj.ext.router.transitions.SwipeTransition.Direction.RIGHT_TO_LEFT:
			dj.ext.dom.classlist.inline.edit(this.classNs_ + 'hide', 'transform', 'translate3d(-30vw, 0, 0)');
			dj.ext.dom.classlist.inline.edit(this.classNs_ + 'ready', 'transform', 'translate3d(100vw, 0, 0)');
			break;

		case dj.ext.router.transitions.SwipeTransition.Direction.TOP_TO_BOTTOM:
			dj.ext.dom.classlist.inline.edit(this.classNs_ + 'hide', 'transform', 'translate3d(0, 30vh, 0)');
			dj.ext.dom.classlist.inline.edit(this.classNs_ + 'ready', 'transform', 'translate3d(0, -100vh, 0)');
			break;

		case dj.ext.router.transitions.SwipeTransition.Direction.BOTTOM_TO_TOP:
			dj.ext.dom.classlist.inline.edit(this.classNs_ + 'hide', 'transform', 'translate3d(0, -30vh, 0)');
			dj.ext.dom.classlist.inline.edit(this.classNs_ + 'ready', 'transform', 'translate3d(0, 100vh, 0)');
			break;
	}
};

/**
 * @private
 */
dj.ext.router.transitions.SwipeTransition.prototype.updateCssTransition_ = function()
{
	var value = 'transform ' + this.time_ + 'ms ' + this.easing_;

	dj.ext.dom.classlist.inline.edit(this.classNs_ + 'hide', 'transition', value);
	dj.ext.dom.classlist.inline.edit(this.classNs_ + 'animate', 'transition', value);
};

/** @inheritDoc */
dj.ext.router.transitions.SwipeTransition.prototype.parameterUpdate = function(parameters)
{
	var time = parseInt(parameters.get('time'), 10);
	var easing = /** @type {string} */ (parameters.get('easing'));
	var direction = /** @type {string} */ (parameters.get('direction'));

	if (direction) {
		this.direction_ = direction;
		this.updateDirection_();
	}

	if (time) {
		this.time_ = time;
	}

	if (easing) {
		this.easing_ = easing;
	}

	this.updateCssTransition_();
};

/** @inheritDoc */
dj.ext.router.transitions.SwipeTransition.prototype.contentCanceled = function()
{
	this.clearTimeouts_();
};

/** @inheritDoc */
dj.ext.router.transitions.SwipeTransition.prototype.cycleEnded = function()
{
	this.time_ = this.defaultTime_;
	this.easing_ = this.defaultEasing_;
	this.direction_ = this.defaultDirection_;

	this.updateDirection_();
	this.updateCssTransition_();
};

/** @private */
dj.ext.router.transitions.SwipeTransition.prototype.clearTimeouts_ = function()
{
    for (var i = 0, len = this.timeouts_.length; i < len; i++) {
        clearTimeout(this.timeouts_[i]);
    }

    this.timeouts_ = [];
};

/** @inheritDoc */
dj.ext.router.transitions.SwipeTransition.prototype.replaceContent = function(oldElements, newElements)
{
	return new goog.Promise(function(resolve, reject){
		for (var i = 0, len = oldElements.length; i < len; i++) {
			dj.ext.dom.classlist.inline.enable(oldElements[i], this.classNs_ + 'hide', true);
		}

		for (var i = 0, len = newElements.length; i < len; i++) {
			dj.ext.dom.classlist.inline.enable(newElements[i], this.classNs_ + 'ready', true);

			this.timeouts_.push(setTimeout(function(element){
				dj.ext.dom.classlist.inline.enable(element, this.classNs_ + 'animate', true);
			}.bind(this, newElements[i]), 50));
		}

		this.timeouts_.push(setTimeout(function(){
			for (var i = 0, len = newElements.length; i < len; i++) {
				dj.ext.dom.classlist.inline.enable(newElements[i], this.classNs_ + 'ready', false);
				dj.ext.dom.classlist.inline.enable(newElements[i], this.classNs_ + 'animate', false);
			}

			for (var i = 0, len = oldElements.length; i < len; i++) {
				dj.ext.dom.classlist.inline.enable(oldElements[i], this.classNs_ + 'hide', false);
			}

			resolve();
		}.bind(this), this.time_ + 50));
	}, this);
};