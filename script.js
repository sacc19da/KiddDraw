document.getElementById('showPixel-button').addEventListener('click', function () {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    const canvasContainer = document.getElementById('canvas-container');
    const tools = document.getElementById('tools');

    const originalCanvasContainerWidth = canvasContainer.clientWidth;
    const originalCanvasContainerHeight = canvasContainer.clientHeight;
    const originalToolsWidth = tools.clientWidth;
    const originalToolsHeight = tools.clientHeight;

    resizeCanvas();

    const resizedCanvasContainerWidth = canvasContainer.clientWidth;
    const resizedCanvasContainerHeight = canvasContainer.clientHeight;
    const resizedToolsWidth = tools.clientWidth;
    const resizedToolsHeight = tools.clientHeight;

    alert(
        `原始視窗內部寬高: ${originalInnerWidth}x${originalInnerHeight}\n` +
        `原始 Canvas 容器寬高: ${originalCanvasContainerWidth}x${originalCanvasContainerHeight}\n` +
        `原始工具列寬高: ${originalToolsWidth}x${originalToolsHeight}\n\n` +
        `調整後 Canvas 容器寬高: ${resizedCanvasContainerWidth}x${resizedCanvasContainerHeight}\n` +
        `調整後工具列寬高: ${resizedToolsWidth}x${resizedToolsHeight}`
    );
});

// 1. 定義變數區
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

// 2. 批次新增監聽事件
window.onload = function () {
    // document.body.style.zoom = "100%";
    document.body.style.zoom = (window.innerWidth / window.outerWidth);
    // 畫布和工具列的初始化代碼
    // resizeCanvas();
    handleOrientationChange();
    // 設定初始工具為鉛筆
    setTool('pencil');
    // 其他初始化代碼
};

// resizeCanvas();

document.querySelectorAll('#canvas-container, #drawing-layer, #template-layer').forEach(element => {
    element.addEventListener('touchstart', event => event.preventDefault());
    element.addEventListener('touchend', event => event.preventDefault());
});

// 二指縮放
// document.addEventListener('touchmove', function (event) {
//     if (event.scale !== 1) {
//         event.preventDefault();
//     }
// }, { passive: false });
// document.addEventListener('gesturestart', function (event) {
//     event.preventDefault();
// });

// document.addEventListener('gesturechange', function (event) {
//     event.preventDefault();
// });

// document.addEventListener('gestureend', function (event) {
//     event.preventDefault();
// });

document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('selectstart', event => event.preventDefault());
document.addEventListener('touchstart', event => {
    if (event.target.type !== 'range' && event.target.type !== 'color') {
        event.preventDefault();
    }
}, { passive: false });
document.addEventListener('touchend', event => {
    if (event.target.type !== 'range' && event.target.type !== 'color') {
        event.preventDefault();
    }
}, { passive: false });


document.getElementById('upload-template').addEventListener('change', loadTemplate);
document.getElementById('save-button').addEventListener('click', saveDrawing);
document.getElementById('clear-canvas-button').addEventListener('click', clearCanvas);
document.getElementById('clear-all-button').addEventListener('click', clearAll);
document.getElementById('undo-button').addEventListener('click', undo);

document.querySelectorAll('#tools button, #tools label').forEach(button => {
    button.addEventListener('touchstart', event => {
        console.log(`Touched button: ${button.id}`);
        event.stopPropagation();
    }, { passive: true });
    button.addEventListener('touchend', event => {
        console.log(`Touched button: ${button.id}`);
        event.stopPropagation();
    }, { passive: true });
    button.addEventListener('click', event => {
        console.log(`Clicked button: ${button.id}`);
        if (button.id.startsWith('tool-')) {
            setTool(button.id.replace('tool-', '').replace('-button', ''));
        }
    });
});

document.getElementById('color-display').addEventListener('click', event => {
    console.log('Clicked color display');
    toggleColorPicker();
});
document.getElementById('color-display').addEventListener('touchstart', event => {
    console.log('Touched color display');
    toggleColorPicker();
}, { passive: true });

