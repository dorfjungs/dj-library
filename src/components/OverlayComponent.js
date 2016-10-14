goog.provide('dj.components.OverlayComponent');

// dj
goog.require('dj.components.BaseComponent');
goog.require('dj.models.OverlayModel');
goog.require('dj.async.ImagePreloader');
goog.require('dj.managers.ComponentManager');
goog.require('dj.async.VideoPreloader');

// goog
goog.require('goog.events');
goog.require('goog.dom');
goog.require('goog.dom.dataset');
goog.require('goog.dom.classlist');
goog.require('goog.net.XhrIo');
goog.require('goog.math');
goog.require('goog.Promise');
goog.require('goog.math.Coordinate');
goog.require('goog.async.nextTick');
goog.require('goog.Uri.QueryData');

/**
 * This component collects all overlays below
 * and tries to render them in one defined
 * element. All overlays will be loaded
 * via XHR and if a layer was loaded
 * the content will be cached in the
 * own model
 *
 * @constructor
 * @extends {dj.components.BaseComponent}
 * @param {dj.managers.ComponentManager} manager
 */
dj.components.OverlayComponent = function(manager)
{
    goog.base(this, manager);

    /**
     * All triggers which want to
     * call the overlay
     *
     * @private
     * @type {Array.<dj.models.OverlayModel>}
     */
    this.overlays_ = [];

    /**
     * The layer element to open
     * on each request from the
     * trigger
     *
     * @private
     * @type {Element}
     */
    this.layer_ = null;

    /**
     * The Close button of
     * the layer element
     *
     * @private
     * @type {Element}
     */
    this.closeBtn_ = null;

    /**
     * The content element
     * of the layer element
     *
     * @private
     * @type {Element}
     */
    this.layerContent_ = null;

    /**
     * The xhr service to use
     * for loading the content
     * for each overlay model
     *
     * @private
     * @type {goog.net.XhrIo}
     */
    this.layerXhr_ = new goog.net.XhrIo();

    /**
     * Saves the last model used
     * Only check if this is not
     * empty before using it
     *
     * @private
     * @type {dj.models.OverlayModel}
     */
    this.lastModel_ = null;

    /**
     * The default location used to replace
     * the state to this url if the layer
     * was closed
     *
     * @private
     * @type {string}
     */
    this.defaultLocation_ = location.href;

    /**
     * @private
     * @type {Function}
     */
    this.openResolve_ = null;

    /**
     * @private
     * @type {string}
     */
    this.classes_ = '';

    /**
     * @private
     * @type {dj.async.VideoPreloader}
     */
    this.videoPreloader_ = new dj.async.VideoPreloader();
};

goog.inherits(
    dj.components.OverlayComponent,
    dj.components.BaseComponent
);

/**
 * This identifier is used to
 * get all the triggers under this
 * element and saves them as model
 * with some options
 *
 * @const
 * @type {string}
 */
dj.components.OverlayComponent.TRIGGER_IDENTIFIER = 'overlay-trigger';

/**
 * The class which will be set on
 * the layer element after a layer
 * open function was called
 *
 * @private
 * @type {string}
 */
dj.components.OverlayComponent.prototype.activeClass_ = 'visible';

/**
 * The class will be set before
 * the xhr request is going to be send
 *
 * @private
 * @type {string}
 */
dj.components.OverlayComponent.prototype.loadingClass_ = 'loading';

/**
 * The class set after the
 * xhr request did finished
 * loading and the content
 * was placed in the layer
 *
 * @private
 * @type {string}
 */
dj.components.OverlayComponent.prototype.loadedClass_ = 'loaded';

/**
 * This class will be set on the
 * html element to prvent the
 * scrolling while a layer
 * was opened
 *
 * @private
 * @type {string}
 */
dj.components.OverlayComponent.prototype.noScrollClass_ = 'scrolling-disabled';

