goog.provide('dj.ext.router.models.RouteModel');

// goog
goog.require('goog.Uri');
goog.require('goog.json');
goog.require('goog.ui.IdGenerator');

/**
 * @struct
 * @constructor
 * @param {string} uri
 * @param {string=} optTitle
 * @param {goog.structs.Map<string, string>|Object=} optParameters
 * @param {string=} optId
 */
dj.ext.router.models.RouteModel = function(uri, optTitle, optParameters, optId)
{
	/**
	 * @public
	 * @type {string}
	 */
	this.id = optId || goog.ui.IdGenerator.getInstance().getNextUniqueId();

	/**
	 * @public
	 * @type {goog.Uri}
	 */
	this.loadUrl = new goog.Uri(uri);

	/**
	 * @public
	 * @type {string}
	 */
	this.loadMethod = 'GET';

	/**
	 * @public
	 * @type {number}
	 */
	this.routeMethod = dj.ext.router.models.RouteModel.RouteMethod.DEFAULT;

	/**
	 * @public
	 * @type {string}
	 */
	this.pushUrl = goog.string.isEmptyString(this.loadUrl.getPath()) ? '/' : this.loadUrl.getPath();

	/**
	 * @public
	 * @type {string}
	 */
	this.title = optTitle || '';

	/**
	 * @public
	 * @type {goog.structs.Map<string, string>}
	 */
	this.parameters = new goog.structs.Map(optParameters || {});

	/**
	 * @public
	 * @type {boolean}
	 */
	this.active = false;
};

/**
 * @enum {number}
 */
dj.ext.router.models.RouteModel.RouteMethod = {
	DEFAULT: 1,
	INTERNAL: 2
};

/**
 * @public
 * @param {string|goog.Uri} url
 * @return {boolean}
 */
dj.ext.router.models.RouteModel.prototype.match = function(url)
{
	if (!(url instanceof goog.Uri)) {
		url = new goog.Uri(url);
	}

	return (this.loadUrl.getPath() == url.getPath() &&
		this.loadUrl.getDomain() == url.getDomain());
};

/**
 * @public
 * @return {dj.ext.router.models.RouteModel}
 */
dj.ext.router.models.RouteModel.prototype.clone = function()
{
	var route = new dj.ext.router.models.RouteModel(
		this.loadUrl.toString(), this.title, this.parameters, this.id);

	route.loadMethod = this.loadMethod;
	route.routeMethod = this.routeMethod;
	route.active = this.active;

	return route;
};

/**
 * @public
 * @return {dj.ext.router.models.RouteModel}
 */
dj.ext.router.models.RouteModel.parse = function(string)
{
	var obj = goog.json.parse(string);
	var route = new dj.ext.router.models.RouteModel(
		obj['url'], obj['title'], obj['parameters'], obj['id']
	);

	route.loadMethod = obj['loadMethod'];
	route.routeMethod = obj['routeMethod'];
	route.active = obj['active'];


	return route;
};

/**
 * @public
 * @return {string}
 */
dj.ext.router.models.RouteModel.serialize = function(route)
{
	return goog.json.serialize({
		'id': route.id,
		'url': route.loadUrl.toString(),
		'title': route.title,
		'loadMethod': route.loadMethod,
		'routeMethod': route.routeMethod,
		'parameters': route.parameters.toObject(),
		'active': route.active
	});
};