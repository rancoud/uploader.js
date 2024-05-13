/* global Uint8Array */
/**
 * Get HTML Element.
 *
 * @param {string} attributeName - attribute name
 * @param {string} elementID     - id
 * @returns {(TypeError|Error|HTMLElement)}
 */
function getHTMLElement(attributeName, elementID) {
    /** @type {(HTMLElement|null)} */
    var htmlElementObject;

    if (typeof elementID !== "string") {
        return new TypeError("Invalid attribute " + attributeName + ", expect string, get " + typeof elementID);
    }

    htmlElementObject = document.getElementById(elementID);
    if (!htmlElementObject) {
        return new Error("DOM element " + elementID + " not found");
    }

    return htmlElementObject;
}

/**
 * Get function.
 *
 * @param {string} fn - function to use, can be separated with '.'
 * @returns {(Function|undefined)}
 */
function getFunction(fn) {
    /** @type Window */
    var scope = window;
    /** @type string[] */
    var fnParts = fn.split(".");
    /** @type number */
    var idxScopes = 0;
    /** @type number */
    var maxFnParts = fnParts.length;

    for (; idxScopes < maxFnParts - 1; idxScopes++) {
        if (fnParts[idxScopes] === "window") {
            continue;
        }

        scope = scope[fnParts[idxScopes]];

        if (scope === undefined) {
            return undefined;
        }
    }

    return scope[fnParts[fnParts.length - 1]];
}

/**
 * Convert DataURL to Blob.
 *
 * @param {string} dataURL - data from canvas
 * @returns {Blob}
 */
function dataURLtoBlob(dataURL) {
    /** @type string */
    var byteString;
    /** @type string */
    var mimeString;
    /** @type Uint8Array */
    var uInt8Array;
    /** @type number */
    var idxArray = 0;
    /** @type number */
    var lenArray;

    /* istanbul ignore else */
    if (dataURL.split(",")[0].indexOf("base64") >= 0) {
        byteString = atob(dataURL.split(",")[1]);
    } else {
        byteString = decodeURI(dataURL.split(",")[1]);
    }

    mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];

    uInt8Array = new Uint8Array(byteString.length);
    lenArray = byteString.length;
    for (; idxArray < lenArray; ++idxArray) {
        uInt8Array[idxArray] = byteString.charCodeAt(idxArray);
    }

    return new Blob([uInt8Array], {type: mimeString});
}

/**
 * Pause Event, useful for disabling the selection with the mouse.
 *
 * @param {Event} event - event
 * @returns {boolean}
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

// region Matrix Computing
/* istanbul ignore next */
/**
 * Get Matrix.
 *
 * @returns {DOMMatrix}
 */
function getMatrix() {
    /** @type {SVGSVGElement} */
    var svg;

    if (typeof DOMMatrix === "function") {
        return new DOMMatrix();
    }

    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    return svg.createSVGMatrix();
}

/* istanbul ignore next */
/**
 * Get Point.
 *
 * @returns {DOMPoint}
 */
function getPoint() {
    /** @type {SVGSVGElement} */
    var svg;

    if (typeof DOMPoint === "function") {
        return new DOMPoint();
    }

    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    return svg.createSVGPoint();
}

/* istanbul ignore next */
/**
 * Track transforms.
 *
 * @param {CanvasRenderingContext2D} ctx - canvas rendering context
 * @returns {undefined}
 */
function trackTransforms(ctx) {
    var xform = getMatrix();
    var savedTransforms = [];
    var save = ctx.save;
    var restore = ctx.restore;
    var scale = ctx.scale;
    var rotate = ctx.rotate;
    var translate = ctx.translate;
    var transform = ctx.transform;
    var setTransform = ctx.setTransform;
    var pt = getPoint();

    // eslint-disable-next-line func-names
    ctx.getTransform = function() {
        return xform;
    };

    // eslint-disable-next-line func-names
    ctx.save = function() {
        savedTransforms.push(xform.translate(0, 0));

        return save.call(ctx);
    };

    // eslint-disable-next-line func-names
    ctx.restore = function() {
        xform = savedTransforms.pop();

        return restore.call(ctx);
    };

    // eslint-disable-next-line func-names
    ctx.scale = function(sx, sy) {
        xform = xform.scale(sx, sy);

        return scale.call(ctx, sx, sy);
    };

    // eslint-disable-next-line func-names
    ctx.rotate = function(radians) {
        // eslint-disable-next-line no-magic-numbers
        xform = xform.rotate(radians * 180 / Math.PI);

        return rotate.call(ctx, radians);
    };

    // eslint-disable-next-line func-names
    ctx.translate = function(dx, dy) {
        xform = xform.translate(dx, dy);

        return translate.call(ctx, dx, dy);
    };

    // eslint-disable-next-line func-names,max-params,id-length
    ctx.transform = function(a, b, c, d, e, f) {
        var matrix2 = getMatrix();
        // eslint-disable-next-line id-length
        matrix2.a = a;
        // eslint-disable-next-line id-length
        matrix2.b = b;
        // eslint-disable-next-line id-length
        matrix2.c = c;
        // eslint-disable-next-line id-length
        matrix2.d = d;
        // eslint-disable-next-line id-length
        matrix2.e = e;
        // eslint-disable-next-line id-length
        matrix2.f = f;
        xform = xform.multiply(matrix2);

        return transform.call(ctx, a, b, c, d, e, f);
    };

    // eslint-disable-next-line func-names,max-params,id-length
    ctx.setTransform = function(a, b, c, d, e, f) {
        // eslint-disable-next-line id-length
        xform.a = a;
        // eslint-disable-next-line id-length
        xform.b = b;
        // eslint-disable-next-line id-length
        xform.c = c;
        // eslint-disable-next-line id-length
        xform.d = d;
        // eslint-disable-next-line id-length
        xform.e = e;
        // eslint-disable-next-line id-length
        xform.f = f;

        return setTransform.call(ctx, a, b, c, d, e, f);
    };

    // eslint-disable-next-line func-names
    ctx.transformedPoint = function(x, y) {
        pt.x = x;
        pt.y = y;

        return pt.matrixTransform(xform.inverse());
    };
}
// endregion

window.getHTMLElement = getHTMLElement; // BUILD REMOVE LINE
window.getFunction = getFunction; // BUILD REMOVE LINE
window.dataURLtoBlob = dataURLtoBlob; // BUILD REMOVE LINE
window.pauseEvent = pauseEvent; // BUILD REMOVE LINE
window.trackTransforms = trackTransforms; // BUILD REMOVE LINE
