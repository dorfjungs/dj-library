goog.provide('dj.ext.router.models.config.ComponentConfig');

// dj
goog.require('dj.sys.models.config.AbstractConfigModel');

// dj.ext.router
goog.require('dj.ext.router.Router');

/**
 * @constructor
 * @param {dj.ext.router.Router} router
 * @extends {dj.sys.models.config.AbstractConfigModel}
 */
dj.ext.router.models.config.ComponentConfig = function(router)
{
	dj.ext.router.models.config.ComponentConfig.base(this, 'constructor');

	/**
	 * @public
	 * @type {dj.ext.router.Router}
	 */
	this.router = router;
};

goog.inherits(
	dj.ext.router.models.config.ComponentConfig,
	dj.sys.models.config.AbstractConfigModel
);