document.getElementById('color-picker').addEventListener('click', event => {
    if (event.target.classList.contains('color')) {
        console.log('Clicked color element');
        setColor(event.target.getAttribute('data-color'));
        //setColor(event.target.value);
        toggleColorPicker();  // 選擇完固定顏色後關閉顏色選擇器
    }
});
document.getElementById('color-picker').addEventListener('touchstart', event => {
    if (event.target.classList.contains('color')) {
        console.log('Touched color element');
        setColor(event.target.getAttribute('data-color'));
        toggleColorPicker();  // 選擇完固定顏色後關閉顏色選擇器
    }
}, { passive: true });

document.getElementById('custom-color-picker').addEventListener('change', event => {
    console.log('Selected custom color');
    setColor(event.target.value);
});

document.getElementById('confirm-color-button').addEventListener('click', event => {
    console.log('Confirmed custom color');
    toggleColorPicker();  // 點擊確認按鈕後關閉顏色選擇器
});

document.getElementById('confirm-color-button').addEventListener('touchstart', event => {
    console.log('Confirmed custom color');
    toggleColorPicker();  // 點擊確認按鈕後關閉顏色選擇器
});

document.getElementById('size-slider').addEventListener('touchstart', (e) => {
    console.log('Touched size slider');
    e.stopPropagation();
}, { passive: true });

document.getElementById('size-slider').addEventListener('touchend', (e) => {
    console.log('Touched size slider');
    e.stopPropagation();
}, { passive: true });

document.getElementById('size-slider').addEventListener('input', (e) => {
    adjustToolSize(e.target.value);
    console.log(`Adjusted size slider to ${e.target.value}`);
});

window.addEventListener('resize', function () {
    saveDrawingImageData(); // 儲存當前狀態
    // resizeCanvas();
    handleOrientationChange();
});
window.addEventListener('orientationchange', function () {
    saveDrawingImageData(); // 儲存當前狀態
    // resizeCanvas();
    handleOrientationChange();
});

document.addEventListener('keydown', function (e) {
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

drawingCanvas.addEventListener('click', (e) => {
    if (currentTool === 'paint') {
        const x = e.clientX - drawingCanvas.offsetLeft;
        const y = e.clientY - drawingCanvas.offsetTop;
        console.log(`Click event at (${x}, ${y})`);
        mergeLayersAndFill(x, y);
        saveDrawingImageData();
    }
});

drawingCanvas.addEventListener('touchstart', (e) => {
    if (currentTool === 'paint') {
        const touch = e.touches[0];
        const x = Math.floor(touch.clientX - drawingCanvas.offsetLeft);
        const y = Math.floor(touch.clientY - drawingCanvas.offsetTop);
        console.log(`Touch event at (${x}, ${y})`);
        mergeLayersAndFill(x, y);
        saveDrawingImageData();
    }
}, { passive: false });

document.querySelectorAll('button[onclick], label[for]').forEach(button => {
    button.addEventListener('click', (e) => {
        console.log(`Clicked button: ${e.target.outerHTML}`);
    });
    button.addEventListener('touchstart', (e) => {
        console.log(`Touched button: ${e.target.outerHTML}`);
    }, { passive: true });
});

// 3. function 區
function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('#tools button').forEach(button => button.classList.remove('selected'));
    document.getElementById('tool-' + tool + '-button').classList.add('selected');
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
            drawingCtx.globalCompositeOperation = 'source-over';
            break;
        case 'eraser':
            toolSize = 20;
            drawingCtx.globalAlpha = 1.0;
            drawingCtx.globalCompositeOperation = 'destination-out';
            break;
        case 'paint':
            toolSize = 0;
            drawingCtx.globalAlpha = 1.0;
            drawingCtx.globalCompositeOperation = 'source-over';
            break;
    }
    document.getElementById('size-slider').value = toolSize;
    document.getElementById('size-slider').disabled = tool === 'paint';

    if (hasDrawing) {
        originalDrawingImage = new Image();
        originalDrawingImage.src = drawingCanvas.toDataURL();
    }
}

