/*! @name videojs-vr @version 1.10.0 @license Apache-2.0 */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _assertThisInitialized = _interopDefault(require('@babel/runtime/helpers/assertThisInitialized'));
var _inheritsLoose = _interopDefault(require('@babel/runtime/helpers/inheritsLoose'));
var window$1 = _interopDefault(require('global/window'));
var document$1 = _interopDefault(require('global/document'));
var webvrui = require('webvr-ui');
var videojs = _interopDefault(require('video.js'));
var THREE$1 = require('three');

var version = "1.10.0";

var corsSupport = function () {
  var video = document$1.createElement('video');
  video.crossOrigin = 'anonymous';
  return video.hasAttribute('crossorigin');
}();

/**
 * This class reacts to interactions with the canvas and
 * triggers appropriate functionality on the player. Right now
 * it does two things:
 *
 * 1. A `mousedown`/`touchstart` followed by `touchend`/`mouseup` without any
 *    `touchmove` or `mousemove` toggles play/pause on the player
 * 2. Only moving on/clicking the control bar or toggling play/pause should
 *    show the control bar. Moving around the scene in the canvas should not.
 */

var CanvasPlayerControls = /*#__PURE__*/function (_videojs$EventTarget) {
  _inheritsLoose(CanvasPlayerControls, _videojs$EventTarget);

  function CanvasPlayerControls(player, canvas, options) {
    var _this;

    _this = _videojs$EventTarget.call(this) || this;
    _this.player = player;
    _this.canvas = canvas;
    _this.options = options;
    _this.onMoveEnd = videojs.bind(_assertThisInitialized(_this), _this.onMoveEnd);
    _this.onMoveStart = videojs.bind(_assertThisInitialized(_this), _this.onMoveStart);
    _this.onMove = videojs.bind(_assertThisInitialized(_this), _this.onMove);
    _this.onControlBarMove = videojs.bind(_assertThisInitialized(_this), _this.onControlBarMove);

    _this.player.controlBar.on(['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend'], _this.onControlBarMove); // we have to override these here because
    // video.js listens for user activity on the video element
    // and makes the user active when the mouse moves.
    // We don't want that for 3d videos


    _this.oldReportUserActivity = _this.player.reportUserActivity;

    _this.player.reportUserActivity = function () {}; // canvas movements


    _this.canvas.addEventListener('mousedown', _this.onMoveStart);

    _this.canvas.addEventListener('touchstart', _this.onMoveStart);

    _this.canvas.addEventListener('mousemove', _this.onMove);

    _this.canvas.addEventListener('touchmove', _this.onMove);

    _this.canvas.addEventListener('mouseup', _this.onMoveEnd);

    _this.canvas.addEventListener('touchend', _this.onMoveEnd);

    _this.shouldTogglePlay = false;
    return _this;
  }

  var _proto = CanvasPlayerControls.prototype;

  _proto.togglePlay = function togglePlay() {
    if (this.player.paused()) {
      this.player.play();
    } else {
      this.player.pause();
    }
  };

  _proto.onMoveStart = function onMoveStart(e) {
    // if the player does not have a controlbar or
    // the move was a mouse click but not left click do not
    // toggle play.
    if (this.options.disableTogglePlay || !this.player.controls() || e.type === 'mousedown' && !videojs.dom.isSingleLeftClick(e)) {
      this.shouldTogglePlay = false;
      return;
    }

    this.shouldTogglePlay = true;
    this.touchMoveCount_ = 0;
  };

  _proto.onMoveEnd = function onMoveEnd(e) {
    // We want to have the same behavior in VR360 Player and standard player.
    // in touchend we want to know if was a touch click, for a click we show the bar,
    // otherwise continue with the mouse logic.
    //
    // Maximum movement allowed during a touch event to still be considered a tap
    // Other popular libs use anywhere from 2 (hammer.js) to 15,
    // so 10 seems like a nice, round number.
    if (e.type === 'touchend' && this.touchMoveCount_ < 10) {
      if (this.player.userActive() === false) {
        this.player.userActive(true);
        return;
      }

      this.player.userActive(false);
      return;
    }

    if (!this.shouldTogglePlay) {
      return;
    } // We want the same behavior in Desktop for VR360  and standard player


    if (e.type === 'mouseup') {
      this.togglePlay();
    }
  };

  _proto.onMove = function onMove(e) {
    // Increase touchMoveCount_ since Android detects 1 - 6 touches when user click normally
    this.touchMoveCount_++;
    this.shouldTogglePlay = false;
  };

  _proto.onControlBarMove = function onControlBarMove(e) {
    this.player.userActive(true);
  };

  _proto.dispose = function dispose() {
    this.canvas.removeEventListener('mousedown', this.onMoveStart);
    this.canvas.removeEventListener('touchstart', this.onMoveStart);
    this.canvas.removeEventListener('mousemove', this.onMove);
    this.canvas.removeEventListener('touchmove', this.onMove);
    this.canvas.removeEventListener('mouseup', this.onMoveEnd);
    this.canvas.removeEventListener('touchend', this.onMoveEnd);
    this.player.controlBar.off(['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend'], this.onControlBarMove);
    this.player.reportUserActivity = this.oldReportUserActivity;
  };

  return CanvasPlayerControls;
}(videojs.EventTarget);

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

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 *
 * originally from https://github.com/mrdoob/three.js/blob/r93/examples/js/controls/OrbitControls.js
 */
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or arrow keys / touch: two-finger move

