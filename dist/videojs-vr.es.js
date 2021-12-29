/*! @name videojs-vr @version 1.10.0 @license Apache-2.0 */
import _assertThisInitialized from '@babel/runtime/helpers/assertThisInitialized';
import _inheritsLoose from '@babel/runtime/helpers/inheritsLoose';
import window$1 from 'global/window';
import document$1 from 'global/document';
import { EnterVRButton } from 'webvr-ui';
import videojs from 'video.js';
import { EventDispatcher, Vector3, MOUSE, Quaternion, Spherical, Vector2, Euler, Math as Math$1 } from 'three';

var version = "1.10.0";

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

  this.target = new Vector3(); // How far you can dolly in and out ( PerspectiveCamera only )

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
    ORBIT: MOUSE.LEFT,
    ZOOM: MOUSE.MIDDLE,
    PAN: MOUSE.RIGHT
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
    var offset = new Vector3(); // so camera.up is the orbit axis

    var quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
    var quatInverse = quat.clone().inverse();
    var lastPosition = new Vector3();
    var lastQuaternion = new Quaternion();
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

  var spherical = new Spherical();
  var sphericalDelta = new Spherical();
  var scale = 1;
  var panOffset = new Vector3();
  var zoomChanged = false;
  var rotateStart = new Vector2();
  var rotateEnd = new Vector2();
  var rotateDelta = new Vector2();
  var panStart = new Vector2();
  var panEnd = new Vector2();
  var panDelta = new Vector2();
  var dollyStart = new Vector2();
  var dollyEnd = new Vector2();
  var dollyDelta = new Vector2();

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
    var v = new Vector3();
    return function panLeft(distance, objectMatrix) {
      v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix

      v.multiplyScalar(-distance);
      panOffset.add(v);
    };
  }();

  var panUp = function () {
    var v = new Vector3();
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
    var offset = new Vector3();
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

OrbitControls.prototype = Object.create(EventDispatcher.prototype);
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

var DeviceOrientationControls = function DeviceOrientationControls(object) {
  var scope = this;
  this.object = object;
  this.object.rotation.reorder('YXZ');
  this.enabled = true;
  this.deviceOrientation = {};
  this.screenOrientation = 0;
  this.alphaOffset = 0; // radians

  var onDeviceOrientationChangeEvent = function onDeviceOrientationChangeEvent(event) {
    scope.deviceOrientation = event;
  };

  var onScreenOrientationChangeEvent = function onScreenOrientationChangeEvent() {
    scope.screenOrientation = window.orientation || 0;
  }; // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''


  var setObjectQuaternion = function () {
    var zee = new Vector3(0, 0, 1);
    var euler = new Euler();
    var q0 = new Quaternion();
    var q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis

    return function (quaternion, alpha, beta, gamma, orient) {
      euler.set(beta, alpha, -gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us

      quaternion.setFromEuler(euler); // orient the device

      quaternion.multiply(q1); // camera looks out the back of the device, not the top

      quaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // adjust for screen orientation
    };
  }();

  this.connect = function () {
    onScreenOrientationChangeEvent(); // run once on load

    window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
    window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
    scope.enabled = true;
  };

  this.disconnect = function () {
    window.removeEventListener('orientationchange', onScreenOrientationChangeEvent, false);
    window.removeEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
    scope.enabled = false;
  };

  this.update = function () {
    if (scope.enabled === false) return;
    var device = scope.deviceOrientation;

    if (device) {
      var alpha = device.alpha ? Math$1.degToRad(device.alpha) + scope.alphaOffset : 0; // Z

      var beta = device.beta ? Math$1.degToRad(device.beta) : 0; // X'

      var gamma = device.gamma ? Math$1.degToRad(device.gamma) : 0; // Y''

      var orient = scope.screenOrientation ? Math$1.degToRad(scope.screenOrientation) : 0; // O

      setObjectQuaternion(scope.object.quaternion, alpha, beta, gamma, orient);
    }
  };

  this.dispose = function () {
    scope.disconnect();
  };

  this.connect();
};

/**
 * Convert a quaternion to an angle
 *
 * Taken from https://stackoverflow.com/a/35448946
 * Thanks P. Ellul
 */

function Quat2Angle(x, y, z, w) {
  var test = x * y + z * w; // singularity at north pole

  if (test > 0.499) {
    var _yaw = 2 * Math.atan2(x, w);

    var _pitch = Math.PI / 2;

    var _roll = 0;
    return new Vector3(_pitch, _roll, _yaw);
  } // singularity at south pole


  if (test < -0.499) {
    var _yaw2 = -2 * Math.atan2(x, w);

    var _pitch2 = -Math.PI / 2;

    var _roll2 = 0;
    return new Vector3(_pitch2, _roll2, _yaw2);
  }

  var sqx = x * x;
  var sqy = y * y;
  var sqz = z * z;
  var yaw = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz);
  var pitch = Math.asin(2 * test);
  var roll = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz);
  return new Vector3(pitch, roll, yaw);
}