function adjustToolSize(size) {
    toolSize = size;
    console.log(`Tool size adjusted to ${size}`);
}

function setColor(newColor) {
    color = newColor;
    drawingCtx.fillStyle = color; // 更新填充樣式
    document.getElementById('selected-color').style.backgroundColor = color;
    console.log(`Color set to ${newColor}`);
}

function toggleColorPicker() {
    const colorPicker = document.getElementById('color-picker');
    console.log('Color picker element:', colorPicker);
    if (colorPicker.style.display === 'none' || colorPicker.style.display === '') {
        colorPicker.style.display = 'block';
        console.log('Toggled color picker display to block');
    } else {
        colorPicker.style.display = 'none';
        console.log('Toggled color picker display to none');
    }
}

function startDrawing(e) {
    if (currentTool !== 'paint') {
        drawing = true;
        hasDrawing = true;
        saveState();
        draw(e);
    }
}

function endDrawing() {
    drawing = false;
    drawingCtx.beginPath();
    originalDrawingImage = new Image();
    originalDrawingImage.src = drawingCanvas.toDataURL();
}

function draw(e) {
    if (!drawing) return;

    let ctx = drawingCtx;
    ctx.lineWidth = toolSize;
    ctx.lineCap = 'round';

    let x, y;
    if (e.touches) {
        x = e.touches[0].clientX - drawingCanvas.offsetLeft;
        y = e.touches[0].clientY - drawingCanvas.offsetTop;
    } else {
        x = e.clientX - drawingCanvas.offsetLeft;
        y = e.clientY - drawingCanvas.offsetTop;
    }

    if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        updateEraserPreview(x, y);
    } else if (currentTool === 'spray') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        sprayPaint(x, y);
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
    }

    if (currentTool !== 'spray') {
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    if (currentTool === 'glitter') {
        for (let i = 0; i < 10; i++) {
            const offsetX = getRandomOffset(toolSize);
            const offsetY = getRandomOffset(toolSize);
            ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
        }
    }

    drawingImageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
}

function sprayPaint(x, y) {
    const density = 50;
    drawingCtx.fillStyle = color; // 使用選擇的顏色
    for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * toolSize;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        drawingCtx.fillRect(x + offsetX, y + offsetY, 1, 1);
    }
}

function getRandomOffset(size) {
    return Math.random() * size - size / 2;
}

