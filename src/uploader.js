/* global Mask, MaskRadius, Position */
/* global dataURLtoBlob, getFunction, getHTMLElement, pauseEvent, trackTransforms */
/* eslint-disable max-lines */
/** @type {string} */
var ZoomModeCenter = "center";
/** @type {string} */
var ZoomModePoint = "point";
/** @type {number} */
var DefaultZoomStep = 1.05;

/**
 * Uploader.
 *
 * @class Uploader
 * @param {HTMLElement} rootDom - rootDom
 * @returns {(Error|undefined)}
 */
function Uploader(rootDom) {
    /** @type {Error} */
    var err;

    this.initAttributes();

    err = this.verifyMandatoryDataAttributes(rootDom);
    if (err !== null) {
        return err;
    }

    err = this.verifyOptionalDataAttributes(rootDom);
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

Uploader.prototype.initAttributes = function initAttributes() {
    this.img = null;
    this.imgSizeComputed = null;

    this.eventChangeInputFileListener = this.changeInputFile.bind(this);
    this.eventTreatImageListener = this.treatImage.bind(this);

    this.eventChangeInputZoomListener = this.changeInputZoomListener.bind(this);
    this.eventInputInputZoomListener = this.inputInputZoomListener.bind(this);
    this.zoomCurrent = 1;
    this.zoomEventHasNeverFired = null;
    this.zoomCurrentValue = null;
    this.zoomLastValue = null;

    this.eventSaveListener = this.save.bind(this);
    this.eventSaveOnLoad = this.saveOnLoad.bind(this);
    this.eventSaveOnError = this.saveOnError.bind(this);
    this.eventCancelListener = this.cancel.bind(this);

    this.ptTopLeftMask = {x: 0, y: 0};
    this.ptBottomRightMask = {x: 0, y: 0};
    this.mask = null;
    this.maskRaw = {color: null, size: null, radius: 0, constraint: true};

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
            init  : null,
            update: null
        },
        image: {
            success: null,
            error  : null
        },
        save: {
            // eslint-disable-next-line camelcase
            update_form_data: null,
            success         : null,
            error           : null
        },
        cancel: null,
        draw  : null
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

Uploader.prototype.verifyMandatoryDataAttributes = function verifyMandatoryDataAttributes(masterDom) {
    /** @type {(string|null)} */
    var inputFileID;
    /** @type {(string|null)} */
    var canvasID;

    inputFileID = masterDom.getAttribute("data-uploader-input_file-id");
    this.inputFileObj = getHTMLElement("data-uploader-input_file-id", inputFileID);
    if (!(this.inputFileObj instanceof HTMLElement)) {
        return this.inputFileObj;
    }

    canvasID = masterDom.getAttribute("data-uploader-canvas-id");
    this.canvasObj = getHTMLElement("data-uploader-canvas-id", canvasID);
    if (!(this.canvasObj instanceof HTMLElement)) {
        return this.canvasObj;
    }

    return null;
};

// eslint-disable-next-line max-lines-per-function,max-statements,complexity
Uploader.prototype.verifyOptionalDataAttributes = function verifyOptionalDataAttributes(masterDom) {
    /** @type {(string|null)} */
    var divErrorID;
    /** @type {(string|null)} */
    var divUploadID;
    /** @type {(string|null)} */
    var divPreviewID;
    /** @type {(string|null)} */
    var maskSize;
    /** @type {number} */
    var maskSizeWidth;
    /** @type {number} */
    var maskSizeHeight;
    /** @type {string[]} */
    var maskSizeParts;
    /** @type {string} */
    var maskColor;
    /** @type {string} */
    var maskRadius;
    /** @type {number} */
    var minMaskSize;
    /** @type {string} */
    var maskConstraint;
    /** @type {string} */
    var inputZoomID;
    /** @type {Error} */
    var errorCallbacks;
    /** @type {string} */
    var btnSaveID;
    /** @type {string} */
    var btnCancelID;
    /** @type {string} */
    var errorLoadMessage;
    /** @type {string} */
    var errorUploadMessage;
    /** @type {(string|number)} */
    var scaleFactor;
    /** @type {string} */
    var cssClassCanvasMoving;

    // region divs
    divErrorID = masterDom.getAttribute("data-uploader-div_error-id") || null;
    if (divErrorID !== null) {
        this.divErrorObj = getHTMLElement("data-uploader-div_error-id", divErrorID);
        if (!(this.divErrorObj instanceof HTMLElement)) {
            return this.divErrorObj;
        }
    }

    divUploadID = masterDom.getAttribute("data-uploader-div_upload-id") || null;
    if (divUploadID !== null) {
        this.divUploadObj = getHTMLElement("data-uploader-div_upload-id", divUploadID);
        if (!(this.divUploadObj instanceof HTMLElement)) {
            return this.divUploadObj;
        }
    }

    divPreviewID = masterDom.getAttribute("data-uploader-div_preview-id") || null;
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
    maskSize = masterDom.getAttribute("data-uploader-mask-size");
    if (maskSize !== null) {
        if (maskSize.indexOf(",") === -1) {
            maskSizeWidth = maskSize >> 0;
            maskSizeHeight = maskSize >> 0;
        } else {
            maskSizeParts = maskSize.split(",");
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
            width : maskSizeWidth,
            height: maskSizeHeight
        };
    }

    // Mask color
    maskColor = masterDom.getAttribute("data-uploader-mask-color");
    if (maskColor === null) {
        this.maskRaw.color = "rgba(255, 255, 255, 0.5)";
    } else if (this.maskRaw.size === null) {
        return new Error("Invalid attribute data-uploader-mask-color, you have to set data-uploader-mask-size first");
    } else {
        this.maskRaw.color = maskColor;
    }

    // Mask radius
    maskRadius = masterDom.getAttribute("data-uploader-mask-radius");
    if (maskRadius !== null) {
        if (this.maskRaw.size === null) {
            return new Error("Invalid attribute data-uploader-mask-radius, you have to set data-uploader-mask-size first");
        }

        this.maskRaw.radius = maskRadius >> 0;
        if (this.maskRaw.radius > 0) {
            minMaskSize = Math.min(this.maskRaw.size.width, this.maskRaw.size.height);
            if (this.maskRaw.radius > minMaskSize) {
                this.maskRaw.radius = (minMaskSize / 2) >> 0;
            }
        }
    }

    maskConstraint = masterDom.getAttribute("data-uploader-mask-constraint");
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
    inputZoomID = masterDom.getAttribute("data-uploader-input_zoom-id");
    if (inputZoomID !== null) {
        this.inputZoomObj = getHTMLElement("data-uploader-input_zoom-id", inputZoomID);
        if (!(this.inputZoomObj instanceof HTMLElement)) {
            return this.inputZoomObj;
        }
    }
    // endregion

    // region callbacks
    /**
     * Parse callbacks.
     *
     * @param {Uploader} instance  - instance of Uploader
     * @param {object}   callbacks - object of callbacks
     * @param {string[]} parentKey - list of parents key
     * @returns {Error|null}
     */
    function parseCallbacks(instance, callbacks, parentKey) {
        /** @type {(Error|null)} */
        var err;
        /** @type {string} */
        var key;
        /** @type {string[]} */
        var localKey;
        /** @type {number} */
        var idxParentKey;
        /** @type {number} */
        var lenParentKey = parentKey.length;
        /** @type {(string|null)} */
        var callbackName;
        /** @type {(Function|undefined)} */
        var callbackFunction;

        for (key in callbacks) {
            /* istanbul ignore else */
            // eslint-disable-next-line no-prototype-builtins
            if (callbacks.hasOwnProperty(key)) {
                localKey = [];
                for (idxParentKey = 0; idxParentKey < lenParentKey; ++idxParentKey) {
                    localKey[idxParentKey] = parentKey;
                }
                localKey.push(key);

                if (callbacks[key] === null) {
                    callbackName = masterDom.getAttribute("data-uploader-callback-" + localKey.join("-")) || null;
                    if (callbackName !== null) {
                        callbackFunction = getFunction(callbackName);
                        if (typeof callbackFunction === "function") {
                            callbacks[key] = callbackFunction;
                        } else {
                            return new Error("Invalid function " + callbackName + " in data-uploader-callback-" + localKey.join("-"));
                        }
                    }
                } else {
                    err = parseCallbacks(instance, callbacks[key], localKey);
                    if (err !== null) {
                        return err;
                    }
                }
            }
        }

        return null;
    }

    errorCallbacks = parseCallbacks(this, this.callbacks, []);
    if (errorCallbacks !== null) {
        return errorCallbacks;
    }
    // endregion

    // region save
    btnSaveID = masterDom.getAttribute("data-uploader-btn_save-id");
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
    btnCancelID = masterDom.getAttribute("data-uploader-btn_cancel-id");
    if (btnCancelID !== null) {
        this.btnCancelObj = getHTMLElement("data-uploader-btn_cancel-id", btnCancelID);
        if (!(this.btnCancelObj instanceof HTMLElement)) {
            return this.btnCancelObj;
        }
    }
    // endregion

    // region errors
    errorLoadMessage = masterDom.getAttribute("data-uploader-error-load") || "";
    if (errorLoadMessage.length > 0) {
        this.errorLoadMessage = errorLoadMessage;
    }

    errorUploadMessage = masterDom.getAttribute("data-uploader-error-upload") || "";
    if (errorUploadMessage.length > 0) {
        this.errorUploadMessage = errorUploadMessage;
    }
    // endregion

    // region scale factor
    scaleFactor = masterDom.getAttribute("data-uploader-scale_factor") || DefaultZoomStep;
    if (scaleFactor !== DefaultZoomStep) {
        scaleFactor = parseFloat(scaleFactor);
        if (scaleFactor === 0 || Number.isNaN(scaleFactor)) {
            scaleFactor = DefaultZoomStep;
        }
    }
    this.scaleFactor = scaleFactor;
    // endregion

    // region css class canvas moving
    cssClassCanvasMoving = masterDom.getAttribute("data-uploader-css-canvas_moving") || "";
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
Uploader.prototype.initInputFile = function initInputFile() {
    this.inputFileObj.addEventListener("change", this.eventChangeInputFileListener);
};

Uploader.prototype.initCanvas = function initCanvas() {
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

Uploader.prototype.initDivs = function initDivs() {
    if (this.divPreviewObj !== null) {
        this.divPreviewObj.setAttribute("hidden", "");
    }

    if (this.divUploadObj !== null) {
        this.divUploadObj.removeAttribute("hidden");
    }

    this.hideError();
};

Uploader.prototype.initMask = function initMask() {
    if (this.maskRaw.size === null) {
        return;
    }

    this.mask = {
        x         : (this.canvasObj.width / 2) - (this.maskRaw.size.width / 2),
        y         : (this.canvasObj.height / 2) - (this.maskRaw.size.height / 2),
        width     : this.maskRaw.size.width,
        height    : this.maskRaw.size.height,
        color     : this.maskRaw.color,
        radius    : this.maskRaw.radius,
        constraint: this.maskRaw.constraint
    };
};

Uploader.prototype.initZoom = function initZoom() {
    if (this.inputZoomObj !== null) {
        this.inputZoomObj.addEventListener("input", this.eventInputInputZoomListener);
        this.inputZoomObj.addEventListener("change", this.eventChangeInputZoomListener);
    }

    if (this.callbacks.zoom.init !== null) {
        this.callbacks.zoom.init(this, "initZoom");
    }
};

Uploader.prototype.initSave = function initSave() {
    if (this.btnSaveObj === null) {
        return;
    }

    this.btnSaveObj.addEventListener("click", this.eventSaveListener);
};

Uploader.prototype.initCancel = function initCancel() {
    if (this.btnCancelObj === null) {
        return;
    }

    this.btnCancelObj.addEventListener("click", this.eventCancelListener);
};
// endregion

// region Buttons actions
Uploader.prototype.changeInputFile = function changeInputFile() {
    if (this.inputFileObj.files.length < 1) {
        return;
    }

    this.reader.readAsDataURL(this.inputFileObj.files[0]);
};

Uploader.prototype.treatImage = function treatImage() {
    this.img = new Image();
    this.img.onload = this.eventTreatImageOnLoad;
    this.img.onerror = this.eventTreatImageOnError;
    this.img.src = this.reader.result;
};

Uploader.prototype.treatImageOnLoad = function treatImageOnLoad() {
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

Uploader.prototype.treatImageOnError = function treatImageOnError() {
    this.img = null;

    this.clearCanvas();

    this.showError(this.errorLoadMessage);

    if (this.callbacks.image.error !== null) {
        this.callbacks.image.error(this, "treatImageOnError");
    }
};

Uploader.prototype.addEventListeners = function addEventListeners() {
    this.canvasObj.addEventListener("mousedown", this.eventMouseDownListener, {passive: false});
    window.addEventListener("mousemove", this.eventMouseMoveListener, {passive: false});
    window.addEventListener("mouseup", this.eventMouseUpListener, {passive: false});

    this.canvasObj.addEventListener("touchstart", this.eventTouchStartListener, {passive: false});
    this.canvasObj.addEventListener("touchmove", this.eventTouchMoveListener, {passive: false});
    this.canvasObj.addEventListener("touchend", this.eventTouchEndListener, {passive: false});

    this.canvasObj.addEventListener("DOMMouseScroll", this.eventHandleScrollListener, {passive: false});
    this.canvasObj.addEventListener("mousewheel", this.eventHandleScrollListener, {passive: false});
};

Uploader.prototype.removeEventListeners = function removeEventListeners() {
    this.canvasObj.removeEventListener("mousedown", this.eventMouseDownListener);
    window.removeEventListener("mousemove", this.eventMouseMoveListener);
    window.removeEventListener("mouseup", this.eventMouseUpListener);

    this.canvasObj.removeEventListener("touchstart", this.eventTouchStartListener);
    this.canvasObj.removeEventListener("touchmove", this.eventTouchMoveListener);
    this.canvasObj.removeEventListener("touchend", this.eventTouchEndListener);

    this.canvasObj.removeEventListener("DOMMouseScroll", this.eventHandleScrollListener);
    this.canvasObj.removeEventListener("mousewheel", this.eventHandleScrollListener);
};

Uploader.prototype.cancel = function cancel() {
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

Uploader.prototype.save = function save() {
    /** @type {string} */
    var dataURL;
    /** @type {Blob} */
    var blob;
    /** @type {FormData} */
    var formData;
    /** @type {XMLHttpRequest} */
    var XHR;

    if (this.img === null || this.canSave === false) {
        return;
    }

    this.canSave = false;

    dataURL = this.getCanvasDataURL();
    blob = dataURLtoBlob(dataURL);
    formData = new FormData();

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

    XHR = new XMLHttpRequest();
    XHR.addEventListener("load", this.eventSaveOnLoad);
    XHR.addEventListener("error", this.eventSaveOnError);
    XHR.open("POST", this.uploadUrl);
    XHR.send(formData);
};

Uploader.prototype.saveOnLoad = function saveOnLoad() {
    this.canSave = true;

    this.hideError();

    if (this.callbacks.save.success !== null) {
        this.callbacks.save.success(this, "saveOnLoad");
    }
};

Uploader.prototype.saveOnError = function saveOnError(error) {
    this.canSave = true;

    this.showError(this.errorUploadMessage);

    if (this.callbacks.save.error !== null) {
        this.callbacks.save.error(this, "saveOnError", error);
    }
};
// endregion

// region Draw
Uploader.prototype.computeSize = function computeSize() {
    /** @type {number} */
    var ratio;
    /** @type {Mask} */
    var mask = {
        x     : 0,
        y     : 0,
        width : this.canvasObj.width,
        height: this.canvasObj.height
    };

    if (this.mask !== null) {
        mask.x = this.mask.x;
        mask.y = this.mask.y;
        mask.width = this.mask.width;
        mask.height = this.mask.height;
    }

    this.imgSizeComputed = {
        x     : mask.x,
        y     : mask.y,
        width : mask.width,
        height: mask.height
    };

    ratio = Math.max(mask.width / this.img.width, mask.height / this.img.height);

    this.imgSizeComputed.height = this.img.height * ratio;
    this.imgSizeComputed.width = this.img.width * ratio;
    this.imgSizeComputed.x = mask.x - ((this.imgSizeComputed.width / 2) - (mask.width / 2));
    this.imgSizeComputed.y = mask.y - ((this.imgSizeComputed.height / 2) - (mask.height / 2));

    return this.imgSizeComputed;
};

Uploader.prototype.draw = function draw() {
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

Uploader.prototype.clearCanvas = function clearCanvas() {
    /** @type {DOMPoint} */
    var p1 = this.canvasContext.transformedPoint(0, 0);
    /** @type {DOMPoint} */
    var p2 = this.canvasContext.transformedPoint(this.canvasObj.width, this.canvasObj.height);

    this.canvasContext.clearRect(p1.x, p1.y, (p2.x - p1.x), (p2.y - p1.y));
};

Uploader.prototype.drawImage = function drawImage() {
    this.canvasContext.drawImage(this.img, this.imgSizeComputed.x, this.imgSizeComputed.y, this.imgSizeComputed.width, this.imgSizeComputed.height);
};

Uploader.prototype.drawMask = function drawMask() {
    /** @type {number} */
    var x;
    /** @type {number} */
    var y;
    /** @type {number} */
    var width;
    /** @type {number} */
    var height;
    /** @type {MaskRadius} */
    var radius;

    if (this.mask === null) {
        return;
    }

    this.canvasContext.save();
    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasContext.fillStyle = this.mask.color;
    this.canvasContext.beginPath();

    x = this.mask.x;
    y = this.mask.y;
    width = this.mask.width;
    height = this.mask.height;
    radius = {
        topLeft    : this.mask.radius,
        topRight   : this.mask.radius,
        bottomRight: this.mask.radius,
        bottomLeft : this.mask.radius
    };

    this.canvasContext.moveTo(x + radius.topLeft, y);
    this.canvasContext.lineTo((x + width) - radius.topRight, y);
    this.canvasContext.quadraticCurveTo(x + width, y, x + width, y + radius.topRight);
    this.canvasContext.lineTo(x + width, (y + height) - radius.bottomRight);
    this.canvasContext.quadraticCurveTo(x + width, y + height, (x + width) - radius.bottomRight, y + height);
    this.canvasContext.lineTo(x + radius.bottomLeft, y + height);
    this.canvasContext.quadraticCurveTo(x, y + height, x, (y + height) - radius.bottomLeft);
    this.canvasContext.lineTo(x, y + radius.topLeft);
    this.canvasContext.quadraticCurveTo(x, y, x + radius.topLeft, y);
    this.canvasContext.closePath();

    this.canvasContext.rect(this.canvasObj.width, 0, -this.canvasObj.width, this.canvasObj.height);
    this.canvasContext.fill();
    this.canvasContext.restore();
};

Uploader.prototype.getCanvasDataURL = function getCanvasDataURL() {
    /** @type {string} */
    var dataURL;

    if (this.mask === null) {
        return this.canvasObj.toDataURL();
    }

    this.clearCanvas();

    this.drawImage();

    dataURL = this.canvasObj.toDataURL();

    this.drawMask();

    return dataURL;
};
// endregion

// region Move
Uploader.prototype.moveStart = function moveStart(event) {
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

Uploader.prototype.moveMove = function moveMove(event) {
    /** @type {number} */
    var scale;
    /** @type {Position} */
    var translation;

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

    scale = this.canvasContext.getTransform().inverse().a;
    translation = this.keepImgInsideMaskBoundings({
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

Uploader.prototype.moveEnd = function moveEnd() {
    /** @type {Position} */
    var translation;

    this.dragStart = null;
    if (this.cssClassCanvasMoving !== "") {
        this.canvasObj.classList.remove(this.cssClassCanvasMoving);
    }

    translation = this.keepImgInsideMaskBoundings({x: 0, y: 0});

    if (translation.x !== 0 || translation.y !== 0) {
        this.canvasContext.translate(translation.x, translation.y);
        this.draw();
    }
};

/**
 * Keep image inside Mask Boundings.
 *
 * @param {Position} translation - position
 * @returns {Position}
 */
Uploader.prototype.keepImgInsideMaskBoundings = function keepImgInsideMaskBoundings(translation) {
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

    if (this.ptBottomRightMask.x > (this.imgSizeComputed.x + this.imgSizeComputed.width)) {
        translation.x = this.ptBottomRightMask.x - (this.imgSizeComputed.x + this.imgSizeComputed.width);
    } else if (this.ptBottomRightMask.x === (this.imgSizeComputed.x + this.imgSizeComputed.width)) {
        if (translation.x < 0) {
            translation.x = 0;
        }
    }

    if (this.ptBottomRightMask.y > (this.imgSizeComputed.y + this.imgSizeComputed.height)) {
        translation.y = this.ptBottomRightMask.y - (this.imgSizeComputed.y + this.imgSizeComputed.height);
    } else if (this.ptBottomRightMask.y === (this.imgSizeComputed.y + this.imgSizeComputed.height)) {
        if (translation.y < 0) {
            translation.y = 0;
        }
    }

    return translation;
};
// endregion

// region Zoom
Uploader.prototype.updateZoomFromInput = function updateZoomFromInput(event) {
    /** @type {DOMPoint} */
    var middleCanvasPoint;
    /** @type {number} */
    var delta;
    /** @type {number} */
    var factor;
    /** @type {Position} */
    var translation;

    if (this.img === null) {
        return undefined;
    }

    if (this.inProgress) {
        event.preventDefault();
        return false;
    }

    this.inProgress = true;

    middleCanvasPoint = this.canvasContext.transformedPoint(this.canvasObj.width / 2, this.canvasObj.height / 2);
    delta = this.zoomCurrent - event.target.value;

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

            this.zoomCurrent = this.zoomCurrent - 1;
            delta = delta - 1;
        } else {
            this.zoomCurrent = this.zoomCurrent + 1;
            delta = delta + 1;
        }

        this.canvasContext.translate(middleCanvasPoint.x, middleCanvasPoint.y);
        this.canvasContext.scale(factor, factor);
        this.canvasContext.translate(-middleCanvasPoint.x, -middleCanvasPoint.y);
    }

    translation = this.keepImgInsideMaskBoundings({x: 0, y: 0});
    this.canvasContext.translate(translation.x, translation.y);
    this.draw();

    if (this.callbacks.zoom.update !== null) {
        this.callbacks.zoom.update(this, "updateZoomFromInput");
    }

    this.inProgress = false;

    return undefined;
};

Uploader.prototype.inputInputZoomListener = function inputInputZoomListener(event) {
    this.zoomEventHasNeverFired = 1;
    this.zoomCurrentValue = event.target.value;
    /* istanbul ignore else */
    if (this.zoomCurrentValue !== this.zoomLastValue) {
        this.updateZoomFromInput(event);
    }
    this.zoomLastValue = this.zoomCurrentValue;
};

Uploader.prototype.changeInputZoomListener = function changeInputZoomListener(event) {
    /* istanbul ignore else */
    if (!this.zoomEventHasNeverFired) {
        this.updateZoomFromInput(event);
    }
};

Uploader.prototype.zoomIn = function zoomIn(zoomMode) {
    this.zoomCurrent = this.zoomCurrent + 1;
    this.zoom(1, zoomMode);
};

Uploader.prototype.zoomOut = function zoomOut(zoomMode) {
    if (this.zoomCurrent === 1) {
        return;
    }

    this.zoomCurrent = this.zoomCurrent - 1;
    this.zoom(-1, zoomMode);
};

Uploader.prototype.zoom = function zoom(exponent, zoomMode) {
    /** @type {DOMPoint} */
    var pt;
    /** @type {number} */
    var factor;
    /** @type {Position} */
    var translation;

    if (zoomMode === ZoomModeCenter) {
        pt = this.canvasContext.transformedPoint(this.canvasObj.width / 2, this.canvasObj.height / 2);
    } else {
        pt = this.canvasContext.transformedPoint(this.lastX, this.lastY);
    }

    this.canvasContext.translate(pt.x, pt.y);
    factor = Math.pow(this.scaleFactor, exponent);
    this.canvasContext.scale(factor, factor);

    this.canvasContext.translate(-pt.x, -pt.y);

    translation = this.keepImgInsideMaskBoundings({x: 0, y: 0});

    this.canvasContext.translate(translation.x, translation.y);
    this.draw();
};

Uploader.prototype.handleScroll = function handleScroll(event) {
    /** @type {number} */
    var oldX = this.lastX;
    /** @type {number} */
    var oldY = this.lastY;
    /** @type {number} */
    var wheelDirection;

    this.lastX = event.offsetX || (event.pageX - this.canvasObj.offsetLeft);
    this.lastY = event.offsetY || (event.pageY - this.canvasObj.offsetTop);

    wheelDirection = 1;
    if (event.detail > 0 || event.wheelDelta < 0) {
        wheelDirection = -1;
    }

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
Uploader.prototype.showError = function showError(message) {
    /** @type {string[]} */
    var parts;
    /** @type {number} */
    var idxParts = 0;
    /** @type {number} */
    var maxParts;

    if (this.divErrorObj === null) {
        return;
    }

    while (this.divErrorObj.lastChild) {
        this.divErrorObj.lastChild.remove();
    }

    parts = message.split("\n");
    maxParts = parts.length;
    for (; idxParts < maxParts; ++idxParts) {
        this.divErrorObj.appendChild(document.createTextNode(parts[idxParts]));
        if (idxParts + 1 < maxParts) {
            this.divErrorObj.appendChild(document.createElement("br"));
        }
    }

    this.divErrorObj.removeAttribute("hidden");
};

Uploader.prototype.hideError = function hideError() {
    if (this.divErrorObj === null) {
        return;
    }

    this.divErrorObj.setAttribute("hidden", "");

    while (this.divErrorObj.lastChild) {
        this.divErrorObj.lastChild.remove();
    }
};
// endregion

window.Uploader = Uploader;
