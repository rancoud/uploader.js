# uploader.js

[![Test workflow](https://img.shields.io/github/actions/workflow/status/rancoud/uploader.js/test.yml?branch=main)](https://github.com/rancoud/uploader.js/actions/workflows/test.yml)
[![Codecov](https://img.shields.io/codecov/c/github/rancoud/uploader.js?logo=codecov)](https://codecov.io/gh/rancoud/uploader.js)

JS Uploader take care of your image upload, resize, pan, zoom.

## Installation
You need to download the js file from `dist` folder, then you can include it in your HTML at the end of your body.
```html
<script src="/uploader.min.js"></script>
```
In your page you need that minimum HTML structure.
```html
<div id="uploader-dom" data-uploader-canvas-id="simple-canvas" data-uploader-input_file-id="simple-input_file">
    <canvas id="simple-canvas" width="200" height="200"></canvas>
    <input type="file" id="simple-input_file">
</div>
```
Tehn in your javascript you can instanciate new Uploader.
```js
var domRoot = document.getElementById("uploader-dom");
var err = new Uploader(domRoot);
if (err instanceof Error) {
    console.error(err);
}
```
