goog.provide('dj.ext.router.handlers.ContentHandler');

// goog
goog.require('goog.net.XhrIo');

// dj.ext
goog.require('dj.ext.router.models.ContentModel');
goog.require('dj.ext.router.events.ContentEvent');
goog.require('dj.ext.router.parsers.ContentParser');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.ext.router.handlers.ContentHandler = function()
{
	dj.ext.router.handlers.ContentHandler.base(this, 'constructor');

	/**
	 * @private
	 * @type {goog.net.XhrIo}
	 */
	this.xhr_ = null;

	/**
	 * @private
	 * @type {goog.Promise}
	 */
	this.loadPromise_ = new goog.Promise(function(){});

	/**
	 * @private
	 * @type {Element}
	 */
	this.outletElement_ = /** @type {Element} */ (document.body);

	/**
	 * @private
	 * @type {dj.ext.router.parsers.ContentParser}
	 */
	this.contentParser_ = null;
};

goog.inherits(
	dj.ext.router.handlers.ContentHandler,
	goog.events.EventTarget
);

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 * @return {dj.ext.router.parsers.ContentParser}
 */
dj.ext.router.handlers.ContentHandler.prototype.load = function(url, fromRoute, toRoute)
{
	this.cancel(fromRoute, toRoute);

	this.contentParser_ = new dj.ext.router.parsers.ContentParser(this.outletElement_);
	this.loadPromise_ = new goog.Promise(function(resolve, reject){
		this.contentLoad_(fromRoute, toRoute);

		this.xhr_ = goog.net.XhrIo.send(url, function(event){
			if (event.type == goog.net.EventType.COMPLETE && event.target.isSuccess()) {
				if (this.contentParser_) {
					this.contentLoaded_(fromRoute, toRoute);
					resolve(this.parseHtml_(event.target.getResponse()));
				}
			}

			this.xhr_ = null;
		}.bind(this));
	}, this);

	return this.contentParser_;
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.ext.router.handlers.ContentHandler.prototype.loaded = function()
{
	return this.loadPromise_;
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 * @return {goog.Promise}
 */
dj.ext.router.handlers.ContentHandler.prototype.parse = function(fromRoute, toRoute)
{
	return new goog.Promise(function(resolve, reject){
		if (this.contentParser_) {
			this.contentParser_.inject().then(function(){
				this.contentReady_(fromRoute, toRoute);

				goog.async.nextTick(function(){
					this.contentParser_.replace().then(function(){
						this.contentParsed_(fromRoute, toRoute);
						resolve();
					}, null, this);
				}, this);
			}, null, this);
		}
		else {
			reject('No content parser found!');
		}
	}, this);
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 */
dj.ext.router.handlers.ContentHandler.prototype.cancel = function(fromRoute, toRoute)
{
	var canceled = false;

	if (this.xhr_ && this.xhr_.isActive()) {
		canceled = true;
		this.xhr_.abort(goog.net.ErrorCode.NO_ERROR);
	}

	if (this.contentParser_) {
		canceled = true;
		this.contentParser_.cancel();
	}

	if (canceled) {
		this.dispatchEvent(new dj.ext.router.events.ContentEvent(
			dj.ext.router.events.ContentEvent.EventType.CONTENT_CANCELED, fromRoute, toRoute, this.contentParser_
		));

		this.xhr_ = null;
		this.contentParser_ = null;
	}
};

/**
 * @public
 * @param {Element} element
 */
dj.ext.router.handlers.ContentHandler.prototype.setOutletElement = function(element)
{
	this.outletElement_ = element;
};

/**
 * @private
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 */
dj.ext.router.handlers.ContentHandler.prototype.contentReady_ = function(fromRoute, toRoute)
{
	if (this.contentParser_) {
		this.dispatchEvent(new dj.ext.router.events.ContentEvent(
			dj.ext.router.events.ContentEvent.EventType.CONTENT_READY, fromRoute, toRoute, this.contentParser_
		));
	}
};

/**
 * @private
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 */
dj.ext.router.handlers.ContentHandler.prototype.contentParsed_ = function(fromRoute, toRoute)
{
	if (this.contentParser_) {
		this.dispatchEvent(new dj.ext.router.events.ContentEvent(
			dj.ext.router.events.ContentEvent.EventType.CONTENT_PARSED, fromRoute, toRoute, this.contentParser_
		));

		this.contentParser_.settle().then(function(){
			this.dispatchEvent(new dj.ext.router.events.ContentEvent(
				dj.ext.router.events.ContentEvent.EventType.CONTENT_SETTLED, fromRoute, toRoute, this.contentParser_
			));

			this.contentParser_.clearTasks();
			this.contentParser_ = null;
		}, null, this);
	}
};

/**
 * @private
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 */
dj.ext.router.handlers.ContentHandler.prototype.contentLoad_ = function(fromRoute, toRoute)
{
	if (this.contentParser_) {
		this.dispatchEvent(new dj.ext.router.events.ContentEvent(
			dj.ext.router.events.ContentEvent.EventType.CONTENT_LOAD, fromRoute, toRoute, this.contentParser_
		));
	}
};

/**
 * @private
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 */
dj.ext.router.handlers.ContentHandler.prototype.contentLoaded_ = function(fromRoute, toRoute)
{
	if (this.contentParser_) {
		this.dispatchEvent(new dj.ext.router.events.ContentEvent(
			dj.ext.router.events.ContentEvent.EventType.CONTENT_LOADED, fromRoute, toRoute, this.contentParser_
		));
	}
};

/**
 * @private
 * @param {string} html
 * @return {dj.ext.router.parsers.ContentParser}
 */
dj.ext.router.handlers.ContentHandler.prototype.parseHtml_ = function(html)
{
	// Not the safest way, but this ensures all data (classes, attributes)
	// will be preserved after the parsing. Unlike the sanatizer.

	var fragment = document.createDocumentFragment();
	var tempNode = goog.dom.createElement('div');
	tempNode.innerHTML = html;

	var contentElements = goog.array.slice(goog.dom.getChildren(tempNode), 0);

	for (var i = 0, len = contentElements.length; i < len; i++) {
		goog.dom.appendChild(fragment, contentElements[i]);
	}

	this.contentParser_.setContentModel(
		new dj.ext.router.models.ContentModel(/** @type {Node} */ (fragment))
	);

	return this.contentParser_;
};