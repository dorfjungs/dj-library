goog.provide('dj.ext.router.Router');

// goog
goog.require('goog.dom.dataset');
goog.require('goog.events.EventHandler');

// dj
goog.require('dj.ext.router.handlers.RouteHandler');
goog.require('dj.ext.router.handlers.ContentHandler');
goog.require('dj.ext.router.models.RouteModel');
goog.require('dj.ext.router.models.ContentModel');

/**
 * @constructor
 * @param {Object=} optRouteParameters
 */
dj.ext.router.Router = function(optRouteParameters)
{
	/**
	 * @private
	 * @type {goog.events.EventHandler}
	 */
	this.eventHandler_ = new goog.events.EventHandler(this);

	/**
	 * @private
	 * @type {dj.ext.router.handlers.RouteHandler}
	 */
	this.routeHandler_ = new dj.ext.router.handlers.RouteHandler();

	/**
	 * @private
	 * @type {dj.ext.router.handlers.ContentHandler}
	 */
	this.contentHandler_ = new dj.ext.router.handlers.ContentHandler();

	/**
	 * @private
	 * @type {goog.structs.Map<string, Element>}
	 */
	this.routeElements_ = new goog.structs.Map();

    /**
     * @private
     * @type {goog.structs.Map<string, Array<goog.events.Key>>}
     */
    this.routeListenerKeys_ = new goog.structs.Map();

    /**
     * @private
     * @type {goog.structs.Map<string, string>}
     */
    this.routeParameters_ = new goog.structs.Map(optRouteParameters || {});

    /**
     * @private
     * @type {dj.ext.router.models.RouteModel}
     */
    this.lastContentRoute_ = null;

    /**
     * @private
     * @type {Array<dj.ext.router.transitions.AbstractTransition>}
     */
    this.transitions_ = [];

    /**
     * @private
     * @type {Array<dj.ext.router.models.RouteModel>}
     */
    this.routes_ = [];
};

/**
 * @public
 */
dj.ext.router.Router.prototype.start = function()
{
	this.routeHandler_.init();
	this.eventHandler_.listen(this.routeHandler_, dj.ext.router.events.RouteEvent.EventType.ROUTE_STARTED, this.handleRouteStart_);
	this.eventHandler_.listen(this.routeHandler_, dj.ext.router.events.RouteEvent.EventType.ROUTE_ENDED, this.handleRouteEnd_);
};

/**
 * @public
 */
dj.ext.router.Router.prototype.stop = function()
{
	this.routeHandler_.deinit();
	this.eventHandler_.unlisten(this.routeHandler_, dj.ext.router.events.RouteEvent.EventType.ROUTE_STARTED, this.handleRouteStart_);
	this.eventHandler_.unlisten(this.routeHandler_, dj.ext.router.events.RouteEvent.EventType.ROUTE_ENDED, this.handleRouteEnd_);
};

/**
 * @public
 * @param {string} namespace
 * @param {Function} ctor
 * @return {dj.ext.router.transitions.AbstractTransition}
 */
dj.ext.router.Router.prototype.addTransition = function(namespace, ctor)
{
	for (var i = 0, len = this.transitions_.length; i < len; i++) {
		if (this.transitions_[i] instanceof ctor) {
			throw new Error('This transition is already active');
		}
	}

	var transition = new ctor(this, namespace);

	goog.asserts.assert(transition instanceof dj.ext.router.transitions.AbstractTransition,
		"Invalid transition");

	transition.init();
	this.transitions_.push(transition);

	return transition;
};

/**
 * @public
 * @param {Function} ctor
 * @return {dj.ext.router.transitions.AbstractTransition}
 */
dj.ext.router.Router.prototype.getTransition = function(ctor)
{
	for (var i = 0, len = this.transitions_.length; i < len; i++) {
		if (this.transitions_[i] instanceof ctor) {
			return this.transitions_[i];
		}
	}

	return null;
};

/**
 * @public
 * @param {string} url
 * @param {string} title
 */
dj.ext.router.Router.prototype.registerTitle = function(url, title)
{
    this.routeHandler_.registerTitle(url, title);
};

/**
 * @public
 * @param {Element} element
 */
dj.ext.router.Router.prototype.setContentOutlet = function(element)
{
	this.contentHandler_.setOutletElement(element);
};

/**
 * @public
 * @return {Element}
 */
dj.ext.router.Router.prototype.getContentOutlet = function()
{
    return this.contentHandler_.getOutletElement();
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} fromRoute
 * @param {dj.ext.router.models.RouteModel} toRoute
 * @return {boolean}
 */