var OrbitOrientationControls = /*#__PURE__*/function () {
  function OrbitOrientationControls(options) {
    this.object = options.camera;
    this.domElement = options.canvas;
    this.orbit = new OrbitControls(this.object, this.domElement);
    this.speed = 0.5;
    this.orbit.target.set(0, 0, -1);
    this.orbit.enableZoom = false;
    this.orbit.enablePan = false;
    this.orbit.rotateSpeed = -this.speed; // if orientation is supported

    if (options.orientation) {
      this.orientation = new DeviceOrientationControls(this.object);
    } // if projection is not full view
    // limit the rotation angle in order to not display back half view


    if (options.halfView) {
      this.orbit.minAzimuthAngle = -Math.PI / 4;
      this.orbit.maxAzimuthAngle = Math.PI / 4;
    }
  }

  var _proto = OrbitOrientationControls.prototype;

  _proto.update = function update() {
    // orientation updates the camera using quaternions and
    // orbit updates the camera using angles. They are incompatible
    // and one update overrides the other. So before
    // orbit overrides orientation we convert our quaternion changes to
    // an angle change. Then save the angle into orbit so that
    // it will take those into account when it updates the camera and overrides
    // our changes
    if (this.orientation) {
      this.orientation.update();
      var quat = this.orientation.object.quaternion;
      var currentAngle = Quat2Angle(quat.x, quat.y, quat.z, quat.w); // we also have to store the last angle since quaternions are b

      if (typeof this.lastAngle_ === 'undefined') {
        this.lastAngle_ = currentAngle;
      }

      this.orbit.rotateLeft((this.lastAngle_.z - currentAngle.z) * (1 + this.speed));
      this.orbit.rotateUp((this.lastAngle_.y - currentAngle.y) * (1 + this.speed));
      this.lastAngle_ = currentAngle;
    }

    this.orbit.update();
  };

  _proto.dispose = function dispose() {
    this.orbit.dispose();

    if (this.orientation) {
      this.orientation.dispose();
    }
  };

  return OrbitOrientationControls;
}();

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

    _this.animate_ = videojs.bind(_assertThisInitialized(_this), _this.animate_); //this.player.on('play', this.motion.bind(this, 'play'));

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
    var enterVR = new EnterVRButton(this.renderer.domElement, options);
    this.player_.el().appendChild(enterVR.domElement);
    enterVR.on('show', function () {});
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
    } // This is for the mobile motion


    this.controls3d.update(); //this.movieScreen.y += 0.0004;

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

        if (!self.controls3d) {
          console.log('no HMD found Using Orbit & Orientation Controls');
          var options = {
            camera: self.camera,
            canvas: self.renderedCanvas,
            // check if its a half sphere view projection
            //halfView: self.currentProjection_.indexOf('180') === 0,
            orientation: videojs.browser.IS_IOS || videojs.browser.IS_ANDROID || false
          };

          if (self.options_.motionControls === false) {
            options.orientation = false;
          }

          self.controls3d = new OrbitOrientationControls(options); //self.canvasPlayerControls = new CanvasPlayerControls(self.player_, self.renderedCanvas, self.options_);
        }

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

export default VR;
