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
goog.require('dj.ext.router.registry.TitleRegistry');

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
     * @type {dj.ext.router.registry.TitleRegistry}
     */
    this.titles_ = new dj.ext.router.registry.TitleRegistry();

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

    /**
     * @private
     * @type {number}
     */
    this.collision_ = dj.ext.router.handlers.RouteHandler.RouteCollision.BLOCK;
};

goog.inherits(
	dj.ext.router.handlers.RouteHandler,
	goog.events.EventTarget
);

/**
 * @enum {number}
 */
dj.ext.router.handlers.RouteHandler.RouteCollision = {
    BLOCK: 1,
    ALLOW: 2
};

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
 * @public
 * @param {string} url
 * @param {string} title
 */
dj.ext.router.handlers.RouteHandler.prototype.registerTitle = function(url, title)
{
    this.titles_.register(url, title);
};

/**
 * @param {goog.events.BrowserEvent} event
 * @private
 */
dj.ext.router.handlers.RouteHandler.prototype.handlePopState_ = function(event)
{
	if (event.state && event.state.hasOwnProperty('activeRoute')) {
		var activeRoute = dj.ext.router.models.RouteModel.parse(event.state['activeRoute']);

		this.enableRoute(activeRoute, true, false, dj.ext.router.events.RouteEvent.TriggerType.USER);
	}
};

/**
 * @public
 * @param {number} collision
 */
dj.ext.router.handlers.RouteHandler.prototype.setRouteCollision = function(collision)
{
    this.collision_ = collision;
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @param {boolean=} optReplace
 * @param {boolean=} optPreventEvents Preventing generic events (excluding the first route event)
 * @param {number=} optTriggerType
 * @return {goog.Promise}
 */
dj.ext.router.handlers.RouteHandler.prototype.enableRoute = function(route, optReplace, optPreventEvents, optTriggerType)
{
    if (this.collision_ == dj.ext.router.handlers.RouteHandler.RouteCollision.BLOCK) {
        if (this.activeRoute_ &&
            this.activeRoute_.match(route.loadUrl) &&
            this.activeRoute_.routeMethod == route.routeMethod) {
            return goog.Promise.resolve();
        }
    }

	if (this.activeRoute_ && this.activeRoute_.active) {
		if (optReplace) {
			this.activeRoute_.active = false;
		}
		else {
			return goog.Promise.resolve();
		}
	}

	var resolver = goog.Promise.withResolver();
    var firstRoute = this.activeRoute_ == null;

	this.activeRoute_ = route;
	this.activeRoute_.active = true;

    if (firstRoute) {
        this.dispatchEvent(new dj.ext.router.events.RouteEvent(
            dj.ext.router.events.RouteEvent.EventType.ROUTE_FIRST,
            this.lastRoute_ ? this.lastRoute_ : this.activeRoute_, this.activeRoute_,
            optTriggerType || dj.ext.router.events.RouteEvent.TriggerType.PROGRAMMATICALLY
        ));
    }

	if (!optPreventEvents) {
		this.dispatchEvent(new dj.ext.router.events.RouteEvent(
			dj.ext.router.events.RouteEvent.EventType.ROUTE_STARTED,
			this.lastRoute_ ? this.lastRoute_ : this.activeRoute_, this.activeRoute_,
            optTriggerType || dj.ext.router.events.RouteEvent.TriggerType.PROGRAMMATICALLY
		));
	}

	resolver.promise.thenAlways(function(){
		this.fulfillActiveRoute_(optReplace, optPreventEvents, optTriggerType)
	}, this);

	goog.async.nextTick(resolver.resolve);

	return resolver.promise;
};

/**
 * @private
 * @param {boolean=} optReplace
 * @param {boolean=} optPreventEvents
 * @param {number=} optTriggerType
 */
dj.ext.router.handlers.RouteHandler.prototype.fulfillActiveRoute_ = function(optReplace, optPreventEvents, optTriggerType)
{
	goog.asserts.assert(this.activeRoute_, 'No active route found');

	var serializedRoute = dj.ext.router.models.RouteModel.serialize(this.activeRoute_);

	if (this.activeRoute_.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.DEFAULT ||
        this.activeRoute_.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL) {
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
	}

	if (!goog.string.isEmptyOrWhitespace(this.activeRoute_.title)) {
		document.title = this.activeRoute_.title;
	}
    else if (this.titles_.match(this.activeRoute_)) {
        document.title = this.titles_.getTitle(this.activeRoute_);
    }
    else if (this.activeRoute_.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL) {
        if (this.titles_.match(this.activeRoute_.parent)) {
            document.title = this.titles_.getTitle(this.activeRoute_.parent);
        }
    }

	if (!optPreventEvents) {
		this.dispatchEvent(new dj.ext.router.events.RouteEvent(
			dj.ext.router.events.RouteEvent.EventType.ROUTE_ENDED,
			this.lastRoute_ ? this.lastRoute_ : this.activeRoute_, this.activeRoute_,
            optTriggerType || dj.ext.router.events.RouteEvent.TriggerType.PROGRAMMATICALLY
		));
	}

	this.lastRoute_ = this.activeRoute_;
	this.activeRoute_.active = false;
};

/**
 * @public
 * @return {dj.ext.router.models.RouteModel}
 */
dj.ext.router.handlers.RouteHandler.prototype.getActiveRoute = function()
{
    return this.activeRoute_;
};