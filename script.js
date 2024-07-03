const templateCanvas = document.getElementById('template-layer');
const drawingCanvas = document.getElementById('drawing-layer');
const templateCtx = templateCanvas.getContext('2d', { willReadFrequently: true });
const drawingCtx = drawingCanvas.getContext('2d', { willReadFrequently: true });
let currentTool = 'pencil';
let drawing = false;
let color = '#000000';
let toolSize = 2;
let templateImage = null;
let eraserPreview = document.createElement('div');
eraserPreview.id = 'eraser-preview';
document.body.appendChild(eraserPreview);
let undoStack = [];
let hasDrawing = false;
let hasTemplate = false;
let drawingImageData = null;
let templateImageData = null;
let originalTemplateImage = null;
let originalDrawingImage = null;

function addEventListeners() {
    const tools = ['pencil', 'brush', 'glitter', 'spray', 'eraser', 'undo', 'clear-canvas', 'clear-all', 'save'];
    tools.forEach(tool => {
        const button = document.getElementById(`${tool}-button`);
        if (button) {
            button.addEventListener('click', () => setTool(tool));
        }
    });

    document.getElementById('size-slider').addEventListener('input', (e) => {
        adjustToolSize(e.target.value);
        console.log(`Adjusted size slider to ${e.target.value}`);
    });

    document.getElementById('color-display').addEventListener('click', toggleColorPicker);

    document.getElementById('upload-template').addEventListener('change', loadTemplate);

    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            undo();
            console.log('Undo action triggered by keyboard');
        }
    });

    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mouseup', endDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseout', endDrawing);

    drawingCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    drawingCanvas.addEventListener('touchend', endDrawing, { passive: false });
    drawingCanvas.addEventListener('touchmove', draw, { passive: false });
}

document.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
    resizeCanvas();
});

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-button').forEach(button => button.classList.remove('selected'));
    document.getElementById(`${tool}-button`).classList.add('selected');
    eraserPreview.style.display = tool === 'eraser' ? 'block' : 'none';

    switch (tool) {
        case 'pencil':
            toolSize = 2;
            drawingCtx.globalAlpha = 1.0;
            drawingCtx.globalCompositeOperation = 'source-over';
            break;
        case 'brush':
            toolSize = 5;
            drawingCtx.globalAlpha = 0.4;
            drawingCtx.globalCompositeOperation = 'source-over';
            break;
        case 'glitter':
            toolSize = 15;
            drawingCtx.globalAlpha = 1.0;
            drawingCtx.globalCompositeOperation = 'source-over';
            break;
        case 'spray':
            toolSize = 10;
            drawingCtx.globalAlpha = 1.0;
            drawingCtx.globalComposite
    }
}
function colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function setColorAtPixel(data, x, y, color) {
    const index = (y * drawingCanvas.width + x) * 4;
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
}

function getColorAtPixel(data, x, y) {
    const index = (y * drawingCanvas.width + x) * 4;
    return [data[index], data[index + 1], data[index + 2], data[index + 3]];
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
}

function saveState() {
    undoStack.push(drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height));
    console.log('State saved');
}

function undo() {
    if (undoStack.length > 0) {
        let prevState = undoStack.pop();
        drawingCtx.putImageData(prevState, 0, 0);
        originalDrawingImage = new Image();
        originalDrawingImage.src = drawingCanvas.toDataURL();
        console.log('Undo action performed');
    }
}

function clearAll() {
    templateCtx.clearRect(0, 0, templateCanvas.width, templateCanvas.height);
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    templateImageData = null;
    drawingImageData = null;
    originalTemplateImage = null;
    originalDrawingImage = null;
    hasTemplate = false;
    hasDrawing = false;
    console.log('Clear all action performed');
}

function clearCanvas() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawingImageData = null;
    originalDrawingImage = null;
    hasDrawing = false;
    console.log('Clear canvas action performed');
}

function resizeCanvas() {
    const canvasContainer = document.getElementById('canvas-container');
    const newTemplateWidth = canvasContainer.clientWidth;
    const newTemplateHeight = canvasContainer.clientHeight;
    const newDrawingWidth = canvasContainer.clientWidth;
    const newDrawingHeight = canvasContainer.clientHeight;

    templateCanvas.width = newTemplateWidth;
    templateCanvas.height = newTemplateHeight;
    drawingCanvas.width = newDrawingWidth;
    drawingCanvas.height = newDrawingHeight;

    if (hasTemplate && originalTemplateImage) {
        templateCtx.clearRect(0, 0, newTemplateWidth, newTemplateHeight);
        templateCtx.drawImage(originalTemplateImage, 0, 0, newTemplateWidth, newTemplateHeight);
    }
    if (hasDrawing && originalDrawingImage) {
        drawingCtx.clearRect(0, 0, newDrawingWidth, newDrawingHeight);
        drawingCtx.drawImage(originalDrawingImage, 0, 0, newDrawingWidth, newDrawingHeight);
    }

    console.log('Canvas resized');
}

function saveDrawing() {
    const link = document.createElement('a');
    link.href = drawingCanvas.toDataURL('image/png');
    link.download = 'drawing.png';
    link.click();
    console.log('Save drawing action performed');
}

function updateEraserPreview(x, y) {
    eraserPreview.style.left = `${x - toolSize / 2}px`;
    eraserPreview.style.top = `${y - toolSize / 2}px`;
    eraserPreview.style.width = `${toolSize}px`;
    eraserPreview.style.height = `${toolSize}px`;
}
