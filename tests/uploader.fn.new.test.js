/* global Uploader */
window.init = function() {};
window.zoomInit = function() {};
window.zoomUpdate = function() {};
window.imageSuccess = function() {};
window.imageError = function() {};
window.saveUpdateFormData = function() {};
window.saveSuccess = function() {};
window.saveError = function() {};
window.namespace = {};
window.namespace.cancel = function() {};
window.namespace.draw = function() {};

/** @covers
 * getHTMLElement
 * getFunction
 * Uploader
 * Uploader.initAttributes
 * Uploader.verifyMandatoryDataAttributes
 * Uploader.verifyOptionalDataAttributes
 * Uploader.initInputFile
 * Uploader.initCanvas
 * Uploader.initDivs
 * Uploader.initMask
 * Uploader.initZoom
 * Uploader.initSave
 * Uploader.initCancel
 * Uploader.hideError
 */
describe("uploader", function() {
    beforeEach(function() {
        require("./required.js");
        require("../src/helpers");
        require("../src/uploader");
    });

    // region Mandatory
    it("should return error on missing mandatory attributes", function(done) {
        document.body.innerHTML = `<div id="uploader"></div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-input_file-id, expect string, get object");

        // ---

        document.body.innerHTML = `<div id="uploader" data-uploader-input_file-id="aze"></div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("DOM element aze not found");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file">
    <input type="file" id="input_file" />
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-canvas-id, expect string, get object");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="aze">
    <input type="file" id="input_file" />
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("DOM element aze not found");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas">
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.inputFileObj).toBe(document.getElementById("input_file"));
        expect(uploader.canvasObj).toBe(document.getElementById("canvas"));

        done();
    });

    it("should call initInput()", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas">
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var inputFileAddEventListener = jest.spyOn(document.getElementById("input_file"), "addEventListener");

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(inputFileAddEventListener).toHaveBeenCalledTimes(1);
        expect(inputFileAddEventListener).toHaveBeenCalledWith("change", uploader.eventChangeInputFileListener);

        done();
    });

    it("should call initCanvas()", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas">
    <input type="file" id="input_file" />
    <canvas id="canvas" width="80" height="50"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.lastX).toBe(40);
        expect(uploader.lastY).toBe(25);

        expect(uploader.canvasContext).toBe(document.getElementById("canvas").getContext("2d"));
        expect(uploader.canvasContext.imageSmoothingEnabled).toBe(true);
        expect(uploader.canvasContext.imageSmoothingQuality).toBe("high");

        expect(uploader.eventMouseDownListener).not.toBe(undefined);
        expect(uploader.eventMouseMoveListener).not.toBe(undefined);
        expect(uploader.eventMouseUpListener).not.toBe(undefined);
        expect(uploader.eventTouchStartListener).not.toBe(undefined);
        expect(uploader.eventTouchMoveListener).not.toBe(undefined);
        expect(uploader.eventTouchEndListener).not.toBe(undefined);
        expect(uploader.eventHandleScrollListener).not.toBe(undefined);

        done();
    });
    // endregion

    // region Optional > divs
    it("should return error on wrong optional attributes - divs", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_upload-id="div_upload"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("DOM element div_upload not found");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_upload-id="div_upload"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_upload"></div>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.divUploadObj).toBe(document.getElementById("div_upload"));

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_preview-id="div_preview"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("DOM element div_preview not found");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_preview-id="div_preview"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_preview"></div>
</div>`;
        uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.divPreviewObj).toBe(document.getElementById("div_preview"));

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_error-id="div_error"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("DOM element div_error not found");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_error-id="div_error"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_error"></div>
</div>`;
        uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.divErrorObj).toBe(document.getElementById("div_error"));

        done();
    });

    it("should call initDivs()", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_preview-id="div_preview"
    data-uploader-div_upload-id="div_upload"
    data-uploader-div_error-id="div_error">
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_preview"></div>
    <div id="div_upload" hidden></div>
    <div id="div_error">text to remove</div>
</div>`;

        var divPreview = document.getElementById("div_preview");
        var divUpload = document.getElementById("div_upload");
        var divError = document.getElementById("div_error");

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.divPreviewObj).toBe(divPreview);
        expect(divPreview.hasAttribute("hidden")).toBe(true);
        expect(divPreview.innerHTML).toBe("");

        expect(uploader.divUploadObj).toBe(divUpload);
        expect(divUpload.hasAttribute("hidden")).toBe(false);
        expect(divUpload.innerHTML).toBe("");

        expect(uploader.divErrorObj).toBe(divError);
        expect(divError.hasAttribute("hidden")).toBe(true);
        expect(divError.innerHTML).toBe("");

        done();
    });
    // endregion

    // region Optional > mask
    it("should return error on wrong optional attributes - mask - data-uploader-mask-size", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="aze"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-mask-size, expect size above 0, get width: 0 height: 0");

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="0"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-mask-size, expect size above 0, get width: 0 height: 0");

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="0,0"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-mask-size, expect size above 0, get width: 0 height: 0");

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="200"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-mask-size, expect size below canvas size, get width: 200 height: 200");

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="10,200"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-mask-size, expect size below canvas size, get width: 10 height: 200");

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="10,100"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.maskRaw.size).toStrictEqual({width: 10, height: 100});

        done();
    });

    it("should return error on wrong optional attributes - mask - data-uploader-mask-color", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-color="rgba(255, 255, 255, 0.5)"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-mask-color, you have to set data-uploader-mask-size first");

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="10,100"
    data-uploader-mask-color="rgba(13, 6, 45, 0.4)"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.maskRaw.color).toBe("rgba(13, 6, 45, 0.4)");

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="10,100"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.maskRaw.color).toBe("rgba(255, 255, 255, 0.5)");

        done();
    });

    it("should return error on wrong optional attributes - mask - data-uploader-mask-radius", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-radius="0"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-mask-radius, you have to set data-uploader-mask-size first");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="10,100"
    data-uploader-mask-radius="opjkfze"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.maskRaw.radius).toBe(0);

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="50,100"
    data-uploader-mask-radius="10"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.maskRaw.radius).toBe(10);

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="50,100"
    data-uploader-mask-radius="9000"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.maskRaw.radius).toBe(25);

        done();
    });

    it("should return error on wrong optional attributes - mask - data-uploader-mask-constraint", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-constraint="fit"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid attribute data-uploader-mask-constraint, you have to set data-uploader-mask-size first");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="10,100"
    data-uploader-mask-constraint="fit"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe(`Invalid attribute data-uploader-mask-constraint, expect value "true" or "false", get fit`);

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="50,100"
    data-uploader-mask-constraint="false"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.maskRaw.constraint).toBe(false);

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="50,100"
    data-uploader-mask-constraint="true"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.maskRaw.constraint).toBe(true);

        // ---

        done();
    });

    it("should call initMask()", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="10,100"
    data-uploader-mask-color="rgba(13, 6, 45, 0.4)"
    data-uploader-mask-radius="20">
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.mask).toStrictEqual({
            x         : 45,
            y         : 0,
            width     : 10,
            height    : 100,
            color     : "rgba(13, 6, 45, 0.4)",
            radius    : 5,
            constraint: true
        });

        done();
    });
    // endregion

    // region Optional > zoom
    it("should return error on wrong optional attributes - zoom", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-input_zoom-id="input_zoom"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("DOM element input_zoom not found");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-input_zoom-id="input_zoom"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <input type="range" id="input_zoom" value="1"/>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.inputZoomObj).toBe(document.getElementById("input_zoom"));

        // ---

        done();
    });

    it("should call initZoom()", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-input_zoom-id="input_zoom"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <input type="range" id="input_zoom" value="1"/>
</div>`;

        var inputZoomAddEventListener = jest.spyOn(document.getElementById("input_zoom"), "addEventListener");

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.zoomCurrent).toBe(1);
        expect(inputZoomAddEventListener).toHaveBeenCalledTimes(2);
        expect(inputZoomAddEventListener).toHaveBeenCalledWith("input", uploader.eventInputInputZoomListener);
        expect(inputZoomAddEventListener).toHaveBeenCalledWith("change", uploader.eventChangeInputZoomListener);

        done();
    });
    // endregion

    // region Optional > save
    it("should return error on wrong optional attributes - save", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-btn_save-id="save"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("DOM element save not found");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-btn_save-id="save"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="save"></button>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.btnSaveObj).toBe(document.getElementById("save"));

        // ---

        done();
    });

    it("should not set upload url, name, prefix", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-upload-url=""
    data-uploader-upload-name=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.uploadUrl).toBe(window.location.toString());
        expect(uploader.uploadName).toBe("image");
        expect(uploader.uploadPrefix).toBe("");

        done();
    });

    it("should set upload url, name, prefix", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-upload-url="/url"
    data-uploader-upload-name="custom_name"
    data-uploader-upload-prefix="prefix"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.uploadUrl).toBe("/url");
        expect(uploader.uploadName).toBe("custom_name");
        expect(uploader.uploadPrefix).toBe("prefix");

        done();
    });

    it("should call initSave()", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-btn_save-id="save"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="save"></button>
</div>`;

        var saveAddEventListener = jest.spyOn(document.getElementById("save"), "addEventListener");

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(saveAddEventListener).toHaveBeenCalledTimes(1);
        expect(saveAddEventListener).toHaveBeenCalledWith("click", uploader.eventSaveListener);

        done();
    });
    // endregion

    // region Optional > cancel
    it("should return error on wrong optional attributes - cancel", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-btn_cancel-id="cancel"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("DOM element cancel not found");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-btn_cancel-id="cancel"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.btnCancelObj).toBe(document.getElementById("cancel"));

        // ---

        done();
    });

    it("should call initCancel()", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-btn_cancel-id="cancel"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;

        var cancelAddEventListener = jest.spyOn(document.getElementById("cancel"), "addEventListener");

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(cancelAddEventListener).toHaveBeenCalledTimes(1);
        expect(cancelAddEventListener).toHaveBeenCalledWith("click", uploader.eventCancelListener);

        done();
    });
    // endregion

    // region Optional > errors messages
    it("should not set errors messages", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-error-load=""
    data-uploader-error-upload=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.errorLoadMessage).toBe("Could not load your image.\nUse png or jpg file.");
        expect(uploader.errorUploadMessage).toBe("Could not upload your image.\nTry later.");

        done();
    });

    it("should set errors messages", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-error-load="error load"
    data-uploader-error-upload="error upload"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.errorLoadMessage).toBe("error load");
        expect(uploader.errorUploadMessage).toBe("error upload");

        done();
    });
    // endregion

    // region Optional > callbacks
    it("should not set callbacks", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel=""
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.callbacks).toStrictEqual({
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
                update_form_data: null,
                success         : null,
                error           : null
            },
            cancel: null,
            draw  : null
        });

        done();
    });

    it("should return error on wrong optional attributes - callbacks", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init="aze"
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel=""
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function aze in data-uploader-callback-init");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init="aze"
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel=""
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function aze in data-uploader-callback-zoom-init");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update="aze"
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel=""
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function aze in data-uploader-callback-zoom-update");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success="window.wrce.uio"
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel=""
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function window.wrce.uio in data-uploader-callback-image-success");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error="window.wrong_namespace.uio"
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel=""
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function window.wrong_namespace.uio in data-uploader-callback-image-error");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data="ppp"
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel=""
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function ppp in data-uploader-callback-save-update_form_data");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success="ppp"
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel=""
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function ppp in data-uploader-callback-save-success");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error="aaa"
    data-uploader-callback-cancel=""
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function aaa in data-uploader-callback-save-error");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel="cancel"
    data-uploader-callback-draw=""
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function cancel in data-uploader-callback-cancel");

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init=""
    data-uploader-callback-zoom-init=""
    data-uploader-callback-zoom-update=""
    data-uploader-callback-image-success=""
    data-uploader-callback-image-error=""
    data-uploader-callback-save-update_form_data=""
    data-uploader-callback-save-success=""
    data-uploader-callback-save-error=""
    data-uploader-callback-cancel=""
    data-uploader-callback-draw="draw"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="cancel"></button>
</div>`;
        err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid function draw in data-uploader-callback-draw");

        // ---

        done();
    });

    it("should set callbacks", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init="window.init"
    data-uploader-callback-zoom-init="window.zoomInit"
    data-uploader-callback-zoom-update="window.zoomUpdate"
    data-uploader-callback-image-success="window.imageSuccess"
    data-uploader-callback-image-error="window.imageError"
    data-uploader-callback-save-update_form_data="window.saveUpdateFormData"
    data-uploader-callback-save-success="window.saveSuccess"
    data-uploader-callback-save-error="window.saveError"
    data-uploader-callback-cancel="window.namespace.cancel"
    data-uploader-callback-draw="window.namespace.draw"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.callbacks.init).toBe(window.init);
        expect(uploader.callbacks.zoom.init).toBe(window.zoomInit);
        expect(uploader.callbacks.zoom.update).toBe(window.zoomUpdate);
        expect(uploader.callbacks.image.success).toBe(window.imageSuccess);
        expect(uploader.callbacks.image.error).toBe(window.imageError);
        expect(uploader.callbacks.save.update_form_data).toBe(window.saveUpdateFormData);
        expect(uploader.callbacks.save.success).toBe(window.saveSuccess);
        expect(uploader.callbacks.save.error).toBe(window.saveError);
        expect(uploader.callbacks.cancel).toBe(window.namespace.cancel);
        expect(uploader.callbacks.draw).toBe(window.namespace.draw);

        done();
    });

    it("should could init callbacks", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-init="window.init"
    data-uploader-callback-zoom-init="window.zoomInit"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var callbackInit = jest.spyOn(window, "init");
        var callbackZoomInit = jest.spyOn(window, "zoomInit");

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploader.callbacks.init).toBe(window.init);
        expect(callbackInit).toHaveBeenCalledWith(uploader, "Uploader");
        expect(callbackInit).toHaveBeenCalledTimes(1);

        expect(uploader.callbacks.zoom.init).toBe(window.zoomInit);
        expect(callbackZoomInit).toHaveBeenCalledWith(uploader, "initZoom");
        expect(callbackZoomInit).toHaveBeenCalledTimes(1);

        done();
    });
    // endregion

    // region Optional > scale factor
    it("should set custom scale factor", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-scale_factor="2.1"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.scaleFactor).toBe(2.1);

        done();
    });

    it("should set default scale factor when it's invalid", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-scale_factor="yolo"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.scaleFactor).toBe(1.05);

        done();
    });
    // endregion

    // region Optional > css class canvas moving
    it("should return error on wrong optional attributes - css canvas moving", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-css-canvas_moving="canvas moving"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        var err = new Uploader(document.getElementById("uploader"));
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe(`Invalid css class "canvas moving" in data-uploader-css-canvas_moving, space is not allowed`);

        // ---

        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <button id="save"></button>
</div>`;
        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.cssClassCanvasMoving).toBe("");

        // ---

        done();
    });

    it("should set css class canvas moving", function(done) {
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-css-canvas_moving="canvas--moving"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        expect(uploader.cssClassCanvasMoving).toBe("canvas--moving");

        done();
    });
    // endregion
});
