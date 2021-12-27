/*! @name videojs-vr @version 1.10.0 @license Apache-2.0 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('global/window'), require('global/document'), require('video.js')) :
	typeof define === 'function' && define.amd ? define(['global/window', 'global/document', 'video.js'], factory) :
	(global = global || self, global.videojsVr = factory(global.window, global.document, global.videojs));
}(this, function (window$1, document$1, videojs) { 'use strict';

	window$1 = window$1 && window$1.hasOwnProperty('default') ? window$1['default'] : window$1;
	document$1 = document$1 && document$1.hasOwnProperty('default') ? document$1['default'] : document$1;
	videojs = videojs && videojs.hasOwnProperty('default') ? videojs['default'] : videojs;

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var assertThisInitialized = createCommonjsModule(function (module) {
	function _assertThisInitialized(self) {
	  if (self === void 0) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return self;
	}

	module.exports = _assertThisInitialized, module.exports.__esModule = true, module.exports["default"] = module.exports;
	});

	var _assertThisInitialized = unwrapExports(assertThisInitialized);

	var setPrototypeOf = createCommonjsModule(function (module) {
	function _setPrototypeOf(o, p) {
	  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
	    o.__proto__ = p;
	    return o;
	  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  return _setPrototypeOf(o, p);
	}

	module.exports = _setPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;
	});

	unwrapExports(setPrototypeOf);

	var inheritsLoose = createCommonjsModule(function (module) {
	function _inheritsLoose(subClass, superClass) {
	  subClass.prototype = Object.create(superClass.prototype);
	  subClass.prototype.constructor = subClass;
	  setPrototypeOf(subClass, superClass);
	}

	module.exports = _inheritsLoose, module.exports.__esModule = true, module.exports["default"] = module.exports;
	});

	var _inheritsLoose = unwrapExports(inheritsLoose);

	var version = "1.10.0";

	// Copyright 2016 Google Inc.
	//
	//     Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	//     You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	//     Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	//     See the License for the specific language governing permissions and
	// limitations under the License.

	// Not yet presenting, but ready to present
	const READY_TO_PRESENT = 'ready';

	// In presentation mode
	const PRESENTING = 'presenting';
	const PRESENTING_FULLSCREEN = 'presenting-fullscreen';

	// Checking device availability
	const PREPARING = 'preparing';

	// Errors
	const ERROR_NO_PRESENTABLE_DISPLAYS = 'error-no-presentable-displays';
	const ERROR_BROWSER_NOT_SUPPORTED = 'error-browser-not-supported';
	const ERROR_REQUEST_TO_PRESENT_REJECTED = 'error-request-to-present-rejected';
	const ERROR_EXIT_PRESENT_REJECTED = 'error-exit-present-rejected';
	const ERROR_REQUEST_STATE_CHANGE_REJECTED = 'error-request-state-change-rejected';
	const ERROR_UNKOWN = 'error-unkown';

	var State = {
	  READY_TO_PRESENT,
	  PRESENTING,
	  PRESENTING_FULLSCREEN,
	  PREPARING,
	  ERROR_NO_PRESENTABLE_DISPLAYS,
	  ERROR_BROWSER_NOT_SUPPORTED,
	  ERROR_REQUEST_TO_PRESENT_REJECTED,
	  ERROR_EXIT_PRESENT_REJECTED,
	  ERROR_REQUEST_STATE_CHANGE_REJECTED,
	  ERROR_UNKOWN,
	};

	var eventemitter3 = createCommonjsModule(function (module) {

	var has = Object.prototype.hasOwnProperty
	  , prefix = '~';

	/**
	 * Constructor to create a storage for our `EE` objects.
	 * An `Events` instance is a plain object whose properties are event names.
	 *
	 * @constructor
	 * @api private
	 */
	function Events() {}

	//
	// We try to not inherit from `Object.prototype`. In some engines creating an
	// instance in this way is faster than calling `Object.create(null)` directly.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// character to make sure that the built-in object properties are not
	// overridden or used as an attack vector.
	//
	if (Object.create) {
	  Events.prototype = Object.create(null);

	  //
	  // This hack is needed because the `__proto__` property is still inherited in
	  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
	  //
	  if (!new Events().__proto__) prefix = false;
	}

	/**
	 * Representation of a single event listener.
	 *
	 * @param {Function} fn The listener function.
	 * @param {Mixed} context The context to invoke the listener with.
	 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	 * @constructor
	 * @api private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Minimal `EventEmitter` interface that is molded against the Node.js
	 * `EventEmitter` interface.
	 *
	 * @constructor
	 * @api public
	 */
	function EventEmitter() {
	  this._events = new Events();
	  this._eventsCount = 0;
	}

	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 *
	 * @returns {Array}
	 * @api public
	 */
	EventEmitter.prototype.eventNames = function eventNames() {
	  var names = []
	    , events
	    , name;

	  if (this._eventsCount === 0) return names;

	  for (name in (events = this._events)) {
	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
	  }

	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }

	  return names;
	};

	/**
	 * Return the listeners registered for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Boolean} exists Only check if there are listeners.
	 * @returns {Array|Boolean}
	 * @api public
	 */
	EventEmitter.prototype.listeners = function listeners(event, exists) {
	  var evt = prefix ? prefix + event : event
	    , available = this._events[evt];

	  if (exists) return !!available;
	  if (!available) return [];
	  if (available.fn) return [available.fn];

	  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
	    ee[i] = available[i].fn;
	  }

	  return ee;
	};

	/**
	 * Calls each of the listeners registered for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @returns {Boolean} `true` if the event had listeners, else `false`.
	 * @api public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return false;

	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;

	  if (listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Add a listener for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {Mixed} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  var listener = new EE(fn, context || this)
	    , evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
	  else if (!this._events[evt].fn) this._events[evt].push(listener);
	  else this._events[evt] = [this._events[evt], listener];

	  return this;
	};

	/**
	 * Add a one-time listener for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {Mixed} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  var listener = new EE(fn, context || this, true)
	    , evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
	  else if (!this._events[evt].fn) this._events[evt].push(listener);
	  else this._events[evt] = [this._events[evt], listener];

	  return this;
	};

	/**
	 * Remove the listeners of a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn Only remove the listeners that match this function.
	 * @param {Mixed} context Only remove the listeners that have this context.
	 * @param {Boolean} once Only remove one-time listeners.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return this;
	  if (!fn) {
	    if (--this._eventsCount === 0) this._events = new Events();
	    else delete this._events[evt];
	    return this;
	  }

	  var listeners = this._events[evt];

	  if (listeners.fn) {
	    if (
	         listeners.fn === fn
	      && (!once || listeners.once)
	      && (!context || listeners.context === context)
	    ) {
	      if (--this._eventsCount === 0) this._events = new Events();
	      else delete this._events[evt];
	    }
	  } else {
	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
	      if (
	           listeners[i].fn !== fn
	        || (once && !listeners[i].once)
	        || (context && listeners[i].context !== context)
	      ) {
	        events.push(listeners[i]);
	      }
	    }

	    //
	    // Reset the array, or remove it completely if we have no more listeners.
	    //
	    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
	    else if (--this._eventsCount === 0) this._events = new Events();
	    else delete this._events[evt];
	  }

	  return this;
	};

	/**
	 * Remove all listeners, or those of the specified event.
	 *
	 * @param {String|Symbol} [event] The event name.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  var evt;

	  if (event) {
	    evt = prefix ? prefix + event : event;
	    if (this._events[evt]) {
	      if (--this._eventsCount === 0) this._events = new Events();
	      else delete this._events[evt];
	    }
	  } else {
	    this._events = new Events();
	    this._eventsCount = 0;
	  }

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// This function doesn't apply anymore.
	//
	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
	  return this;
	};

	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;

	//
	// Allow `EventEmitter` to be imported as module namespace.
	//
	EventEmitter.EventEmitter = EventEmitter;

	//
	// Expose the module.
	//
	{
	  module.exports = EventEmitter;
	}
	});

	var screenfull = createCommonjsModule(function (module) {
	/*!
	* screenfull
	* v3.3.3 - 2018-09-04
	* (c) Sindre Sorhus; MIT License
	*/
	(function () {

		var document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};
		var isCommonjs = module.exports;
		var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

		var fn = (function () {
			var val;

			var fnMap = [
				[
					'requestFullscreen',
					'exitFullscreen',
					'fullscreenElement',
					'fullscreenEnabled',
					'fullscreenchange',
					'fullscreenerror'
				],
				// New WebKit
				[
					'webkitRequestFullscreen',
					'webkitExitFullscreen',
					'webkitFullscreenElement',
					'webkitFullscreenEnabled',
					'webkitfullscreenchange',
					'webkitfullscreenerror'

				],
				// Old WebKit (Safari 5.1)
				[
					'webkitRequestFullScreen',
					'webkitCancelFullScreen',
					'webkitCurrentFullScreenElement',
					'webkitCancelFullScreen',
					'webkitfullscreenchange',
					'webkitfullscreenerror'

				],
				[
					'mozRequestFullScreen',
					'mozCancelFullScreen',
					'mozFullScreenElement',
					'mozFullScreenEnabled',
					'mozfullscreenchange',
					'mozfullscreenerror'
				],
				[
					'msRequestFullscreen',
					'msExitFullscreen',
					'msFullscreenElement',
					'msFullscreenEnabled',
					'MSFullscreenChange',
					'MSFullscreenError'
				]
			];

			var i = 0;
			var l = fnMap.length;
			var ret = {};

			for (; i < l; i++) {
				val = fnMap[i];
				if (val && val[1] in document) {
					for (i = 0; i < val.length; i++) {
						ret[fnMap[0][i]] = val[i];
					}
					return ret;
				}
			}

			return false;
		})();

		var eventNameMap = {
			change: fn.fullscreenchange,
			error: fn.fullscreenerror
		};

		var screenfull = {
			request: function (elem) {
				var request = fn.requestFullscreen;

				elem = elem || document.documentElement;

				// Work around Safari 5.1 bug: reports support for
				// keyboard in fullscreen even though it doesn't.
				// Browser sniffing, since the alternative with
				// setTimeout is even worse.
				if (/ Version\/5\.1(?:\.\d+)? Safari\//.test(navigator.userAgent)) {
					elem[request]();
				} else {
					elem[request](keyboardAllowed ? Element.ALLOW_KEYBOARD_INPUT : {});
				}
			},
			exit: function () {
				document[fn.exitFullscreen]();
			},
			toggle: function (elem) {
				if (this.isFullscreen) {
					this.exit();
				} else {
					this.request(elem);
				}
			},
			onchange: function (callback) {
				this.on('change', callback);
			},
			onerror: function (callback) {
				this.on('error', callback);
			},
			on: function (event, callback) {
				var eventName = eventNameMap[event];
				if (eventName) {
					document.addEventListener(eventName, callback, false);
				}
			},
			off: function (event, callback) {
				var eventName = eventNameMap[event];
				if (eventName) {
					document.removeEventListener(eventName, callback, false);
				}
			},
			raw: fn
		};

		if (!fn) {
			if (isCommonjs) {
				module.exports = false;
			} else {
				window.screenfull = false;
			}

			return;
		}

		Object.defineProperties(screenfull, {
			isFullscreen: {
				get: function () {
					return Boolean(document[fn.fullscreenElement]);
				}
			},
			element: {
				enumerable: true,
				get: function () {
					return document[fn.fullscreenElement];
				}
			},
			enabled: {
				enumerable: true,
				get: function () {
					// Coerce to boolean in case of old WebKit
					return Boolean(document[fn.fullscreenEnabled]);
				}
			}
		});

		if (isCommonjs) {
			module.exports = screenfull;
		} else {
			window.screenfull = screenfull;
		}
	})();
	});

	// Copyright 2016 Google Inc.

	/**
	 * WebVR Manager is a utility to handle VR displays
	 */
	class WebVRManager extends eventemitter3 {

	  /**
	   * Construct a new WebVRManager
	   */
	  constructor() {
	    super();
	    this.state = State.PREPARING;

	    // Bind vr display present change event to __onVRDisplayPresentChange
	    this.__onVRDisplayPresentChange = this.__onVRDisplayPresentChange.bind(this);
	    window.addEventListener('vrdisplaypresentchange', this.__onVRDisplayPresentChange);

	    this.__onChangeFullscreen = this.__onChangeFullscreen.bind(this);
	    if (screenfull.enabled) {
	      document.addEventListener(screenfull.raw.fullscreenchange, this.__onChangeFullscreen);
	    }
	  }

	  /**
	   * Check if the browser is compatible with WebVR and has headsets.
	   * @return {Promise<VRDisplay>}
	   */
	  checkDisplays() {
	    return WebVRManager.getVRDisplay()
	      .then((display) => {
	        this.defaultDisplay = display;
	        this.__setState(State.READY_TO_PRESENT);
	        return display;
	      })
	      .catch((e) => {
	        delete this.defaultDisplay;
	        if (e.name == 'NO_DISPLAYS') {
	          this.__setState(State.ERROR_NO_PRESENTABLE_DISPLAYS);
	        } else if (e.name == 'WEBVR_UNSUPPORTED') {
	          this.__setState(State.ERROR_BROWSER_NOT_SUPPORTED);
	        } else {
	          this.__setState(State.ERROR_UNKOWN);
	        }
	      });
	  }

	  /**
	   * clean up object for garbage collection
	   */
	  remove() {
	    window.removeEventListener('vrdisplaypresentchange', this.__onVRDisplayPresentChange);
	    if (screenfull.enabled) {
	      document.removeEventListener(screenfull.raw.fullscreenchanged, this.__onChangeFullscreen);
	    }

	    this.removeAllListeners();
	  }

	  /**
	   * returns promise returning list of available VR displays.
	   * @return {Promise<VRDisplay>}
	   */
	  static getVRDisplay() {
	    return new Promise((resolve, reject) => {
	      if (!navigator || !navigator.getVRDisplays) {
	        let e = new Error('Browser not supporting WebVR');
	        e.name = 'WEBVR_UNSUPPORTED';
	        reject(e);
	        return;
	      }

	      const rejectNoDisplay = ()=> {
	        // No displays are found.
	        let e = new Error('No displays found');
	        e.name = 'NO_DISPLAYS';
	        reject(e);
	      };

	      navigator.getVRDisplays().then(
	        function(displays) {
	          // Promise succeeds, but check if there are any displays actually.
	          for (let i = 0; i < displays.length; i++) {
	            if (displays[i].capabilities.canPresent) {
	              resolve(displays[i]);
	              break;
	            }
	          }

	          rejectNoDisplay();
	        },
	        rejectNoDisplay);
	    });
	  }

	  /**
	   * Enter presentation mode with your set VR display
	   * @param {VRDisplay} display the display to request present on
	   * @param {HTMLCanvasElement} canvas
	   * @return {Promise.<TResult>}
	   */
	  enterVR(display, canvas) {
	    this.presentedSource = canvas;
	    return display.requestPresent([{
	      source: canvas,
	    }])
	      .then(
	        ()=> {},
	        // this could fail if:
	        // 1. Display `canPresent` is false
	        // 2. Canvas is invalid
	        // 3. not executed via user interaction
	        ()=> this.__setState(State.ERROR_REQUEST_TO_PRESENT_REJECTED)
	      );
	  }

	  /**
	   * Exit presentation mode on display
	   * @param {VRDisplay} display
	   * @return {Promise.<TResult>}
	   */
	  exitVR(display) {
	    return display.exitPresent()
	      .then(
	        ()=> {
	          this.presentedSource = undefined;
	        },
	        // this could fail if:
	        // 1. exit requested while not currently presenting
	        ()=> this.__setState(State.ERROR_EXIT_PRESENT_REJECTED)
	      );
	  }

	  /**
	   * Enter fullscreen mode
	   * @param {HTMLCanvasElement} canvas
	   * @return {boolean}
	   */
	  enterFullscreen(canvas) {
	    if (screenfull.enabled) {
	      screenfull.request(canvas);
	    } else {
	      // iOS
	      this.__setState(State.PRESENTING_FULLSCREEN);
	    }
	    return true;
	  }

	  /**
	   * Exit fullscreen mode
	   * @return {boolean}
	   */
	  exitFullscreen() {
	    if (screenfull.enabled && screenfull.isFullscreen) {
	      screenfull.exit();
	    } else if (this.state == State.PRESENTING_FULLSCREEN) {
	      this.checkDisplays();
	    }
	    return true;
	  }

	  /**
	   * Change the state of the manager
	   * @param {State} state
	   * @private
	   */
	  __setState(state) {
	    if (state != this.state) {
	      this.emit('change', state, this.state);
	      this.state = state;
	    }
	  }

	  /**
	   * Triggered on fullscreen change event
	   * @param {Event} e
	   * @private
	   */
	  __onChangeFullscreen(e) {
	    if (screenfull.isFullscreen) {
	      if(this.state != State.PRESENTING) {
	        this.__setState(State.PRESENTING_FULLSCREEN);
	      }
	    } else {
	      this.checkDisplays();
	    }
	  }

	  /**
	   * Triggered on vr present change
	   * @param {Event} event
	   * @private
	   */
	  __onVRDisplayPresentChange(event) {
	    try {
	      let display;
	      if(event.display) {
	        // In chrome its supplied on the event
	        display = event.display;
	      } else if(event.detail && event.detail.display) {
	        // Polyfill stores display under detail
	        display = event.detail.display;
	      }

	      if(display && display.isPresenting && display.getLayers()[0].source !== this.presentedSource) {
	        // this means a different instance of WebVRManager has requested to present
	        return;
	      }

	      const isPresenting = this.defaultDisplay && this.defaultDisplay.isPresenting;
	      this.__setState(isPresenting ? State.PRESENTING : State.READY_TO_PRESENT);
	    } catch(err) {
	      // continue regardless of error
	    }
	  }

	}

	// Copyright 2016 Google Inc.
	//
	//     Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	//     You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	//     Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	//     See the License for the specific language governing permissions and
	// limitations under the License.

	const _LOGO_SCALE = 0.8;
	let _WEBVR_UI_CSS_INJECTED = {};

	/**
	 * Generate the innerHTML for the button
	 *
	 * @return {string} html of the button as string
	 * @param {string} cssPrefix
	 * @param {Number} height
	 * @private
	 */
	const generateInnerHTML = (cssPrefix, height)=> {
	  const logoHeight = height*_LOGO_SCALE;
	  const svgString = generateVRIconString(cssPrefix, logoHeight) + generateNoVRIconString(cssPrefix, logoHeight);

	  return `<button class="${cssPrefix}-button">
          <div class="${cssPrefix}-title"></div>
          <div class="${cssPrefix}-logo" >${svgString}</div>
        </button>`;
	};

	/**
	 * Inject the CSS string to the head of the document
	 *
	 * @param {string} cssText the css to inject
	 */
	const injectCSS = (cssText)=> {
	  // Create the css
	  const style = document.createElement('style');
	  style.innerHTML = cssText;

	  let head = document.getElementsByTagName('head')[0];
	  head.insertBefore(style, head.firstChild);
	};

	/**
	 * Generate DOM element view for button
	 *
	 * @return {HTMLElement}
	 * @param {Object} options
	 */
	const createDefaultView = (options)=> {
	  const fontSize = options.height / 3;
	  if (options.injectCSS) {
	    // Check that css isnt already injected
	    if (!_WEBVR_UI_CSS_INJECTED[options.cssprefix]) {
	      injectCSS(generateCSS(options, fontSize));
	      _WEBVR_UI_CSS_INJECTED[options.cssprefix] = true;
	    }
	  }

	  const el = document.createElement('div');
	  el.innerHTML = generateInnerHTML(options.cssprefix, fontSize);
	  return el.firstChild;
	};


	const generateVRIconString = (cssPrefix, height)=> {
	    let aspect = 28 / 18;
	    return `<svg class="${cssPrefix}-svg" version="1.1" x="0px" y="0px" 
        width="${aspect * height}px" height="${height}px" viewBox="0 0 28 18" xml:space="preserve">
        <path d="M26.8,1.1C26.1,0.4,25.1,0,24.2,0H3.4c-1,0-1.7,0.4-2.4,1.1C0.3,1.7,0,2.7,0,3.6v10.7
        c0,1,0.3,1.9,0.9,2.6C1.6,17.6,2.4,18,3.4,18h5c0.7,0,1.3-0.2,1.8-0.5c0.6-0.3,1-0.8,1.3-1.4l
        1.5-2.6C13.2,13.1,13,13,14,13v0h-0.2 h0c0.3,0,0.7,0.1,0.8,0.5l1.4,2.6c0.3,0.6,0.8,1.1,1.3,
        1.4c0.6,0.3,1.2,0.5,1.8,0.5h5c1,0,2-0.4,2.7-1.1c0.7-0.7,1.2-1.6,1.2-2.6 V3.6C28,2.7,27.5,
        1.7,26.8,1.1z M7.4,11.8c-1.6,0-2.8-1.3-2.8-2.8c0-1.6,1.3-2.8,2.8-2.8c1.6,0,2.8,1.3,2.8,2.8
        C10.2,10.5,8.9,11.8,7.4,11.8z M20.1,11.8c-1.6,0-2.8-1.3-2.8-2.8c0-1.6,1.3-2.8,2.8-2.8C21.7
        ,6.2,23,7.4,23,9 C23,10.5,21.7,11.8,20.1,11.8z"/>
    </svg>`;
	};

	const generateNoVRIconString = (cssPrefix, height)=>{
	    let aspect = 28 / 18;
	    return `<svg class="${cssPrefix}-svg-error" x="0px" y="0px" 
        width="${aspect * height}px" height="${aspect * height}px" viewBox="0 0 28 28" xml:space="preserve">
        <path d="M17.6,13.4c0-0.2-0.1-0.4-0.1-0.6c0-1.6,1.3-2.8,2.8-2.8s2.8,1.3,2.8,2.8s-1.3,2.8-2.8,2.8
        c-0.2,0-0.4,0-0.6-0.1l5.9,5.9c0.5-0.2,0.9-0.4,1.3-0.8
        c0.7-0.7,1.1-1.6,1.1-2.5V7.4c0-1-0.4-1.9-1.1-2.5c-0.7-0.7-1.6-1-2.5-1
        H8.1 L17.6,13.4z"/>
        <path d="M10.1,14.2c-0.5,0.9-1.4,1.4-2.4,1.4c-1.6,0-2.8-1.3-2.8-2.8c0-1.1,0.6-2,1.4-2.5
        L0.9,5.1 C0.3,5.7,0,6.6,0,7.5v10.7c0,1,0.4,1.8,1.1,2.5c0.7,0.7,1.6,1,2.5,1
        h5c0.7,0,1.3-0.1,1.8-0.5c0.6-0.3,1-0.8,1.3-1.4l1.3-2.6 L10.1,14.2z"/>
        <path d="M25.5,27.5l-25-25C-0.1,2-0.1,1,0.5,0.4l0,0C1-0.1,2-0.1,2.6,0.4l25,25c0.6,0.6,0.6,1.5
        ,0,2.1l0,0 C27,28.1,26,28.1,25.5,27.5z"/>
    </svg>`;
	};

	/**
	 * Generate the CSS string to inject
	 *
	 * @param {Object} options
	 * @param {Number} [fontSize=18]
	 * @return {string}
	 */
	const generateCSS = (options, fontSize=18)=> {
	  const height = options.height;
	  const borderWidth = 2;
	  const borderColor = options.background ? options.background : options.color;
	  const cssPrefix = options.cssprefix;

	  let borderRadius;
	  if (options.corners == 'round') {
	    borderRadius = options.height / 2;
	  } else if (options.corners == 'square') {
	    borderRadius = 2;
	  } else {
	    borderRadius = options.corners;
	  }

	  return (`
    @font-face {
        font-family: 'Karla';
        font-style: normal;
        font-weight: 400;
        src: local('Karla'), local('Karla-Regular'), 
             url(https://fonts.gstatic.com/s/karla/v5/31P4mP32i98D9CEnGyeX9Q.woff2) format('woff2');
        unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;
    }
    @font-face {
        font-family: 'Karla';
        font-style: normal;
        font-weight: 400;
        src: local('Karla'), local('Karla-Regular'), 
             url(https://fonts.gstatic.com/s/karla/v5/Zi_e6rBgGqv33BWF8WTq8g.woff2) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, 
                       U+20AC, U+2212, U+2215, U+E0FF, U+EFFD, U+F000;
    }

    button.${cssPrefix}-button {
        font-family: 'Karla', sans-serif;

        border: ${borderColor} ${borderWidth}px solid;
        border-radius: ${borderRadius}px;
        box-sizing: border-box;
        background: ${options.background ? options.background : 'none'};

        height: ${height}px;
        min-width: ${fontSize * 9.6}px;
        display: inline-block;
        position: relative;

        cursor: pointer;
    }
    
    button.${cssPrefix}-button:focus {
      outline: none;
    }

    /*
    * Logo
    */

    .${cssPrefix}-logo {
        width: ${height}px;
        height: ${height}px;
        position: absolute;
        top:0px;
        left:0px;
        width: ${height - 4}px;
        height: ${height - 4}px;
    }
    .${cssPrefix}-svg {
        fill: ${options.color};
        margin-top: ${(height - fontSize * _LOGO_SCALE) / 2 - 2}px;
        margin-left: ${height / 3 }px;
    }
    .${cssPrefix}-svg-error {
        fill: ${options.color};
        display:none;
        margin-top: ${(height - 28 / 18 * fontSize * _LOGO_SCALE) / 2 - 2}px;
        margin-left: ${height / 3 }px;
    }


    /*
    * Title
    */

    .${cssPrefix}-title {
        color: ${options.color};
        position: relative;
        font-size: ${fontSize}px;
        padding-left: ${height * 1.05}px;
        padding-right: ${(borderRadius - 10 < 5) ? height / 3 : borderRadius - 10}px;
    }

    /*
    * disabled
    */

    button.${cssPrefix}-button[disabled=true] {
        opacity: ${options.disabledOpacity};
        cursor: default;
    }

    button.${cssPrefix}-button[disabled=true] > .${cssPrefix}-logo > .${cssPrefix}-svg {
        display:none;
    }

    button.${cssPrefix}-button[disabled=true] > .${cssPrefix}-logo > .${cssPrefix}-svg-error {
        display:initial;
    }
  `);
	};

	// Copyright 2016 Google Inc.

	/**
	 * A button to allow easy-entry and messaging around a WebVR experience
	 * @class
	 */
	class EnterVRButton extends eventemitter3 {
	  /**
	   * Construct a new Enter VR Button
	   * @constructor
	   * @param {HTMLCanvasElement} sourceCanvas the canvas that you want to present in WebVR
	   * @param {Object} [options] optional parameters
	   * @param {HTMLElement} [options.domElement] provide your own domElement to bind to
	   * @param {Boolean} [options.injectCSS=true] set to false if you want to write your own styles
	   * @param {Function} [options.beforeEnter] should return a promise, opportunity to intercept request to enter
	   * @param {Function} [options.beforeExit] should return a promise, opportunity to intercept request to exit
	   * @param {Function} [options.onRequestStateChange] set to a function returning false to prevent default state changes
	   * @param {string} [options.textEnterVRTitle] set the text for Enter VR
	   * @param {string} [options.textVRNotFoundTitle] set the text for when a VR display is not found
	   * @param {string} [options.textExitVRTitle] set the text for exiting VR
	   * @param {string} [options.color] text and icon color
	   * @param {string} [options.background] set to false for no brackground or a color
	   * @param {string} [options.corners] set to 'round', 'square' or pixel value representing the corner radius
	   * @param {string} [options.disabledOpacity] set opacity of button dom when disabled
	   * @param {string} [options.cssprefix] set to change the css prefix from default 'webvr-ui'
	   */
	  constructor(sourceCanvas, options) {
	    super();
	    options = options || {};

	    options.color = options.color || 'rgb(80,168,252)';
	    options.background = options.background || false;
	    options.disabledOpacity = options.disabledOpacity || 0.5;
	    options.height = options.height || 55;
	    options.corners = options.corners || 'square';
	    options.cssprefix = options.cssprefix || 'webvr-ui';

	    options.textEnterVRTitle = options.textEnterVRTitle || 'ENTER VR';
	    options.textVRNotFoundTitle = options.textVRNotFoundTitle || 'VR NOT FOUND';
	    options.textExitVRTitle = options.textExitVRTitle || 'EXIT VR';

	    options.onRequestStateChange = options.onRequestStateChange || (() => true);
	    // Currently `beforeEnter` is unsupported by Firefox
	    options.beforeEnter = options.beforeEnter || undefined;
	    options.beforeExit = options.beforeExit || (()=> new Promise((resolve)=> resolve()));

	    options.injectCSS = options.injectCSS !== false;

	    this.options = options;


	    this.sourceCanvas = sourceCanvas;

	    // Pass in your own domElement if you really dont want to use ours
	    this.domElement = options.domElement || createDefaultView(options);
	    this.__defaultDisplayStyle = this.domElement.style.display || 'initial';

	    // Create WebVR Manager
	    this.manager = new WebVRManager();
	    this.manager.checkDisplays();
	    this.manager.addListener('change', (state)=> this.__onStateChange(state));

	    // Bind button click events to __onClick
	    this.domElement.addEventListener('click', ()=> this.__onEnterVRClick());

	    this.__forceDisabled = false;
	    this.setTitle(this.options.textEnterVRTitle);
	  }

	  /**
	   * Set the title of the button
	   * @param {string} text
	   * @return {EnterVRButton}
	   */
	  setTitle(text) {
	    this.domElement.title = text;
	    ifChild(this.domElement, this.options.cssprefix, 'title', (title)=> {
	      if (!text) {
	        title.style.display = 'none';
	      } else {
	        title.innerText = text;
	        title.style.display = 'initial';
	      }
	    });

	    return this;
	  }

	  /**
	   * Set the tooltip of the button
	   * @param {string} tooltip
	   * @return {EnterVRButton}
	   */
	  setTooltip(tooltip) {
	    this.domElement.title = tooltip;
	    return this;
	  }

	  /**
	   * Show the button
	   * @return {EnterVRButton}
	   */
	  show() {
	    this.domElement.style.display = this.__defaultDisplayStyle;
	    this.emit('show');
	    return this;
	  }

	  /**
	   * Hide the button
	   * @return {EnterVRButton}
	   */
	  hide() {
	    this.domElement.style.display = 'none';
	    this.emit('hide');
	    return this;
	  }

	  /**
	   * Enable the button
	   * @return {EnterVRButton}
	   */
	  enable() {
	    this.__setDisabledAttribute(false);
	    this.__forceDisabled = false;
	    return this;
	  }

	  /**
	   * Disable the button from being clicked
	   * @return {EnterVRButton}
	   */
	  disable() {
	    this.__setDisabledAttribute(true);
	    this.__forceDisabled = true;
	    return this;
	  }

	  /**
	   * clean up object for garbage collection
	   */
	  remove() {
	    this.manager.remove();

	    if (this.domElement.parentElement) {
	      this.domElement.parentElement.removeChild(this.domElement);
	    }
	  }

	  /**
	   * Returns a promise getting the VRDisplay used
	   * @return {Promise.<VRDisplay>}
	   */
	  getVRDisplay() {
	    return WebVRManager.getVRDisplay();
	  }

	  /**
	   * Check if the canvas the button is connected to is currently presenting
	   * @return {boolean}
	   */
	  isPresenting() {
	    return this.state === State.PRESENTING || this.state == State.PRESENTING_FULLSCREEN;
	  }

	  /**
	   * Request entering VR
	   * @return {Promise}
	   */
	  requestEnterVR() {
	    return new Promise((resolve, reject)=> {
	      if (this.options.onRequestStateChange(State.PRESENTING)) {
	        if(this.options.beforeEnter) {
	          return this.options.beforeEnter()
	            .then(()=> this.manager.enterVR(this.manager.defaultDisplay, this.sourceCanvas))
	            .then(resolve);
	        } else {
	          return this.manager.enterVR(this.manager.defaultDisplay, this.sourceCanvas)
	            .then(resolve);
	        }
	      } else {
	        reject(new Error(State.ERROR_REQUEST_STATE_CHANGE_REJECTED));
	      }
	    });
	  }

	  /**
	   * Request exiting presentation mode
	   * @return {Promise}
	   */
	  requestExit() {
	    const initialState = this.state;

	    return new Promise((resolve, reject)=> {
	      if (this.options.onRequestStateChange(State.READY_TO_PRESENT)) {
	        return this.options.beforeExit()
	          .then(()=>
	            // if we were presenting VR, exit VR, if we are
	            // exiting fullscreen, exit fullscreen
	            initialState === State.PRESENTING ?
	              this.manager.exitVR(this.manager.defaultDisplay) :
	              this.manager.exitFullscreen())
	          .then(resolve);
	      } else {
	        reject(new Error(State.ERROR_REQUEST_STATE_CHANGE_REJECTED));
	      }
	    });
	  }

	  /**
	   * Request entering the site in fullscreen, but not VR
	   * @return {Promise}
	   */
	  requestEnterFullscreen() {
	    return new Promise((resolve, reject)=> {
	      if (this.options.onRequestStateChange(State.PRESENTING_FULLSCREEN)) {
	        if(this.options.beforeEnter) {
	          return this.options.beforeEnter()
	            .then(()=>this.manager.enterFullscreen(this.sourceCanvas))
	            .then(resolve);
	        } else {
	          return this.manager.enterFullscreen(this.sourceCanvas)
	            .then(resolve);
	        }
	      } else {
	        reject(new Error(State.ERROR_REQUEST_STATE_CHANGE_REJECTED));
	      }
	    });
	  }

	  /**
	   * Set the disabled attribute
	   * @param {boolean} disabled
	   * @private
	   */
	  __setDisabledAttribute(disabled) {
	    if (disabled || this.__forceDisabled) {
	      this.domElement.setAttribute('disabled', 'true');
	    } else {
	      this.domElement.removeAttribute('disabled');
	    }
	  }

	  /**
	   * Handling click event from button
	   * @private
	   */
	  __onEnterVRClick() {
	    if (this.state == State.READY_TO_PRESENT) {
	      this.requestEnterVR();
	    } else if (this.isPresenting()) {
	      this.requestExit();
	    }
	  }

	  /**
	   * @param {State} state the state that its transitioning to
	   * @private
	   */
	  __onStateChange(state) {
	    if (state != this.state) {
	      if (this.state === State.PRESENTING || this.state === State.PRESENTING_FULLSCREEN) {
	        this.emit('exit', this.manager.defaultDisplay);
	      }
	      this.state = state;

	      switch (state) {
	        case State.READY_TO_PRESENT:
	          this.show();
	          this.setTitle(this.options.textEnterVRTitle);
	          if (this.manager.defaultDisplay) {
	            this.setTooltip('Enter VR using ' + this.manager.defaultDisplay.displayName);
	          }
	          this.__setDisabledAttribute(false);
	          this.emit('ready', this.manager.defaultDisplay);
	          break;

	        case State.PRESENTING:
	        case State.PRESENTING_FULLSCREEN:
	          if (!this.manager.defaultDisplay ||
	            !this.manager.defaultDisplay.capabilities.hasExternalDisplay ||
	            state == State.PRESENTING_FULLSCREEN) {
	            this.hide();
	          }
	          this.setTitle(this.options.textExitVRTitle);
	          this.__setDisabledAttribute(false);
	          this.emit('enter', this.manager.defaultDisplay);
	          break;

	        // Error states
	        case State.ERROR_BROWSER_NOT_SUPPORTED:
	          this.show();
	          this.setTitle(this.options.textVRNotFoundTitle);
	          this.setTooltip('Browser not supported');
	          this.__setDisabledAttribute(true);
	          this.emit('error', new Error(state));
	          break;

	        case State.ERROR_NO_PRESENTABLE_DISPLAYS:
	          this.show();
	          this.setTitle(this.options.textVRNotFoundTitle);
	          this.setTooltip('No VR headset found.');
	          this.__setDisabledAttribute(true);
	          this.emit('error', new Error(state));
	          break;

	        case State.ERROR_REQUEST_TO_PRESENT_REJECTED:
	          this.show();
	          this.setTitle(this.options.textVRNotFoundTitle);
	          this.setTooltip('Something went wrong trying to start presenting to your headset.');
	          this.__setDisabledAttribute(true);
	          this.emit('error', new Error(state));
	          break;

	        case State.ERROR_EXIT_PRESENT_REJECTED:
	        default:
	          this.show();
	          this.setTitle(this.options.textVRNotFoundTitle);
	          this.setTooltip('Unknown error.');
	          this.__setDisabledAttribute(true);
	          this.emit('error', new Error(state));
	      }
	    }
	  }
	}

	/**
	 * Function checking if a specific css class exists as child of element.
	 *
	 * @param {HTMLElement} el element to find child in
	 * @param {string} cssPrefix css prefix of button
	 * @param {string} suffix class name
	 * @param {function} fn function to call if child is found
	 * @private
	 */
	const ifChild = (el, cssPrefix, suffix, fn)=> {
	  const c = el.querySelector('.' + cssPrefix + '-' + suffix);
	  c && fn(c);
	};

	// Copyright 2016 Google Inc.

	if (typeof AFRAME !== 'undefined' && AFRAME) {
	  AFRAME.registerComponent('webvr-ui', {
	    dependencies: ['canvas'],

	    schema: {
	      enabled: {type: 'boolean', default: true},
	      color: {type: 'string', default: 'white'},
	      background: {type: 'string', default: 'black'},
	      corners: {type: 'string', default: 'square'},
	      disabledOpacity: {type: 'number', default: 0.5},

	      textEnterVRTitle: {type: 'string'},
	      textExitVRTitle: {type: 'string'},
	      textVRNotFoundTitle: {type: 'string'},
	    },

	    init: function() {
	    },

	    update: function() {
	      let scene = document.querySelector('a-scene');
	      scene.setAttribute('vr-mode-ui', {enabled: !this.data.enabled});

	      if (this.data.enabled) {
	        if (this.enterVREl) {
	          return;
	        }

	        let options = {
	          color: this.data.color,
	          background: this.data.background,
	          corners: this.data.corners,
	          disabledOpacity: this.data.disabledOpacity,
	          textEnterVRTitle: this.data.textEnterVRTitle,
	          textExitVRTitle: this.data.textExitVRTitle,
	          textVRNotFoundTitle: this.data.textVRNotFoundTitle,
	          onRequestStateChange: function(state) {
	            if (state == State.PRESENTING) {
	              scene.enterVR();
	            } else {
	              scene.exitVR();
	            }
	            return false;
	          },
	        };

	        let enterVR = this.enterVR = new EnterVRButton(scene.canvas, options);

	        this.enterVREl = enterVR.domElement;

	        document.body.appendChild(enterVR.domElement);

	        enterVR.domElement.style.position = 'absolute';
	        enterVR.domElement.style.bottom = '10px';
	        enterVR.domElement.style.left = '50%';
	        enterVR.domElement.style.transform = 'translate(-50%, -50%)';
	        enterVR.domElement.style.textAlign = 'center';
	      } else {
	        if (this.enterVREl) {
	          this.enterVREl.parentNode.removeChild(this.enterVREl);
	          this.enterVR.remove();
	        }
	      }
	    },

	    remove: function() {
	      if (this.enterVREl) {
	        this.enterVREl.parentNode.removeChild(this.enterVREl);
	        this.enterVR.remove();
	      }
	    },
	  });
	}

	// Copyright 2016 Google Inc.

	var corsSupport = function () {
	  var video = document$1.createElement('video');
	  video.crossOrigin = 'anonymous';
	  return video.hasAttribute('crossorigin');
	}();

	/**
	 * This class manages ambisonic decoding and binaural rendering via Omnitone library.
	 */

	var OmnitoneController = /*#__PURE__*/function (_videojs$EventTarget) {
	  _inheritsLoose(OmnitoneController, _videojs$EventTarget);

	  /**
	   * Omnitone controller class.
	   *
	   * @class
	   * @param {AudioContext} audioContext - associated AudioContext.
	   * @param {Omnitone library} omnitone - Omnitone library element.
	   * @param {HTMLVideoElement} video - vidoe tag element.
	   * @param {Object} options - omnitone options.
	   */
	  function OmnitoneController(audioContext, omnitone, video, options) {
	    var _this;

	    _this = _videojs$EventTarget.call(this) || this;
	    var settings = videojs.mergeOptions({
	      // Safari uses the different AAC decoder than FFMPEG. The channel order is
	      // The default 4ch AAC channel layout for FFMPEG AAC channel ordering.
	      channelMap: videojs.browser.IS_SAFARI ? [2, 0, 1, 3] : [0, 1, 2, 3],
	      ambisonicOrder: 1
	    }, options);
	    _this.videoElementSource = audioContext.createMediaElementSource(video);
	    _this.foaRenderer = omnitone.createFOARenderer(audioContext, settings);

	    _this.foaRenderer.initialize().then(function () {
	      if (audioContext.state === 'suspended') {
	        _this.trigger({
	          type: 'audiocontext-suspended'
	        });
	      }

	      _this.videoElementSource.connect(_this.foaRenderer.input);

	      _this.foaRenderer.output.connect(audioContext.destination);

	      _this.initialized = true;

	      _this.trigger({
	        type: 'omnitone-ready'
	      });
	    }, function (error) {
	      videojs.log.warn("videojs-vr: Omnitone initializes failed with the following error: " + error + ")");
	    });

	    return _this;
	  }
	  /**
	   * Updates the rotation of the Omnitone decoder based on three.js camera matrix.
	   *
	   * @param {Camera} camera Three.js camera object
	   */


	  var _proto = OmnitoneController.prototype;

	  _proto.update = function update(camera) {
	    if (!this.initialized) {
	      return;
	    }

	    this.foaRenderer.setRotationMatrixFromCamera(camera.matrix);
	  }
	  /**
	   * Destroys the controller and does any necessary cleanup.
	   */
	  ;

	  _proto.dispose = function dispose() {
	    this.initialized = false;
	    this.foaRenderer.setRenderingMode('bypass');
	    this.foaRenderer = null;
	  };

	  return OmnitoneController;
	}(videojs.EventTarget);

	var BigPlayButton = videojs.getComponent('BigPlayButton');

	var BigVrPlayButton = /*#__PURE__*/function (_BigPlayButton) {
	  _inheritsLoose(BigVrPlayButton, _BigPlayButton);

	  function BigVrPlayButton() {
	    return _BigPlayButton.apply(this, arguments) || this;
	  }

	  var _proto = BigVrPlayButton.prototype;

	  _proto.buildCSSClass = function buildCSSClass() {
	    return "vjs-big-vr-play-button " + _BigPlayButton.prototype.buildCSSClass.call(this);
	  };

	  return BigVrPlayButton;
	}(BigPlayButton);

	videojs.registerComponent('BigVrPlayButton', BigVrPlayButton);

	var defaults = {
	  debug: false,
	  omnitone: false,
	  forceCardboard: false,
	  omnitoneOptions: {},
	  projection: 'AUTO',
	  sphereDetail: 32,
	  disableTogglePlay: false
	};
	var errors = {
	  'web-vr-out-of-date': {
	    headline: '360 is out of date',
	    type: '360_OUT_OF_DATE',
	    message: "Your browser supports 360 but not the latest version. See <a href='http://webvr.info'>http://webvr.info</a> for more info."
	  },
	  'web-vr-not-supported': {
	    headline: '360 not supported on this device',
	    type: '360_NOT_SUPPORTED',
	    message: "Your browser does not support 360. See <a href='http://webvr.info'>http://webvr.info</a> for assistance."
	  },
	  'web-vr-hls-cors-not-supported': {
	    headline: '360 HLS video not supported on this device',
	    type: '360_NOT_SUPPORTED',
	    message: "Your browser/device does not support HLS 360 video. See <a href='http://webvr.info'>http://webvr.info</a> for assistance."
	  }
	};
	var Plugin = videojs.getPlugin('plugin');
	var Component = videojs.getComponent('Component');

	var VR = /*#__PURE__*/function (_Plugin) {
	  _inheritsLoose(VR, _Plugin);

	  function VR(player, options) {
	    var _this;

	    var settings = videojs.mergeOptions(defaults, options);
	    _this = _Plugin.call(this, player, settings) || this;
	    _this.options_ = settings;
	    _this.player_ = player;
	    _this.bigPlayButtonIndex_ = player.children().indexOf(player.getChild('BigPlayButton')) || 0; // custom videojs-errors integration boolean

	    _this.videojsErrorsSupport_ = !!videojs.errors;

	    if (_this.videojsErrorsSupport_) {
	      player.errors({
	        errors: errors
	      });
	    } // IE 11 does not support enough webgl to be supported
	    // older safari does not support cors, so it wont work


	    if (videojs.browser.IE_VERSION || !corsSupport) {
	      // if a player triggers error before 'loadstart' is fired
	      // video.js will reset the error overlay
	      _this.player_.on('loadstart', function () {
	        _this.triggerError_({
	          code: 'web-vr-not-supported',
	          dismiss: false
	        });
	      });

	      return _assertThisInitialized(_this);
	    }

	    _this.animate_ = videojs.bind(_assertThisInitialized(_this), _this.animate_);

	    _this.on(player, 'loadedmetadata', _this.init);

	    return _this;
	  }

	  var _proto = VR.prototype;

	  _proto.triggerError_ = function triggerError_(errorObj) {
	    // if we have videojs-errors use it
	    if (this.videojsErrorsSupport_) {
	      this.player_.error(errorObj); // if we don't have videojs-errors just use a normal player error
	    } else {
	      // strip any html content from the error message
	      // as it is not supported outside of videojs-errors
	      var div = document$1.createElement('div');
	      div.innerHTML = errors[errorObj.code].message;
	      var message = div.textContent || div.innerText || '';
	      this.player_.error({
	        code: errorObj.code,
	        message: message
	      });
	    }
	  };

	  _proto.requestAnimationFrame = function requestAnimationFrame(fn) {
	    if (this.vrDisplay) {
	      return this.vrDisplay.requestAnimationFrame(fn);
	    }

	    return this.player_.requestAnimationFrame(fn);
	  };

	  _proto.cancelAnimationFrame = function cancelAnimationFrame(id) {
	    if (this.vrDisplay) {
	      return this.vrDisplay.cancelAnimationFrame(id);
	    }

	    return this.player_.cancelAnimationFrame(id);
	  };

	  _proto.init = function init() {
	    this.reset();
	    this.scene = new THREE.Scene();
	    this.renderer = new THREE.WebGLRenderer({
	      devicePixelRatio: window$1.devicePixelRatio,
	      alpha: false,
	      clearColor: 0xffffff,
	      antialias: true
	    });
	    this.renderer.setSize(this.player_.currentWidth(), this.player_.currentHeight());
	    this.camera = new THREE.PerspectiveCamera(75, this.player_.currentWidth() / this.player_.currentHeight(), 1, 1000);
	    this.camera.position.set(0, 0, 300);
	    this.orbitController = new THREE.OrbitControls(this.camera, this.renderer.domElement);
	    this.orbitController.enableZoom = false; //Disable zoom in/out so that the user will have to stay in the sphere we created.

	    this.orbitController.update();
	    this.vrController = new THREE.VRControls(this.camera);
	    this.videoTexture = new THREE.VideoTexture(this.getVideoEl_());
	    this.videoTexture.generateMipmaps = false;
	    this.videoTexture.minFilter = THREE.LinearFilter;
	    this.videoTexture.magFilter = THREE.LinearFilter;
	    this.videoTexture.format = THREE.RGBFormat; // Store vector representing the direction in which the camera is looking, in world space.

	    this.cameraVector = new THREE.Vector3();
	    this.movieGeometry = new THREE.SphereBufferGeometry(500, 60, 40);
	    this.movieGeometry.scale(-1, 1, 1);
	    this.movieMaterial = new THREE.MeshBasicMaterial({
	      map: this.videoTexture,
	      side: THREE.DoubleSide
	    });
	    this.movieScreen = new THREE.Mesh(this.movieGeometry, this.movieMaterial);
	    this.movieScreen.rotation.y = Math.PI / 2;
	    this.scene.add(this.movieScreen);
	    this.setupStage();
	    this.vrEffect = new THREE.VREffect(this.renderer);
	    this.vrEffect.setSize(this.player_.currentWidth(), this.player_.currentHeight());
	    this.renderedCanvas = this.renderer.domElement;
	    this.renderedCanvas.setAttribute('style', 'width: 100%; height: 100%; position: absolute; top:0;');
	    var videoElStyle = this.getVideoEl_().style;
	    this.player_.el().insertBefore(this.renderedCanvas, this.player_.el().firstChild);
	    videoElStyle.zIndex = '-1';
	    videoElStyle.opacity = '0';
	    var options = {
	      color: 'black',
	      background: 'white',
	      corners: 'square'
	    };
	    var enterVR = new EnterVRButton(this.renderer.domElement, options);
	    this.player_.el().appendChild(enterVR.domElement);
	    this.initialized_ = true;
	    this.trigger('initialized');
	  };

	  _proto.animate_ = function animate_() {
	    if (!this.initialized_) {
	      return;
	    }

	    if (this.getVideoEl_().readyState === this.getVideoEl_().HAVE_ENOUGH_DATA) {
	      if (this.videoTexture) {
	        this.videoTexture.needsUpdate = true;
	      }
	    }

	    this.movieScreen.y += 0.0004;
	    this.vrEffect.render(this.scene, this.camera);
	    this.animationFrameId_ = this.vrDisplay.requestAnimationFrame(this.animate_);
	  };

	  _proto.setupStage = function setupStage() {
	    var self = this;
	    navigator.getVRDisplays().then(function (displays) {
	      if (displays.length > 0) {
	        self.vrDisplay = displays[0];

	        if (self.vrDisplay.stageParameters) {
	          setStageDimensions(self.vrDisplay.stageParameters);
	        }

	        self.vrDisplay.requestAnimationFrame(self.animate_);
	      }
	    });
	  };

	  _proto.setStageDimensions = function setStageDimensions(stage) {
	    // Make the skybox fit the stage.
	    var material = this.movieScreen.material;
	    scene.remove(this.movieScreen); // Size the skybox according to the size of the actual stage.

	    var geometry = new THREE.BoxGeometry(stage.sizeX, boxSize, stage.sizeZ);
	    this.movieScreen = new THREE.Mesh(geometry, material); // Place it on the floor.

	    this.movieScreen.position.y = boxSize / 2;
	    scene.add(this.movieScreen);
	  };

	  _proto.getVideoEl_ = function getVideoEl_() {
	    return this.player_.el().getElementsByTagName('video')[0];
	  };

	  _proto.reset = function reset() {
	    if (!this.initialized_) {
	      return;
	    } // re-add the big play button to player


	    if (!this.player_.getChild('BigPlayButton')) {
	      this.player_.addChild('BigPlayButton', {}, this.bigPlayButtonIndex_);
	    }

	    if (this.player_.getChild('BigVrPlayButton')) {
	      this.player_.removeChild('BigVrPlayButton');
	    } // reset the video element style so that it will be displayed


	    var videoElStyle = this.getVideoEl_().style;
	    videoElStyle.zIndex = '';
	    videoElStyle.opacity = ''; // set the current projection to the default

	    this.currentProjection_ = this.defaultProjection_; // remove the old canvas

	    if (this.renderedCanvas) {
	      this.renderedCanvas.parentNode.removeChild(this.renderedCanvas);
	    }

	    if (this.animationFrameId_) {
	      this.cancelAnimationFrame(this.animationFrameId_);
	    }

	    this.initialized_ = false;
	  };

	  _proto.dispose = function dispose() {
	    _Plugin.prototype.dispose.call(this);

	    this.reset();
	  };

	  return VR;
	}(Plugin);

	VR.prototype.setTimeout = Component.prototype.setTimeout;
	VR.prototype.clearTimeout = Component.prototype.clearTimeout;
	VR.VERSION = version;
	videojs.registerPlugin('vr', VR);

	return VR;

}));