/** @inheritDoc */
dj.components.OverlayComponent.prototype.init = function()
{
	return new goog.Promise(function(resolve, reject){
	    /**
	     * Get the domhelper for a
	     * better performance while
	     * creating elements
	     */

	    var domHelper = goog.dom.getDomHelper();

        /**
         * Get addiitonal classes
         */

        this.classes_ = goog.dom.dataset.get(this.getElement(), 'classes') || '';

	    /**
	     * Create initial layer element
	     */

        this.closeBtn_ = domHelper.createDom('div', 'main-overlay-close main-close-btn fa fa-times');
	    this.layer_ = domHelper.createDom('div', 'main-overlay ' + this.classes_, [
	        this.layerContent_ = domHelper.createDom('div', 'main-overlay-content')
	    ]);

	    /**
	     * Add layer element at the last
	     * position under the body element
	     * so it will lay over the elements
	     * above (if no z-index was set)
	     */

	    goog.dom.appendChild(goog.dom.getDocument().body, this.layer_);

         /**
          * Colllect triggers
          * with the identifier
          */
        goog.array.forEach(this.getElementsByClass(dj.components.OverlayComponent.TRIGGER_IDENTIFIER),
            this.addOverlay, this);

	    /**
	     * Resolve async
	     */
	    goog.async.nextTick(function(){
	    	resolve();
	    });
    }, this);
};

/** @inheritDoc */
dj.components.OverlayComponent.prototype.enterComponent = function()
{
	goog.base(this, 'enterComponent');

    /**
     * Listen for the layer
     * xhr response (success)
     */

    this.getHandler().listen(this.layerXhr_, goog.net.EventType.SUCCESS,
        this.handleLayerXhrSuccess_);

    /**
     * Listen for the close click
     */

    if (this.closeBtn_) {
        this.getHandler().listen(this.closeBtn_, goog.events.EventType.CLICK,
            this.handleCloseBtnClick_);
    }
};

/**
 * @param {Element} trigger
 */
dj.components.OverlayComponent.prototype.addOverlay = function(trigger)
{
    /**
     * Create a model with the given
     * trigger and add it to the overlay
     * list
     */

    this.overlays_.push(this.createModel_(trigger));

    /**
     * Add listener to open the
     * layer with the config from the
     * trigger
     */

    this.getHandler().listen(trigger, goog.events.EventType.CLICK,
        this.handleTriggerClick_);
};

/**
 * @param {dj.models.OverlayModel} model
 */
dj.components.OverlayComponent.prototype.addModel = function(model)
{
    this.overlays_.push(model);
};

/**
 * @private
 * @param  {Element} trigger
 * @return {dj.models.OverlayModel}
 */
dj.components.OverlayComponent.prototype.createModel_ = function(trigger)
{
    var parameters = goog.json.parse(goog.dom.dataset.get(trigger, 'parameters') || null);

    if (parameters) {
        parameters = new goog.structs.Map(parameters);
    }

    return new dj.models.OverlayModel(trigger,
        /** @type {string} */ (goog.dom.dataset.get(trigger, 'href')),
        trigger.getAttribute('href'),
        /** @type {string|undefined} */ (goog.dom.dataset.get(trigger, 'pushstate')),
        /** @type {string|undefined} */ (goog.dom.dataset.get(trigger, 'jumpback')),
        parameters
    );
};

/**
 * @private
 * @param  {Element} trigger
 * @return {dj.models.OverlayModel}
 */
dj.components.OverlayComponent.prototype.getModelByTrigger_ = function(trigger)
{
    for (var i = 0, len = this.overlays_.length; i < len; i++) {
        if (this.overlays_[i].getTrigger() == trigger) {
            return this.overlays_[i];
        }
    }

    return null;
};

/**
 * @param {Element} trigger
 * @return {dj.models.OverlayModel}
 */
dj.components.OverlayComponent.prototype.getModelByTrigger = function(trigger)
{
    return this.getModelByTrigger_(trigger);
};

/**
 * @private
 * @param  {string} url
 * @return {dj.models.OverlayModel}
 */
dj.components.OverlayComponent.prototype.getModelByUrl_ = function(url)
{
    for (var i = 0, len = this.overlays_.length; i < len; i++) {
        if (this.overlays_[i].getUrl() == url) {
            return this.overlays_[i];
        }
    }

    return null;
};

/**
 * @private
 * @param {goog.events.BrowserEvent} event
 */
dj.components.OverlayComponent.prototype.handleCloseBtnClick_ = function(event)
{
    this.close();
};

