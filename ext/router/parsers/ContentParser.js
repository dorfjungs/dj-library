goog.provide('dj.ext.router.parsers.ContentParser');

// goog
goog.require('goog.asserts');

/**
 * @constructor
 * @param {Element} rootEl
 */
dj.ext.router.parsers.ContentParser = function(rootEl)
{
	/**
	 * @private
	 * @type {Element}
	 */
	this.rootElement_ = rootEl;

	/**
	 * @private
	 * @type {Array<Element>}
	 */
	this.oldContentElements_ = goog.array.slice(
		goog.dom.getChildren(this.rootElement_), 0);

	/**
	 * @private
	 * @type {Array<Element>}
	 */
	this.newContentElements_ = [];

	/**
	 * @private
	 * @type {dj.ext.router.models.ContentModel}
	 */
	this.contentModel_ = null;

	/**
	 * @private
	 * @type {boolean}
	 */
	this.canceled_ = false;

	/**
	 * @private
	 * @type {boolean}
	 */
	this.injected_ = false;

	/**
	 * @private
	 * @type {goog.structs.Map<string, Function>}
	 */
	this.replaceTasks_ = new goog.structs.Map();

	/**
	 * @private
	 * @type {Array<string>}
	 */
	this.overriddenReplaceTasks_ = [];

	/**
	 * @private
	 * @type {goog.structs.Map<string, Function>}
	 */
	this.injectTasks_ = new goog.structs.Map();

	/**
	 * @private
	 * @type {Array<string>}
	 */
	this.overriddenInjectTasks_ = [];

	/**
	 * @private
	 * @type {goog.structs.Map<string, Function>}
	 */
	this.settleTasks_ = new goog.structs.Map();

	/**
	 * @private
	 * @type {Array<string>}
	 */
	this.overriddenSettleTasks_ = [];
};

/**
 * @public
 * @param {dj.ext.router.models.ContentModel} model
 */
dj.ext.router.parsers.ContentParser.prototype.setContentModel = function(model)
{
	this.contentModel_ = model;
	this.newContentElements_ = goog.array.slice(goog.dom.getChildren(/** @type {Element} */ (this.contentModel_.fragment)), 0);
	this.hideElements_(this.newContentElements_);
};

/**
 * @private
 * @param {Array<Element>} elements
 */
dj.ext.router.parsers.ContentParser.prototype.showElements_ = function(elements)
{
	for (var i = 0, len = this.newContentElements_.length; i < len; i++) {
		goog.style.setStyle(this.newContentElements_[i], 'display', '');
	}
};

/**
 * @private
 * @param {Array<Element>} elements
 */
