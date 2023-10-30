/**
 * uploader.js (v1.0.0)
 * https://github.com/rancoud/uploader.js
 * 
 * MIT License
 * 
 * Copyright (c) 2023 Rancoud
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function () {
  "use strict";

  /**
   *
   */
  function getHTMLElement(attributeName, elemID) {
    if (typeof elemID !== "string") {
      return new TypeError("Invalid attribute " + attributeName + ", expect string, get " + typeof elemID);
    }

    var elemObj = document.getElementById(elemID);
    if (!elemObj) {
      return new Error("DOM element " + elemID + " not found");
    }

    return elemObj;
  }

  /**
   *
   */
  function getFunction(fn) {
    var scope = window;
    var fnParts = fn.split(".");
    var idxScopes = 0;
    var maxFnParts = fnParts.length;
    for (; idxScopes < maxFnParts - 1; idxScopes++) {
      if (fnParts[idxScopes] === "window") {
        continue;
      }

      scope = scope[fnParts[idxScopes]];

      if (scope === undefined) {
        return;
      }
    }

    return scope[fnParts[fnParts.length - 1]];
  }

  var ZoomModeCenter = "center";
  var ZoomModePoint = "point";

  /**
   *
   */
  function Uploader(masterDom) {
    this.initAttributes();

    var err = this.verifyMandatoryDataAttributes(masterDom);
    if (err !== null) {
      return err;
    }

    err = this.verifyOptionalDataAttributes(masterDom);
    if (err !== null) {
      return err;
    }

    // Mandatory
    this.initInputFile();
    this.initCanvas();

    // Optional
    this.initDivs();
    this.initMask();
    this.initZoom();
    this.initSave();
    this.initCancel();

    if (this.callbacks.init !== null) {
      this.callbacks.init(this, "Uploader");
    }
  }

  Uploader.prototype.initAttributes = function () {
    this.img = null;
    this.imgSizeComputed = null;

    this.eventChangeInputFileListener = this.changeInputFile.bind(this);
    this.eventTreatImageListener = this.treatImage.bind(this);

    this.eventChangeInputZoomListener = this.changeInputZoomListener.bind(this);
    this.eventInputInputZoomListener = this.inputInputZoomListener.bind(this);
    this.zoomCurrent = 1;
    this._zoomEventHasNeverFired = null;
    this._zoomCurrentValue = null;
    this._zoomLastValue = null;

    this.eventSaveListener = this.save.bind(this);
    this.eventSaveOnLoad = this.saveOnLoad.bind(this);
    this.eventSaveOnError = this.saveOnError.bind(this);
    this.eventCancelListener = this.cancel.bind(this);

    this.ptTopLeftMask = { x: 0, y: 0 };
    this.ptBottomRightMask = { x: 0, y: 0 };
    this.mask = null;
    this.maskRaw = { color: null, size: null, radius: 0, constraint: true };

    this.inputFileObj = null;
    this.canvasObj = null;
    this.cssClassCanvasMoving = "";

    this.scaleFactor = 1.05;
    this.dragStart = null;

    this.divErrorObj = null;
    this.divUploadObj = null;
    this.divPreviewObj = null;
    this.inputZoomObj = null;
    this.btnSaveObj = null;
    this.btnCancelObj = null;

    this.callbacks = {
      init: null,
      zoom: {
        init: null,
        update: null
      },
      image: {
        success: null,
        error: null
      },
      save: {
        update_form_data: null,
        success: null,
        error: null
      },
      cancel: null,
      draw: null
    };

    this.errorLoadMessage = "Could not load your image.\nUse png or jpg file.";
    this.errorUploadMessage = "Could not upload your image.\nTry later.";

    this.canSave = true;

    this.reader = new FileReader();
    this.reader.addEventListener("load", this.eventTreatImageListener);

    this.eventTreatImageOnLoad = this.treatImageOnLoad.bind(this);
    this.eventTreatImageOnError = this.treatImageOnError.bind(this);

    this.inProgress = false;
  };

  Uploader.prototype.verifyMandatoryDataAttributes = function (masterDom) {
    var inputFileID = masterDom.getAttribute("data-uploader-input_file-id");
    this.inputFileObj = getHTMLElement("data-uploader-input_file-id", inputFileID);
    if (!(this.inputFileObj instanceof HTMLElement)) {
      return this.inputFileObj;
    }

    var canvasID = masterDom.getAttribute("data-uploader-canvas-id");
    this.canvasObj = getHTMLElement("data-uploader-canvas-id", canvasID);
    if (!(this.canvasObj instanceof HTMLElement)) {
      return this.canvasObj;
    }

    return null;
  };

  Uploader.prototype.verifyOptionalDataAttributes = function (masterDom) {
    // region divs
    var divErrorID = masterDom.getAttribute("data-uploader-div_error-id") || null;
    if (divErrorID !== null) {
      this.divErrorObj = getHTMLElement("data-uploader-div_error-id", divErrorID);
      if (!(this.divErrorObj instanceof HTMLElement)) {
        return this.divErrorObj;
      }
    }

    var divUploadID = masterDom.getAttribute("data-uploader-div_upload-id") || null;
    if (divUploadID !== null) {
      this.divUploadObj = getHTMLElement("data-uploader-div_upload-id", divUploadID);
      if (!(this.divUploadObj instanceof HTMLElement)) {
        return this.divUploadObj;
      }
    }

    var divPreviewID = masterDom.getAttribute("data-uploader-div_preview-id") || null;
    if (divPreviewID !== null) {
      this.divPreviewObj = getHTMLElement("data-uploader-div_preview-id", divPreviewID);
      if (!(this.divPreviewObj instanceof HTMLElement)) {
        return this.divPreviewObj;
      }
    }
    // endregion

    /*
     * region mask
     * mask size
     */
    var maskSize = masterDom.getAttribute("data-uploader-mask-size");
    if (maskSize !== null) {
      var maskSizeWidth = 0;
      var maskSizeHeight = 0;
      if (maskSize.indexOf(",") === -1) {
        maskSizeWidth = maskSize >> 0;
        maskSizeHeight = maskSize >> 0;
      } else {
        var maskSizeParts = maskSize.split(",");
        maskSizeWidth = maskSizeParts[0] >> 0;
        maskSizeHeight = maskSizeParts[1] >> 0;
      }

      if (maskSizeWidth === 0 || maskSizeHeight === 0) {
        return new Error("Invalid attribute data-uploader-mask-size, expect size above 0, get width: " + maskSizeWidth + " height: " + maskSizeHeight);
      }

      if (maskSizeWidth > this.canvasObj.width || maskSizeHeight > this.canvasObj.height) {
        return new Error("Invalid attribute data-uploader-mask-size, expect size below canvas size, get width: " + maskSizeWidth + " height: " + maskSizeHeight);
      }

      this.maskRaw.size = {
        width: maskSizeWidth,
        height: maskSizeHeight
      };
    }

    // Mask color
    var maskColor = masterDom.getAttribute("data-uploader-mask-color");
    if (maskColor === null) {
      this.maskRaw.color = "rgba(255, 255, 255, 0.5)";
    } else if (this.maskRaw.size === null) {
      return new Error("Invalid attribute data-uploader-mask-color, you have to set data-uploader-mask-size first");
    } else {
      this.maskRaw.color = maskColor;
    }

    // Mask radius
    var maskRadius = masterDom.getAttribute("data-uploader-mask-radius");
    if (maskRadius !== null) {
      if (this.maskRaw.size === null) {
        return new Error("Invalid attribute data-uploader-mask-radius, you have to set data-uploader-mask-size first");
      }

      this.maskRaw.radius = maskRadius >> 0;
      if (this.maskRaw.radius > 0) {
        var minMaskSize = Math.min(this.maskRaw.size.width, this.maskRaw.size.height);
        if (this.maskRaw.radius > minMaskSize) {
          this.maskRaw.radius = minMaskSize / 2 >> 0;
        }
      }
    }

    // Mask constraint
    var maskConstraint = masterDom.getAttribute("data-uploader-mask-constraint");
    if (maskConstraint !== null) {
      if (this.maskRaw.size === null) {
        return new Error("Invalid attribute data-uploader-mask-constraint, you have to set data-uploader-mask-size first");
      }

      if (maskConstraint !== "true" && maskConstraint !== "false") {
        return new Error("Invalid attribute data-uploader-mask-constraint, expect value \"true\" or \"false\", get " + maskConstraint);
      }

      if (maskConstraint === "false") {
        this.maskRaw.constraint = false;
      }
    }
    // endregion

    // region zoom
    var inputZoomID = masterDom.getAttribute("data-uploader-input_zoom-id");
    if (inputZoomID !== null) {
      this.inputZoomObj = getHTMLElement("data-uploader-input_zoom-id", inputZoomID);
      if (!(this.inputZoomObj instanceof HTMLElement)) {
        return this.inputZoomObj;
      }
    }
    // endregion

    // region callbacks
    /**
     *
     */
    function parseCallbacks(instance, callbacks, parentKey) {
      var idxParentKey;
      var lenParentKey = parentKey.length;

      for (var key in callbacks) {
        /* istanbul ignore else */
        if (callbacks.hasOwnProperty(key)) {
          var localKey = [];
          for (idxParentKey = 0; idxParentKey < lenParentKey; idxParentKey++) {
            localKey[idxParentKey] = parentKey;
          }
          localKey.push(key);

          if (callbacks[key] !== null) {
            var err = parseCallbacks(instance, callbacks[key], localKey);
            if (err !== null) {
              return err;
            }
          } else {
            var callbackName = masterDom.getAttribute("data-uploader-callback-" + localKey.join("-")) || null;
            if (callbackName !== null) {
              var callbackFunction = getFunction(callbackName);
              if (typeof callbackFunction === "function") {
                callbacks[key] = callbackFunction;
              } else {
                return new Error("Invalid function " + callbackName + " in data-uploader-callback-" + localKey.join("-"));
              }
            }
          }
        }
      }

      return null;
    }

    var errorCallbacks = parseCallbacks(this, this.callbacks, []);
    if (errorCallbacks !== null) {
      return errorCallbacks;
    }
    // endregion

    // region save
    var btnSaveID = masterDom.getAttribute("data-uploader-btn_save-id");
    if (btnSaveID !== null) {
      this.btnSaveObj = getHTMLElement("data-uploader-btn_save-id", btnSaveID);
      if (!(this.btnSaveObj instanceof HTMLElement)) {
        return this.btnSaveObj;
      }
    }

    this.uploadUrl = masterDom.getAttribute("data-uploader-upload-url") || window.location.toString();
    this.uploadName = masterDom.getAttribute("data-uploader-upload-name") || "image";
    this.uploadPrefix = masterDom.getAttribute("data-uploader-upload-prefix") || "";
    // endregion

    // region cancel
    var btnCancelID = masterDom.getAttribute("data-uploader-btn_cancel-id");
    if (btnCancelID !== null) {
      this.btnCancelObj = getHTMLElement("data-uploader-btn_cancel-id", btnCancelID);
      if (!(this.btnCancelObj instanceof HTMLElement)) {
        return this.btnCancelObj;
      }
    }
    // endregion

    // region errors
    var errorLoadMessage = masterDom.getAttribute("data-uploader-error-load") || "";
    if (errorLoadMessage.length > 0) {
      this.errorLoadMessage = errorLoadMessage;
    }

    var errorUploadMessage = masterDom.getAttribute("data-uploader-error-upload") || "";
    if (errorUploadMessage.length > 0) {
      this.errorUploadMessage = errorUploadMessage;
    }
    // endregion

    // region scale factor
    var scaleFactor = masterDom.getAttribute("data-uploader-scale_factor") || 1.05;
    if (scaleFactor !== 1.05) {
      scaleFactor = parseFloat(scaleFactor);
      if (scaleFactor === 0 || Number.isNaN(scaleFactor)) {
        scaleFactor = 1.05;
      }
    }
    this.scaleFactor = scaleFactor;
    // endregion

    // region css class canvas moving
    var cssClassCanvasMoving = masterDom.getAttribute("data-uploader-css-canvas_moving") || "";
    if (cssClassCanvasMoving !== "") {
      if (cssClassCanvasMoving.indexOf(" ") !== -1) {
        return new Error("Invalid css class \"" + cssClassCanvasMoving + "\" in data-uploader-css-canvas_moving, space is not allowed");
      }

      this.cssClassCanvasMoving = cssClassCanvasMoving;
    }
    // endregion

    return null;
  };

  // region Initialize
  Uploader.prototype.initInputFile = function () {
    this.inputFileObj.addEventListener("change", this.eventChangeInputFileListener);
  };

  Uploader.prototype.initCanvas = function () {
    this.lastX = this.canvasObj.width / 2;
    this.lastY = this.canvasObj.height / 2;

    this.canvasContext = this.canvasObj.getContext("2d");
    this.canvasContext.imageSmoothingEnabled = true;
    this.canvasContext.imageSmoothingQuality = "high";

    trackTransforms(this.canvasContext);

    this.eventMouseDownListener = this.moveStart.bind(this);
    this.eventMouseMoveListener = this.moveMove.bind(this);
    this.eventMouseUpListener = this.moveEnd.bind(this);
    this.eventTouchStartListener = this.moveStart.bind(this);
    this.eventTouchMoveListener = this.moveMove.bind(this);
    this.eventTouchEndListener = this.moveEnd.bind(this);
    this.eventHandleScrollListener = this.handleScroll.bind(this);
  };

  Uploader.prototype.initDivs = function () {
    if (this.divPreviewObj !== null) {
      this.divPreviewObj.setAttribute("hidden", "");
    }

    if (this.divUploadObj !== null) {
      this.divUploadObj.removeAttribute("hidden");
    }

    this.hideError();
  };

  Uploader.prototype.initMask = function () {
    if (this.maskRaw.size === null) {
      return;
    }

    this.mask = {
      x: this.canvasObj.width / 2 - this.maskRaw.size.width / 2,
      y: this.canvasObj.height / 2 - this.maskRaw.size.height / 2,
      width: this.maskRaw.size.width,
      height: this.maskRaw.size.height,
      color: this.maskRaw.color,
      radius: this.maskRaw.radius,
      constraint: this.maskRaw.constraint
    };
  };

  Uploader.prototype.initZoom = function () {
    if (this.inputZoomObj !== null) {
      this.inputZoomObj.addEventListener("input", this.eventInputInputZoomListener);
      this.inputZoomObj.addEventListener("change", this.eventChangeInputZoomListener);
    }

    if (this.callbacks.zoom.init !== null) {
      this.callbacks.zoom.init(this, "initZoom");
    }
  };

  Uploader.prototype.initSave = function () {
    if (this.btnSaveObj === null) {
      return;
    }

    this.btnSaveObj.addEventListener("click", this.eventSaveListener);
  };

  Uploader.prototype.initCancel = function () {
    if (this.btnCancelObj === null) {
      return;
    }

    this.btnCancelObj.addEventListener("click", this.eventCancelListener);
  };
  // endregion

  // region Buttons actions
  Uploader.prototype.changeInputFile = function () {
    if (this.inputFileObj.files.length < 1) {
      return;
    }

    this.reader.readAsDataURL(this.inputFileObj.files[0]);
  };

  Uploader.prototype.treatImage = function () {
    this.img = new Image();
    this.img.onload = this.eventTreatImageOnLoad;
    this.img.onerror = this.eventTreatImageOnError;
    this.img.src = this.reader.result;
  };

  Uploader.prototype.treatImageOnLoad = function () {
    if (this.img.width <= 0 || this.img.height <= 0) {
      this.treatImageOnError();
      return;
    }

    this.removeEventListeners();
    this.addEventListeners();

    this.zoomCurrent = 1;
    if (this.inputZoomObj) {
      this.inputZoomObj.value = 1;
    }

    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);

    this.computeSize();

    this.draw();

    if (this.divUploadObj) {
      this.divUploadObj.setAttribute("hidden", "");
    }

    if (this.divPreviewObj) {
      this.divPreviewObj.removeAttribute("hidden");
    }

    this.hideError();

    if (this.callbacks.image.success !== null) {
      this.callbacks.image.success(this, "treatImageOnLoad");
    }

    if (this.callbacks.zoom.update !== null) {
      this.callbacks.zoom.update(this, "treatImageOnLoad");
    }
  };

  Uploader.prototype.treatImageOnError = function () {
    this.img = null;

    this.clearCanvas();

    this.showError(this.errorLoadMessage);

    if (this.callbacks.image.error !== null) {
      this.callbacks.image.error(this, "treatImageOnError");
    }
  };

  Uploader.prototype.addEventListeners = function () {
    this.canvasObj.addEventListener("mousedown", this.eventMouseDownListener, { passive: false });
    window.addEventListener("mousemove", this.eventMouseMoveListener, { passive: false });
    window.addEventListener("mouseup", this.eventMouseUpListener, { passive: false });

    this.canvasObj.addEventListener("touchstart", this.eventTouchStartListener, { passive: false });
    this.canvasObj.addEventListener("touchmove", this.eventTouchMoveListener, { passive: false });
    this.canvasObj.addEventListener("touchend", this.eventTouchEndListener, { passive: false });

    this.canvasObj.addEventListener("DOMMouseScroll", this.eventHandleScrollListener, { passive: false });
    this.canvasObj.addEventListener("mousewheel", this.eventHandleScrollListener, { passive: false });
  };

  Uploader.prototype.removeEventListeners = function () {
    this.canvasObj.removeEventListener("mousedown", this.eventMouseDownListener);
    window.removeEventListener("mousemove", this.eventMouseMoveListener);
    window.removeEventListener("mouseup", this.eventMouseUpListener);

    this.canvasObj.removeEventListener("touchstart", this.eventTouchStartListener);
    this.canvasObj.removeEventListener("touchmove", this.eventTouchMoveListener);
    this.canvasObj.removeEventListener("touchend", this.eventTouchEndListener);

    this.canvasObj.removeEventListener("DOMMouseScroll", this.eventHandleScrollListener);
    this.canvasObj.removeEventListener("mousewheel", this.eventHandleScrollListener);
  };

  Uploader.prototype.cancel = function () {
    this.img = null;
    this.imgSizeComputed = null;
    this.zoomCurrent = 1;

    if (this.divPreviewObj !== null) {
      this.divPreviewObj.setAttribute("hidden", "");
    }

    if (this.divUploadObj !== null) {
      this.divUploadObj.removeAttribute("hidden");
    }

    this.hideError();

    this.clearCanvas();

    this.inputFileObj.value = null;

    this.removeEventListeners();

    if (this.callbacks.cancel !== null) {
      this.callbacks.cancel(this, "cancel");
    }
  };

  Uploader.prototype.save = function () {
    if (this.img === null || this.canSave === false) {
      return;
    }

    this.canSave = false;

    var dataURL = this.getCanvasDataURL();
    var blob = dataURItoBlob(dataURL);
    var formData = new FormData();

    formData.append(this.uploadPrefix + this.uploadName, blob);
    formData.append(this.uploadPrefix + "canvas_width", this.canvasObj.width);
    formData.append(this.uploadPrefix + "canvas_height", this.canvasObj.height);

    if (this.mask !== null) {
      formData.append(this.uploadPrefix + "mask_width", this.mask.width);
      formData.append(this.uploadPrefix + "mask_height", this.mask.height);
      formData.append(this.uploadPrefix + "mask_x", this.mask.x);
      formData.append(this.uploadPrefix + "mask_y", this.mask.y);
    }

    if (this.callbacks.save.update_form_data !== null) {
      formData = this.callbacks.save.update_form_data(this, "save", formData);
    }

    var XHR = new XMLHttpRequest();
    XHR.addEventListener("load", this.eventSaveOnLoad);
    XHR.addEventListener("error", this.eventSaveOnError);
    XHR.open("POST", this.uploadUrl);
    XHR.send(formData);
  };

  Uploader.prototype.saveOnLoad = function () {
    this.canSave = true;

    this.hideError();

    if (this.callbacks.save.success !== null) {
      this.callbacks.save.success(this, "saveOnLoad");
    }
  };

  Uploader.prototype.saveOnError = function (error) {
    this.canSave = true;

    this.showError(this.errorUploadMessage);

    if (this.callbacks.save.error !== null) {
      this.callbacks.save.error(this, "saveOnError", error);
    }
  };

  /**
   *
   */
  function dataURItoBlob(dataURI) {
    var byteString;

    /* istanbul ignore else */
    if (dataURI.split(",")[0].indexOf("base64") >= 0) {
      byteString = atob(dataURI.split(",")[1]);
    } else {
      byteString = decodeURI(dataURI.split(",")[1]);
    }

    var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

    var ia = new Uint8Array(byteString.length);
    var len = byteString.length;
    for (var i = 0; i < len; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
  }
  // endregion

  // region Draw
  Uploader.prototype.computeSize = function () {
    var mask = {
      x: 0,
      y: 0,
      width: this.canvasObj.width,
      height: this.canvasObj.height
    };

    if (this.mask !== null) {
      mask.x = this.mask.x;
      mask.y = this.mask.y;
      mask.width = this.mask.width;
      mask.height = this.mask.height;
    }

    this.imgSizeComputed = {
      x: mask.x,
      y: mask.y,
      width: mask.width,
      height: mask.height
    };

    var ratio = Math.max(mask.width / this.img.width, mask.height / this.img.height);

    this.imgSizeComputed.height = this.img.height * ratio;
    this.imgSizeComputed.width = this.img.width * ratio;
    this.imgSizeComputed.x = mask.x - (this.imgSizeComputed.width / 2 - mask.width / 2);
    this.imgSizeComputed.y = mask.y - (this.imgSizeComputed.height / 2 - mask.height / 2);

    return this.imgSizeComputed;
  };

  Uploader.prototype.draw = function () {
    this.clearCanvas();

    this.drawImage();

    this.drawMask();

    if (this.mask !== null) {
      this.ptTopLeftMask = this.canvasContext.transformedPoint(this.mask.x, this.mask.y);
      this.ptBottomRightMask = this.canvasContext.transformedPoint(this.mask.x + this.mask.width, this.mask.y + this.mask.height);
    }

    if (this.callbacks.draw !== null) {
      this.callbacks.draw(this, "draw");
    }
  };

  Uploader.prototype.clearCanvas = function () {
    var p1 = this.canvasContext.transformedPoint(0, 0);
    var p2 = this.canvasContext.transformedPoint(this.canvasObj.width, this.canvasObj.height);
    this.canvasContext.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
  };

  Uploader.prototype.drawImage = function () {
    this.canvasContext.drawImage(this.img, this.imgSizeComputed.x, this.imgSizeComputed.y, this.imgSizeComputed.width, this.imgSizeComputed.height);
  };

  Uploader.prototype.drawMask = function () {
    if (this.mask === null) {
      return;
    }

    this.canvasContext.save();
    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasContext.fillStyle = this.mask.color;
    this.canvasContext.beginPath();

    var x = this.mask.x;
    var y = this.mask.y;
    var width = this.mask.width;
    var height = this.mask.height;
    var radius = {
      topLeft: this.mask.radius,
      topRight: this.mask.radius,
      bottomRight: this.mask.radius,
      bottomLeft: this.mask.radius
    };

    this.canvasContext.moveTo(x + radius.topLeft, y);
    this.canvasContext.lineTo(x + width - radius.topRight, y);
    this.canvasContext.quadraticCurveTo(x + width, y, x + width, y + radius.topRight);
    this.canvasContext.lineTo(x + width, y + height - radius.bottomRight);
    this.canvasContext.quadraticCurveTo(x + width, y + height, x + width - radius.bottomRight, y + height);
    this.canvasContext.lineTo(x + radius.bottomLeft, y + height);
    this.canvasContext.quadraticCurveTo(x, y + height, x, y + height - radius.bottomLeft);
    this.canvasContext.lineTo(x, y + radius.topLeft);
    this.canvasContext.quadraticCurveTo(x, y, x + radius.topLeft, y);
    this.canvasContext.closePath();

    this.canvasContext.rect(this.canvasObj.width, 0, -this.canvasObj.width, this.canvasObj.height);
    this.canvasContext.fill();
    this.canvasContext.restore();
  };

  Uploader.prototype.getCanvasDataURL = function () {
    if (this.mask === null) {
      return this.canvasObj.toDataURL();
    }

    this.clearCanvas();

    this.drawImage();

    var dataURL = this.canvasObj.toDataURL();

    this.drawMask();

    return dataURL;
  };
  // endregion

  // region Move
  Uploader.prototype.moveStart = function (event) {
    pauseEvent(event);

    if (event.touches && event.touches.length > 0) {
      this.lastX = event.touches[0].pageX;
      this.lastY = event.touches[0].pageY;
    } else {
      this.lastX = event.pageX;
      this.lastY = event.pageY;
    }

    this.dragStart = {
      x: this.lastX,
      y: this.lastY
    };

    if (this.cssClassCanvasMoving !== "") {
      this.canvasObj.classList.add(this.cssClassCanvasMoving);
    }
  };

  Uploader.prototype.moveMove = function (event) {
    if (!this.dragStart) {
      return;
    }

    if (event.touches && event.touches.length > 0) {
      this.lastX = event.touches[0].pageX;
      this.lastY = event.touches[0].pageY;
    } else {
      this.lastX = event.pageX;
      this.lastY = event.pageY;
    }

    pauseEvent(event);

    if (this.lastX === this.dragStart.x && this.lastY === this.dragStart.y) {
      return;
    }

    var scale = this.canvasContext.getTransform().inverse().a;
    var translation = this.keepImgInsideMaskBoundings({
      x: (this.lastX - this.dragStart.x) * scale,
      y: (this.lastY - this.dragStart.y) * scale
    });

    if (translation.x !== 0 || translation.y !== 0) {
      this.canvasContext.translate(translation.x, translation.y);
      this.draw();
    }

    this.dragStart.x = this.lastX;
    this.dragStart.y = this.lastY;
  };

  Uploader.prototype.moveEnd = function () {
    this.dragStart = null;
    if (this.cssClassCanvasMoving !== "") {
      this.canvasObj.classList.remove(this.cssClassCanvasMoving);
    }

    var translation = this.keepImgInsideMaskBoundings({ x: 0, y: 0 });

    if (translation.x !== 0 || translation.y !== 0) {
      this.canvasContext.translate(translation.x, translation.y);
      this.draw();
    }
  };

  Uploader.prototype.keepImgInsideMaskBoundings = function (translation) {
    if (this.mask === null || this.mask.constraint === false) {
      return translation;
    }

    if (this.imgSizeComputed.x > this.ptTopLeftMask.x) {
      translation.x = this.ptTopLeftMask.x - this.imgSizeComputed.x;
    } else if (this.ptTopLeftMask.x === this.imgSizeComputed.x) {
      if (translation.x > 0) {
        translation.x = 0;
      }
    }

    if (this.imgSizeComputed.y > this.ptTopLeftMask.y) {
      translation.y = this.ptTopLeftMask.y - this.imgSizeComputed.y;
    } else if (this.ptTopLeftMask.y === this.imgSizeComputed.y) {
      if (translation.y > 0) {
        translation.y = 0;
      }
    }

    if (this.ptBottomRightMask.x > this.imgSizeComputed.x + this.imgSizeComputed.width) {
      translation.x = this.ptBottomRightMask.x - (this.imgSizeComputed.x + this.imgSizeComputed.width);
    } else if (this.ptBottomRightMask.x === this.imgSizeComputed.x + this.imgSizeComputed.width) {
      if (translation.x < 0) {
        translation.x = 0;
      }
    }

    if (this.ptBottomRightMask.y > this.imgSizeComputed.y + this.imgSizeComputed.height) {
      translation.y = this.ptBottomRightMask.y - (this.imgSizeComputed.y + this.imgSizeComputed.height);
    } else if (this.ptBottomRightMask.y === this.imgSizeComputed.y + this.imgSizeComputed.height) {
      if (translation.y < 0) {
        translation.y = 0;
      }
    }

    return translation;
  };

  // Useful for disabling the selection with the mouse
  /**
   *
   */
  function pauseEvent(event) {
    if (event.stopPropagation) {
      event.stopPropagation();
    }

    if (event.preventDefault) {
      event.preventDefault();
    }

    event.cancelBubble = true;
    event.returnValue = false;

    return false;
  }
  // endregion

  // region Zoom
  Uploader.prototype.updateZoomFromInput = function (event) {
    if (this.img === null) {
      return;
    }

    if (this.inProgress) {
      event.preventDefault();
      return false;
    }

    this.inProgress = true;

    var middleCanvasPoint = this.canvasContext.transformedPoint(this.canvasObj.width / 2, this.canvasObj.height / 2);
    var delta = this.zoomCurrent - event.target.value;
    var factor;
    if (delta > 0) {
      factor = Math.pow(this.scaleFactor, -1);
    } else {
      factor = Math.pow(this.scaleFactor, 1);
    }

    while (delta !== 0) {
      if (delta > 0) {
        if (this.zoomCurrent === 1) {
          break;
        }

        this.zoomCurrent--;
        delta--;
      } else {
        this.zoomCurrent++;
        delta++;
      }

      this.canvasContext.translate(middleCanvasPoint.x, middleCanvasPoint.y);
      this.canvasContext.scale(factor, factor);
      this.canvasContext.translate(-middleCanvasPoint.x, -middleCanvasPoint.y);
    }

    var translation = this.keepImgInsideMaskBoundings({ x: 0, y: 0 });
    this.canvasContext.translate(translation.x, translation.y);
    this.draw();

    if (this.callbacks.zoom.update !== null) {
      this.callbacks.zoom.update(this, "updateZoomFromInput");
    }

    this.inProgress = false;
  };

  Uploader.prototype.inputInputZoomListener = function (event) {
    this._zoomEventHasNeverFired = 1;
    this._zoomCurrentValue = event.target.value;
    /* istanbul ignore else */
    if (this._zoomCurrentValue !== this._zoomLastValue) {
      this.updateZoomFromInput(event);
    }
    this._zoomLastValue = this._zoomCurrentValue;
  };

  Uploader.prototype.changeInputZoomListener = function (event) {
    /* istanbul ignore else */
    if (!this._zoomEventHasNeverFired) {
      this.updateZoomFromInput(event);
    }
  };

  Uploader.prototype.zoomIn = function (zoomMode) {
    this.zoomCurrent++;
    this.zoom(1, zoomMode);
  };

  Uploader.prototype.zoomOut = function (zoomMode) {
    if (this.zoomCurrent === 1) {
      return;
    }

    this.zoomCurrent--;
    this.zoom(-1, zoomMode);
  };

  Uploader.prototype.zoom = function (exponent, zoomMode) {
    var pt;
    if (zoomMode === ZoomModeCenter) {
      pt = this.canvasContext.transformedPoint(this.canvasObj.width / 2, this.canvasObj.height / 2);
    } else {
      pt = this.canvasContext.transformedPoint(this.lastX, this.lastY);
    }

    this.canvasContext.translate(pt.x, pt.y);
    var factor = Math.pow(this.scaleFactor, exponent);
    this.canvasContext.scale(factor, factor);

    this.canvasContext.translate(-pt.x, -pt.y);

    var translation = this.keepImgInsideMaskBoundings({ x: 0, y: 0 });

    this.canvasContext.translate(translation.x, translation.y);
    this.draw();
  };

  Uploader.prototype.handleScroll = function (event) {
    var oldX = this.lastX;
    var oldY = this.lastY;

    this.lastX = event.offsetX || event.pageX - this.canvasObj.offsetLeft;
    this.lastY = event.offsetY || event.pageY - this.canvasObj.offsetTop;

    var wheelDirection = event.detail < 0 ? 1 : event.wheelDelta > 0 ? 1 : -1;
    /* istanbul ignore else */
    if (wheelDirection === 1) {
      this.zoomIn(ZoomModePoint);
    } else if (wheelDirection === -1) {
      this.zoomOut(ZoomModePoint);
    }

    if (this.inputZoomObj !== null) {
      this.inputZoomObj.value = this.zoomCurrent;
    }

    if (this.callbacks.zoom.update !== null) {
      this.callbacks.zoom.update(this, "handleScroll");
    }

    this.lastX = oldX;
    this.lastY = oldY;

    pauseEvent(event);

    return false;
  };
  // endregion

  // region Error
  Uploader.prototype.showError = function (message) {
    if (this.divErrorObj === null) {
      return;
    }

    while (this.divErrorObj.lastChild) {
      this.divErrorObj.lastChild.remove();
    }

    var parts = message.split("\n");
    var idxParts = 0;
    var maxParts = parts.length;
    for (; idxParts < maxParts; idxParts++) {
      this.divErrorObj.appendChild(document.createTextNode(parts[idxParts]));
      if (idxParts + 1 < maxParts) {
        this.divErrorObj.appendChild(document.createElement("br"));
      }
    }

    this.divErrorObj.removeAttribute("hidden");
  };

  Uploader.prototype.hideError = function () {
    if (this.divErrorObj === null) {
      return;
    }

    this.divErrorObj.setAttribute("hidden", "");

    while (this.divErrorObj.lastChild) {
      this.divErrorObj.lastChild.remove();
    }
  };
  // endregion

  // region Matrix Computing
  /* istanbul ignore next */
  /**
   *
   */
  function getMatrix() {
    if (typeof DOMMatrix === "function") {
      return new DOMMatrix();
    }

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    return svg.createSVGMatrix();
  }

  /* istanbul ignore next */
  /**
   *
   */
  function getPoint() {
    if (typeof DOMPoint === "function") {
      return new DOMPoint();
    }

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    return svg.createSVGPoint();
  }

  /* istanbul ignore next */
  /**
   *
   */
  function trackTransforms(ctx) {
    var xform = getMatrix();
    ctx.getTransform = function () {
      return xform;
    };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function () {
      savedTransforms.push(xform.translate(0, 0));
      return save.call(ctx);
    };

    var restore = ctx.restore;
    ctx.restore = function () {
      xform = savedTransforms.pop();
      return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function (sx, sy) {
      xform = xform.scale(sx, sy);
      return scale.call(ctx, sx, sy);
    };

    var rotate = ctx.rotate;
    ctx.rotate = function (radians) {
      xform = xform.rotate(radians * 180 / Math.PI);
      return rotate.call(ctx, radians);
    };

    var translate = ctx.translate;
    ctx.translate = function (dx, dy) {
      xform = xform.translate(dx, dy);
      return translate.call(ctx, dx, dy);
    };

    var transform = ctx.transform;
    ctx.transform = function (a, b, c, d, e, f) {
      var matrix2 = getMatrix();
      matrix2.a = a;
      matrix2.b = b;
      matrix2.c = c;
      matrix2.d = d;
      matrix2.e = e;
      matrix2.f = f;
      xform = xform.multiply(matrix2);
      return transform.call(ctx, a, b, c, d, e, f);
    };

    var setTransform = ctx.setTransform;
    ctx.setTransform = function (a, b, c, d, e, f) {
      xform.a = a;
      xform.b = b;
      xform.c = c;
      xform.d = d;
      xform.e = e;
      xform.f = f;
      return setTransform.call(ctx, a, b, c, d, e, f);
    };

    var pt = getPoint();
    ctx.transformedPoint = function (x, y) {
      pt.x = x;
      pt.y = y;
      return pt.matrixTransform(xform.inverse());
    };
  }
  // endregion

  window.Uploader = Uploader;

})();