/**
 *
 */
dj.components.OverlayComponent.prototype.close = function()
{
    if (this.lastModel_) {
        this.resetHistoryState_();
        this.enableLayer_(false);

        /**
         * Scroll back to the position
         * of the trigger, so the scroll
         * position won't stuck on 0 (top)
         */

        if (this.lastModel_.getAllowJumpback()) {
            goog.Timer.callOnce(function(){
                this.scrollToModel_(this.lastModel_);
            }, 0, this);
        }
    }
};

/**
 * @return {Element}
 */
dj.components.OverlayComponent.prototype.getLayerElement = function()
{
    return this.layer_;
};

/**
 * @private
 * @param {dj.models.OverlayModel} model
 */
dj.components.OverlayComponent.prototype.scrollToModel_ = function(model)
{
    if (model && model.getTrigger()) {
        var offset = goog.style.getPageOffset(model.getTrigger());
        goog.dom.getWindow()['scrollTo'](offset.x, offset.y);
    }
};

/**
 * @private
 * @param {boolean} isActive
 */
dj.components.OverlayComponent.prototype.enableLayer_ = function(isActive)
{
    goog.dom.classlist.enable(this.layer_, this.activeClass_, isActive);
    goog.dom.classlist.enable(goog.dom.getDocument()['documentElement'], this.noScrollClass_, isActive);
};

/**
 * @private
 * @param {goog.events.BrowserEvent} event
 */
dj.components.OverlayComponent.prototype.handleTriggerClick_ = function(event)
{
    event.preventDefault();
    event.stopPropagation();

    /**
     * Open the layer with the model and
     * load the required informations
     */

    this.openWithModel_(
        this.getModelByTrigger_(/** @type {Element} */ (event.currentTarget))
    );
};

/**
 * This replaces the current history
 * state with an empty object, no title
 * and the given url (No new history
 * will be set)
 *
 * @private
 * @param {string} url
 */
dj.components.OverlayComponent.prototype.historyReplaceState_ = function(url)
{
    var win = goog.dom.getWindow();

    if (win.hasOwnProperty('history') && typeof win['history']['replaceState'] == 'function') {
        win['history']['replaceState']({}, '', url);
    }
};

/**
 * @private
 * @param {dj.models.OverlayModel} model
 */
dj.components.OverlayComponent.prototype.setHistoryByModel_ = function(model)
{
    if (model.hasPushStateUrl() && model.getAllowPushState()) {
        this.historyReplaceState_(model.getPushStateUrl() + location.search);
    }
};

/**
 * @private
 */
dj.components.OverlayComponent.prototype.resetHistoryState_ = function()
{
    this.historyReplaceState_(this.defaultLocation_);
};

/**
 * @param {dj.models.OverlayModel} model
 * @param {boolean=} optForceReload
 * @param {goog.structs.Map<string, string>=} optContent
 * @return {goog.Promise}
 */
dj.components.OverlayComponent.prototype.open = function(model, optContent, optForceReload)
{
    return this.openWithModel_(model, optContent, optForceReload);
};

/**
 * @private
 * @param {dj.models.OverlayModel} model
 * @param {boolean=} optForceReload
 * @param {goog.structs.Map<string, string>=} optContent
 * @return {goog.Promise}
 */