dj.ext.router.Router.prototype.isExternal = function(fromRoute, toRoute)
{
    if (toRoute.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL && !toRoute.parent) {
        throw new Error('The external route needs a parent route');
    }

    if (fromRoute.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL && !fromRoute.parent) {
        throw new Error('The external route needs a parent route');
    }

    if (fromRoute.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL &&
        toRoute.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL) {
        return true;
    }

    if (fromRoute.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL ||
        toRoute.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL) {
        if (toRoute.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL) {
            if (fromRoute.match(toRoute.parent)) {
                return true;
            }
        }

        if (fromRoute.routeMethod == dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL) {
            if (toRoute.match(fromRoute.parent)) {
                return true;
            }
        }
    }

    return false;
};

/**
 * @private
 * @param {dj.ext.router.events.RouteEvent} event
 */
dj.ext.router.Router.prototype.handleRouteStart_ = function(event)
{
    if ( ! this.isExternal(event.fromRoute, event.toRoute)) {
        goog.async.nextTick(function(){
            this.contentHandler_.load(
                event.toRoute.loadUrl.toString(),
                event.fromRoute, event.toRoute
            );
        }, this);
    }
};

/**
 * @private
 * @param {dj.ext.router.events.RouteEvent} event
 */
dj.ext.router.Router.prototype.handleRouteEnd_ = function(event)
{
    if ( ! this.isExternal(event.fromRoute, event.toRoute)) {
        goog.async.nextTick(function(){
        	this.contentHandler_.loaded().then(function(){
        		this.contentHandler_.parse(event.fromRoute, event.toRoute);
        	}, null, this);
        }, this);
    }
    else {
        this.lastContentRoute_ = event.toRoute;
    }
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @param {boolean=} optPreventEvents
 * @return {goog.Promise}
 */
dj.ext.router.Router.prototype.setRoute = function(route, optPreventEvents)
{
	return this.routeHandler_.enableRoute(route, true, optPreventEvents,
        dj.ext.router.events.RouteEvent.TriggerType.PROGRAMMATICALLY);
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @return {goog.Promise}
 */
dj.ext.router.Router.prototype.navigate = function(route)
{
	return this.routeHandler_.enableRoute(route, false, false,
        dj.ext.router.events.RouteEvent.TriggerType.PROGRAMMATICALLY);
};

/**
 * @public
 * @param {string} url
 * @param {string=} optTitle
 * @param {Object=} optParameters
 * @return {goog.Promise}
 */
dj.ext.router.Router.prototype.navigateByUrl = function(url, optTitle, optParameters)
{
	const route = this.getRouteByUrl(url) || this.createRoute(url, optTitle, optParameters);

	return this.navigate(route);
};

/**
 * @public
 * @return {dj.ext.router.handlers.RouteHandler}
 */
dj.ext.router.Router.prototype.getRouteHandler = function()
{
	return this.routeHandler_;
};

/**
 * @public
 * @return {dj.ext.router.handlers.ContentHandler}
 */
dj.ext.router.Router.prototype.getContentHandler = function()
{
	return this.contentHandler_;
};

/**
 * @public
 * @return {dj.ext.router.models.RouteModel}
 */
dj.ext.router.Router.prototype.getActiveRoute = function()
{
    return this.routeHandler_.getActiveRoute();
};

/**
 * @public
 * @param {string} url
 * @return {dj.ext.router.models.RouteModel}
 */
dj.ext.router.Router.prototype.getRouteByUrl = function(url)
{
	for (var i = 0, len = this.routes_.length; i < len; i++) {
		var route = this.routes_[i];

		if (route.match(url)) {
			return route;
		}
	}

	return null;
};

/**
 * @public
 * @param {string} id
 * @return {dj.ext.router.models.RouteModel}
 */
dj.ext.router.Router.prototype.getRouteById = function(id)
{
	for (var i = 0, len = this.routes_.length; i < len; i++) {
		if (this.routes_[i].id == id) {
			return this.routes_[i];
		}
	}

	return null;
};

/**
 * @public
 * @param {Array<Element>} elements
 */
dj.ext.router.Router.prototype.addRoutesByElements = function(elements)
{
	for (var i = 0, len = elements.length; i < len; i++) {
        this.addRouteByElement(elements[i]);
	}
};

/**
 * Remove routes related to route elements which arent't in the dom anymore
 *
 * @public
 * @param {Element=} optScope
 */
dj.ext.router.Router.prototype.cleanRoutes = function(optScope)
{
	this.routeElements_.forEach(function(element, id){
        var route = this.getRouteById(id);

        this.removeRouteListener_(route);
        this.routeElements_.remove(id);
		goog.array.remove(this.routes_, route);
	}, this);
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 */
dj.ext.router.Router.prototype.addRoute = function(route)
{
	var queryData = route.loadUrl.getQueryData();

	this.routeParameters_.forEach(function(value, key){
		queryData.add(key, value);
	});

	this.addRouteListener_(route);
	this.routes_.push(route);
};

/**
 * @public
 * @param {Element} element
 */
dj.ext.router.Router.prototype.addRouteByElement = function(element)
{
	var params = goog.dom.dataset.get(element, 'parameters');
	var route = new dj.ext.router.models.RouteModel(
		this.getRouteUrlByElement_(element),
		goog.dom.dataset.get(element, 'title') || '',
		params ? goog.json.parse(params) : null
	);

	if (goog.dom.dataset.has(element, 'loadMethod')) {
		route.loadMethod = /** @type {string} */ (goog.dom.dataset.get(element, 'loadMethod'));
	}

	if (goog.dom.dataset.has(element, 'routeMethod')) {
		var routeMethod = goog.dom.dataset.get(element, 'routeMethod');

		switch (routeMethod) {
			case 'internal':
				route.routeMethod = dj.ext.router.models.RouteModel.RouteMethod.INTERNAL;
				break;

            case 'external':
                route.routeMethod = dj.ext.router.models.RouteModel.RouteMethod.EXTERNAL;
		}
	}

	this.routeElements_.set(route.id, element);
    this.addRoute(route);
};

/**
 * @public
 * @param {string} url
 * @param {string=} optTitle
 * @param {Object=} optParameters
 * @return {dj.ext.router.models.RouteModel}
 */
dj.ext.router.Router.prototype.createRoute = function(url, optTitle, optParameters)
{
	var route = new dj.ext.router.models.RouteModel(url, optTitle, optParameters);
	var queryData = route.loadUrl.getQueryData();

	this.routeParameters_.forEach(function(value, key){
		queryData.add(key, value);
	});

	return route;
};

/**
 * @private
 * @param {Element} element
 * @return {string}
 */
dj.ext.router.Router.prototype.getRouteUrlByElement_ = function(element)
{
	switch (element.tagName.toLowerCase()) {
		case 'a':
			return element.getAttribute('href');
			break;
	}

	return '';
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @return {Element}
 */
dj.ext.router.Router.prototype.getRouteElement = function(route)
{
	return this.routeElements_.get(route.id);
};

/**
 * @private
 * @param {dj.ext.router.models.RouteModel} route
 * @param {goog.events.Key} key
 */
dj.ext.router.Router.prototype.addRouteListenerKey_ = function(route, key)
{
    if (this.routeListenerKeys_.containsKey(route.id)) {
        this.routeListenerKeys_.get(route.id).push(key);
    }
    else {
        this.routeListenerKeys_.set(route.id, [key]);
    }
};

/**
 * @private
 * @param {dj.ext.router.models.RouteModel} route
 * @param {goog.events.Key} key
 */
dj.ext.router.Router.prototype.removeRouteListenerKey_ = function(route, key)
{
    if (this.routeListenerKeys_.containsKey(route.id)) {
        goog.array.remove(this.routeListenerKeys_.get(route.id), key);
    }
};

/**
 * @private
 * @param {dj.ext.router.models.RouteModel} route
 */
dj.ext.router.Router.prototype.addRouteListener_ = function(route)
{
    if (this.routeElements_.containsKey(route.id)) {
		var element = this.routeElements_.get(route.id);
		var listenerKey = goog.events.listen(element, goog.events.EventType.CLICK,
			this.handleRouteElementClick_.bind(this, route), false);

        this.addRouteListenerKey_(route, listenerKey);
	}
};

/**
 * @private
 * @param {dj.ext.router.models.RouteModel} route
 */
dj.ext.router.Router.prototype.removeRouteListener_ = function(route)
{
    if (this.routeElements_.containsKey(route.id)) {
        var element = this.routeElements_.get(route.id);
        var listenerKeys = this.routeListenerKeys_.get(route.id);

        if (listenerKeys) {
            for (var i = 0, len = listenerKeys.length; i < len; i++) {
                goog.events.unlistenByKey(listenerKeys[i]);
                this.removeRouteListenerKey_(route, listenerKeys[i]);
            }
        }
    }
};

/**
 * @private
 * @param {dj.ext.router.models.RouteModel} route
 * @param {goog.events.BrowserEvent} event
 */
dj.ext.router.Router.prototype.handleRouteElementClick_ = function(route, event)
{
    event.preventDefault();
    this.navigate(route);
};