var OrbitControls = function OrbitControls(object, domElement) {
  this.object = object;
  this.domElement = domElement !== undefined ? domElement : document; // Set to false to disable this control

  this.enabled = true; // "target" sets the location of focus, where the object orbits around

  this.target = new THREE$1.Vector3(); // How far you can dolly in and out ( PerspectiveCamera only )

  this.minDistance = 0;
  this.maxDistance = Infinity; // How far you can zoom in and out ( OrthographicCamera only )

  this.minZoom = 0;
  this.maxZoom = Infinity; // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.

  this.minPolarAngle = 0; // radians

  this.maxPolarAngle = Math.PI; // radians
  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].

  this.minAzimuthAngle = -Infinity; // radians

  this.maxAzimuthAngle = Infinity; // radians
  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop

  this.enableDamping = false;
  this.dampingFactor = 0.25; // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming

  this.enableZoom = true;
  this.zoomSpeed = 1.0; // Set to false to disable rotating

  this.enableRotate = true;
  this.rotateSpeed = 1.0; // Set to false to disable panning

  this.enablePan = true;
  this.panSpeed = 1.0;
  this.screenSpacePanning = false; // if true, pan in screen-space

  this.keyPanSpeed = 7.0; // pixels moved per arrow key push
  // Set to true to automatically rotate around the target
  // If auto-rotate is enabled, you must call controls.update() in your animation loop

  this.autoRotate = false;
  this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60
  // Set to false to disable use of the keys

  this.enableKeys = true; // The four arrow keys

  this.keys = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    BOTTOM: 40
  }; // Mouse buttons

  this.mouseButtons = {
    ORBIT: THREE$1.MOUSE.LEFT,
    ZOOM: THREE$1.MOUSE.MIDDLE,
    PAN: THREE$1.MOUSE.RIGHT
  }; // for reset

  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();
  this.zoom0 = this.object.zoom; //
  // public methods
  //

  this.getPolarAngle = function () {
    return spherical.phi;
  };

  this.getAzimuthalAngle = function () {
    return spherical.theta;
  };

  this.saveState = function () {
    scope.target0.copy(scope.target);
    scope.position0.copy(scope.object.position);
    scope.zoom0 = scope.object.zoom;
  };

  this.reset = function () {
    scope.target.copy(scope.target0);
    scope.object.position.copy(scope.position0);
    scope.object.zoom = scope.zoom0;
    scope.object.updateProjectionMatrix();
    scope.dispatchEvent(changeEvent);
    scope.update();
    state = STATE.NONE;
  }; // this method is exposed, but perhaps it would be better if we can make it private...


  this.update = function () {
    var offset = new THREE$1.Vector3(); // so camera.up is the orbit axis

    var quat = new THREE$1.Quaternion().setFromUnitVectors(object.up, new THREE$1.Vector3(0, 1, 0));
    var quatInverse = quat.clone().inverse();
    var lastPosition = new THREE$1.Vector3();
    var lastQuaternion = new THREE$1.Quaternion();
    return function update() {
      var position = scope.object.position;
      offset.copy(position).sub(scope.target); // rotate offset to "y-axis-is-up" space

      offset.applyQuaternion(quat); // angle from z-axis around y-axis

      spherical.setFromVector3(offset);

      if (scope.autoRotate && state === STATE.NONE) {
        scope.rotateLeft(getAutoRotationAngle());
      }

      spherical.theta += sphericalDelta.theta;
      spherical.phi += sphericalDelta.phi; // restrict theta to be between desired limits

      spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta)); // restrict phi to be between desired limits

      spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
      spherical.makeSafe();
      spherical.radius *= scale; // restrict radius to be between desired limits

      spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius)); // move target to panned location

      scope.target.add(panOffset);
      offset.setFromSpherical(spherical); // rotate offset back to "camera-up-vector-is-up" space

      offset.applyQuaternion(quatInverse);
      position.copy(scope.target).add(offset);
      scope.object.lookAt(scope.target);

      if (scope.enableDamping === true) {
        sphericalDelta.theta *= 1 - scope.dampingFactor;
        sphericalDelta.phi *= 1 - scope.dampingFactor;
        panOffset.multiplyScalar(1 - scope.dampingFactor);
      } else {
        sphericalDelta.set(0, 0, 0);
        panOffset.set(0, 0, 0);
      }

      scale = 1; // update condition is:
      // min(camera displacement, camera rotation in radians)^2 > EPS
      // using small-angle approximation cos(x/2) = 1 - x^2 / 8

      if (zoomChanged || lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
        scope.dispatchEvent(changeEvent);
        lastPosition.copy(scope.object.position);
        lastQuaternion.copy(scope.object.quaternion);
        zoomChanged = false;
        return true;
      }

      return false;
    };
  }();

  this.dispose = function () {
    scope.domElement.removeEventListener('contextmenu', onContextMenu, false);
    scope.domElement.removeEventListener('mousedown', onMouseDown, false);
    scope.domElement.removeEventListener('wheel', onMouseWheel, false);
    scope.domElement.removeEventListener('touchstart', onTouchStart, false);
    scope.domElement.removeEventListener('touchend', onTouchEnd, false);
    scope.domElement.removeEventListener('touchmove', onTouchMove, false);
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    window.removeEventListener('keydown', onKeyDown, false); //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
  }; //
  // internals
  //


  var scope = this;
  var changeEvent = {
    type: 'change'
  };
  var startEvent = {
    type: 'start'
  };
  var endEvent = {
    type: 'end'
  };
  var STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY_PAN: 4
  };
  var state = STATE.NONE;
  var EPS = 0.000001; // current position in spherical coordinates

  var spherical = new THREE$1.Spherical();
  var sphericalDelta = new THREE$1.Spherical();
  var scale = 1;
  var panOffset = new THREE$1.Vector3();
  var zoomChanged = false;
  var rotateStart = new THREE$1.Vector2();
  var rotateEnd = new THREE$1.Vector2();
  var rotateDelta = new THREE$1.Vector2();
  var panStart = new THREE$1.Vector2();
  var panEnd = new THREE$1.Vector2();
  var panDelta = new THREE$1.Vector2();
  var dollyStart = new THREE$1.Vector2();
  var dollyEnd = new THREE$1.Vector2();
  var dollyDelta = new THREE$1.Vector2();

  function getAutoRotationAngle() {
    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
  }

  function getZoomScale() {
    return Math.pow(0.95, scope.zoomSpeed);
  }

  scope.rotateLeft = function rotateLeft(angle) {
    sphericalDelta.theta -= angle;
  };

  scope.rotateUp = function rotateUp(angle) {
    sphericalDelta.phi -= angle;
  };

  var panLeft = function () {
    var v = new THREE$1.Vector3();
    return function panLeft(distance, objectMatrix) {
      v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix

      v.multiplyScalar(-distance);
      panOffset.add(v);
    };
  }();

  var panUp = function () {
    var v = new THREE$1.Vector3();
    return function panUp(distance, objectMatrix) {
      if (scope.screenSpacePanning === true) {
        v.setFromMatrixColumn(objectMatrix, 1);
      } else {
        v.setFromMatrixColumn(objectMatrix, 0);
        v.crossVectors(scope.object.up, v);
      }

      v.multiplyScalar(distance);
      panOffset.add(v);
    };
  }(); // deltaX and deltaY are in pixels; right and down are positive


  var pan = function () {
    var offset = new THREE$1.Vector3();
    return function pan(deltaX, deltaY) {
      var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

      if (scope.object.isPerspectiveCamera) {
        // perspective
        var position = scope.object.position;
        offset.copy(position).sub(scope.target);
        var targetDistance = offset.length(); // half of the fov is center to top of screen

        targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180.0); // we use only clientHeight here so aspect ratio does not distort speed

        panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
        panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
      } else if (scope.object.isOrthographicCamera) {
        // orthographic
        panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
        panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);
      } else {
        // camera neither orthographic nor perspective
        console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
        scope.enablePan = false;
      }
    };
  }();

  function dollyIn(dollyScale) {
    if (scope.object.isPerspectiveCamera) {
      scale /= dollyScale;
    } else if (scope.object.isOrthographicCamera) {
      scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
      scope.object.updateProjectionMatrix();
      zoomChanged = true;
    } else {
      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
      scope.enableZoom = false;
    }
  }

  function dollyOut(dollyScale) {
    if (scope.object.isPerspectiveCamera) {
      scale *= dollyScale;
    } else if (scope.object.isOrthographicCamera) {
      scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
      scope.object.updateProjectionMatrix();
      zoomChanged = true;
    } else {
      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
      scope.enableZoom = false;
    }
  } //
  // event callbacks - update the object state
  //


  function handleMouseDownRotate(event) {
    //console.log( 'handleMouseDownRotate' );
    rotateStart.set(event.clientX, event.clientY);
  }

  function handleMouseDownDolly(event) {
    //console.log( 'handleMouseDownDolly' );
    dollyStart.set(event.clientX, event.clientY);
  }

  function handleMouseDownPan(event) {
    //console.log( 'handleMouseDownPan' );
    panStart.set(event.clientX, event.clientY);
  }

  function handleMouseMoveRotate(event) {
    //console.log( 'handleMouseMoveRotate' );
    rotateEnd.set(event.clientX, event.clientY);
    rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
    scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height

    scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
    rotateStart.copy(rotateEnd);
    scope.update();
  }

  function handleMouseMoveDolly(event) {
    //console.log( 'handleMouseMoveDolly' );
    dollyEnd.set(event.clientX, event.clientY);
    dollyDelta.subVectors(dollyEnd, dollyStart);

    if (dollyDelta.y > 0) {
      dollyIn(getZoomScale());
    } else if (dollyDelta.y < 0) {
      dollyOut(getZoomScale());
    }

    dollyStart.copy(dollyEnd);
    scope.update();
  }

  function handleMouseMovePan(event) {
    //console.log( 'handleMouseMovePan' );
    panEnd.set(event.clientX, event.clientY);
    panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
    pan(panDelta.x, panDelta.y);
    panStart.copy(panEnd);
    scope.update();
  }

  function handleMouseWheel(event) {
    // console.log( 'handleMouseWheel' );
    if (event.deltaY < 0) {
      dollyOut(getZoomScale());
    } else if (event.deltaY > 0) {
      dollyIn(getZoomScale());
    }

    scope.update();
  }

  function handleKeyDown(event) {
    //console.log( 'handleKeyDown' );
    switch (event.keyCode) {
      case scope.keys.UP:
        pan(0, scope.keyPanSpeed);
        scope.update();
        break;

      case scope.keys.BOTTOM:
        pan(0, -scope.keyPanSpeed);
        scope.update();
        break;

      case scope.keys.LEFT:
        pan(scope.keyPanSpeed, 0);
        scope.update();
        break;

      case scope.keys.RIGHT:
        pan(-scope.keyPanSpeed, 0);
        scope.update();
        break;
    }
  }

  function handleTouchStartRotate(event) {
    //console.log( 'handleTouchStartRotate' );
    rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
  }

  function handleTouchStartDollyPan(event) {
    //console.log( 'handleTouchStartDollyPan' );
    if (scope.enableZoom) {
      var dx = event.touches[0].pageX - event.touches[1].pageX;
      var dy = event.touches[0].pageY - event.touches[1].pageY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      dollyStart.set(0, distance);
    }

    if (scope.enablePan) {
      var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
      var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
      panStart.set(x, y);
    }
  }

  function handleTouchMoveRotate(event) {
    //console.log( 'handleTouchMoveRotate' );
    rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
    rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
    scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height

    scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
    rotateStart.copy(rotateEnd);
    scope.update();
  }

  function handleTouchMoveDollyPan(event) {
    //console.log( 'handleTouchMoveDollyPan' );
    if (scope.enableZoom) {
      var dx = event.touches[0].pageX - event.touches[1].pageX;
      var dy = event.touches[0].pageY - event.touches[1].pageY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      dollyEnd.set(0, distance);
      dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));
      dollyIn(dollyDelta.y);
      dollyStart.copy(dollyEnd);
    }

    if (scope.enablePan) {
      var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
      var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
      panEnd.set(x, y);
      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x, panDelta.y);
      panStart.copy(panEnd);
    }

    scope.update();
  }

  function handleTouchEnd(event) {
    //console.log( 'handleTouchEnd' );
    //console.log( 'handleTouchEnd' );
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(function (permissionState) {
        if (permissionState === 'granted') {
          window.addEventListener('devicemotion', function () {});
        }
      }).catch(console.error);
    }
  } //
  // event handlers - FSM: listen for events and reset state
  //


  function onMouseDown(event) {
    if (scope.enabled === false) return;
    event.preventDefault();

    switch (event.button) {
      case scope.mouseButtons.ORBIT:
        if (scope.enableRotate === false) return;
        handleMouseDownRotate(event);
        state = STATE.ROTATE;
        break;

      case scope.mouseButtons.ZOOM:
        if (scope.enableZoom === false) return;
        handleMouseDownDolly(event);
        state = STATE.DOLLY;
        break;

      case scope.mouseButtons.PAN:
        if (scope.enablePan === false) return;
        handleMouseDownPan(event);
        state = STATE.PAN;
        break;
    }

    if (state !== STATE.NONE) {
      document.addEventListener('mousemove', onMouseMove, false);
      document.addEventListener('mouseup', onMouseUp, false);
      scope.dispatchEvent(startEvent);
    }
  }

  function onMouseMove(event) {
    if (scope.enabled === false) return;
    event.preventDefault();

    switch (state) {
      case STATE.ROTATE:
        if (scope.enableRotate === false) return;
        handleMouseMoveRotate(event);
        break;

      case STATE.DOLLY:
        if (scope.enableZoom === false) return;
        handleMouseMoveDolly(event);
        break;

      case STATE.PAN:
        if (scope.enablePan === false) return;
        handleMouseMovePan(event);
        break;
    }
  }

  function onMouseUp(event) {
    if (scope.enabled === false) return;
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    scope.dispatchEvent(endEvent);
    state = STATE.NONE;
  }

  function onMouseWheel(event) {
    if (scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE && state !== STATE.ROTATE) return;
    event.preventDefault();
    event.stopPropagation();
    scope.dispatchEvent(startEvent);
    handleMouseWheel(event);
    scope.dispatchEvent(endEvent);
  }

  function onKeyDown(event) {
    if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false) return;
    handleKeyDown(event);
  }

  function onTouchStart(event) {
    if (scope.enabled === false) return;
    event.preventDefault();

    switch (event.touches.length) {
      case 1:
        // one-fingered touch: rotate
        if (scope.enableRotate === false) return;
        handleTouchStartRotate(event);
        state = STATE.TOUCH_ROTATE;
        break;

      case 2:
        // two-fingered touch: dolly-pan
        if (scope.enableZoom === false && scope.enablePan === false) return;
        handleTouchStartDollyPan(event);
        state = STATE.TOUCH_DOLLY_PAN;
        break;

      default:
        state = STATE.NONE;
    }

    if (state !== STATE.NONE) {
      scope.dispatchEvent(startEvent);
    }
  }

  function onTouchMove(event) {
    if (scope.enabled === false) return;
    event.preventDefault();
    event.stopPropagation();

    switch (event.touches.length) {
      case 1:
        // one-fingered touch: rotate
        if (scope.enableRotate === false) return;
        if (state !== STATE.TOUCH_ROTATE) return; // is this needed?

        handleTouchMoveRotate(event);
        break;

      case 2:
        // two-fingered touch: dolly-pan
        if (scope.enableZoom === false && scope.enablePan === false) return;
        if (state !== STATE.TOUCH_DOLLY_PAN) return; // is this needed?

        handleTouchMoveDollyPan(event);
        break;

      default:
        state = STATE.NONE;
    }
  }

  function onTouchEnd(event) {
    if (scope.enabled === false) return;
    handleTouchEnd(event);
    scope.dispatchEvent(endEvent);
    state = STATE.NONE;
  }

  function onContextMenu(event) {
    if (scope.enabled === false) return;
    event.preventDefault();
  } //
  // scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );


  scope.domElement.addEventListener('mousedown', onMouseDown, false);
  scope.domElement.addEventListener('wheel', onMouseWheel, false);
  scope.domElement.addEventListener('touchstart', onTouchStart, false);
  scope.domElement.addEventListener('touchend', onTouchEnd, false);
  scope.domElement.addEventListener('touchmove', onTouchMove, false);
  window.addEventListener('keydown', onKeyDown, false); // force an update at start

  this.update();
};

