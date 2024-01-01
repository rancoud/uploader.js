/* global Uploader */
window.cancel = function() {};

/** @covers
 * Uploader.cancel
 * Uploader.hideError
 * Uploader.clearCanvas
 * Uploader.removeEventListeners
 */
describe("uploader", function(){
    beforeEach(function() {
        require("./required.js");
        require("../src/helpers");
        require("../src/uploader");
    });

    it("should reset even there is not image", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-cancel="window.cancel"
    data-uploader-div_upload-id="div_upload"
    data-uploader-div_preview-id="div_preview"
    data-uploader-div_error-id="div_error"
    data-uploader-btn_cancel-id="cancel"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_upload"></div>
    <div id="div_preview" hidden></div>
    <div id="div_error">bla</div>
    <button id="cancel"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderCancel = jest.spyOn(Uploader.prototype, 'cancel');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderRemoveEventListeners = jest.spyOn(Uploader.prototype, 'removeEventListeners');
        var canvasRemoveEventListener = jest.spyOn(document.getElementById('canvas'), 'removeEventListener');
        var windowRemoveEventListener = jest.spyOn(window, 'removeEventListener');

        var callbackCancel = jest.spyOn(window, 'cancel');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        var divUpload = document.getElementById("div_upload");
        var divPreview = document.getElementById("div_preview");
        var divError = document.getElementById("div_error");
        var btnCancel = document.getElementById("cancel");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        uploaderHideError.mockClear();

        btnCancel.click();

        // region Test: call Uploader.cancel
        expect(uploaderCancel).toHaveBeenCalledTimes(1);
        uploaderCancel.mockClear();

        expect(uploader.img).toBe(null);
        expect(uploader.imgSizeComputed).toBe(null);
        expect(uploader.zoomCurrent).toBe(1);

        expect(divPreview.hasAttribute('hidden')).toBe(true);
        expect(divUpload.hasAttribute('hidden')).toBe(false);

        // region Test: call Uploader.hideError
        expect(uploaderHideError).toHaveBeenCalledTimes(1);
        uploaderHideError.mockClear();

        expect(divError.textContent).toBe('');
        expect(divError.hasAttribute("hidden")).toBe(true);
        // endregion

        // region Test: call Uploader.clearCanvas
        expect(uploaderClearCanvas).toHaveBeenCalledTimes(1);
        uploaderClearCanvas.mockClear();
        // endregion

        expect(inputFile.value).toBe("");

        // region Test: call Uploader.removeEventListeners
        expect(uploaderRemoveEventListeners).toHaveBeenCalledTimes(1);
        uploaderRemoveEventListeners.mockClear();

        expect(canvasRemoveEventListener).toHaveBeenCalledTimes(6);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(1, 'mousedown', uploader.eventMouseDownListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(2, 'touchstart', uploader.eventTouchStartListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(3, 'touchmove', uploader.eventTouchMoveListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(4, 'touchend', uploader.eventTouchEndListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(5, 'DOMMouseScroll', uploader.eventHandleScrollListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(6, 'mousewheel', uploader.eventHandleScrollListener);
        canvasRemoveEventListener.mockClear();

        expect(windowRemoveEventListener).toHaveBeenCalledTimes(2);
        expect(windowRemoveEventListener).toHaveBeenNthCalledWith(1, 'mousemove', uploader.eventMouseMoveListener);
        expect(windowRemoveEventListener).toHaveBeenNthCalledWith(2, 'mouseup', uploader.eventMouseUpListener);
        windowRemoveEventListener.mockClear();
        // endregion

        // region Test: call Uploader.callbacks.cancel
        expect(callbackCancel).toHaveBeenCalledTimes(1);
        expect(callbackCancel).toHaveBeenCalledWith(uploader, 'cancel');
        callbackCancel.mockClear();
        // endregion

        // endregion

        done();
    });

    it("should reset even there is not image - no divs", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-btn_cancel-id="cancel"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_upload"></div>
    <div id="div_preview" hidden></div>
    <div id="div_error">bla</div>
    <button id="cancel"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderCancel = jest.spyOn(Uploader.prototype, 'cancel');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderRemoveEventListeners = jest.spyOn(Uploader.prototype, 'removeEventListeners');
        var canvasRemoveEventListener = jest.spyOn(document.getElementById('canvas'), 'removeEventListener');
        var windowRemoveEventListener = jest.spyOn(window, 'removeEventListener');

        var callbackCancel = jest.spyOn(window, 'cancel');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        var divUpload = document.getElementById("div_upload");
        var divPreview = document.getElementById("div_preview");
        var divError = document.getElementById("div_error");
        var btnCancel = document.getElementById("cancel");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        uploaderHideError.mockClear();

        btnCancel.click();

        // region Test: call Uploader.cancel
        expect(uploaderCancel).toHaveBeenCalledTimes(1);
        uploaderCancel.mockClear();

        expect(uploader.img).toBe(null);
        expect(uploader.imgSizeComputed).toBe(null);
        expect(uploader.zoomCurrent).toBe(1);

        expect(divPreview.hasAttribute('hidden')).toBe(true);
        expect(divUpload.hasAttribute('hidden')).toBe(false);

        // region Test: call Uploader.hideError
        expect(uploaderHideError).toHaveBeenCalledTimes(1);
        uploaderHideError.mockClear();

        expect(divError.textContent).toBe('bla');
        expect(divError.hasAttribute("hidden")).toBe(false);
        // endregion

        // region Test: call Uploader.clearCanvas
        expect(uploaderClearCanvas).toHaveBeenCalledTimes(1);
        uploaderClearCanvas.mockClear();
        // endregion

        expect(inputFile.value).toBe("");

        // region Test: call Uploader.removeEventListeners
        expect(uploaderRemoveEventListeners).toHaveBeenCalledTimes(1);
        uploaderRemoveEventListeners.mockClear();

        expect(canvasRemoveEventListener).toHaveBeenCalledTimes(6);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(1, 'mousedown', uploader.eventMouseDownListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(2, 'touchstart', uploader.eventTouchStartListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(3, 'touchmove', uploader.eventTouchMoveListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(4, 'touchend', uploader.eventTouchEndListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(5, 'DOMMouseScroll', uploader.eventHandleScrollListener);
        expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(6, 'mousewheel', uploader.eventHandleScrollListener);
        canvasRemoveEventListener.mockClear();

        expect(windowRemoveEventListener).toHaveBeenCalledTimes(2);
        expect(windowRemoveEventListener).toHaveBeenNthCalledWith(1, 'mousemove', uploader.eventMouseMoveListener);
        expect(windowRemoveEventListener).toHaveBeenNthCalledWith(2, 'mouseup', uploader.eventMouseUpListener);
        windowRemoveEventListener.mockClear();
        // endregion

        // region Test: call Uploader.callbacks.cancel
        expect(callbackCancel).toHaveBeenCalledTimes(0);
        callbackCancel.mockClear();
        // endregion

        // endregion

        done();
    });

    it("should reset canvas after load image", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-cancel="window.cancel"
    data-uploader-div_upload-id="div_upload"
    data-uploader-div_preview-id="div_preview"
    data-uploader-div_error-id="div_error"
    data-uploader-btn_cancel-id="cancel"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_upload"></div>
    <div id="div_preview" hidden></div>
    <div id="div_error">bla</div>
    <button id="cancel"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderCancel = jest.spyOn(Uploader.prototype, 'cancel');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderRemoveEventListeners = jest.spyOn(Uploader.prototype, 'removeEventListeners');
        var canvasRemoveEventListener = jest.spyOn(document.getElementById('canvas'), 'removeEventListener');
        var windowRemoveEventListener = jest.spyOn(window, 'removeEventListener');

        var callbackCancel = jest.spyOn(window, 'cancel');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var divUpload = document.getElementById("div_upload");
        var divPreview = document.getElementById("div_preview");
        var divError = document.getElementById("div_error");
        var btnCancel = document.getElementById("cancel");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event('change'));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, 'result', {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; }),
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function(){
            // clean
            uploaderRemoveEventListeners.mockClear();
            canvasRemoveEventListener.mockClear();
            windowRemoveEventListener.mockClear();
            uploaderHideError.mockClear();
            uploader.canvasContext.__clearDrawCalls();
            uploaderClearCanvas.mockClear();

            btnCancel.click();

            // region Test: call Uploader.cancel
            expect(uploaderCancel).toHaveBeenCalledTimes(1);
            uploaderCancel.mockClear();

            expect(uploader.img).toBe(null);
            expect(uploader.imgSizeComputed).toBe(null);
            expect(uploader.zoomCurrent).toBe(1);

            expect(divPreview.hasAttribute('hidden')).toBe(true);
            expect(divUpload.hasAttribute('hidden')).toBe(false);

            // region Test: call Uploader.hideError
            expect(uploaderHideError).toHaveBeenCalledTimes(1);
            uploaderHideError.mockClear();

            expect(divError.textContent).toBe('');
            expect(divError.hasAttribute("hidden")).toBe(true);
            // endregion

            // region Test: call Uploader.clearCanvas
            expect(uploaderClearCanvas).toHaveBeenCalledTimes(1);
            uploaderClearCanvas.mockClear();
            // endregion

            expect(inputFile.value).toBe("");

            // region Test: call Uploader.removeEventListeners
            expect(uploaderRemoveEventListeners).toHaveBeenCalledTimes(1);
            uploaderRemoveEventListeners.mockClear();

            expect(canvasRemoveEventListener).toHaveBeenCalledTimes(6);
            expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(1, 'mousedown', uploader.eventMouseDownListener);
            expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(2, 'touchstart', uploader.eventTouchStartListener);
            expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(3, 'touchmove', uploader.eventTouchMoveListener);
            expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(4, 'touchend', uploader.eventTouchEndListener);
            expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(5, 'DOMMouseScroll', uploader.eventHandleScrollListener);
            expect(canvasRemoveEventListener).toHaveBeenNthCalledWith(6, 'mousewheel', uploader.eventHandleScrollListener);
            canvasRemoveEventListener.mockClear();

            expect(windowRemoveEventListener).toHaveBeenCalledTimes(2);
            expect(windowRemoveEventListener).toHaveBeenNthCalledWith(1, 'mousemove', uploader.eventMouseMoveListener);
            expect(windowRemoveEventListener).toHaveBeenNthCalledWith(2, 'mouseup', uploader.eventMouseUpListener);
            windowRemoveEventListener.mockClear();
            // endregion

            // region Test: call Uploader.callbacks.cancel
            expect(callbackCancel).toHaveBeenCalledTimes(1);
            expect(callbackCancel).toHaveBeenCalledWith(uploader, 'cancel');
            callbackCancel.mockClear();
            // endregion

            // endregion

            done();
        }, 20);
    });
});
