goog.provide('dj.ext.router.transitions.AbstractTransition');

// goog
goog.require('goog.style');
goog.require('goog.events.EventHandler');

/**
 * @abstract
 * @constructor
 * @param {dj.ext.router.Router} router
 * @param {string} namespace
 */
dj.ext.router.transitions.AbstractTransition = function(router, namespace)
{
	/**
	 * @type {dj.ext.router.Router}
	 * @private
	 */
	this.router_ = router;

	/**
	 * @private
	 * @type {goog.events.EventHandler}
	 */
	this.handler_ = new goog.events.EventHandler(this);

	/**
	 * @private
	 * @type {string}
	 */
	this.namespace_ = namespace;

	/**
	 * @private
	 * @type {goog.structs.Map<string, *>}
	 */
	this.cycleParameters_ = new goog.structs.Map();
};

/**
 * @public
 */
dj.ext.router.transitions.AbstractTransition.prototype.init = function()
{
	this.handler_.listen(this.router_.getContentHandler(), dj.ext.router.events.ContentEvent.EventType.CONTENT_LOAD, this.handleContentLoad_)
                .listen(this.router_.getContentHandler(), dj.ext.router.events.ContentEvent.EventType.CONTENT_LOADED, this.handleContentLoaded_)
				.listen(this.router_.getContentHandler(), dj.ext.router.events.ContentEvent.EventType.CONTENT_READY, this.handleContentReady_)
				.listen(this.router_.getContentHandler(), dj.ext.router.events.ContentEvent.EventType.CONTENT_PARSED, this.handleContentParsed_)
				.listen(this.router_.getContentHandler(), dj.ext.router.events.ContentEvent.EventType.CONTENT_SETTLED, this.handleContentSettled_)
				.listen(this.router_.getContentHandler(), dj.ext.router.events.ContentEvent.EventType.CONTENT_CANCELED, this.handleContentCanceled_);
};

/**
 * @private
 * @param {dj.ext.router.events.ContentEvent} event
 */
dj.ext.router.transitions.AbstractTransition.prototype.handleContentLoad_ = function(event)
{
    this.loadContent();
};

/**
 * @private
 * @param {dj.ext.router.events.ContentEvent} event
 */
dj.ext.router.transitions.AbstractTransition.prototype.handleContentLoaded_ = function(event)
{
	event.parser.addInjectTask(this.namespace_, this.injectContent.bind(this));
};

/**
 * @private
 * @param {dj.ext.router.events.ContentEvent} event
 */
dj.ext.router.transitions.AbstractTransition.prototype.handleContentReady_ = function(event)
{
	event.parser.addReplaceTask(this.namespace_, this.replaceContent.bind(this));
};

/**
 * @private
 * @param {dj.ext.router.events.ContentEvent} event
 */
dj.ext.router.transitions.AbstractTransition.prototype.handleContentParsed_ = function(event)
{
	event.parser.addSettleTask(this.namespace_, this.settleContent.bind(this));
};

/**
 * @private
 * @param {dj.ext.router.events.ContentEvent} event
 */
dj.ext.router.transitions.AbstractTransition.prototype.handleContentSettled_ = function(event)
{
	this.cycleParameters_.clear();
	this.cycleEnded();
};

/**
 * @private
 * @param {dj.ext.router.events.ContentEvent} event
 */
dj.ext.router.transitions.AbstractTransition.prototype.handleContentCanceled_ = function(event)
{
	this.cycleParameters_.clear();
	this.cycleEnded();
};

/**
 * @public
 * @param {string} key
 * @param {*} value
 */
dj.ext.router.transitions.AbstractTransition.prototype.setParameter = function(key, value)
{
	this.cycleParameters_.set(key, value);
	this.parameterUpdate(this.cycleParameters_);
};

/**
 * @protected
 * @param {goog.structs.Map<string, *>} parameters
 */
dj.ext.router.transitions.AbstractTransition.prototype.parameterUpdate = function(parameters)
{
};

/**
 * @protected
 */
dj.ext.router.transitions.AbstractTransition.prototype.cycleEnded = function()
{
};

/**
 * @protected
 */
dj.ext.router.transitions.AbstractTransition.prototype.loadContent = function()
{

};

/**
 * @protected
 * @param {Array<Element>} oldElements
 * @param {Array<Element>} newElements
 * @return {goog.Promise}
 */
dj.ext.router.transitions.AbstractTransition.prototype.injectContent = function(oldElements, newElements)
{
	return goog.Promise.resolve();
};

/**
 * @protected
 * @param {Array<Element>} oldElements
 * @param {Array<Element>} newElements
 * @return {goog.Promise}
 */
dj.ext.router.transitions.AbstractTransition.prototype.replaceContent = function(oldElements, newElements)
{
	return goog.Promise.resolve();
};

/**
 * @protected
 * @param {Array<Element>} oldElements
 * @param {Array<Element>} newElements
 * @return {goog.Promise}
 */
dj.ext.router.transitions.AbstractTransition.prototype.settleContent = function(oldElements, newElements)
{
	return goog.Promise.resolve();
};

/**
 * @protected
 * @param {Element} element
 * @param {string} property
 */
dj.ext.router.transitions.AbstractTransition.prototype.setCssTransition = function(element, property)
{
	goog.style.setStyle(element, {
		'transition': property,
		'-webkit-transition': property
	});
};

/**
 * @protected
 * @param {Element} element
 * @param {string} x
 * @param {string} y
 */
dj.ext.router.transitions.AbstractTransition.prototype.setCssTranslation = function(element, x, y)
{
	goog.style.setStyle(element, {
		'tranform': 'translate3d(' + x + ',' + y + ',0)',
		'-webkit-transform': 'translate3d(' + x + ',' + y + ',0)'
	});
};