dj.components.OverlayComponent.prototype.openWithModel_ = function(model, optContent, optForceReload)
{
    if ( ! model) {
        return goog.Promise.reject();
    }

    /**
     * Save scroll position
     * before doing anything
     */

    this.scrollPosition_ = goog.dom.getDocumentScroll();

    /**
     * Save this model for
     * further use
     */

    this.lastModel_ = model;

    /**
     * Clear old content
     */

    goog.dom.setTextContent(this.layerContent_, '');

    /**
     * Set loading class for
     * the layer and remove previous
     * loaded class
     */

    goog.dom.classlist.enable(this.layer_, this.loadedClass_, false);
    goog.dom.classlist.enable(this.layer_, this.loadingClass_, true);

    /**
     * Set active classes
     */

    this.enableLayer_(true);

    /**
     * Set push state url
     * with the model given
     */

    this.setHistoryByModel_(model);

    /**
     * Check if the layer was already
     * opened - if so we take the cached
     * content to display it again without
     * reloading the whole page
     */

    var forceReload = optForceReload || false;
    var queryData = goog.Uri.QueryData.createFromMap(
        /** @type {!goog.structs.Map<string, ?>} */ (optContent || model.getParameters())
    );

    return new goog.Promise(function(resolve, reject){
        this.openResolve_ = resolve;

        if (model.hasContent() && !forceReload) {
            this.parseLayerContent_(model.getContent());

            goog.async.nextTick(this.openResolve_);
            this.openResolve_ = null;
        }
        else {
            if ( ! this.layerXhr_.isActive()) {
                /**
                 * Send xhr request with
                 * relevant informations
                 * from the given model
                 */

                var url = model.getUrl();

                if ( ! queryData.isEmpty()) {
                    url += '?' + queryData.toString();
                }

                this.layerXhr_.send(url , 'GET');
            }
            else {
                reject();
            }
        }
    }, this);
};

/**
 * @private
 * @param {goog.events.Event} event
 */
dj.components.OverlayComponent.prototype.handleLayerXhrSuccess_ = function(event)
{
    var content = event.target.getResponseText();
    var model = this.getModelByUrl_(event.target.getLastUri().split('?')[0]);

    /**
     * Save content for further
     * use. Caching...
     */

    model.setContent(content);

    /**
     * Preload the images of
     * the new content
     *
     * @todo: Implement image preloader per promises
     */

    var images = content.match(/\<img.*?src="(.*?)"|\<img.*?src='(.*?)'/g);
    var preloader = new dj.async.ImagePreloader();
    var promises = [];

    if (images) {
        for (var i = 0, len = images.length; i < len; i++) {
            preloader.addSource(
                images[i].replace(/\<img.*src="|\<img.*src='/, '').replace(/"|'/, '')
            );
        }
    }

    /**
     * Parse content to
     * display for the user if
     * all images were preloaded
     */

    preloader.preload().then(function(){
        this.parseLayerContent_(content);

        if (this.openResolve_) {
            goog.async.nextTick(this.openResolve_);
            this.openResolve_ = null;
        }
    }, null, this);
};

/**
 * @private
 * @param  {string} content
 */
dj.components.OverlayComponent.prototype.parseLayerContent_ = function(content)
{
    /**
     * Add ne content under
     * the layer content element
     */

    this.layerContent_.innerHTML = content;

    /**
     * Get videos and wait for buffering
     */

    var videos = goog.dom.getElementsByTagNameAndClass('video', null, this.layerContent_);

    this.videoPreloader_.addVideoElements(/** @type {Array<HTMLVideoElement>} */ (videos));
    this.videoPreloader_.preload().then(function(){
        /**
         * Append close btn if class
         * was found
         */

        var closeBtn = goog.dom.getElementByClass('overlay-close', this.layerContent_);

        if (closeBtn) {
            goog.dom.appendChild(closeBtn, this.closeBtn_);
        }

        /**
         * Remove loading class and
         * activate the loaded class
         */

        goog.dom.classlist.enable(this.layer_, this.loadedClass_, true);
        goog.dom.classlist.enable(this.layer_, this.loadingClass_, false);

        /**
         * Update the components which
         * were loaded with the new content
         */

        this.updateLayerComponents_();

        /**
         * Scroll to the 0 position
         * so the user starts at the
         * beginning of the layer
         */

        goog.Timer.callOnce(function(){
            if (this.layerContent_.hasOwnProperty('scrollTop')) {
                this.layerContent_['scrollTop'] = 0;
            }
        }, 0, this);
    }, null, this);
};

/**
 * @private
 */
dj.components.OverlayComponent.prototype.updateLayerComponents_ = function()
{
    /**
     * Update the own triggers for
     * opening other overlays from
     * the current overlay
     */

    goog.array.forEach(
        goog.dom.getElementsByClass(dj.components.OverlayComponent.TRIGGER_IDENTIFIER, this.layerContent_),
        this.addOverlay, this
    );

    /**
     * Update the component manager
     * if ther are new components
     * in the loaded content
     */

    this.getManager().update();
};