OrbitControls.prototype = Object.create(THREE$1.EventDispatcher.prototype);
OrbitControls.prototype.constructor = OrbitControls;
Object.defineProperties(OrbitControls.prototype, {
  center: {
    get: function get() {
      console.warn('THREE.OrbitControls: .center has been renamed to .target');
      return this.target;
    }
  },
  // backward compatibility
  noZoom: {
    get: function get() {
      console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
      return !this.enableZoom;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
      this.enableZoom = !value;
    }
  },
  noRotate: {
    get: function get() {
      console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
      return !this.enableRotate;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
      this.enableRotate = !value;
    }
  },
  noPan: {
    get: function get() {
      console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
      return !this.enablePan;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
      this.enablePan = !value;
    }
  },
  noKeys: {
    get: function get() {
      console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
      return !this.enableKeys;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
      this.enableKeys = !value;
    }
  },
  staticMoving: {
    get: function get() {
      console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
      return !this.enableDamping;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
      this.enableDamping = !value;
    }
  },
  dynamicDampingFactor: {
    get: function get() {
      console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
      return this.dampingFactor;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
      this.dampingFactor = value;
    }
  }
});

/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 *
 * originally from https://github.com/mrdoob/three.js/blob/r93/examples/js/controls/DeviceOrientationControls.js
 */

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
    _this.handleResize = videojs.bind(_assertThisInitialized(_this), _this.handleResize);

    _this.on(player, 'loadedmetadata', _this.init);

    return _this;
  }

  var _proto = VR.prototype;

  _proto.handleResize = function handleResize() {
    this.camera.aspect = this.player_.currentWidth() / this.player_.currentHeight();
    this.camera.updateProjectionMatrix();

    if (this.player_.isFullscreen()) {
      this.renderer.setSize(window$1.innerWidth, window$1.innerHeight);
      this.vrEffect.setSize(window$1.innerWidth, window$1.innerHeight);
    } else {
      this.renderer.setSize(this.player_.currentWidth(), this.player_.currentHeight());
      this.vrEffect.setSize(this.player_.currentWidth(), this.player_.currentHeight());
    }
  };

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
      overdraw: true,
      side: THREE.BackSide
    });
    this.movieScreen = new THREE.Mesh(this.movieGeometry, this.movieMaterial);
    this.movieScreen.rotation.y = Math.PI / 2;
    this.movieScreen.scale.x = -1;
    this.movieScreen.quaternion.setFromAxisAngle({
      x: 0,
      y: 1,
      z: 0
    }, -Math.PI / 2);
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
    var enterVR = new webvrui.EnterVRButton(this.renderer.domElement, options);
    this.player_.el().appendChild(enterVR.domElement);
    enterVR.on('show', function () {});
    this.initialized_ = true;
    this.trigger('initialized');
    window$1.addEventListener('resize', this.handleResize, true);
    window$1.addEventListener('vrdisplaypresentchange', this.handleResize, true);
  };

  _proto.animate_ = function animate_() {
    if (!this.initialized_) {
      return;
    }

    if (this.getVideoEl_().readyState === this.getVideoEl_().HAVE_ENOUGH_DATA) {
      if (this.videoTexture) {
        this.videoTexture.needsUpdate = true;
      }
    } // This is for the mobile motion


    if (this.controls3d) {
      this.controls3d.update();
    }

    this.movieScreen.rotation.y += 0.0004;
    this.vrEffect.render(this.scene, this.camera);
    this.animationFrameId_ = this.vrDisplay.requestAnimationFrame(this.animate_);
  };

  _proto.setupStage = function setupStage() {
    var self = this;
    navigator.getVRDisplays().then(function (displays) {
      if (displays.length > 0) {
        self.vrDisplay = displays[0];

        if (!self.vrDisplay.isPolyfilled) {
          console.log('Real HMD found using VRControls', self.vrDisplay); // We use VRControls here since we are working with an HMD
          // and we only want orientation controls.

          self.controls3d = new VRControls(this.camera);
        }

        self.vrDisplay.requestAnimationFrame(self.animate_);
      }
    });
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
    }

    if (this.controls3d) {
      this.controls3d.dispose();
      this.controls3d = null;
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

module.exports = VR;
