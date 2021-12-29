import {
  version as VERSION
} from '../package.json';
import window from 'global/window';
import document from 'global/document';
import * as webvrui from 'webvr-ui';
import videojs from 'video.js';
import * as utils from './utils';
import OmnitoneController from './omnitone-controller';

// Default options for the plugin.
const defaults = {
  debug: false,
  sphereDetail: 32,
  disableTogglePlay: false
};

const errors = {
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

const Plugin = videojs.getPlugin('plugin');
const Component = videojs.getComponent('Component');

class VR extends Plugin {
  constructor(player, options) {
      const settings = videojs.mergeOptions(defaults, options);

      super(player, settings);

      this.options_ = settings;
      this.player_ = player;
      this.bigPlayButtonIndex_ = player.children().indexOf(player.getChild('BigPlayButton')) || 0;

      // custom videojs-errors integration boolean
      this.videojsErrorsSupport_ = !!videojs.errors;

      if (this.videojsErrorsSupport_) {
          player.errors({
              errors
          });
      }

      // IE 11 does not support enough webgl to be supported
      // older safari does not support cors, so it wont work
      if (videojs.browser.IE_VERSION || !utils.corsSupport) {
          // if a player triggers error before 'loadstart' is fired
          // video.js will reset the error overlay
          this.player_.on('loadstart', () => {
              this.triggerError_({
                  code: 'web-vr-not-supported',
                  dismiss: false
              });
          });
          return;
      }

      this.animate_ = videojs.bind(this, this.animate_);
      this.handleResize = videojs.bind(this, this.handleResize);
      this.on(player, 'loadedmetadata', this.init);
      this.on(player, 'click', function() {

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          DeviceMotionEvent.requestPermission()
            .then(permissionState => {
              if (permissionState === 'granted') {
                window.addEventListener('devicemotion', () => {
                  document.getElementById('access').innerHTML = 'Granted';
                });
              }
            })
            .catch(console.error);
        } else {
          // handle regular non iOS 13+ devices
        }

       });

  }

  handleResize(){

    this.camera.aspect = this.player_.currentWidth() / this.player_.currentHeight();
    this.camera.updateProjectionMatrix();
    if(this.player_.isFullscreen()){
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.vrEffect.setSize(window.innerWidth, window.innerHeight);
    }else{
      this.renderer.setSize(this.player_.currentWidth(), this.player_.currentHeight());
      this.vrEffect.setSize(this.player_.currentWidth(), this.player_.currentHeight());
    }

  }

  triggerError_(errorObj) {
      // if we have videojs-errors use it
      if (this.videojsErrorsSupport_) {
          this.player_.error(errorObj);
          // if we don't have videojs-errors just use a normal player error
      } else {
          // strip any html content from the error message
          // as it is not supported outside of videojs-errors
          const div = document.createElement('div');

          div.innerHTML = errors[errorObj.code].message;

          const message = div.textContent || div.innerText || '';

          this.player_.error({
              code: errorObj.code,
              message
          });
      }
  }

  requestAnimationFrame(fn) {
      if (this.vrDisplay) {

          return this.vrDisplay.requestAnimationFrame(fn);
      }

      return this.player_.requestAnimationFrame(fn);
  }

  cancelAnimationFrame(id) {

      if (this.vrDisplay) {
          return this.vrDisplay.cancelAnimationFrame(id);
      }

      return this.player_.cancelAnimationFrame(id);
  }

  init() {
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
      this.videoTexture.format = THREE.RGBFormat;

      // Store vector representing the direction in which the camera is looking, in world space.
      this.cameraVector = new THREE.Vector3();

      const position = {
          x: 0,
          y: 0,
          z: 0
      };

      this.movieGeometry = new THREE.SphereBufferGeometry(512, 32, 32);

      this.movieMaterial = new THREE.MeshBasicMaterial({
          map: this.videoTexture,
          //overdraw: true,
          //side: THREE.BackSide
      });

      this.movieScreen = new THREE.Mesh(this.movieGeometry, this.movieMaterial);
      this.movieScreen.rotation.y = Math.PI / 2;
      this.movieScreen.scale.x = -1;
      this.movieScreen.quaternion.setFromAxisAngle({x: 0, y: 1, z: 0}, -Math.PI / 2);
      this.scene.add(this.movieScreen);

      this.setupStage();

      this.vrEffect = new THREE.VREffect(this.renderer);
      this.vrEffect.setSize(this.player_.currentWidth(), this.player_.currentHeight());

      this.renderedCanvas = this.renderer.domElement;
      this.renderedCanvas.setAttribute('style', 'width: 100%; height: 100%; position: absolute; top:0;');

      const videoElStyle = this.getVideoEl_().style;

      this.player_.el().insertBefore(this.renderedCanvas, this.player_.el().firstChild);
      videoElStyle.zIndex = '-1';
      videoElStyle.opacity = '0';

      let options = {
          color: 'black',
          background: 'white',
          corners: 'square'
      };
      this.enterVR = new webvrui.EnterVRButton(this.renderer.domElement, options);
      this.player_.el().appendChild(this.enterVR.domElement);

      this.initialized_ = true;
      this.trigger('initialized');

      window.addEventListener('resize', this.handleResize, true);
      window.addEventListener('vrdisplaypresentchange', this.handleResize, true);
      this.player_.on('useractive', () => {
        this.enterVR.show();
      });

      this.player_.on('userinactive', () => {
        this.enterVR.hide();
      });

  }

  animate_() {
      if (!this.initialized_) {
          return;
      }

      if (this.getVideoEl_().readyState === this.getVideoEl_().HAVE_ENOUGH_DATA) {
          if (this.videoTexture) {
              this.videoTexture.needsUpdate = true;
          }
      }
      // This is for the mobile motion
      if (this.controls3d) {
        this.controls3d.update();
      }

      if(this.player_.paused()){
        this.movieScreen.rotation.y += 0.0004;
      }
      this.vrEffect.render(this.scene, this.camera);
      this.animationFrameId_ = this.vrDisplay.requestAnimationFrame(this.animate_);
  }

  setupStage() {
      const self = this;
      navigator.getVRDisplays()
          .then(function(displays) {
              if (displays.length > 0) {
                  self.vrDisplay = displays[0];
                  self.vrDisplay.requestAnimationFrame(self.animate_);
              }
          });
  }

  getVideoEl_() {
      return this.player_.el().getElementsByTagName('video')[0];
  }

  reset() {
      if (!this.initialized_) {
          return;
      }

      if (this.controls3d) {
        this.controls3d.dispose();
        this.controls3d = null;
      }

      // reset the video element style so that it will be displayed
      const videoElStyle = this.getVideoEl_().style;

      videoElStyle.zIndex = '';
      videoElStyle.opacity = '';

      // set the current projection to the default
      this.currentProjection_ = this.defaultProjection_;

      // remove the old canvas
      if (this.renderedCanvas) {
          this.renderedCanvas.parentNode.removeChild(this.renderedCanvas);
      }

      if (this.animationFrameId_) {
          this.cancelAnimationFrame(this.animationFrameId_);
      }

      this.initialized_ = false;
  }

  dispose() {
      super.dispose();
      this.reset();
  }

}

VR.prototype.setTimeout = Component.prototype.setTimeout;
VR.prototype.clearTimeout = Component.prototype.clearTimeout;

VR.VERSION = VERSION;

videojs.registerPlugin('vr', VR);
export default VR;
