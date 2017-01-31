# dj library
A javascriot library which builds it's components on the latest version of the underrated closure library.

### What you need to use it
You just need to get the latest version of the closure library: https://github.com/google/closure-library

### Coming features
- Dynamic configuration for each component (incl. base64)
- Static configuration for each component

### SYS and EXT
**SYS:** It provides the component manager of the library.

**EXT:** All components and utilities already created. E.g. OverlyComponent, DropdownComponent, ...

### Creating a component

The very basic structure of a component could like like this:
```javascript
goog.provide('your.sample.Component');
goog.require('dj.sys.components.AbstractComponent');

/**
 * @constructor
 * @extends {dj.sys.components.AbstractComponent}
 */
your.sample.Component = function()
{
  your.sample.Component.base(this, 'constructor');
};
goog.inherits(your.sample.Component, dj.sys.components.AbstractComponent);
```

### The components "ready" and "init" methods

You have to methods to affect the loading and initialization behaviour of a component.

### The components ready method

This method is the first after the component manager has become a component for initialization. This function needs to return a promise, which tells the component manager to continue with the initialization. There is a helper function for this in the parent component to prevent differences between the components. This could look like this:

```javascript
/** @inheritDoc */
your.sample.Component.prototype.ready = function()
{
  return this.baseReady(your.sample.Component, function(resolve, reject){
    // All ready stuff. After the initialization has finished.
    // Call the resolve function to tell the waiting components it's ready.
    resolve();
  });
};
```

### The components init method

After the component is ready the manager goes to the next function: "init". It's behaving like the ready method:
```javascript
/** @inheritDoc */
your.sample.Component.prototype.init = function()
{
  return this.baseInit(your.sample.Component, function(resolve, reject){
    // All initialization stuff. After the initialization has finished.
    // Call the resolve function to tell the waiting components it's ready.
    resolve();
  });
};
```

### The features of AbstractComponent

The base class comes with some useful features. Like a handleResize or handleScroll implementation. To register these functionalities you can call
```javascript
this.listenScroll();
```
or
```javascript
this.listenResize();
```
This will register a listener on the scroll or resize provider. You are able to do your stuff on resize or scroll by overriding these two functions:
```javascript
/** @inheritDoc */
your.sample.Component.prototype.handleResize = function()
{
  your.sample.Component.prototype.base(this, 'handleResize');

  // Do your stuff on resize
};

/** @inheritDoc */
your.sample.Component.prototype.handleScroll = function()
{
  your.sample.Component.prototype.base(this, 'handleScroll');

  // Do your stuff on scroll
};
```

To obtain the scroll position or the screen size you can call:
```javascript
var scrollPosition = this.getSrollPosition();
```
or
```javascript
var windowSize = this.getWindowSize();
```

### Using the component manager

To set up the component manager simply do it like this:

```javascript
goog.require('dj.sys.ComponentManager');

// Your created components
goog.require('your.sample.Component');
goog.require('your.sample.Component2');

// Instantiate the component manager
var componentManager = new dj.sys.ComponentManager();

// Start adding available components
componentManager.add('sample', your.sample.Component);
componentManager.add('sample2', your.sample.Component2);

// After that you are able to init the components
componentManager.init().then(function(){
    // Component initialization finished
}, null, this);
```

### Extended usage of the component manager

Update the component manager
```javascript
componentManager.update().then(function(){
    // Component initialization finished
}, null, this);
```

Change the attribute name the component manager is using to select the components.
The ***default*** attribute name is ***data-cmp***.
```javascript
var yourComponentInstnace = componentManager.getComponent('a-component-id');
```

Manually initialize a component instance. Immediately resolved if the component was already initialized.
```javascript
componentManager.initComponent(yourComponentInstance).then(function(){
    // Component initialized
}, null, this);
```

Set a different root element, only components under this element will be recognized.
The ***default*** root is the ***document element***.
```javascript
componentManager.setRootElement(goog.dom.getElement('element-id'));
```

Change the attribute name the component manager is using to select the components.
The ***default*** attribute name is ***data-cmp***.
```javascript
componentManager.setAttributeName('data-attr-name');
```