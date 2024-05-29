/* global Uploader */
window.zoomUpdate = function() {};
window.customZoomUpdate = function(uploaderInstance, from) {
    if (from !== "updateZoomFromInput") {
        return;
    }

    // eslint-disable-next-line jest/no-standalone-expect
    expect(uploaderInstance.inProgress).toBe(true);
    uploaderInstance.updateZoomFromInput({preventDefault: () => {}});
    // eslint-disable-next-line jest/no-standalone-expect
    expect(uploaderInstance.inProgress).toBe(true);
};

/** @covers
 * Uploader.moveStart
 * Uploader.moveMove
 * Uploader.moveEnd
 * Uploader.keepImgInsideMaskBoundings
 * Uploader.pauseEvent
 * Uploader.updateZoomFromInput
 * Uploader.inputInputZoomListener
 * Uploader.changeInputZoomListener
 * Uploader.zoomIn
 * Uploader.zoomOut
 * Uploader.zoom
 * Uploader.handleScroll
 */
describe("uploader", function() {
    beforeEach(function() {
        require("./required.js");
        require("../src/helpers");
        require("../src/uploader");
    });

    it("should call mouse event", function(done) {
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
        var uploaderMoveStart = jest.spyOn(Uploader.prototype, "moveStart");
        var uploaderMoveMove = jest.spyOn(Uploader.prototype, "moveMove");
        var uploaderMoveEnd = jest.spyOn(Uploader.prototype, "moveEnd");
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var canvasObj = document.getElementById("canvas");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            // region Test: call Uploader.moveStart
            canvasObj.dispatchEvent(new Event("mousedown"));
            expect(uploaderMoveStart).toHaveBeenCalledTimes(1);
            uploaderMoveStart.mockClear();
            // endregion

            // region Test: call Uploader.moveMove
            window.dispatchEvent(new Event("mousemove"));
            expect(uploaderMoveMove).toHaveBeenCalledTimes(1);
            uploaderMoveMove.mockClear();
            // endregion

            // region Test: call Uploader.moveEnd
            window.dispatchEvent(new Event("mouseup"));
            expect(uploaderMoveEnd).toHaveBeenCalledTimes(1);
            uploaderMoveEnd.mockClear();
            // endregion

            done();
        }, 20);
    });

    it("should call touch event", function(done) {
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
        var uploaderMoveStart = jest.spyOn(Uploader.prototype, "moveStart");
        var uploaderMoveMove = jest.spyOn(Uploader.prototype, "moveMove");
        var uploaderMoveEnd = jest.spyOn(Uploader.prototype, "moveEnd");
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var canvasObj = document.getElementById("canvas");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            var touchStart = document.createEvent("TouchEvent");
            touchStart.initEvent("touchstart", true, true);
            Object.defineProperty(touchStart, "touches", {
                get: jest.fn().mockReturnValue([{pageX: 0, pageY: 0}])
            });

            var touchMove = document.createEvent("TouchEvent");
            touchMove.initEvent("touchmove", true, true);
            Object.defineProperty(touchMove, "touches", {
                get: jest.fn().mockReturnValue([{pageX: 0, pageY: 0}])
            });

            var touchEnd = document.createEvent("TouchEvent");
            touchEnd.initEvent("touchend", true, true);
            Object.defineProperty(touchEnd, "touches", {
                get: jest.fn().mockReturnValue([{pageX: 0, pageY: 0}])
            });

            // region Test: call Uploader.moveStart
            canvasObj.dispatchEvent(touchStart);
            expect(uploaderMoveStart).toHaveBeenCalledTimes(1);
            uploaderMoveStart.mockClear();
            // endregion

            // region Test: call Uploader.moveMove
            canvasObj.dispatchEvent(touchMove);
            expect(uploaderMoveMove).toHaveBeenCalledTimes(1);
            uploaderMoveMove.mockClear();
            // endregion

            // region Test: call Uploader.moveEnd
            canvasObj.dispatchEvent(touchEnd);
            expect(uploaderMoveEnd).toHaveBeenCalledTimes(1);
            uploaderMoveEnd.mockClear();
            // endregion

            done();
        }, 20);
    });

    it("should call zoom event", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-input_zoom-id="input_zoom"
    data-uploader-callback-zoom-update="window.zoomUpdate"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <input type="range" id="input_zoom" value="1"/>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderHandleScroll = jest.spyOn(Uploader.prototype, "handleScroll");
        var uploaderZoomIn = jest.spyOn(Uploader.prototype, "zoomIn");
        var uploaderZoomOut = jest.spyOn(Uploader.prototype, "zoomOut");
        var uploaderZoom = jest.spyOn(Uploader.prototype, "zoom");
        var uploaderChangeInputZoomListener = jest.spyOn(Uploader.prototype, "changeInputZoomListener");
        var uploaderInputInputZoomListener = jest.spyOn(Uploader.prototype, "inputInputZoomListener");

        var callbackZoomUpdate = jest.spyOn(window, "zoomUpdate");
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var canvasObj = document.getElementById("canvas");
        var inputFile = document.getElementById("input_file");
        var inputZoom = document.getElementById("input_zoom");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        // region Test: call Uploader.updateZoomFromInput
        inputZoom.dispatchEvent(new Event("change"));
        expect(uploaderChangeInputZoomListener).toHaveBeenCalledTimes(1);
        uploaderChangeInputZoomListener.mockClear();

        expect(callbackZoomUpdate).toHaveBeenCalledTimes(0);
        callbackZoomUpdate.mockClear();
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            callbackZoomUpdate.mockClear();

            // region Test: call Uploader.handleScroll with DOMMouseScroll -1 (zoomIn)
            canvasObj.dispatchEvent(new CustomEvent("DOMMouseScroll", {detail: -1}));
            expect(uploaderHandleScroll).toHaveBeenCalledTimes(1);
            uploaderHandleScroll.mockClear();

            expect(uploaderZoomIn).toHaveBeenCalledTimes(1);
            uploaderZoomIn.mockClear();

            expect(uploaderZoom).toHaveBeenCalledTimes(1);
            uploaderZoom.mockClear();

            expect(uploader.zoomCurrent).toBe(2);

            expect(callbackZoomUpdate).toHaveBeenCalledTimes(1);
            expect(callbackZoomUpdate).toHaveBeenCalledWith(uploader, "handleScroll");
            callbackZoomUpdate.mockClear();
            // endregion

            // region Test: call Uploader.handleScroll with DOMMouseScroll +1 (zoomOut)
            canvasObj.dispatchEvent(new CustomEvent("DOMMouseScroll", {detail: 1}));
            expect(uploaderHandleScroll).toHaveBeenCalledTimes(1);
            uploaderHandleScroll.mockClear();

            expect(uploaderZoomOut).toHaveBeenCalledTimes(1);
            uploaderZoomOut.mockClear();

            expect(uploaderZoom).toHaveBeenCalledTimes(1);
            uploaderZoom.mockClear();

            expect(uploader.zoomCurrent).toBe(1);

            expect(callbackZoomUpdate).toHaveBeenCalledTimes(1);
            expect(callbackZoomUpdate).toHaveBeenCalledWith(uploader, "handleScroll");
            callbackZoomUpdate.mockClear();

            canvasObj.dispatchEvent(new CustomEvent("DOMMouseScroll", {detail: 1}));
            expect(uploaderHandleScroll).toHaveBeenCalledTimes(1);
            uploaderHandleScroll.mockClear();

            expect(uploaderZoomOut).toHaveBeenCalledTimes(1);
            uploaderZoomOut.mockClear();

            expect(uploaderZoom).toHaveBeenCalledTimes(0);
            uploaderZoom.mockClear();

            expect(uploader.zoomCurrent).toBe(1);

            expect(callbackZoomUpdate).toHaveBeenCalledTimes(1);
            expect(callbackZoomUpdate).toHaveBeenCalledWith(uploader, "handleScroll");
            callbackZoomUpdate.mockClear();
            // endregion

            // region Test: call Uploader.handleScroll with mousewheel -1 (zoomIn)
            canvasObj.dispatchEvent(new CustomEvent("mousewheel", {detail: -1}));
            expect(uploaderHandleScroll).toHaveBeenCalledTimes(1);
            uploaderHandleScroll.mockClear();

            expect(uploaderZoomIn).toHaveBeenCalledTimes(1);
            uploaderZoomIn.mockClear();

            expect(uploaderZoom).toHaveBeenCalledTimes(1);
            uploaderZoom.mockClear();

            expect(uploader.zoomCurrent).toBe(2);

            expect(callbackZoomUpdate).toHaveBeenCalledTimes(1);
            expect(callbackZoomUpdate).toHaveBeenCalledWith(uploader, "handleScroll");
            callbackZoomUpdate.mockClear();
            // endregion

            // region Test: call Uploader.handleScroll with mousewheel +1 (zoomOut)
            canvasObj.dispatchEvent(new CustomEvent("mousewheel", {detail: 1}));
            expect(uploaderHandleScroll).toHaveBeenCalledTimes(1);
            uploaderHandleScroll.mockClear();

            expect(uploaderZoomOut).toHaveBeenCalledTimes(1);
            uploaderZoomOut.mockClear();

            expect(uploaderZoom).toHaveBeenCalledTimes(1);
            uploaderZoom.mockClear();

            expect(uploader.zoomCurrent).toBe(1);

            expect(callbackZoomUpdate).toHaveBeenCalledTimes(1);
            expect(callbackZoomUpdate).toHaveBeenCalledWith(uploader, "handleScroll");
            callbackZoomUpdate.mockClear();
            // endregion

            // region Test: call Uploader.updateZoomFromInput
            inputZoom.dispatchEvent(new Event("change"));
            expect(uploaderChangeInputZoomListener).toHaveBeenCalledTimes(1);
            uploaderChangeInputZoomListener.mockClear();

            expect(callbackZoomUpdate).toHaveBeenCalledTimes(1);
            expect(callbackZoomUpdate).toHaveBeenCalledWith(uploader, "updateZoomFromInput");
            callbackZoomUpdate.mockClear();
            // endregion

            // region Test: call Uploader.updateZoomFromInput
            inputZoom.dispatchEvent(new Event("input"));
            expect(uploaderInputInputZoomListener).toHaveBeenCalledTimes(1);
            uploaderInputInputZoomListener.mockClear();

            expect(callbackZoomUpdate).toHaveBeenCalledTimes(1);
            expect(callbackZoomUpdate).toHaveBeenCalledWith(uploader, "updateZoomFromInput");
            callbackZoomUpdate.mockClear();
            // endregion

            // region Test: call Uploader.handleScroll with wheelDelta
            uploader.handleScroll({offsetX: 0, offsetY: 0, wheelDelta: 10});

            expect(uploaderZoomIn).toHaveBeenCalledTimes(1);
            uploaderZoomIn.mockClear();

            uploader.handleScroll({offsetX: 0, offsetY: 0, wheelDelta: -10});

            expect(uploaderZoomOut).toHaveBeenCalledTimes(1);
            uploaderZoomOut.mockClear();
            // endregion

            // region Test: call Uploader.handleScroll but there is no callbacks.zoom.update and no inputZoomObj
            callbackZoomUpdate.mockClear();
            uploader.inputZoomObj = null;
            uploader.callbacks.zoom.update = null;
            uploader.handleScroll({offsetX: 0, offsetY: 0, wheelDelta: 10});

            expect(inputZoom.value).not.toBe(uploader.zoomCurrent);
            expect(callbackZoomUpdate).toHaveBeenCalledTimes(0);
            callbackZoomUpdate.mockClear();
            // endregion

            done();
        }, 20);
    });

    it("should move with mouse image (no mask)", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-css-canvas_moving="uploader__canvas--moving"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderDraw = jest.spyOn(Uploader.prototype, "draw");
        var uploaderKeepImgInsideMaskBoundings = jest.spyOn(Uploader.prototype, "keepImgInsideMaskBoundings");
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var canvasObj = document.getElementById("canvas");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            // clean
            uploaderDraw.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            var img = new Image();
            img.src = window.fileDataURL;

            // region Test: call Uploader.moveStart
            uploader.moveStart({pageX: 1, pageY: 3});

            expect(uploader.lastX).toBe(1);
            expect(uploader.lastY).toBe(3);
            expect(uploader.dragStart).toStrictEqual({x: 1, y: 3});
            expect(canvasObj.classList.contains("uploader__canvas--moving")).toBe(true);
            // endregion

            // region Test: call Uploader.moveMove
            uploader.moveMove({pageX: 10, pageY: 15});

            expect(uploader.lastX).toBe(10);
            expect(uploader.lastY).toBe(15);

            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledTimes(1);
            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledWith({x: 9, y: 12});
            expect(uploaderKeepImgInsideMaskBoundings).toHaveReturnedWith({x: 9, y: 12});
            uploaderKeepImgInsideMaskBoundings.mockClear();

            expect(uploaderDraw).toHaveBeenCalledTimes(1);
            uploaderDraw.mockClear();

            var drawCalls = uploader.canvasContext.__getDrawCalls();
            /*
            expect(drawCalls).toStrictEqual([
                {
                    "props": {
                        "height": 100,
                        "width": 100,
                        "x": -9,
                        "y": -12
                    },
                    "transform": [
                        1,
                        0,
                        0,
                        1,
                        9, // 10 - 1
                        12 // 15 - 3
                    ],
                    "type": "clearRect"
                },
                {
                    "props": {
                        "dHeight": 100,
                        "dWidth": 100,
                        "dx": 0,
                        "dy": 0,
                        "img": img,
                        "sHeight": 100,
                        "sWidth": 100,
                        "sx": 0,
                        "sy": 0
                    },
                    "transform": [
                        1,
                        0,
                        0,
                        1,
                        9, // 10 - 1
                        12 // 15 - 3
                    ],
                    "type": "drawImage"
                }
            ]);
            */
            uploader.canvasContext.__clearDrawCalls();

            expect(uploader.dragStart).toStrictEqual({x: 10, y: 15});
            // endregion

            // region Test: call Uploader.moveEnd
            uploader.moveEnd({pageX: 999999, pageY: 999999});
            expect(uploader.dragStart).toBe(null);
            expect(canvasObj.classList.contains("uploader__canvas--moving")).toBe(false);

            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledTimes(1);
            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledWith({x: 0, y: 0});
            expect(uploaderKeepImgInsideMaskBoundings).toHaveReturnedWith({x: 0, y: 0});
            uploaderKeepImgInsideMaskBoundings.mockClear();

            expect(uploaderDraw).toHaveBeenCalledTimes(0);
            uploaderDraw.mockClear();

            drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([]);
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            done();
        }, 20);
    });

    it("should replace image inside mask", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="50"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderDraw = jest.spyOn(Uploader.prototype, "draw");
        var uploaderKeepImgInsideMaskBoundings = jest.spyOn(Uploader.prototype, "keepImgInsideMaskBoundings");
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var canvasObj = document.getElementById("canvas");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            // clean
            uploaderDraw.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            var img = new Image();
            img.src = window.fileDataURL;

            // region Test: call Uploader.moveStart
            uploader.moveStart({pageX: 1, pageY: 3});

            expect(uploader.lastX).toBe(1);
            expect(uploader.lastY).toBe(3);
            expect(uploader.dragStart).toStrictEqual({x: 1, y: 3});
            // endregion

            // region Test: call Uploader.moveMove
            uploader.moveMove({pageX: 10, pageY: 15});

            expect(uploader.lastX).toBe(10);
            expect(uploader.lastY).toBe(15);

            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledTimes(1);
            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledWith({x: 0, y: 0});
            expect(uploaderKeepImgInsideMaskBoundings).toHaveReturnedWith({x: 0, y: 0});
            uploaderKeepImgInsideMaskBoundings.mockClear();

            expect(uploaderDraw).toHaveBeenCalledTimes(0);
            uploaderDraw.mockClear();

            var drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([]);
            uploader.canvasContext.__clearDrawCalls();

            expect(uploader.dragStart).toStrictEqual({x: 10, y: 15});
            // endregion

            // region Test: call Uploader.moveEnd
            uploader.moveEnd({pageX: 999999, pageY: 999999});
            expect(uploader.dragStart).toBe(null);
            expect(canvasObj.classList.contains("uploader__canvas--moving")).toBe(false);

            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledTimes(1);
            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledWith({x: 0, y: 0});
            expect(uploaderKeepImgInsideMaskBoundings).toHaveReturnedWith({x: 0, y: 0});
            uploaderKeepImgInsideMaskBoundings.mockClear();

            expect(uploaderDraw).toHaveBeenCalledTimes(0);
            uploaderDraw.mockClear();

            drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([]);
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            done();
        }, 20);
    });

    it("should move image inside mask", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="50"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderDraw = jest.spyOn(Uploader.prototype, "draw");
        var uploaderKeepImgInsideMaskBoundings = jest.spyOn(Uploader.prototype, "keepImgInsideMaskBoundings");
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var canvasObj = document.getElementById("canvas");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            // clean
            uploaderDraw.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            var img = new Image();
            img.src = window.fileDataURL;

            // Zoom twice for moving (scale has to change)
            uploader.zoomIn("center");
            uploader.zoomIn("center");

            uploaderKeepImgInsideMaskBoundings.mockClear();
            uploaderDraw.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            var currentScale = uploader.canvasContext.getTransform().inverse().a;

            // region Test: call Uploader.moveStart
            uploader.moveStart({pageX: 1, pageY: 3});

            expect(uploader.lastX).toBe(1);
            expect(uploader.lastY).toBe(3);
            expect(uploader.dragStart).toStrictEqual({x: 1, y: 3});
            // endregion

            // region Test: call Uploader.moveMove
            uploader.moveMove({pageX: 10, pageY: 15});

            expect(uploader.lastX).toBe(10);
            expect(uploader.lastY).toBe(15);

            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledTimes(1);
            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledWith({x: 9 * currentScale, y: 12 * currentScale});
            expect(uploaderKeepImgInsideMaskBoundings).toHaveReturnedWith({x: 9 * currentScale, y: 12 * currentScale});
            uploaderKeepImgInsideMaskBoundings.mockClear();

            expect(uploaderDraw).toHaveBeenCalledTimes(1);
            uploaderDraw.mockClear();

            /*
            var drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([
                {
                    "props": {
                        "height": 100 * currentScale,
                        "width": 100 * currentScale,
                        "x": -3.5147392290249435, // ???
                        "y": -6.235827664399094 // ???
                    },
                    "transform": [
                        1.1025,
                        0,
                        0,
                        1.1025,
                        3.875, // ???
                        6.875000000000002 // ???
                    ],
                    "type": "clearRect"
                },
                {
                    "props": {
                        "dHeight": 100,
                        "dWidth": 100,
                        "dx": 25,
                        "dy": 25,
                        "img": img,
                        "sHeight": 100,
                        "sWidth": 100,
                        "sx": 0,
                        "sy": 0
                    },
                    "transform": [
                        1.1025,
                        0,
                        0,
                        1.1025,
                        3.875, // ???
                        6.875000000000002 // ???
                    ],
                    "type": "drawImage"
                },
                window.canvasDrawCalls.fill_MaskSize50Radius0
            ]);*/
            uploader.canvasContext.__clearDrawCalls();

            expect(uploader.dragStart).toStrictEqual({x: 10, y: 15});
            // endregion

            // region Test: call Uploader.moveEnd
            uploader.moveEnd({pageX: 0, pageY: 0});
            expect(uploader.dragStart).toBe(null);
            expect(canvasObj.classList.contains("uploader__canvas--moving")).toBe(false);

            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledTimes(1);
            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledWith({x: -5.839002267573694, y: -8.560090702947846}); // ???
            expect(uploaderKeepImgInsideMaskBoundings).toHaveReturnedWith({x: -5.839002267573694, y: -8.560090702947846}); // ???
            uploaderKeepImgInsideMaskBoundings.mockClear();

            expect(uploaderDraw).toHaveBeenCalledTimes(1);
            uploaderDraw.mockClear();

            /*
            drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([
                {
                    "props": {
                        "height": 90.702947845805,
                        "width": 90.702947845805,
                        "x": 2.3242630385487506,
                        "y": 2.324263038548753
                    },
                    "transform": [
                        1.1025,
                        0,
                        0,
                        1.1025,
                        -2.5624999999999973,
                        -2.5625
                    ],
                    "type": "clearRect"
                },
                {
                    "props": {
                        "dHeight": 100,
                        "dWidth": 100,
                        "dx": 25,
                        "dy": 25,
                        "img": img,
                        "sHeight": 100,
                        "sWidth": 100,
                        "sx": 0,
                        "sy": 0
                    },
                    "transform": [
                        1.1025,
                        0,
                        0,
                        1.1025,
                        -2.5624999999999973,
                        -2.5625
                    ],
                    "type": "drawImage"
                },
                {
                    "props": {
                        "fillRule": "nonzero",
                        "path": [
                            {
                                "props": {},
                                "transform": [
                                    1,
                                    0,
                                    0,
                                    1,
                                    0,
                                    0
                                ],
                                "type": "beginPath"
                            },
                            {
                                "props": {
                                    "x": 25,
                                    "y": 25
                                },
                                "transform": [
                                    1,
                                    0,
                                    0,
                                    1,
                                    0,
                                    0
                                ],
                                "type": "moveTo"
                            },
                            {
                                "props": {
                                    "x": 75,
                                    "y": 25
                                },
                                "transform": [
                                    1,
                                    0,
                                    0,
                                    1,
                                    0,
                                    0
                                ],
                                "type": "lineTo"
                            },
                            {
                                "props": {
                                    "x": 75,
                                    "y": 75
                                },
                                "transform": [
                                    1,
                                    0,
                                    0,
                                    1,
                                    0,
                                    0
                                ],
                                "type": "lineTo"
                            },
                            {
                                "props": {
                                    "x": 25,
                                    "y": 75
                                },
                                "transform": [
                                    1,
                                    0,
                                    0,
                                    1,
                                    0,
                                    0
                                ],
                                "type": "lineTo"
                            },
                            {
                                "props": {
                                    "x": 25,
                                    "y": 25
                                },
                                "transform": [
                                    1,
                                    0,
                                    0,
                                    1,
                                    0,
                                    0
                                ],
                                "type": "lineTo"
                            },
                            {
                                "props": {},
                                "transform": [
                                    1,
                                    0,
                                    0,
                                    1,
                                    0,
                                    0
                                ],
                                "type": "closePath"
                            },
                            {
                                "props": {
                                    "height": 100,
                                    "width": -100,
                                    "x": 100,
                                    "y": 0
                                },
                                "transform": [
                                    1,
                                    0,
                                    0,
                                    1,
                                    0,
                                    0
                                ],
                                "type": "rect"
                            }
                        ]
                    },
                    "transform": [
                        1,
                        0,
                        0,
                        1,
                        0,
                        0
                    ],
                    "type": "fill"
                }
            ]);
            */
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            done();
        }, 20);
    });

    it("should move image but with no constraint inside mask", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="50"
    data-uploader-mask-constraint="false"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        // endregion

        // region Setup: jest spy
        var uploaderDraw = jest.spyOn(Uploader.prototype, "draw");
        var uploaderKeepImgInsideMaskBoundings = jest.spyOn(Uploader.prototype, "keepImgInsideMaskBoundings");
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var canvasObj = document.getElementById("canvas");
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            // clean
            uploaderDraw.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            var img = new Image();
            img.src = window.fileDataURL;

            uploaderKeepImgInsideMaskBoundings.mockClear();
            uploaderDraw.mockClear();
            uploader.canvasContext.__clearDrawCalls();

            var currentScale = uploader.canvasContext.getTransform().inverse().a;

            // region Test: call Uploader.moveStart
            uploader.moveStart({pageX: 0, pageY: 0});

            expect(uploader.lastX).toBe(0);
            expect(uploader.lastY).toBe(0);
            expect(uploader.dragStart).toStrictEqual({x: 0, y: 0});
            expect(canvasObj.classList.toString()).toBe("");
            // endregion

            // region Test: call Uploader.moveMove
            uploader.moveMove({pageX: 10, pageY: 15});

            expect(uploader.lastX).toBe(10);
            expect(uploader.lastY).toBe(15);

            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledTimes(1);
            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledWith({x: 10 * currentScale, y: 15 * currentScale});
            expect(uploaderKeepImgInsideMaskBoundings).toHaveReturnedWith({x: 10 * currentScale, y: 15 * currentScale});
            uploaderKeepImgInsideMaskBoundings.mockClear();

            expect(uploaderDraw).toHaveBeenCalledTimes(1);
            uploaderDraw.mockClear();

            var drawCalls = uploader.canvasContext.__getDrawCalls();
            /*
            expect(drawCalls).toStrictEqual([
                {
                    "props": {
                        "height": 100 * currentScale,
                        "width": 100 * currentScale,
                        "x": -10,
                        "y": -15
                    },
                    "transform": [
                        1,
                        0,
                        0,
                        1,
                        10,
                        15
                    ],
                    "type": "clearRect"
                },
                {
                    "props": {
                        "dHeight": 100,
                        "dWidth": 100,
                        "dx": 25,
                        "dy": 25,
                        "img": img,
                        "sHeight": 100,
                        "sWidth": 100,
                        "sx": 0,
                        "sy": 0
                    },
                    "transform": [
                        1,
                        0,
                        0,
                        1,
                        10,
                        15
                    ],
                    "type": "drawImage"
                },
                window.canvasDrawCalls.fill_MaskSize50Radius0
            ]);
            */
            uploader.canvasContext.__clearDrawCalls();

            expect(uploader.dragStart).toStrictEqual({x: 10, y: 15});
            // endregion

            // region Test: call Uploader.moveEnd
            uploader.moveEnd({pageX: 0, pageY: 0});
            expect(uploader.dragStart).toBe(null);
            expect(canvasObj.classList.contains("uploader__canvas--moving")).toBe(false);

            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledTimes(1);
            expect(uploaderKeepImgInsideMaskBoundings).toHaveBeenCalledWith({x: 0, y: 0});
            expect(uploaderKeepImgInsideMaskBoundings).toHaveReturnedWith({x: 0, y: 0});
            uploaderKeepImgInsideMaskBoundings.mockClear();

            expect(uploaderDraw).toHaveBeenCalledTimes(0);
            uploaderDraw.mockClear();

            drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([]);
            uploader.canvasContext.__clearDrawCalls();
            // endregion

            done();
        }, 20);
    });

    it("should test keepImgInsideMaskBoundings possibilities", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="50"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            var translation = {x: 0, y: 0};

            // initials values
            // uploader.imgSizeComputed => { x: 25, y: 25, width: 50, height: 50 }
            // uploader.ptTopLeftMask => DOMPoint { x: 25, y: 25, z: 0, w: 1 }
            // uploader.ptBottomRightMask => DOMPoint { x: 75, y: 75, z: 0, w: 1 }

            // region Test: No Translation
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 0, y: 0});
            // endregion

            // region Test: block translation when image inside mask is too small and you are in the good position
            // translate left - blocked
            translation = {x: -1, y: 0};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 0, y: 0});

            // translate right - blocked
            translation = {x: 1, y: 0};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 0, y: 0});

            // translate up - blocked
            translation = {x: 0, y: -1};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 0, y: 0});

            // translate down - blocked
            translation = {x: 0, y: 1};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 0, y: 0});
            // endregion

            // region Test: don't block translation when image below mask is big enough
            uploader.ptTopLeftMask = {x: 45, y: 45};
            uploader.ptBottomRightMask = {x: 50, y: 50};

            // translate left - not blocked
            translation = {x: -1, y: 0};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: -1, y: 0});

            // translate right - not blocked
            translation = {x: 1, y: 0};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 1, y: 0});

            // translate up - not blocked
            translation = {x: 0, y: -1};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 0, y: -1});

            // translate down - not blocked
            translation = {x: 0, y: 1};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 0, y: 1});
            // endregion

            // region Test: move image inside the mask when translation is too much - top left mask
            uploader.ptTopLeftMask = {x: 20, y: 20};
            uploader.ptBottomRightMask = {x: 45, y: 45};

            // translate left - not blocked
            translation = {x: -1, y: 0};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: -5, y: -5});

            // translate right - not blocked
            translation = {x: 1, y: 0};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: -5, y: -5});

            // translate up - not blocked
            translation = {x: 0, y: -1};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: -5, y: -5});

            // translate down - not blocked
            translation = {x: 0, y: 1};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: -5, y: -5});
            // endregion

            // region Test: move image inside the mask when translation is too much - bottom right mask
            uploader.ptTopLeftMask = {x: 25, y: 25};
            uploader.ptBottomRightMask = {x: 80, y: 80};

            // translate left - not blocked
            translation = {x: -1, y: 0};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 5, y: 5});

            // translate right - not blocked
            translation = {x: 1, y: 0};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 5, y: 5});

            // translate up - not blocked
            translation = {x: 0, y: -1};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 5, y: 5});

            // translate down - not blocked
            translation = {x: 0, y: 1};
            translation = uploader.keepImgInsideMaskBoundings(translation);
            expect(translation).toStrictEqual({x: 5, y: 5});
            // endregion

            done();
        }, 20);
    });

    it("should not register values when calling moveMove and dragStart is null", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-mask-size="50"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
</div>`;
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            expect(uploader.dragStart).toBe(null);

            uploader.moveMove({pageX: 10, pageY: 15});

            expect(uploader.dragStart).toBe(null);

            done();
        }, 20);
    });

    it("should test updateZoomFromInput", function(done) {
        // region Setup: DOM
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
        // endregion

        // region Setup: jest spy
        var uploaderZoomIn = jest.spyOn(Uploader.prototype, "zoomIn");
        uploaderZoomIn.mockClear();
        var uploaderZoomOut = jest.spyOn(Uploader.prototype, "zoomOut");
        uploaderZoomOut.mockClear();
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        var img = new Image();
        img.src = window.fileDataURL;

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            uploader.canvasContext.__clearDrawCalls();

            uploader.updateZoomFromInput({target: {value: 2}});
            expect(uploaderZoomIn).toHaveBeenCalledTimes(0);
            uploaderZoomIn.mockClear();
            expect(uploaderZoomOut).toHaveBeenCalledTimes(0);
            uploaderZoomOut.mockClear();

            /*
            var drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([
                {
                    "props": {
                        "height": 95.23809523809524,
                        "width": 95.23809523809524,
                        "x": 2.380952380952381,
                        "y": 2.380952380952381
                    },
                    "transform": [
                        1.05,
                        0,
                        0,
                        1.05,
                        -2.5,
                        -2.5
                    ],
                    "type": "clearRect"
                },
                {
                    "props": {
                        "dHeight": 100,
                        "dWidth": 100,
                        "dx": 0,
                        "dy": 0,
                        "img": img,
                        "sHeight": 100,
                        "sWidth": 100,
                        "sx": 0,
                        "sy": 0
                    },
                    "transform": [
                        1.05,
                        0,
                        0,
                        1.05,
                        -2.5,
                        -2.5
                    ],
                    "type": "drawImage"
                }
            ]);
            */
            uploader.canvasContext.__clearDrawCalls();

            uploader.updateZoomFromInput({target: {value: 1}});
            expect(uploaderZoomIn).toHaveBeenCalledTimes(0);
            uploaderZoomIn.mockClear();
            expect(uploaderZoomOut).toHaveBeenCalledTimes(0);
            uploaderZoomOut.mockClear();

            /*
            drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([
                {
                    "props": {
                        "height": 100,
                        "width": 100,
                        "x": 0,
                        "y": 0
                    },
                    "transform": [
                        1,
                        0,
                        0,
                        1,
                        0,
                        0
                    ],
                    "type": "clearRect"
                },
                {
                    "props": {
                        "dHeight": 100,
                        "dWidth": 100,
                        "dx": 0,
                        "dy": 0,
                        "img": img,
                        "sHeight": 100,
                        "sWidth": 100,
                        "sx": 0,
                        "sy": 0
                    },
                    "transform": [
                        1,
                        0,
                        0,
                        1,
                        0,
                        0
                    ],
                    "type": "drawImage"
                }
            ]);
            */
            uploader.canvasContext.__clearDrawCalls();

            uploader.updateZoomFromInput({target: {value: -1}});

            /*
            drawCalls = uploader.canvasContext.__getDrawCalls();
            expect(drawCalls).toStrictEqual([
                {
                    "props": {
                        "height": 100,
                        "width": 100,
                        "x": 0,
                        "y": 0
                    },
                    "transform": [
                        1,
                        0,
                        0,
                        1,
                        0,
                        0
                    ],
                    "type": "clearRect"
                },
                {
                    "props": {
                        "dHeight": 100,
                        "dWidth": 100,
                        "dx": 0,
                        "dy": 0,
                        "img": img,
                        "sHeight": 100,
                        "sWidth": 100,
                        "sx": 0,
                        "sy": 0
                    },
                    "transform": [
                        1,
                        0,
                        0,
                        1,
                        0,
                        0
                    ],
                    "type": "drawImage"
                }
            ]);
            */
            uploader.canvasContext.__clearDrawCalls();

            done();
        }, 20);
    });

    it("should test updateZoomFromInput cannot be called when inProgress == true", function(done) {
        // region Setup: DOM
        document.body.innerHTML = `
<div id="uploader"
    data-uploader-input_file-id="input_file"
    data-uploader-canvas-id="canvas"
    data-uploader-input_zoom-id="input_zoom"
    data-uploader-callback-zoom-update="window.customZoomUpdate"
>
    <input type="file" id="input_file" />
    <canvas id="canvas" width="100" height="100"></canvas>
    <input type="range" id="input_zoom" value="1"/>
</div>`;
        // endregion

        // region Setup: input file/zoom + div preview/upload + new Uploader
        var inputFile = document.getElementById("input_file");
        Object.defineProperty(inputFile, "files", {
            get: jest.fn().mockImplementation(() => { return [window.ValidFile]; })
        });

        var uploader = new Uploader(document.getElementById("uploader"));
        expect(uploader).not.toBeInstanceOf(Error);
        // endregion

        inputFile.dispatchEvent(new Event("change"));

        // WARNING, uploader.reader.result is mocked because it return null in jest
        Object.defineProperty(uploader.reader, "result", {
            get: jest.fn().mockImplementation(() => { return window.fileDataURL; })
        });

        // WARNING, because of jest we have to simulate load event for FileReader setted in Uploader.initAttributes
        uploader.eventTreatImageListener();

        uploader.img.width = 100;
        uploader.img.height = 100;
        uploader.img.dispatchEvent(new Event("load"));

        var img = new Image();
        img.src = window.fileDataURL;

        // WARNING, jest.useFakeTimers() not working with image.onload event
        setTimeout(function() {
            uploader.canvasContext.__clearDrawCalls();

            uploader.updateZoomFromInput({target: {value: 2}});

            setTimeout(function() {
                done();
            }, 100);
        }, 20);
    });
});
