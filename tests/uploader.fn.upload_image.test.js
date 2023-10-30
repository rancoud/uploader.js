/* global Uploader */
window.saveSuccess = function() {};
window.saveError = function() {};
window.saveUpdateFormData = function(instance, from, formData) { return formData; };

/** @covers
 * Uploader.save
 * Uploader.getCanvasDataURL
 * Uploader.saveOnLoad
 * Uploader.saveOnError
 * Uploader.hideError
 * Uploader.showError
 */
describe("uploader", function(){
    beforeEach(function() {
        require("./required.js");
        require("../src/uploader");
    });

    it("should upload image", function(done) {
        // region Setup: callbackLeft
        let callbacksLeft = 2;
        function callbackCalled() {
            callbacksLeft--;
            if (callbacksLeft === 0) {
                done();
            }
        }
        // endregion

        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-save-success="window.saveSuccess"
    data-uploader-callback-save-error="window.saveError"
    data-uploader-callback-save-update_form_data="window.saveUpdateFormData"
    data-uploader-div_error-id="div_error"
    data-uploader-btn_save-id="save"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_error">bla</div>
    <button id="save"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderSave = jest.spyOn(Uploader.prototype, 'save');
        var uploaderGetCanvasDataURL = jest.spyOn(Uploader.prototype, 'getCanvasDataURL');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');

        var callbackSaveSuccess = jest.spyOn(window, 'saveSuccess');
        var callbackSaveError = jest.spyOn(window, 'saveError');
        var callbackSaveUpdateFormData = jest.spyOn(window, 'saveUpdateFormData');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var divError = document.getElementById("div_error");
        var btnSave = document.getElementById("save");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        // region Setup: XHR
        var xhrOpen = jest.spyOn(XMLHttpRequest.prototype, 'open');
        var xhrSend = jest.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function(formData) {
            // WARNING, this test can only be here because it's too quick for being test after save click
            expect(uploader.canSave).toBe(false);

            // region Test: verify formData
            expect(formData.get("canvas_width")).toBe("100");
            expect(formData.get("canvas_height")).toBe("100");
            expect(formData.has("image")).toBe(true);
            expect(formData.get("image")).toBeInstanceOf(File);
            // endregion

            // region Test: verify canvas draw calls
            var drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([]);
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            // WARNING, we have to force the event because XHR mocking is not perfect
            uploader.saveOnLoad();

            expect(uploader.canSave).toBe(true);

            expect(uploaderHideError).toHaveBeenCalledTimes(1);
            uploaderHideError.mockClear();

            expect(uploaderShowError).toHaveBeenCalledTimes(0);
            uploaderShowError.mockClear();

            expect(divError.textContent).toBe('');
            expect(divError.hasAttribute("hidden")).toBe(true);

            expect(callbackSaveUpdateFormData).toHaveBeenCalledTimes(1);
            expect(callbackSaveUpdateFormData).toHaveBeenCalledWith(uploader, 'save', formData);
            callbackSaveUpdateFormData.mockClear();

            expect(callbackSaveSuccess).toHaveBeenCalledTimes(1);
            expect(callbackSaveSuccess).toHaveBeenCalledWith(uploader, 'saveOnLoad');
            callbackSaveSuccess.mockClear();

            expect(callbackSaveError).toHaveBeenCalledTimes(0);
            callbackSaveError.mockClear();

            callbackCalled();
        });
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
            uploaderHideError.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            // WARNING, before saving we need to mock canvas.toDataURL
            uploader.canvasObj.toDataURL.mockReturnValueOnce(window.canvasDataURL);
            var canvasToDataURL = jest.spyOn(uploader.canvasObj, 'toDataURL');

            uploaderClearCanvas.mockClear();
            uploaderDrawImage.mockClear();
            uploaderDrawMask.mockClear();

            btnSave.click();

            // region Test: call Uploader.save
            expect(uploaderSave).toHaveBeenCalledTimes(1);
            uploaderSave.mockClear();

                // region Test: call Uploader.getCanvasDataURL
                {
                    expect(uploaderGetCanvasDataURL).toHaveBeenCalledTimes(1);
                    uploaderGetCanvasDataURL.mockClear();

                    expect(canvasToDataURL).toHaveBeenCalledTimes(1);
                    canvasToDataURL.mockClear();
                }
                // endregion

            expect(uploaderClearCanvas).toHaveBeenCalledTimes(0);
            expect(uploaderDrawImage).toHaveBeenCalledTimes(0);
            expect(uploaderDrawMask).toHaveBeenCalledTimes(0);

            expect(xhrOpen).toHaveBeenCalledTimes(1);
            expect(xhrOpen).toHaveBeenCalledWith('POST', 'http://localhost/');
            xhrOpen.mockClear();

            expect(xhrSend).toHaveBeenCalledTimes(1);
            expect(xhrSend).toHaveBeenCalledWith(expect.anything());
            xhrSend.mockClear();
            // endregion

            callbackCalled();
        }, 20);
    });

    it("should upload image (no callback)", function(done) {
        // region Setup: callbackLeft
        let callbacksLeft = 2;
        function callbackCalled() {
            callbacksLeft--;
            if (callbacksLeft === 0) {
                done();
            }
        }
        // endregion

        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_error-id="div_error"
    data-uploader-btn_save-id="save"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_error">bla</div>
    <button id="save"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderSave = jest.spyOn(Uploader.prototype, 'save');
        var uploaderGetCanvasDataURL = jest.spyOn(Uploader.prototype, 'getCanvasDataURL');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');

        var callbackSaveSuccess = jest.spyOn(window, 'saveSuccess');
        var callbackSaveError = jest.spyOn(window, 'saveError');
        var callbackSaveUpdateFormData = jest.spyOn(window, 'saveUpdateFormData');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var divError = document.getElementById("div_error");
        var btnSave = document.getElementById("save");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        // region Setup: XHR
        var xhrOpen = jest.spyOn(XMLHttpRequest.prototype, 'open');
        var xhrSend = jest.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function(formData) {
            // WARNING, this test can only be here because it's too quick for being test after save click
            expect(uploader.canSave).toBe(false);

            // region Test: verify formData
            expect(formData.get("canvas_width")).toBe("100");
            expect(formData.get("canvas_height")).toBe("100");
            expect(formData.has("image")).toBe(true);
            expect(formData.get("image")).toBeInstanceOf(File);
            // endregion

            // region Test: verify canvas draw calls
            var drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([]);
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            // WARNING, we have to force the event because XHR mocking is not perfect
            uploader.saveOnLoad();

            expect(uploader.canSave).toBe(true);

            expect(uploaderHideError).toHaveBeenCalledTimes(1);
            uploaderHideError.mockClear();

            expect(uploaderShowError).toHaveBeenCalledTimes(0);
            uploaderShowError.mockClear();

            expect(divError.textContent).toBe('');
            expect(divError.hasAttribute("hidden")).toBe(true);

            expect(callbackSaveSuccess).toHaveBeenCalledTimes(0);
            callbackSaveSuccess.mockClear();
            expect(callbackSaveError).toHaveBeenCalledTimes(0);
            callbackSaveError.mockClear();
            expect(callbackSaveUpdateFormData).toHaveBeenCalledTimes(0);
            callbackSaveUpdateFormData.mockClear();

            callbackCalled();
        });
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
            uploaderHideError.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            // WARNING, before saving we need to mock canvas.toDataURL
            uploader.canvasObj.toDataURL.mockReturnValueOnce(window.canvasDataURL);
            var canvasToDataURL = jest.spyOn(uploader.canvasObj, 'toDataURL');

            uploaderClearCanvas.mockClear();
            uploaderDrawImage.mockClear();
            uploaderDrawMask.mockClear();

            btnSave.click();

            // region Test: call Uploader.save
            expect(uploaderSave).toHaveBeenCalledTimes(1);
            uploaderSave.mockClear();

            // region Test: call Uploader.getCanvasDataURL
            {
                expect(uploaderGetCanvasDataURL).toHaveBeenCalledTimes(1);
                uploaderGetCanvasDataURL.mockClear();

                expect(canvasToDataURL).toHaveBeenCalledTimes(1);
                canvasToDataURL.mockClear();
            }
            // endregion

            expect(uploaderClearCanvas).toHaveBeenCalledTimes(0);
            expect(uploaderDrawImage).toHaveBeenCalledTimes(0);
            expect(uploaderDrawMask).toHaveBeenCalledTimes(0);

            expect(xhrOpen).toHaveBeenCalledTimes(1);
            expect(xhrOpen).toHaveBeenCalledWith('POST', 'http://localhost/');
            xhrOpen.mockClear();

            expect(xhrSend).toHaveBeenCalledTimes(1);
            expect(xhrSend).toHaveBeenCalledWith(expect.anything());
            xhrSend.mockClear();
            // endregion

            callbackCalled();
        }, 20);
    });

    it("should upload image but there is a problem with XHR", function(done) {
        // region Setup: callbackLeft
        let callbacksLeft = 2;
        function callbackCalled() {
            callbacksLeft--;
            if (callbacksLeft === 0) {
                done();
            }
        }
        // endregion

        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-save-success="window.saveSuccess"
    data-uploader-callback-save-error="window.saveError"
    data-uploader-callback-save-update_form_data="window.saveUpdateFormData"
    data-uploader-div_error-id="div_error"
    data-uploader-btn_save-id="save"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_error">bla</div>
    <button id="save"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderSave = jest.spyOn(Uploader.prototype, 'save');
        var uploaderGetCanvasDataURL = jest.spyOn(Uploader.prototype, 'getCanvasDataURL');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');

        var callbackSaveSuccess = jest.spyOn(window, 'saveSuccess');
        var callbackSaveError = jest.spyOn(window, 'saveError');
        var callbackSaveUpdateFormData = jest.spyOn(window, 'saveUpdateFormData');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var divError = document.getElementById("div_error");
        var btnSave = document.getElementById("save");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        // region Setup: XHR
        var xhrOpen = jest.spyOn(XMLHttpRequest.prototype, 'open');
        var xhrSend = jest.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function(formData) {
            // WARNING, this test can only be here because it's too quick for being test after save click
            expect(uploader.canSave).toBe(false);

            // region Test: verify formData
            expect(formData.get("canvas_width")).toBe("100");
            expect(formData.get("canvas_height")).toBe("100");
            expect(formData.has("image")).toBe(true);
            expect(formData.get("image")).toBeInstanceOf(File);
            // endregion

            // region Test: verify canvas draw calls
            var drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([]);
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            // WARNING, we have to force the event because XHR mocking is not perfect
            uploader.saveOnError(new Error());

            expect(uploader.canSave).toBe(true);

            expect(uploaderHideError).toHaveBeenCalledTimes(0);
            uploaderHideError.mockClear();

            expect(uploaderShowError).toHaveBeenCalledTimes(1);
            uploaderShowError.mockClear();

            expect(divError.innerHTML).toBe("Could not upload your image.<br>Try later.");
            expect(divError.hasAttribute("hidden")).toBe(false);

            expect(callbackSaveSuccess).toHaveBeenCalledTimes(0);
            callbackSaveSuccess.mockClear();

            expect(callbackSaveUpdateFormData).toHaveBeenCalledTimes(1);
            expect(callbackSaveUpdateFormData).toHaveBeenCalledWith(uploader, 'save', formData);
            callbackSaveUpdateFormData.mockClear();

            expect(callbackSaveError).toHaveBeenCalledTimes(1);
            expect(callbackSaveError).toHaveBeenCalledWith(uploader, 'saveOnError', expect.anything());
            callbackSaveError.mockClear();

            uploader.callbacks.save.error = null;
            uploader.saveOnError(new Error());

            expect(callbackSaveError).toHaveBeenCalledTimes(0);
            callbackSaveError.mockClear();

            callbackCalled();
        });
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
            uploaderHideError.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            // WARNING, before saving we need to mock canvas.toDataURL
            uploader.canvasObj.toDataURL.mockReturnValueOnce(window.canvasDataURL);
            var canvasToDataURL = jest.spyOn(uploader.canvasObj, 'toDataURL');

            uploaderClearCanvas.mockClear();
            uploaderDrawImage.mockClear();
            uploaderDrawMask.mockClear();

            btnSave.click();

            // region Test: call Uploader.save
            expect(uploaderSave).toHaveBeenCalledTimes(1);
            uploaderSave.mockClear();

            // region Test: call Uploader.getCanvasDataURL
            {
                expect(uploaderGetCanvasDataURL).toHaveBeenCalledTimes(1);
                uploaderGetCanvasDataURL.mockClear();

                expect(canvasToDataURL).toHaveBeenCalledTimes(1);
                canvasToDataURL.mockClear();
            }
            // endregion

            expect(uploaderClearCanvas).toHaveBeenCalledTimes(0);
            expect(uploaderDrawImage).toHaveBeenCalledTimes(0);
            expect(uploaderDrawMask).toHaveBeenCalledTimes(0);

            expect(xhrOpen).toHaveBeenCalledTimes(1);
            expect(xhrOpen).toHaveBeenCalledWith('POST', 'http://localhost/');
            xhrOpen.mockClear();

            expect(xhrSend).toHaveBeenCalledTimes(1);
            expect(xhrSend).toHaveBeenCalledWith(expect.anything());
            xhrSend.mockClear();
            // endregion

            callbackCalled();
        }, 20);
    });

    it("should upload image + mask", function(done) {
        // region Setup: callbackLeft
        let callbacksLeft = 2;
        function callbackCalled() {
            callbacksLeft--;
            if (callbacksLeft === 0) {
                done();
            }
        }
        // endregion

        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-save-success="window.saveSuccess"
    data-uploader-callback-save-error="window.saveError"
    data-uploader-callback-save-update_form_data="window.saveUpdateFormData"
    data-uploader-div_error-id="div_error"
    data-uploader-btn_save-id="save"
    data-uploader-mask-size="50,40"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_error">bla</div>
    <button id="save"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderSave = jest.spyOn(Uploader.prototype, 'save');
        var uploaderGetCanvasDataURL = jest.spyOn(Uploader.prototype, 'getCanvasDataURL');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');
        uploaderShowError.mockClear();

        var callbackSaveSuccess = jest.spyOn(window, 'saveSuccess');
        var callbackSaveError = jest.spyOn(window, 'saveError');
        var callbackSaveUpdateFormData = jest.spyOn(window, 'saveUpdateFormData');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var divError = document.getElementById("div_error");
        var btnSave = document.getElementById("save");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        // region Setup: XHR
        var xhrOpen = jest.spyOn(XMLHttpRequest.prototype, 'open');
        var xhrSend = jest.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function(formData) {
            // WARNING, this test can only be here because it's too quick for being test after save click
            expect(uploader.canSave).toBe(false);

            // region Test: verify formData
            expect(formData.get("canvas_width")).toBe("100");
            expect(formData.get("canvas_height")).toBe("100");
            expect(formData.has("image")).toBe(true);
            expect(formData.get("image")).toBeInstanceOf(File);
            expect(formData.get("mask_width")).toBe("50");
            expect(formData.get("mask_height")).toBe("40");
            expect(formData.get("mask_x")).toBe("25");
            expect(formData.get("mask_y")).toBe("30");
            // endregion

            // region Test: verify canvas draw calls
            var drawCalls = uploader.canvasContext.__getDrawCalls();
            // ???
            /*expect(drawCalls).toStrictEqual([
                window.canvasDrawCalls.clearRect,
                window.canvasDrawCalls.drawImage_Size100Mask50,
                window.canvasDrawCalls.fill_MaskSize50x40Radius0
            ]);*/
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            // WARNING, we have to force the event because XHR mocking is not perfect
            uploader.saveOnLoad();

            expect(uploader.canSave).toBe(true);

            expect(uploaderHideError).toHaveBeenCalledTimes(1);
            uploaderHideError.mockClear();

            expect(uploaderShowError).toHaveBeenCalledTimes(0);
            uploaderShowError.mockClear();

            expect(divError.textContent).toBe('');
            expect(divError.hasAttribute("hidden")).toBe(true);

            expect(callbackSaveUpdateFormData).toHaveBeenCalledTimes(1);
            expect(callbackSaveUpdateFormData).toHaveBeenCalledWith(uploader, 'save', formData);
            callbackSaveUpdateFormData.mockClear();

            expect(callbackSaveSuccess).toHaveBeenCalledTimes(1);
            expect(callbackSaveSuccess).toHaveBeenCalledWith(uploader, 'saveOnLoad');
            callbackSaveSuccess.mockClear();

            expect(callbackSaveError).toHaveBeenCalledTimes(0);
            callbackSaveError.mockClear();

            callbackCalled();
        });
        // endregion

        inputFile.dispatchEvent(new Event('change'));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, 'result', {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; }),
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function(){
            // clean
            uploaderHideError.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            // WARNING, before saving we need to mock canvas.toDataURL
            uploader.canvasObj.toDataURL.mockReturnValueOnce(window.canvasDataURL);
            var canvasToDataURL = jest.spyOn(uploader.canvasObj, 'toDataURL');

            uploaderClearCanvas.mockClear();
            uploaderDrawImage.mockClear();
            uploaderDrawMask.mockClear();

            btnSave.click();

            // region Test: call Uploader.save
            expect(uploaderSave).toHaveBeenCalledTimes(1);
            uploaderSave.mockClear();

            // region Test: call Uploader.getCanvasDataURL
            {
                expect(uploaderGetCanvasDataURL).toHaveBeenCalledTimes(1);
                uploaderGetCanvasDataURL.mockClear();

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

                expect(canvasToDataURL).toHaveBeenCalledTimes(1);
                canvasToDataURL.mockClear();

                // region Test: call Uploader.drawMask
                {
                    expect(uploaderDrawMask).toHaveBeenCalledTimes(1);
                    uploaderDrawMask.mockClear();
                }
                // endregion
            }
            // endregion

            expect(xhrOpen).toHaveBeenCalledTimes(1);
            expect(xhrOpen).toHaveBeenCalledWith('POST', 'http://localhost/');
            xhrOpen.mockClear();

            expect(xhrSend).toHaveBeenCalledTimes(1);
            expect(xhrSend).toHaveBeenCalledWith(expect.anything());
            xhrSend.mockClear();
            // endregion

            callbackCalled();
        }, 20);
    });

    it("should upload image + mask + full save options", function(done) {
        // region Setup: callbackLeft
        let callbacksLeft = 2;
        function callbackCalled() {
            callbacksLeft--;
            if (callbacksLeft === 0) {
                done();
            }
        }
        // endregion

        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-callback-save-success="window.saveSuccess"
    data-uploader-callback-save-error="window.saveError"
    data-uploader-callback-save-update_form_data="window.saveUpdateFormData"
    data-uploader-div_error-id="div_error"
    data-uploader-btn_save-id="save"
    data-uploader-mask-size="50,40"
    data-uploader-upload-name="my_name"
    data-uploader-upload-url="/yolo"
    data-uploader-upload-prefix="my_prefix_"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_error">bla</div>
    <button id="save"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderSave = jest.spyOn(Uploader.prototype, 'save');
        var uploaderGetCanvasDataURL = jest.spyOn(Uploader.prototype, 'getCanvasDataURL');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        var uploaderShowError = jest.spyOn(Uploader.prototype, 'showError');

        var callbackSaveSuccess = jest.spyOn(window, 'saveSuccess');
        var callbackSaveError = jest.spyOn(window, 'saveError');
        var callbackSaveUpdateFormData = jest.spyOn(window, 'saveUpdateFormData');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var divError = document.getElementById("div_error");
        var btnSave = document.getElementById("save");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        // region Setup: XHR
        var xhrOpen = jest.spyOn(XMLHttpRequest.prototype, 'open');
        var xhrSend = jest.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function(formData) {
            // WARNING, this test can only be here because it's too quick for being test after save click
            expect(uploader.canSave).toBe(false);

            // region Test: verify formData
            expect(formData.get("my_prefix_canvas_width")).toBe("100");
            expect(formData.get("my_prefix_canvas_height")).toBe("100");
            expect(formData.has("my_prefix_my_name")).toBe(true);
            expect(formData.get("my_prefix_my_name")).toBeInstanceOf(File);
            expect(formData.get("my_prefix_mask_width")).toBe("50");
            expect(formData.get("my_prefix_mask_height")).toBe("40");
            expect(formData.get("my_prefix_mask_x")).toBe("25");
            expect(formData.get("my_prefix_mask_y")).toBe("30");
            // endregion

            // region Test: verify canvas draw calls
            var drawCalls = uploader.canvasContext.__getDrawCalls();
            //???
            /*expect(drawCalls).toStrictEqual([
                window.canvasDrawCalls.clearRect,
                window.canvasDrawCalls.drawImage_Size100Mask50,
                window.canvasDrawCalls.fill_MaskSize50x40Radius0
            ]);*/
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            // WARNING, we have to force the event because XHR mocking is not perfect
            uploader.saveOnLoad();

            expect(uploader.canSave).toBe(true);

            expect(uploaderHideError).toHaveBeenCalledTimes(1);
            uploaderHideError.mockClear();

            expect(uploaderShowError).toHaveBeenCalledTimes(0);
            uploaderShowError.mockClear();

            expect(divError.textContent).toBe('');
            expect(divError.hasAttribute("hidden")).toBe(true);

            expect(callbackSaveUpdateFormData).toHaveBeenCalledTimes(1);
            expect(callbackSaveUpdateFormData).toHaveBeenCalledWith(uploader, 'save', formData);
            callbackSaveUpdateFormData.mockClear();

            expect(callbackSaveSuccess).toHaveBeenCalledTimes(1);
            expect(callbackSaveSuccess).toHaveBeenCalledWith(uploader, 'saveOnLoad');
            callbackSaveSuccess.mockClear();

            expect(callbackSaveError).toHaveBeenCalledTimes(0);
            callbackSaveError.mockClear();

            callbackCalled();
        });
        // endregion

        inputFile.dispatchEvent(new Event('change'));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, 'result', {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; }),
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function(){
            // clean
            uploaderHideError.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            // WARNING, before saving we need to mock canvas.toDataURL
            uploader.canvasObj.toDataURL.mockReturnValueOnce(window.canvasDataURL);
            var canvasToDataURL = jest.spyOn(uploader.canvasObj, 'toDataURL');

            uploaderClearCanvas.mockClear();
            uploaderDrawImage.mockClear();
            uploaderDrawMask.mockClear();

            btnSave.click();

            // region Test: call Uploader.save
            expect(uploaderSave).toHaveBeenCalledTimes(1);
            uploaderSave.mockClear();

            // region Test: call Uploader.getCanvasDataURL
            {
                expect(uploaderGetCanvasDataURL).toHaveBeenCalledTimes(1);
                uploaderGetCanvasDataURL.mockClear();

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

                expect(canvasToDataURL).toHaveBeenCalledTimes(1);
                canvasToDataURL.mockClear();

                // region Test: call Uploader.drawMask
                {
                    expect(uploaderDrawMask).toHaveBeenCalledTimes(1);
                    uploaderDrawMask.mockClear();
                }
                // endregion
            }
            // endregion

            expect(xhrOpen).toHaveBeenCalledTimes(1);
            expect(xhrOpen).toHaveBeenCalledWith('POST', '/yolo');
            xhrOpen.mockClear();

            expect(xhrSend).toHaveBeenCalledTimes(1);
            expect(xhrSend).toHaveBeenCalledWith(expect.anything());
            xhrSend.mockClear();
            // endregion

            callbackCalled();
        }, 20);
    });

    it("should not upload image when there is no img", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_error-id="div_error"
    data-uploader-btn_save-id="save"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_error">bla</div>
    <button id="save"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderSave = jest.spyOn(Uploader.prototype, 'save');
        var uploaderGetCanvasDataURL = jest.spyOn(Uploader.prototype, 'getCanvasDataURL');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var btnSave = document.getElementById("save");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        // region Setup: XHR
        var xhrOpen = jest.spyOn(XMLHttpRequest.prototype, 'open');
        var xhrSend = jest.spyOn(XMLHttpRequest.prototype, 'send');
        // endregion

        btnSave.click();

        // region Test: call Uploader.save
        expect(uploaderSave).toHaveBeenCalledTimes(1);
        uploaderSave.mockClear();

        expect(uploaderGetCanvasDataURL).toHaveBeenCalledTimes(0);
        expect(xhrOpen).toHaveBeenCalledTimes(0);
        expect(xhrSend).toHaveBeenCalledTimes(0);
        // endregion

        done();
    });

    it("should not upload image when a upload is still in progress", function(done) {
        // region Setup: callbackLeft
        let callbacksLeft = 2;
        function callbackCalled() {
            callbacksLeft--;
            if (callbacksLeft === 0) {
                done();
            }
        }
        // endregion

        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-div_error-id="div_error"
    data-uploader-btn_save-id="save"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <div id="div_error">bla</div>
    <button id="save"></button>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderSave = jest.spyOn(Uploader.prototype, 'save');
        var uploaderGetCanvasDataURL = jest.spyOn(Uploader.prototype, 'getCanvasDataURL');
        var uploaderClearCanvas = jest.spyOn(Uploader.prototype, 'clearCanvas');
        var uploaderDrawImage = jest.spyOn(Uploader.prototype, 'drawImage');
        var uploaderDrawMask = jest.spyOn(Uploader.prototype, 'drawMask');
        var uploaderHideError = jest.spyOn(Uploader.prototype, 'hideError');
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, 'files', {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; }),
        });

        var btnSave = document.getElementById("save");

        var uploader = new Uploader(document.getElementById('uploader'));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        // region Setup: XHR
        var xhrOpen = jest.spyOn(XMLHttpRequest.prototype, 'open');
        var xhrSend = jest.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function(formData) {
            // WARNING, this test can only be here because it's too quick for being test after save click
            expect(uploader.canSave).toBe(false);

            // region Test: verify formData
            expect(formData.get("canvas_width")).toBe("100");
            expect(formData.get("canvas_height")).toBe("100");
            expect(formData.has("image")).toBe(true);
            expect(formData.get("image")).toBeInstanceOf(File);
            // endregion

            // region Test: verify canvas draw calls
            var drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([]);
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            btnSave.click();

            setTimeout(function() {
                expect(uploaderGetCanvasDataURL).toHaveBeenCalledTimes(0);

                callbackCalled();
            }, 10);
        });
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
            uploaderHideError.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            // WARNING, before saving we need to mock canvas.toDataURL
            uploader.canvasObj.toDataURL.mockReturnValueOnce(window.canvasDataURL);
            var canvasToDataURL = jest.spyOn(uploader.canvasObj, 'toDataURL');

            uploaderClearCanvas.mockClear();
            uploaderDrawImage.mockClear();
            uploaderDrawMask.mockClear();

            btnSave.click();

            // region Test: call Uploader.save
            expect(uploaderSave).toHaveBeenCalledTimes(1);
            uploaderSave.mockClear();

            // region Test: call Uploader.getCanvasDataURL
            {
                expect(uploaderGetCanvasDataURL).toHaveBeenCalledTimes(1);
                uploaderGetCanvasDataURL.mockClear();

                expect(canvasToDataURL).toHaveBeenCalledTimes(1);
                canvasToDataURL.mockClear();
            }
            // endregion

            expect(uploaderClearCanvas).toHaveBeenCalledTimes(0);
            expect(uploaderDrawImage).toHaveBeenCalledTimes(0);
            expect(uploaderDrawMask).toHaveBeenCalledTimes(0);

            expect(xhrOpen).toHaveBeenCalledTimes(1);
            expect(xhrOpen).toHaveBeenCalledWith('POST', 'http://localhost/');
            xhrOpen.mockClear();

            expect(xhrSend).toHaveBeenCalledTimes(1);
            expect(xhrSend).toHaveBeenCalledWith(expect.anything());
            xhrSend.mockClear();
            // endregion

            callbackCalled();
        }, 20);
    });
});
