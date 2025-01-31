/*! @name videojs-vr @version 1.10.0 @license Apache-2.0 */
import _assertThisInitialized from '@babel/runtime/helpers/assertThisInitialized';
import _inheritsLoose from '@babel/runtime/helpers/inheritsLoose';
import window from 'global/window';
import document from 'global/document';
import { EnterVRButton } from 'webvr-ui';
import videojs from 'video.js';

var version = "1.10.0";

var corsSupport = function () {
  var video = document.createElement('video');
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

var defaults = {
  debug: false,
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

    _this.on(player, 'click', function () {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(function (permissionState) {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', function () {
              document.getElementById('access').innerHTML = 'Granted';
            });
          }
        }).catch(console.error);
      }
    });

    return _this;
  }

  var _proto = VR.prototype;

  _proto.handleResize = function handleResize() {
    this.camera.aspect = this.player_.currentWidth() / this.player_.currentHeight();
    this.camera.updateProjectionMatrix();

    if (this.player_.isFullscreen()) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.vrEffect.setSize(window.innerWidth, window.innerHeight);
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
      var div = document.createElement('div');
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
    var _this2 = this;

    this.reset();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      devicePixelRatio: window.devicePixelRatio,
      alpha: false,
      clearColor: 0xffffff,
      antialias: true
    });
    this.renderer.setSize(this.player_.currentWidth(), this.player_.currentHeight());
    this.camera = new THREE.PerspectiveCamera(75, this.player_.currentWidth() / this.player_.currentHeight(), 0.1, 1000);
    this.camera.position.z = 50;
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
    this.movieGeometry = new THREE.SphereBufferGeometry(512, 32, 32);
    this.movieMaterial = new THREE.MeshBasicMaterial({
      map: this.videoTexture //overdraw: true,
      //side: THREE.BackSide

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
    this.enterVR = new EnterVRButton(this.renderer.domElement, options);
    this.player_.el().appendChild(this.enterVR.domElement);
    this.initialized_ = true;
    this.trigger('initialized');
    window.addEventListener('resize', this.handleResize, true);
    window.addEventListener('vrdisplaypresentchange', this.handleResize, true);
    this.player_.on('useractive', function () {
      _this2.enterVR.show();
    });
    this.player_.on('userinactive', function () {
      _this2.enterVR.hide();
    });
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

    if (this.player_.paused()) {
      this.movieScreen.rotation.y += 0.0004;
    }

    this.vrEffect.render(this.scene, this.camera);
    this.animationFrameId_ = this.vrDisplay.requestAnimationFrame(this.animate_);
  };

  _proto.setupStage = function setupStage() {
    var self = this;
    navigator.getVRDisplays().then(function (displays) {
      if (displays.length > 0) {
        self.vrDisplay = displays[0];
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
