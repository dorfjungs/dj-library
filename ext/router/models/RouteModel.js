goog.provide('dj.ext.router.models.RouteModel');

// goog
goog.require('goog.Uri');
goog.require('goog.ui.IdGenerator');

// dj
goog.require('dj.ext.utils.map');

/**
 * @struct
 * @constructor
 * @param {string} uri
 * @param {string=} optTitle
 * @param {Map<string, string>|Object=} optParameters
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
     * @type {dj.ext.router.models.RouteModel}
     */
    this.parent = null;

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
	this.pushUrl = dj.ext.router.models.RouteModel.getPushUrl(this.loadUrl);

	/**
	 * @public
	 * @type {string}
	 */
	this.title = optTitle || '';

	/**
	 * @public
	 * @type {Map<string, string>}
	 */
	this.parameters = dj.ext.utils.map.create(optParameters);

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
    INTERNAL: 2,
    EXTERNAL: 3
};

/**
 * @public
 * @param {string|goog.Uri|dj.ext.router.models.RouteModel} url
 * @return {boolean}
 */
dj.ext.router.models.RouteModel.prototype.match = function(url)
{
    if (url instanceof dj.ext.router.models.RouteModel) {
        url = url.loadUrl;
    }
    else if (goog.typeOf(url) == 'string') {
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

    route.parent = this.parent;
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
	var obj = JSON.parse(string);
	var route = new dj.ext.router.models.RouteModel(
		obj['url'], obj['title'], obj['parameters'], obj['id']
	);

    route.parent = obj['parent'] ? dj.ext.router.models.RouteModel.parse(obj['parent']) : null;
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
	return JSON.stringify({
		'id': route.id,
		'url': route.loadUrl.toString(),
        'parent': route.parent ? dj.ext.router.models.RouteModel.serialize(route.parent) : null,
		'title': route.title,
		'loadMethod': route.loadMethod,
		'routeMethod': route.routeMethod,
		'parameters': dj.ext.utils.map.toObject(route.parameters),
		'active': route.active
	});
};


/**
 * @public
 * @param {goog.Uri} loadUrl
 * @return {string}
 */
dj.ext.router.models.RouteModel.getPushUrl = function(loadUrl)
{
	var pushUrl;
	if (goog.string.isEmptyString(loadUrl.getPath())) {
		pushUrl = '/';
	}
	else {
		pushUrl = loadUrl.getPath();
	}

	var queryData = loadUrl.getQueryData();
	queryData.remove('ajax');
	var queryString = queryData.toDecodedString();
	if (queryString != '') {
		pushUrl = pushUrl + '?' + queryString;
	}

	return pushUrl
};