goog.provide('dj.ext.router.Router');

// goog
goog.require('goog.dom.dataset');
goog.require('goog.events.EventHandler');

// dj.ext
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
	 * @type {goog.structs.Map<string, string>}
	 */
	this.routeParameters_ = new goog.structs.Map(optRouteParameters || {});

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
 * @param {Element} element
 */
dj.ext.router.Router.prototype.setContentOutlet = function(element)
{
	this.contentHandler_.setOutletElement(element);
};

/**
 * @private
 * @param {dj.ext.router.events.RouteEvent} event
 */
dj.ext.router.Router.prototype.handleRouteStart_ = function(event)
{
    goog.async.nextTick(function(){
    	this.contentHandler_.load(
    		event.toRoute.loadUrl.toString(),
    		event.fromRoute, event.toRoute
    	);
    }, this);
};

/**
 * @private
 * @param {dj.ext.router.events.RouteEvent} event
 */
dj.ext.router.Router.prototype.handleRouteEnd_ = function(event)
{
    goog.async.nextTick(function(){
    	this.contentHandler_.loaded().then(function(){
    		this.contentHandler_.parse(event.fromRoute, event.toRoute);
    	}, null, this);
    }, this);
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @param {boolean=} optPreventEvents
 * @return {goog.Promise}
 */
dj.ext.router.Router.prototype.setRoute = function(route, optPreventEvents)
{
	return this.routeHandler_.enableRoute(route, true, optPreventEvents);
};

/**
 * @public
 * @param {dj.ext.router.models.RouteModel} route
 * @return {goog.Promise}
 */
dj.ext.router.Router.prototype.navigate = function(route)
{
	return this.routeHandler_.enableRoute(route);
};

/**
 * @public
 * @param {string} url
 * @return {goog.Promise}
 */
dj.ext.router.Router.prototype.navigateByUrl = function(url)
{
	return this.navigate(this.getRouteByUrl(url));
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
		if (!goog.dom.contains(optScope || document.documentElement, element)) {
			this.routeElements_.remove(id);
			goog.array.remove(this.routes_, this.getRouteById(id));
		}
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
	var queryData = route.loadUrl.getQueryData();

	if (goog.dom.dataset.has(element, 'loadMethod')) {
		route.loadMethod = goog.dom.dataset.get(element, 'loadMethod');
	}

	if (goog.dom.dataset.has(element, 'routeMethod')) {
		var routeMethod = goog.dom.dataset.get(element, 'routeMethod');

		switch (routeMethod) {
			case 'internal':
				route.routeMethod = dj.ext.router.models.RouteModel.RouteMethod.INTERNAL;
				break;
		}
	}

	this.routeParameters_.forEach(function(value, key){
		queryData.add(key, value);
	});

	this.routeElements_.set(route.id, element);
	this.addRouteListener_(route);
	this.routes_.push(route);
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
 */
dj.ext.router.Router.prototype.addRouteListener_ = function(route)
{
	if (this.routeElements_.containsKey(route.id)) {
		var element = this.routeElements_.get(route.id);

		goog.events.listen(element, goog.events.EventType.CLICK,
			function(route, event){
				event.preventDefault();
				this.navigate(route);
			}.bind(this, route),
			false, this
		);
	}
};