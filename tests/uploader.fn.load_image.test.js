/* global Uploader */
window.zoomUpdate = function() {};
window.imageSuccess = function() {};
window.imageError = function() {};
window.namespace = {};
window.namespace.draw = function() {};

/** @covers
 * Uploader.changeInputFile
 * Uploader.treatImage
 * Uploader.treatImageOnLoad
 * Uploader.treatImageOnError
 * Uploader.removeEventListeners
 * Uploader.addEventListeners
 * Uploader.computeSize
 * Uploader.draw
 * Uploader.clearCanvas
 * Uploader.drawImage
 * Uploader.drawMask
 * Uploader.hideError
 * Uploader.showError
 */
describe("uploader", function(){
    beforeEach(function() {
        require("./required.js");
        require("../src/uploader");
    });

    it("should load valid image (no options)", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderChangeInputFile = jest.spyOn(Uploader.prototype, 'changeInputFile');
        var uploaderTreatImage = jest.spyOn(Uploader.prototype, 'treatImage');
        var uploaderTreatImageOnLoad = jest.spyOn(Uploader.prototype, 'treatImageOnLoad');
        var uploaderTreatImageOnError = jest.spyOn(Uploader.prototype, 'treatImageOnError');
        var uploaderRemoveEventListeners = jest.spyOn(Uploader.prototype, 'removeEventListeners');
        var uploaderAddEventListeners = jest.spyOn(Uploader.prototype, 'addEventListeners');
        var uploaderDraw = jest.spyOn(Uploader.prototype, 'draw');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderComputeSize = jest.spyOn(Uploader.prototype, 'computeSize');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');

        var canvasAddEventListener = jest.spyOn(document.getElementById('canvas'), 'addEventListener');
        var windowAddEventListener = jest.spyOn(window, 'addEventListener');
        var canvasRemoveEventListener = jest.spyOn(document.getElementById('canvas'), 'removeEventListener');
        var windowRemoveEventListener = jest.spyOn(window, 'removeEventListener');

        var fileReaderReadAsDataURL = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => {return window.fileDataURL;});
        // endregion

        // region Setup: input file + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploaderHideError).toHaveBeenCalledTimes(1);
        uploaderHideError.mockClear();
        // endregion

        inputFile.dispatchEvent(new Event('change'));

        // region Test: call Uploader.changeInputFile
        expect(uploaderChangeInputFile).toHaveBeenCalledTimes(1);
        uploaderChangeInputFile.mockClear();
        // endregion

        // region Test: call FileReader.readAsDataURL
        expect(fileReaderReadAsDataURL).toHaveBeenCalledWith(window.ValidFile);
        expect(fileReaderReadAsDataURL).toHaveBeenCalledTimes(1);
        fileReaderReadAsDataURL.mockClear();

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, 'result', {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; }),
        });
        // endregion

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        // region Test: call Uploader.treatImage
        expect(uploaderTreatImage).toHaveBeenCalledTimes(1);
        uploaderTreatImage.mockClear();

        expect(uploader.img).not.toBe(null);
        expect(uploader.img.onload).toBe(uploader.eventTreatImageOnLoad);
        expect(uploader.img.onerror).toBe(uploader.eventTreatImageOnError);
        expect(uploader.img.src).toBe(uploader.reader.result);
        // endregion

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // region Test: call Uploader.onLoadImage
        // WARNING, jest.useFakeTimers() not working with image.onload event
        //setTimeout(function(){
            expect(uploaderTreatImageOnLoad).toHaveBeenCalledTimes(1);
            uploaderTreatImageOnLoad.mockClear();

            // Because we use a valid image there is no call to treatImageOnError
            expect(uploaderTreatImageOnError).toHaveBeenCalledTimes(0);
            uploaderTreatImageOnError.mockClear();

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

            // region Test: call Uploader.addEventListeners
            expect(uploaderAddEventListeners).toHaveBeenCalledTimes(1);
            uploaderAddEventListeners.mockClear();

            expect(canvasAddEventListener).toHaveBeenCalledTimes(6);
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(1, 'mousedown', uploader.eventMouseDownListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(2, 'touchstart', uploader.eventTouchStartListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(3, 'touchmove', uploader.eventTouchMoveListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(4, 'touchend', uploader.eventTouchEndListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(5, 'DOMMouseScroll', uploader.eventHandleScrollListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(6, 'mousewheel', uploader.eventHandleScrollListener, {"passive": false});
            canvasAddEventListener.mockClear();

            expect(windowAddEventListener).toHaveBeenCalledTimes(2);
            expect(windowAddEventListener).toHaveBeenNthCalledWith(1, 'mousemove', uploader.eventMouseMoveListener, {"passive": false});
            expect(windowAddEventListener).toHaveBeenNthCalledWith(2, 'mouseup', uploader.eventMouseUpListener, {"passive": false});
            windowAddEventListener.mockClear();
            // endregion

            expect(uploader.zoomCurrent).toBe(1);

            // region Test: call Uploader.computeSize
            expect(uploaderComputeSize).toHaveBeenCalledTimes(1);
            uploaderComputeSize.mockClear();
            expect(uploader.imgSizeComputed).toStrictEqual({"height": 100, "width": 100, "x": 0, "y": 0});
            // endregion

            // region Test: call Uploader.draw
            expect(uploaderDraw).toHaveBeenCalledTimes(1);
            uploaderDraw.mockClear();

            // region Test: call Uploader.clearCanvas
            {
                expect(uploaderClearCanvas).toHaveBeenCalledTimes(1);
                uploaderClearCanvas.mockClear();
            }
            // endregion

            // region Test: call Uploader.drawImage
            {
                expect(uploaderDrawImage).toHaveBeenCalledTimes(1);
                uploaderDrawImage.mockClear();
            }
            // endregion

            // region Test: call Uploader.drawMask
            {
                expect(uploaderDrawMask).toHaveBeenCalledTimes(1);
                uploaderDrawMask.mockClear();
            }
            // endregion

            expect(uploader.canvasContext.__getDrawCalls()).toStrictEqual([
                window.canvasDrawCalls.clearRect,
                window.canvasDrawCalls.drawImage_Size100
            ]);
            uploader.canvasContext.__clearDrawCalls();

            expect(uploader.ptTopLeftMask).toStrictEqual({"x": 0, "y": 0});
            expect(uploader.ptBottomRightMask).toStrictEqual({"x": 0, "y": 0});
            // endregion

            // region Test: call Uploader.hideError
            expect(uploaderHideError).toHaveBeenCalledTimes(1);
            uploaderHideError.mockClear();
            // endregion

            expect(uploaderShowError).toHaveBeenCalledTimes(0);

            done();
        //}, 20);
        // endregion
    });

    it("should load valid image + no mask", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-zoom-update="window.zoomUpdate"
    data-uploader-callback-image-success="window.imageSuccess"
    data-uploader-callback-image-error="window.imageError"
    data-uploader-callback-draw="window.namespace.draw"
    data-uploader-input_zoom-id="input_zoom"
    data-uploader-div_upload-id="div_upload"
    data-uploader-div_preview-id="div_preview"
    data-uploader-div_error-id="div_error"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <input type="range" id="input_zoom" value="1"/>
    <div id="div_upload"></div>
    <div id="div_preview" hidden></div>
    <div id="div_error">bla</div>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderChangeInputFile = jest.spyOn(Uploader.prototype, 'changeInputFile');
        var uploaderTreatImage = jest.spyOn(Uploader.prototype, 'treatImage');
        var uploaderTreatImageOnLoad = jest.spyOn(Uploader.prototype, 'treatImageOnLoad');
        var uploaderTreatImageOnError = jest.spyOn(Uploader.prototype, 'treatImageOnError');
        var uploaderRemoveEventListeners = jest.spyOn(Uploader.prototype, 'removeEventListeners');
        var uploaderAddEventListeners = jest.spyOn(Uploader.prototype, 'addEventListeners');
        var uploaderDraw = jest.spyOn(Uploader.prototype, 'draw');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderComputeSize = jest.spyOn(Uploader.prototype, 'computeSize');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');

        var canvasAddEventListener = jest.spyOn(document.getElementById('canvas'), 'addEventListener');
        var windowAddEventListener = jest.spyOn(window, 'addEventListener');
        var canvasRemoveEventListener = jest.spyOn(document.getElementById('canvas'), 'removeEventListener');
        var windowRemoveEventListener = jest.spyOn(window, 'removeEventListener');

        var fileReaderReadAsDataURL = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => {return window.fileDataURL;});

        var callbackZoomUpdate = jest.spyOn(window, 'zoomUpdate');
        var callbackImageSuccess = jest.spyOn(window, 'imageSuccess');
        var callbackImageError = jest.spyOn(window, 'imageError');
        var callbackDraw = jest.spyOn(window.namespace, 'draw');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputZoom = document.getElementById("input_zoom");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var divUpload = document.getElementById("div_upload");
        var divPreview = document.getElementById("div_preview");
        var divError = document.getElementById("div_error");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploaderHideError).toHaveBeenCalledTimes(1);
        uploaderHideError.mockClear();
        // endregion

        inputFile.dispatchEvent(new Event('change'));

        // region Test: call Uploader.changeInputFile
        expect(uploaderChangeInputFile).toHaveBeenCalledTimes(1);
        uploaderChangeInputFile.mockClear();
        // endregion

        // region Test: call FileReader.readAsDataURL
        expect(fileReaderReadAsDataURL).toHaveBeenCalledWith(window.ValidFile);
        expect(fileReaderReadAsDataURL).toHaveBeenCalledTimes(1);
        fileReaderReadAsDataURL.mockClear();

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, 'result', {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; }),
        });
        // endregion

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        // region Test: call Uploader.treatImage
        expect(uploaderTreatImage).toHaveBeenCalledTimes(1);
        uploaderTreatImage.mockClear();

        expect(uploader.img).not.toBe(null);
        expect(uploader.img.onload).toBe(uploader.eventTreatImageOnLoad);
        expect(uploader.img.onerror).toBe(uploader.eventTreatImageOnError);
        expect(uploader.img.src).toBe(uploader.reader.result);
        // endregion

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // region Test: call Uploader.onLoadImage
        // WARNING, jest.useFakeTimers() not working with image.onload event
        //setTimeout(function(){
            expect(uploaderTreatImageOnLoad).toHaveBeenCalledTimes(1);
            uploaderTreatImageOnLoad.mockClear();

            // Because we use a valid image there is no call to treatImageOnError
            expect(uploaderTreatImageOnError).toHaveBeenCalledTimes(0);
            uploaderTreatImageOnError.mockClear();

            expect(callbackImageError).toHaveBeenCalledTimes(0);
            callbackImageError.mockClear();

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

            // region Test: call Uploader.addEventListeners
            expect(uploaderAddEventListeners).toHaveBeenCalledTimes(1);
            uploaderAddEventListeners.mockClear();

            expect(canvasAddEventListener).toHaveBeenCalledTimes(6);
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(1, 'mousedown', uploader.eventMouseDownListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(2, 'touchstart', uploader.eventTouchStartListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(3, 'touchmove', uploader.eventTouchMoveListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(4, 'touchend', uploader.eventTouchEndListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(5, 'DOMMouseScroll', uploader.eventHandleScrollListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(6, 'mousewheel', uploader.eventHandleScrollListener, {"passive": false});
            canvasAddEventListener.mockClear();

            expect(windowAddEventListener).toHaveBeenCalledTimes(2);
            expect(windowAddEventListener).toHaveBeenNthCalledWith(1, 'mousemove', uploader.eventMouseMoveListener, {"passive": false});
            expect(windowAddEventListener).toHaveBeenNthCalledWith(2, 'mouseup', uploader.eventMouseUpListener, {"passive": false});
            windowAddEventListener.mockClear();
            // endregion

            expect(uploader.zoomCurrent).toBe(1);
            expect(inputZoom.value).toBe("1");

            // region Test: call Uploader.computeSize
            expect(uploaderComputeSize).toHaveBeenCalledTimes(1);
            uploaderComputeSize.mockClear();
            expect(uploader.imgSizeComputed).toStrictEqual({"height": 100, "width": 100, "x": 0, "y": 0});
            // endregion

            // region Test: call Uploader.draw
            expect(uploaderDraw).toHaveBeenCalledTimes(1);
            uploaderDraw.mockClear();

                // region Test: call Uploader.clearCanvas
                {
                    expect(uploaderClearCanvas).toHaveBeenCalledTimes(1);
                    uploaderClearCanvas.mockClear();
                }
                // endregion

                // region Test: call Uploader.drawImage
                {
                    expect(uploaderDrawImage).toHaveBeenCalledTimes(1);
                    uploaderDrawImage.mockClear();
                }
                // endregion

                // region Test: call Uploader.drawMask
                {
                    expect(uploaderDrawMask).toHaveBeenCalledTimes(1);
                    uploaderDrawMask.mockClear();
                }
                // endregion

                // region Test: call callbacks.draw
                {
                    expect(callbackDraw).toHaveBeenCalledTimes(1);
                    expect(callbackDraw).toHaveBeenCalledWith(uploader, 'draw');
                    callbackDraw.mockClear();
                }
                // endregion

            expect(uploader.canvasContext.__getDrawCalls()).toStrictEqual([
                window.canvasDrawCalls.clearRect,
                window.canvasDrawCalls.drawImage_Size100
            ]);
            uploader.canvasContext.__clearDrawCalls();

            expect(uploader.ptTopLeftMask).toStrictEqual({"x": 0, "y": 0});
            expect(uploader.ptBottomRightMask).toStrictEqual({"x": 0, "y": 0});
            // endregion

            expect(divUpload.hasAttribute("hidden")).toBe(true);
            expect(divPreview.hasAttribute("hidden")).toBe(false);

            // region Test: call Uploader.hideError
            expect(uploaderHideError).toHaveBeenCalledTimes(1);
            uploaderHideError.mockClear();

            expect(divError.textContent).toBe('');
            expect(divError.hasAttribute("hidden")).toBe(true);
            // endregion

            expect(uploaderShowError).toHaveBeenCalledTimes(0);

            // region Test: call Uploader.callbacks.image.success
            expect(callbackImageSuccess).toHaveBeenCalledTimes(1);
            expect(callbackImageSuccess).toHaveBeenCalledWith(uploader, 'treatImageOnLoad');
            callbackImageSuccess.mockClear();
            // endregion

            // region Test: call Uploader.callbacks.zoom.update
            expect(callbackZoomUpdate).toHaveBeenCalledTimes(1);
            expect(callbackZoomUpdate).toHaveBeenCalledWith(uploader, 'treatImageOnLoad');
            callbackZoomUpdate.mockClear();
            // endregion

            done();
        //}, 20);
        // endregion
    });

    it("should load valid image + basic mask", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-zoom-update="window.zoomUpdate"
    data-uploader-callback-image-success="window.imageSuccess"
    data-uploader-callback-image-error="window.imageError"
    data-uploader-callback-draw="window.namespace.draw"
    data-uploader-input_zoom-id="input_zoom"
    data-uploader-div_upload-id="div_upload"
    data-uploader-div_preview-id="div_preview"
    data-uploader-div_error-id="div_error"
    data-uploader-mask-size="50"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <input type="range" id="input_zoom" value="1"/>
    <div id="div_upload"></div>
    <div id="div_preview" hidden></div>
    <div id="div_error">bla</div>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderChangeInputFile = jest.spyOn(Uploader.prototype, 'changeInputFile');
        var uploaderTreatImage = jest.spyOn(Uploader.prototype, 'treatImage');
        var uploaderTreatImageOnLoad = jest.spyOn(Uploader.prototype, 'treatImageOnLoad');
        var uploaderTreatImageOnError = jest.spyOn(Uploader.prototype, 'treatImageOnError');
        var uploaderRemoveEventListeners = jest.spyOn(Uploader.prototype, 'removeEventListeners');
        var uploaderAddEventListeners = jest.spyOn(Uploader.prototype, 'addEventListeners');
        var uploaderDraw = jest.spyOn(Uploader.prototype, 'draw');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderComputeSize = jest.spyOn(Uploader.prototype, 'computeSize');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');

        var canvasAddEventListener = jest.spyOn(document.getElementById('canvas'), 'addEventListener');
        var windowAddEventListener = jest.spyOn(window, 'addEventListener');
        var canvasRemoveEventListener = jest.spyOn(document.getElementById('canvas'), 'removeEventListener');
        var windowRemoveEventListener = jest.spyOn(window, 'removeEventListener');

        var fileReaderReadAsDataURL = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => {return window.fileDataURL;});

        var callbackZoomUpdate = jest.spyOn(window, 'zoomUpdate');
        var callbackImageSuccess = jest.spyOn(window, 'imageSuccess');
        var callbackImageError = jest.spyOn(window, 'imageError');
        var callbackDraw = jest.spyOn(window.namespace, 'draw');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputZoom = document.getElementById("input_zoom");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var divUpload = document.getElementById("div_upload");
        var divPreview = document.getElementById("div_preview");
        var divError = document.getElementById("div_error");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploaderHideError).toHaveBeenCalledTimes(1);
        uploaderHideError.mockClear();
        // endregion

        inputFile.dispatchEvent(new Event('change'));

        // region Test: call Uploader.changeInputFile
        expect(uploaderChangeInputFile).toHaveBeenCalledTimes(1);
        uploaderChangeInputFile.mockClear();
        // endregion

        // region Test: call FileReader.readAsDataURL
        expect(fileReaderReadAsDataURL).toHaveBeenCalledWith(window.ValidFile);
        expect(fileReaderReadAsDataURL).toHaveBeenCalledTimes(1);
        fileReaderReadAsDataURL.mockClear();

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, 'result', {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; }),
        });
        // endregion

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        // region Test: call Uploader.treatImage
        expect(uploaderTreatImage).toHaveBeenCalledTimes(1);
        uploaderTreatImage.mockClear();

        expect(uploader.img).not.toBe(null);
        expect(uploader.img.onload).toBe(uploader.eventTreatImageOnLoad);
        expect(uploader.img.onerror).toBe(uploader.eventTreatImageOnError);
        expect(uploader.img.src).toBe(uploader.reader.result);
        // endregion

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // region Test: call Uploader.onLoadImage
        // WARNING, jest.useFakeTimers() not working with image.onload event
        //setTimeout(function(){
            expect(uploaderTreatImageOnLoad).toHaveBeenCalledTimes(1);
            uploaderTreatImageOnLoad.mockClear();

            // Because we use a valid image there is no call to treatImageOnError
            expect(uploaderTreatImageOnError).toHaveBeenCalledTimes(0);
            uploaderTreatImageOnError.mockClear();

            expect(callbackImageError).toHaveBeenCalledTimes(0);
            callbackImageError.mockClear();

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

            // region Test: call Uploader.addEventListeners
            expect(uploaderAddEventListeners).toHaveBeenCalledTimes(1);
            uploaderAddEventListeners.mockClear();

            expect(canvasAddEventListener).toHaveBeenCalledTimes(6);
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(1, 'mousedown', uploader.eventMouseDownListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(2, 'touchstart', uploader.eventTouchStartListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(3, 'touchmove', uploader.eventTouchMoveListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(4, 'touchend', uploader.eventTouchEndListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(5, 'DOMMouseScroll', uploader.eventHandleScrollListener, {"passive": false});
            expect(canvasAddEventListener).toHaveBeenNthCalledWith(6, 'mousewheel', uploader.eventHandleScrollListener, {"passive": false});
            canvasAddEventListener.mockClear();

            expect(windowAddEventListener).toHaveBeenCalledTimes(2);
            expect(windowAddEventListener).toHaveBeenNthCalledWith(1, 'mousemove', uploader.eventMouseMoveListener, {"passive": false});
            expect(windowAddEventListener).toHaveBeenNthCalledWith(2, 'mouseup', uploader.eventMouseUpListener, {"passive": false});
            windowAddEventListener.mockClear();
            // endregion

            expect(uploader.zoomCurrent).toBe(1);
            expect(inputZoom.value).toBe("1");

            // region Test: call Uploader.computeSize
            expect(uploaderComputeSize).toHaveBeenCalledTimes(1);
            uploaderComputeSize.mockClear();
            expect(uploader.imgSizeComputed).toStrictEqual({"height": 50, "width": 50, "x": 25, "y": 25});
            // endregion

            // region Test: call Uploader.draw
            expect(uploaderDraw).toHaveBeenCalledTimes(1);
            uploaderDraw.mockClear();

                // region Test: call Uploader.clearCanvas
                {
                    expect(uploaderClearCanvas).toHaveBeenCalledTimes(1);
                    uploaderClearCanvas.mockClear();
                }
                // endregion

                // region Test: call Uploader.drawImage
                {
                    expect(uploaderDrawImage).toHaveBeenCalledTimes(1);
                    uploaderDrawImage.mockClear();
                }
                // endregion

                // region Test: call Uploader.drawMask
                {
                    expect(uploaderDrawMask).toHaveBeenCalledTimes(1);
                    uploaderDrawMask.mockClear();
                }
                // endregion

                // region Test: call callbacks.draw
                {
                    expect(callbackDraw).toHaveBeenCalledTimes(1);
                    expect(callbackDraw).toHaveBeenCalledWith(uploader, 'draw');
                    callbackDraw.mockClear();
                }
                // endregion

            expect(uploader.canvasContext.__getDrawCalls()).toStrictEqual([
                window.canvasDrawCalls.clearRect,
                window.canvasDrawCalls.drawImage_Size100Mask50,
                window.canvasDrawCalls.fill_MaskSize50Radius0
            ]);
            uploader.canvasContext.__clearDrawCalls();

            expect(uploader.ptTopLeftMask).toStrictEqual(new DOMPoint(25, 25));
            expect(uploader.ptBottomRightMask).toStrictEqual(new DOMPoint(75, 75));
            // endregion

            expect(divUpload.hasAttribute("hidden")).toBe(true);
            expect(divPreview.hasAttribute("hidden")).toBe(false);

            // region Test: call Uploader.hideError
            expect(uploaderHideError).toHaveBeenCalledTimes(1);
            uploaderHideError.mockClear();

            expect(divError.textContent).toBe('');
            expect(divError.hasAttribute("hidden")).toBe(true);
            // endregion

            expect(uploaderShowError).toHaveBeenCalledTimes(0);

            // region Test: call Uploader.callbacks.image.success
            expect(callbackImageSuccess).toHaveBeenCalledTimes(1);
            expect(callbackImageSuccess).toHaveBeenCalledWith(uploader, 'treatImageOnLoad');
            callbackImageSuccess.mockClear();
            // endregion

            // region Test: call Uploader.callbacks.zoom.update
            expect(callbackZoomUpdate).toHaveBeenCalledTimes(1);
            expect(callbackZoomUpdate).toHaveBeenCalledWith(uploader, 'treatImageOnLoad');
            callbackZoomUpdate.mockClear();
            // endregion

            done();
        //}, 20);
        // endregion
    });

    it("should load invalid image + show error", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-zoom-update="window.zoomUpdate"
    data-uploader-callback-image-success="window.imageSuccess"
    data-uploader-callback-image-error="window.imageError"
    data-uploader-callback-draw="window.namespace.draw"
    data-uploader-input_zoom-id="input_zoom"
    data-uploader-div_upload-id="div_upload"
    data-uploader-div_preview-id="div_preview"
    data-uploader-div_error-id="div_error"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <input type="range" id="input_zoom"/>
    <div id="div_upload"></div>
    <div id="div_preview" hidden></div>
    <div id="div_error">bla</div>
</div>`;
        // endregion

        // region Setup: jest spy
        jest.spyOn(console, 'error'); // In tests that you expect errors

        var uploaderChangeInputFile = jest.spyOn(Uploader.prototype, 'changeInputFile');
        var uploaderTreatImage = jest.spyOn(Uploader.prototype, 'treatImage');
        var uploaderTreatImageOnLoad = jest.spyOn(Uploader.prototype, 'treatImageOnLoad');
        var uploaderTreatImageOnError = jest.spyOn(Uploader.prototype, 'treatImageOnError');
        var uploaderRemoveEventListeners = jest.spyOn(Uploader.prototype, 'removeEventListeners');
        var uploaderAddEventListeners = jest.spyOn(Uploader.prototype, 'addEventListeners');
        var uploaderDraw = jest.spyOn(Uploader.prototype, 'draw');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderComputeSize = jest.spyOn(Uploader.prototype, 'computeSize');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');

        var canvasAddEventListener = jest.spyOn(document.getElementById('canvas'), 'addEventListener');
        var windowAddEventListener = jest.spyOn(window, 'addEventListener');
        var canvasRemoveEventListener = jest.spyOn(document.getElementById('canvas'), 'removeEventListener');
        var windowRemoveEventListener = jest.spyOn(window, 'removeEventListener');

        var fileReaderReadAsDataURL = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => {return window.fileDataURL;});

        var callbackZoomUpdate = jest.spyOn(window, 'zoomUpdate');
        var callbackImageSuccess = jest.spyOn(window, 'imageSuccess');
        var callbackImageError = jest.spyOn(window, 'imageError');
        var callbackDraw = jest.spyOn(window.namespace, 'draw');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputZoom = document.getElementById("input_zoom");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.InvalidFile]; }),
        });

        var divUpload = document.getElementById("div_upload");
        var divPreview = document.getElementById("div_preview");
        var divError = document.getElementById("div_error");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploaderHideError).toHaveBeenCalledTimes(1);
        uploaderHideError.mockClear();
        // endregion

        inputFile.dispatchEvent(new Event('change'));

        // region Test: call Uploader.changeInputFile
        expect(uploaderChangeInputFile).toHaveBeenCalledTimes(1);
        uploaderChangeInputFile.mockClear();
        // endregion

        // region Test: call FileReader.readAsDataURL
        expect(fileReaderReadAsDataURL).toHaveBeenCalledWith(window.ValidFile);
        expect(fileReaderReadAsDataURL).toHaveBeenCalledTimes(1);
        fileReaderReadAsDataURL.mockClear();

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, 'result', {
            get: jest.fn().mockImplementation(() => { return ""; }),
        });
        // endregion

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        // region Test: call Uploader.treatImage
        expect(uploaderTreatImage).toHaveBeenCalledTimes(1);
        uploaderTreatImage.mockClear();

        expect(uploader.img).not.toBe(null);
        expect(uploader.img.onload).toBe(uploader.eventTreatImageOnLoad);
        expect(uploader.img.onerror).toBe(uploader.eventTreatImageOnError);
        //expect(uploader.img.src).toBe(uploader.reader.result);
        // endregion

        uploader.img.dispatchEvent(new Event("error"));

        // region Test: call Uploader.treatImageOnError
        // WARNING, jest.useFakeTimers() not working with image.onload event
        //setTimeout(function(){
            // Because we use an invalid image there is no call to treatImageOnLoad
            expect(uploaderTreatImageOnLoad).toHaveBeenCalledTimes(0);
            uploaderTreatImageOnLoad.mockClear();

            expect(uploaderTreatImageOnError).toHaveBeenCalledTimes(1);
            uploaderTreatImageOnError.mockClear();

            // region Test: call Uploader.callbacks.image.error
            expect(callbackImageError).toHaveBeenCalledTimes(1);
            expect(callbackImageError).toHaveBeenCalledWith(uploader, 'treatImageOnError');
            callbackImageError.mockClear();
            // endregion

            // region Test: no call Uploader.callbacks.image.success
            expect(callbackImageSuccess).toHaveBeenCalledTimes(0);
            callbackImageSuccess.mockClear();
            // endregion

            expect(uploader.img).toBe(null);

            // region Test: call Uploader.clearCanvas
            {
                expect(uploaderClearCanvas).toHaveBeenCalledTimes(1);
                uploaderClearCanvas.mockClear();

                expect(uploader.canvasContext.__getDrawCalls()).toStrictEqual([
                    window.canvasDrawCalls.clearRect
                ]);
                uploader.canvasContext.__clearDrawCalls();
            }
            // endregion

            // region Test: call Uploader.showError
            expect(uploaderShowError).toHaveBeenCalledTimes(1);
            uploaderShowError.mockClear();

            expect(divError.innerHTML).toBe('Could not load your image.<br>Use png or jpg file.');
            expect(divError.hasAttribute("hidden")).toBe(false);
            // endregion

            // region Test: verify no other functions been called
            expect(uploaderRemoveEventListeners).toHaveBeenCalledTimes(0);
            expect(canvasRemoveEventListener).toHaveBeenCalledTimes(0);
            expect(windowRemoveEventListener).toHaveBeenCalledTimes(0);
            expect(uploaderAddEventListeners).toHaveBeenCalledTimes(0);
            expect(canvasAddEventListener).toHaveBeenCalledTimes(0);
            expect(windowAddEventListener).toHaveBeenCalledTimes(0);
            expect(uploaderComputeSize).toHaveBeenCalledTimes(0);
            expect(uploaderDraw).toHaveBeenCalledTimes(0);
            expect(uploaderDrawImage).toHaveBeenCalledTimes(0);
            expect(uploaderDrawMask).toHaveBeenCalledTimes(0);
            expect(callbackZoomUpdate).toHaveBeenCalledTimes(0);
            expect(callbackImageSuccess).toHaveBeenCalledTimes(0);
            expect(callbackDraw).toHaveBeenCalledTimes(0);
            expect(uploaderHideError).toHaveBeenCalledTimes(0);

            expect(uploader.zoomCurrent).toBe(1);
            expect(inputZoom.value).toBe("50");
            expect(uploader.imgSizeComputed).toBe(null);
            expect(divUpload.hasAttribute("hidden")).toBe(false);
            expect(divPreview.hasAttribute("hidden")).toBe(true);
            expect(uploader.ptTopLeftMask).toStrictEqual({"x": 0, "y": 0});
            expect(uploader.ptBottomRightMask).toStrictEqual({"x": 0, "y": 0});
            // endregion

            done();
        //}, 20);
        // endregion
    });

    it("should load empty image + show error", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-zoom-update="window.zoomUpdate"
    data-uploader-callback-image-success="window.imageSuccess"
    data-uploader-callback-draw="window.namespace.draw"
    data-uploader-input_zoom-id="input_zoom"
    data-uploader-div_upload-id="div_upload"
    data-uploader-div_preview-id="div_preview"
    data-uploader-div_error-id="div_error"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <input type="range" id="input_zoom"/>
    <div id="div_upload"></div>
    <div id="div_preview" hidden></div>
    <div id="div_error">bla</div>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderChangeInputFile = jest.spyOn(Uploader.prototype, 'changeInputFile');
        var uploaderTreatImage = jest.spyOn(Uploader.prototype, 'treatImage');
        var uploaderTreatImageOnLoad = jest.spyOn(Uploader.prototype, 'treatImageOnLoad');
        var uploaderTreatImageOnError = jest.spyOn(Uploader.prototype, 'treatImageOnError');
        var uploaderRemoveEventListeners = jest.spyOn(Uploader.prototype, 'removeEventListeners');
        var uploaderAddEventListeners = jest.spyOn(Uploader.prototype, 'addEventListeners');
        var uploaderDraw = jest.spyOn(Uploader.prototype, 'draw');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderComputeSize = jest.spyOn(Uploader.prototype, 'computeSize');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');

        var canvasAddEventListener = jest.spyOn(document.getElementById('canvas'), 'addEventListener');
        var windowAddEventListener = jest.spyOn(window, 'addEventListener');
        var canvasRemoveEventListener = jest.spyOn(document.getElementById('canvas'), 'removeEventListener');
        var windowRemoveEventListener = jest.spyOn(window, 'removeEventListener');

        var fileReaderReadAsDataURL = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => {return window.fileDataURL;});

        var callbackZoomUpdate = jest.spyOn(window, 'zoomUpdate');
        var callbackImageSuccess = jest.spyOn(window, 'imageSuccess');
        var callbackDraw = jest.spyOn(window.namespace, 'draw');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputZoom = document.getElementById("input_zoom");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var divUpload = document.getElementById("div_upload");
        var divPreview = document.getElementById("div_preview");
        var divError = document.getElementById("div_error");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploaderHideError).toHaveBeenCalledTimes(1);
        uploaderHideError.mockClear();
        // endregion

        inputFile.dispatchEvent(new Event('change'));

        // region Test: call Uploader.changeInputFile
        expect(uploaderChangeInputFile).toHaveBeenCalledTimes(1);
        uploaderChangeInputFile.mockClear();
        // endregion

        // region Test: call FileReader.readAsDataURL
        expect(fileReaderReadAsDataURL).toHaveBeenCalledWith(window.ValidFile);
        expect(fileReaderReadAsDataURL).toHaveBeenCalledTimes(1);
        fileReaderReadAsDataURL.mockClear();

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, 'result', {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; }),
        });
        // endregion

        uploader.eventTreatImageOnLoad = function() {
            uploader.img.width = 0;
            uploader.treatImageOnLoad();
        };

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        // region Test: call Uploader.treatImage
        expect(uploaderTreatImage).toHaveBeenCalledTimes(1);
        uploaderTreatImage.mockClear();

        expect(uploader.img).not.toBe(null);
        expect(uploader.img.onload).toBe(uploader.eventTreatImageOnLoad);
        expect(uploader.img.onerror).toBe(uploader.eventTreatImageOnError);
        expect(uploader.img.src).toBe(uploader.reader.result);
        // endregion

        uploader.img.dispatchEvent(new Event("load"));

        // region Test: call Uploader.treatImageOnError
        // WARNING, jest.useFakeTimers() not working with image.onload event
        //setTimeout(function(){
            // Because we use an invalid image there is no call to treatImageOnLoad
            expect(uploaderTreatImageOnLoad).toHaveBeenCalledTimes(1);
            uploaderTreatImageOnLoad.mockClear();

            expect(uploaderTreatImageOnError).toHaveBeenCalledTimes(1);
            uploaderTreatImageOnError.mockClear();

            expect(uploader.img).toBe(null);

            // region Test: call Uploader.clearCanvas
            {
                expect(uploaderClearCanvas).toHaveBeenCalledTimes(1);
                uploaderClearCanvas.mockClear();

                expect(uploader.canvasContext.__getDrawCalls()).toStrictEqual([
                    window.canvasDrawCalls.clearRect
                ]);
                uploader.canvasContext.__clearDrawCalls();
            }
            // endregion

            // region Test: call Uploader.showError
            expect(uploaderShowError).toHaveBeenCalledTimes(1);
            uploaderShowError.mockClear();

            expect(divError.innerHTML).toBe('Could not load your image.<br>Use png or jpg file.');
            expect(divError.hasAttribute("hidden")).toBe(false);
            // endregion

            // region Test: verify no other functions been called
            expect(uploaderRemoveEventListeners).toHaveBeenCalledTimes(0);
            expect(canvasRemoveEventListener).toHaveBeenCalledTimes(0);
            expect(windowRemoveEventListener).toHaveBeenCalledTimes(0);
            expect(uploaderAddEventListeners).toHaveBeenCalledTimes(0);
            expect(canvasAddEventListener).toHaveBeenCalledTimes(0);
            expect(windowAddEventListener).toHaveBeenCalledTimes(0);
            expect(uploaderComputeSize).toHaveBeenCalledTimes(0);
            expect(uploaderDraw).toHaveBeenCalledTimes(0);
            expect(uploaderDrawImage).toHaveBeenCalledTimes(0);
            expect(uploaderDrawMask).toHaveBeenCalledTimes(0);
            expect(callbackZoomUpdate).toHaveBeenCalledTimes(0);
            expect(callbackImageSuccess).toHaveBeenCalledTimes(0);
            expect(callbackDraw).toHaveBeenCalledTimes(0);
            expect(uploaderHideError).toHaveBeenCalledTimes(0);

            expect(uploader.zoomCurrent).toBe(1);
            expect(inputZoom.value).toBe("50");
            expect(uploader.imgSizeComputed).toBe(null);
            expect(divUpload.hasAttribute("hidden")).toBe(false);
            expect(divPreview.hasAttribute("hidden")).toBe(true);
            expect(uploader.ptTopLeftMask).toStrictEqual({"x": 0, "y": 0});
            expect(uploader.ptBottomRightMask).toStrictEqual({"x": 0, "y": 0});
            // endregion

            // region Test: call directly Uploader.showError will not append text but replace it
            uploader.showError("there is an error");

            expect(divError.innerHTML).toBe('there is an error');
            expect(divError.hasAttribute("hidden")).toBe(false);
            // endregion

            // region Test: call directly Uploader.showError will not add text if there is no divErroObj in uploader instance
            uploader.divErrorObj = null;
            uploader.showError("oups");

            expect(divError.innerHTML).not.toBe('oups');
            // endregion

            done();
        //}, 20);
        // endregion
    });

    it("should not call Uploader.treatImage when input file is empty", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-input_zoom-id="input_zoom"
    data-uploader-div_upload-id="div_upload"
    data-uploader-div_preview-id="div_preview"
    data-uploader-div_error-id="div_error"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <input type="range" id="input_zoom" value="1"/>
    <div id="div_upload"></div>
    <div id="div_preview" hidden></div>
    <div id="div_error">bla</div>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderChangeInputFile = jest.spyOn(Uploader.prototype, 'changeInputFile');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');

        var fileReaderReadAsDataURL = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => {return window.fileDataURL;});
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);

        expect(uploaderHideError).toHaveBeenCalledTimes(1);
        uploaderHideError.mockClear();
        // endregion

        inputFile.dispatchEvent(new Event('change'));

        // region Test: call Uploader.changeInputFile
        expect(uploaderChangeInputFile).toHaveBeenCalledTimes(1);
        uploaderChangeInputFile.mockClear();
        // endregion

        // region Test: call FileReader.readAsDataURL
        expect(fileReaderReadAsDataURL).toHaveBeenCalledTimes(0);
        fileReaderReadAsDataURL.mockClear();
        // endregion

        done();
    });
});
