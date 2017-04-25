goog.provide('dj.ext.router.handlers.RouteHandler');

// goog
goog.require('goog.asserts');
goog.require('goog.Promise');
goog.require('goog.async.nextTick');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');

// dj.ext
goog.require('dj.ext.router.models.RouteModel');
goog.require('dj.ext.router.events.RouteEvent');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
dj.ext.router.handlers.RouteHandler = function()
{
	dj.ext.router.handlers.RouteHandler.base(this, 'constructor');

	/**
	 * @private
	 * @type {goog.events.EventHandler}
	 */
	this.handler_ = new goog.events.EventHandler(this);

	/**
	 * @private
	 * @type {dj.ext.router.models.RouteModel}
	 */
	this.activeRoute_ = null;

	/**
	 * @private
	 * @type {dj.ext.router.models.RouteModel}
	 */
	this.lastRoute_ = null;
};

goog.inherits(
	dj.ext.router.handlers.RouteHandler,
	goog.events.EventTarget
);

/**
 * @public
 */
dj.ext.router.handlers.RouteHandler.prototype.init = function()
{
	window.history.scrollRestoration = 'manual';
	this.handler_.listen(window, goog.events.EventType.POPSTATE,
		this.handlePopState_);
};

/**
 * @public
 */
dj.ext.router.handlers.RouteHandler.prototype.deinit = function()
{
	window.history.scrollRestoration = 'auto';
	this.handler_.unlisten(window, goog.events.EventType.POPSTATE,
		this.handlePopState_);
};

/**
 * @param {goog.events.BrowserEvent} event
 * @private
 */
dj.ext.router.handlers.RouteHandler.prototype.handlePopState_ = function(event)
{
	if (event.state && event.state.hasOwnProperty('activeRoute')) {
		var activeRoute = dj.ext.router.models.RouteModel.parse(event.state['activeRoute']);

		this.enableRoute(activeRoute, true);
	}
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @param {boolean=} optReplace
 * @param {boolean=} optPreventEvents
 * @return {goog.Promise}
 */
dj.ext.router.handlers.RouteHandler.prototype.enableRoute = function(route, optReplace, optPreventEvents)
{
	if (this.activeRoute_ && this.activeRoute_.active) {
		if (optReplace) {
			this.activeRoute_.active = false;
		}
		else {
			return goog.Promise.resolve();
		}
	}

	var resolver = goog.Promise.withResolver();

	this.activeRoute_ = route;
	this.activeRoute_.active = true;

	if (!optPreventEvents) {
		this.dispatchEvent(new dj.ext.router.events.RouteEvent(
			dj.ext.router.events.RouteEvent.EventType.ROUTE_STARTED,
			this.lastRoute_ ? this.lastRoute_ : this.activeRoute_, this.activeRoute_
		));
	}

	resolver.promise.thenAlways(function(){
		this.fulfillActiveRoute_(optReplace, optPreventEvents)
	}, this);

	goog.async.nextTick(resolver.resolve);

	return resolver.promise;
};

/**
 * @param {boolean=} optReplace
 * @param {boolean=} optPreventEvents
 * @private
 */
dj.ext.router.handlers.RouteHandler.prototype.fulfillActiveRoute_ = function(optReplace, optPreventEvents)
{
	goog.asserts.assert(this.activeRoute_, 'No active route found');

	if (!optReplace) {
		goog.asserts.assert(this.lastRoute_, 'No previous route found');
	}

	var serializedRoute = dj.ext.router.models.RouteModel.serialize(this.activeRoute_);

	if (optReplace) {
		window.history.replaceState({
			'activeRoute': serializedRoute
		}, '', this.activeRoute_.pushUrl);
	}
	else {
		window.history.pushState({
			'activeRoute': serializedRoute
		}, '', this.activeRoute_.pushUrl);
	}

	if (!goog.string.isEmpty(this.activeRoute_.title)) {
		document.title = this.activeRoute_.title;
	}

	if (!optPreventEvents) {
		this.dispatchEvent(new dj.ext.router.events.RouteEvent(
			dj.ext.router.events.RouteEvent.EventType.ROUTE_ENDED,
			this.lastRoute_ ? this.lastRoute_ : this.activeRoute_, this.activeRoute_
		));
	}

	this.lastRoute_ = this.activeRoute_;
	this.activeRoute_.active = false;
}