dj.ext.router.parsers.ContentParser.prototype.hideElements_ = function(elements)
{
	for (var i = 0, len = this.newContentElements_.length; i < len; i++) {
		goog.style.setStyle(this.newContentElements_[i], 'display', 'none');
	}
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.ext.router.parsers.ContentParser.prototype.inject = function()
{
	return new goog.Promise(function(resolve, reject){
		if (this.contentModel_) {
			if (!this.canceled_) {
				this.runInjectTasks().then(function(){
					if (!this.injected_ && !this.canceled_) {
						this.injected_ = true;
						goog.dom.insertChildAt(this.rootElement_, this.contentModel_.fragment, 0);

						goog.async.nextTick(function(){
							this.showElements_(this.newContentElements_);
							resolve();
						}, this);
					}
				}, null, this);
			}
		}
	}, this);
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.ext.router.parsers.ContentParser.prototype.replace = function()
{
	return new goog.Promise(function(resolve, reject){
		if (!this.canceled_) {
			this.runReplaceTasks().then(function(){
                if (!this.canceled_) {
                    goog.array.forEach(this.oldContentElements_, goog.dom.removeNode);
                    goog.async.nextTick(resolve);
                }
			}, null, this);
		}
	}, this);
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.ext.router.parsers.ContentParser.prototype.settle = function()
{
	return new goog.Promise(function(resolve, reject){
		if (!this.canceled_) {
			this.runSettleTasks().then(function(){
                if (!this.canceled_) {
                    goog.async.nextTick(resolve);
                }
			});
		}
	}, this);
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.ext.router.parsers.ContentParser.prototype.runReplaceTasks = function()
{
	return new goog.Promise(function(resolve, reject){
		var promises = [];

		this.replaceTasks_.forEach(function(task){
			promises.push(task(this.oldContentElements_, this.newContentElements_));
		}, this);

		goog.Promise.all(promises).then(resolve, reject);
	}, this);
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.ext.router.parsers.ContentParser.prototype.runInjectTasks = function()
{
	return new goog.Promise(function(resolve, reject){
		var promises = [];

		this.injectTasks_.forEach(function(task){
			promises.push(task(this.oldContentElements_, this.newContentElements_));
		}, this);

		goog.Promise.all(promises).then(resolve, reject);
	}, this);
};

/**
 * @public
 * @return {goog.Promise}
 */
dj.ext.router.parsers.ContentParser.prototype.runSettleTasks = function()
{
	return new goog.Promise(function(resolve, reject){
		var promises = [];

		this.settleTasks_.forEach(function(task){
			promises.push(task(this.oldContentElements_, this.newContentElements_));
		}, this);

		goog.Promise.all(promises).then(resolve, reject);
	}, this);
};

/**
 * @public
 */
dj.ext.router.parsers.ContentParser.prototype.cancel = function()
{
	this.canceled_ = true;
};

/**
 * @public
 */
dj.ext.router.parsers.ContentParser.prototype.clearTasks = function()
{
	this.injectTasks_.clear();
	this.settleTasks_.clear();
	this.replaceTasks_.clear();
	this.overriddenReplaceTasks_ = [];
	this.overriddenInjectTasks_ = [];
	this.overriddenSettleTasks_ = [];
};

/**
 * @private
 */
dj.ext.router.parsers.ContentParser.prototype.addTask_ = function(name, task, list)
{
	list.set(name, task instanceof goog.Promise ? function(){ return task; } : task);
};

/**
 * @public
 * @param {string} name
 * @param {Function|goog.Promise} task
 */
dj.ext.router.parsers.ContentParser.prototype.addReplaceTask = function(name, task)
{
	if (this.overriddenReplaceTasks_.indexOf(name) === -1) {
		this.addTask_(name, task, this.replaceTasks_);
	}
};

/**
 * @public
 * @param {string} oldName
 * @param {string} newName
 * @param {Function|goog.Promise=} optTask
 */
dj.ext.router.parsers.ContentParser.prototype.overrideReplaceTask = function(oldName, newName, optTask)
{
	this.overriddenReplaceTasks_.push(oldName);
	this.replaceTasks_.remove(oldName);

	if (optTask) {
		this.addReplaceTask(newName, optTask);
	}
};

/**
 * @public
 * @param {string} name
 * @param {Function|goog.Promise} task
 */
dj.ext.router.parsers.ContentParser.prototype.addInjectTask = function(name, task)
{
	if (this.overriddenInjectTasks_.indexOf(name) === -1) {
		this.addTask_(name, task, this.injectTasks_);
	}
};

/**
 * @public
 * @param {string} oldName
 * @param {string} newName
 * @param {Function|goog.Promise=} optTask
 */
dj.ext.router.parsers.ContentParser.prototype.overrideInjectTask = function(oldName, newName, optTask)
{
	this.overriddenInjectTasks_.push(oldName);
	this.injectTasks_.remove(oldName);

	if (optTask) {
		this.addInjectTask(newName, optTask);
	}
};

/**
 * @public
 * @param {string} name
 * @param {Function|goog.Promise} task
 */
dj.ext.router.parsers.ContentParser.prototype.addSettleTask = function(name, task)
{
	if (this.overriddenSettleTasks_.indexOf(name) === -1) {
		this.addTask_(name, task, this.settleTasks_);
	}
};

/**
 * @public
 * @param {string} oldName
 * @param {string} newName
 * @param {Function|goog.Promise=} optTask
 */
dj.ext.router.parsers.ContentParser.prototype.overrideSettleTask = function(oldName, newName, optTask)
{
	this.overriddenSettleTasks_.push(oldName);
	this.settleTasks_.remove(oldName);

	if (optTask) {
		this.addSettleTask(newName, optTask);
	}
};