function loadTemplate(event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = function (e) {
        templateImage = new Image();
        templateImage.onload = function () {
            hasTemplate = true;
            templateCtx.clearRect(0, 0, templateCanvas.width, templateCanvas.height);
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            templateCtx.drawImage(templateImage, 0, 0, templateCanvas.width, templateCanvas.height);
            originalTemplateImage = new Image();
            originalTemplateImage.src = templateCanvas.toDataURL();
            drawingImageData = null;
            hasDrawing = false;
        };
        templateImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function mergeLayersAndFill(x, y) {
    saveState(); // 在進行填滿操作之前保存當前狀態

    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = drawingCanvas.width;
    tempCanvas.height = drawingCanvas.height;
    let tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    // 合併圖層
    tempCtx.drawImage(templateCanvas, 0, 0);
    tempCtx.drawImage(drawingCanvas, 0, 0);

    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imgData.data;
    const stack = [[x, y]];
    const targetColor = getColorAtPixel(data, x, y);
    const fillColor = hexToRgb(color);

    console.log(`Target color at (${x}, ${y}):`, targetColor);

    if (colorsMatch(targetColor, fillColor)) return;

    console.log(`Starting fill at (${x}, ${y}) with target color ${targetColor} and fill color ${fillColor}`);

    let steps = 0;
    const MAX_STEPS = 1000000; // 設置最大步驟限制
    const MAX_PIXELS = 100000; // 設置最大填充像素數量限制

    let filledPixels = 0;

    // 填充算法
    while (stack.length) {
        const [currentX, currentY] = stack.pop();
        if (currentX < 0 || currentY < 0 || currentX >= tempCanvas.width || currentY >= tempCanvas.height) continue;

        const currentColor = getColorAtPixel(data, currentX, currentY);

        if (colorsMatch(currentColor, targetColor)) {
            setColorAtPixel(data, currentX, currentY, fillColor);
            stack.push([currentX + 1, currentY], [currentX - 1, currentY], [currentX, currentY + 1], [currentX, currentY - 1]);
            filledPixels++;
        }

        steps++;
        if (steps % 10000 === 0) {
            console.log(`Filled ${steps} pixels`);
        }

        // // 如果達到步驟限制或填充像素數量限制，提前終止填充
        // if (steps >= MAX_STEPS || filledPixels >= MAX_PIXELS) {
        //     console.log('Fill operation terminated early to prevent infinite loop or performance issues.');
        //     break;
        // }
    }

    tempCtx.putImageData(imgData, 0, 0);
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawingCtx.drawImage(tempCanvas, 0, 0);

    originalDrawingImage = new Image();
    originalDrawingImage.src = drawingCanvas.toDataURL();
}
function getColorAtPixel(data, x, y) {
    const index = (y * drawingCanvas.width + x) * 4;
    return [data[index], data[index + 1], data[index + 2], data[index + 3]];
}

function setColorAtPixel(data, x, y, color) {
    const index = (y * drawingCanvas.width + x) * 4;
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
}

function colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function updateEraserPreview(x, y) {
    eraserPreview.style.left = `${x - toolSize / 2}px`;
    eraserPreview.style.top = `${y - toolSize / 2}px`;
    eraserPreview.style.width = `${toolSize}px`;
    eraserPreview.style.height = `${toolSize}px`;
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
    const templateCanvas = document.getElementById('template-layer');
    const drawingCanvas = document.getElementById('drawing-layer');
    const templateCtx = templateCanvas.getContext('2d');
    const drawingCtx = drawingCanvas.getContext('2d');

    const newTemplateWidth = canvasContainer.clientWidth;
    const newTemplateHeight = canvasContainer.clientHeight;
    const newDrawingWidth = canvasContainer.clientWidth;
    const newDrawingHeight = canvasContainer.clientHeight;

    templateCanvas.width = newTemplateWidth;
    templateCanvas.height = newTemplateHeight;
    drawingCanvas.width = newTemplateWidth;
    drawingCanvas.height = newTemplateHeight;

    if (templateCtx && drawingCtx) {
        templateCtx.clearRect(0, 0, newTemplateWidth, newTemplateHeight);
        drawingCtx.clearRect(0, 0, newDrawingWidth, newDrawingHeight);
    }

    if (hasTemplate && templateImageData) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = templateImageData.width;
        tempCanvas.height = templateImageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(templateImageData, 0, 0);
        templateCtx.drawImage(tempCanvas, 0, 0, newTemplateWidth, newTemplateHeight);
    }
    if (hasDrawing && drawingImageData) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = drawingImageData.width;
        tempCanvas.height = drawingImageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(drawingImageData, 0, 0);
        drawingCtx.drawImage(tempCanvas, 0, 0, newDrawingWidth, newDrawingHeight);
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

function saveDrawingImageData() {
    try {
        if (drawingCanvas.width > 0 && drawingCanvas.height > 0) {
            drawingImageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
            console.log('Drawing image data saved');
        }
    } catch (error) {
        console.error('Error getting image data:', error);
    }
}

function handleOrientationChange() {
    const body = document.body;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 移除所有可能存在的class
    body.classList.remove('horizontal-layout');
    body.classList.remove('vertical-layout');

    // 判斷是否為橫向
    if (width > height || (width === height && width > 1366)) {
        body.classList.add('horizontal-layout');
    } else {
        body.classList.add('vertical-layout');
    }

    resizeCanvas();
    console.log('width & height changed:' + width + 'x' + height);
}
