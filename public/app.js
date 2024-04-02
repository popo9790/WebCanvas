// Canvas
var Canvas = document.getElementById("Canvas");
var Ctx = Canvas.getContext("2d");
var isDrawing = false;
const CanvasHeight = 800;
const CanvasWidth = 950;

// ToolState: [Brush, Eraser, Circle, Rectangle, Triangle, Text]
var ToolState;

// Brush and Eraser size
var BrushSize;
var EraserSize;

// Shape canvas
var shapeCanvas;
var shapeCtx;
var startCoor = { x: 0, y: 0 };
var curCoor = { x: 0, y: 0 };

// Brush color selector (implementing by canvas)
var ColorSelector = document.getElementById("ColorSelector");
var ColorSelectorCtx = ColorSelector.getContext("2d");
var BrushColor;
var SliderColor;
var cR, cG, cB;

// History of canvas
var CurIdx;
var CumulativePoints = [];

// Change the size of brush and eraser
{
  $("#BrushSize").on("input", function () {
    BrushSize = $(this).val();
    Ctx.lineWidth = BrushSize;
    EraserSize = BrushSize;
  });
}

// Change the color of brush (bug: two ways of gradient)
{
  $("#ColorR").on("input", function () {
    cR = $(this).val();
    SliderColor = "rgb(" + cR + ", " + cG + ", " + cB + ")";
    changePalette();
  });

  $("#ColorG").on("input", function () {
    cG = $(this).val();
    SliderColor = "rgb(" + cR + ", " + cG + ", " + cB + ")";
    changePalette();
  });

  $("#ColorB").on("input", function () {
    cB = $(this).val();
    SliderColor = "rgb(" + cR + ", " + cG + ", " + cB + ")";
    changePalette();
  });

  function changePalette() {
    var gradientMix = ColorSelectorCtx.createLinearGradient(
      0,
      0,
      ColorSelector.width,
      0
    );
    gradientMix.addColorStop(0, "white");
    gradientMix.addColorStop(0.5, SliderColor);

    ColorSelectorCtx.fillStyle = gradientMix;
    ColorSelectorCtx.fillRect(0, 0, ColorSelector.width, ColorSelector.height);

    gradientMix = ColorSelectorCtx.createLinearGradient(
      0,
      0,
      0,
      ColorSelector.height
    );
    gradientMix.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradientMix.addColorStop(1, "rgba(0, 0, 0, 1)");

    ColorSelectorCtx.fillStyle = gradientMix;
    ColorSelectorCtx.fillRect(0, 0, ColorSelector.width, ColorSelector.height);

    Ctx.strokeStyle = SliderColor;

    BrushColor = "rgb(" + cR + ", " + cG + ", " + cB + ")";
  }

  $("#ColorSelector").on("click", function (event) {
    const x = event.offsetX;
    const y = event.offsetY;
    const pixelData = ColorSelectorCtx.getImageData(x, y, 1, 1).data;
    BrushColor =
      "rgb(" + pixelData[0] + ", " + pixelData[1] + ", " + pixelData[2] + ")";
    console.log(BrushColor);

    Ctx.strokeStyle = BrushColor;
  });
}

// Change the ToolState and Cursor
{
  $("#NormalBrush").click(function () {
    ToolState = "Brush";
    $("#CanvasCursor").css("cursor", "url('./img/brush-cur.png') 10 30 , auto");
    console.log("Brush");
  });

  $("#Eraser").click(function () {
    ToolState = "Eraser";
    $("#CanvasCursor").css("cursor", "url('./img/eraser-cur.png') 10 20, auto");
    console.log("Eraser");
  });

  $("#CirBrush").click(function () {
    ToolState = "Circle";
    $("#CanvasCursor").css("cursor", "url('./img/circle-cur.png'), auto");
    console.log("Circle");
  });

  $("#TriBrush").click(function () {
    ToolState = "Triangle";
    $("#CanvasCursor").css("cursor", "url('./img/triangle-cur.png'), auto");
    console.log("Triangle");
  });

  $("#RectBrush").click(function () {
    ToolState = "Rectangle";
    $("#CanvasCursor").css("cursor", "url('./img/rectangle-cur.png'), auto");
    console.log("Rectangle");
  });

  $("#Text").click(function () {
    ToolState = "Text";
    $("#CanvasCursor").css("cursor", "url('./img/text-cur.png'), auto");
    console.log("Text");
  });
}

// Draw on canvas
{
  $("Canvas").on("mousedown", function (event) {
    if (ToolState === "Text") {
      Texting(event.clientX, event.clientY);
    } else {
      Ctx.lineJoin = "round";
      Ctx.lineCap = "round";

      isDrawing = true;

      startCoor = { x: event.clientX, y: event.clientY };
      Ctx.beginPath();
    }
  });

  $("Canvas").on("mousemove", function (event) {
    if (isDrawing) {
      var x = event.clientX - Canvas.offsetLeft;
      var y = event.clientY - Canvas.offsetTop;
      if (ToolState === "Brush") {
        Ctx.lineTo(x, y);
        Ctx.stroke();
      } else if (ToolState === "Eraser") {
        Ctx.clearRect(
          x - EraserSize / 2,
          y - EraserSize / 2,
          EraserSize,
          EraserSize
        );
      } else if (ToolState === "Circle") {
        createShapeCanvas(event.clientX, event.clientY);
        var center =
          shapeCanvas.height < shapeCanvas.width
            ? shapeCanvas.height
            : shapeCanvas.width;

        shapeCtx.beginPath();
        shapeCtx.arc(center / 2, center / 2, center / 2, 0, 2 * Math.PI);
        console.log(BrushColor);
        shapeCtx.fillStyle = BrushColor;
        shapeCtx.fill();
      } else if (ToolState === "Rectangle") {
        createShapeCanvas(event.clientX, event.clientY);

        shapeCtx.beginPath();
        shapeCtx.rect(0, 0, shapeCanvas.width, shapeCanvas.height);
        shapeCtx.fillStyle = BrushColor;
        shapeCtx.fill();
      } else if (ToolState === "Triangle") {
        createShapeCanvas(event.clientX, event.clientY);

        shapeCtx.beginPath();
        shapeCtx.moveTo(shapeCanvas.width / 2, 0);
        shapeCtx.lineTo(shapeCanvas.width, shapeCanvas.height);
        shapeCtx.lineTo(0, shapeCanvas.height);
        shapeCtx.closePath();
        shapeCtx.fillStyle = BrushColor;
        shapeCtx.fill();
      }
    } else {
      var tmpCanvas = document.getElementById("shapeCanvas");
      if (tmpCanvas != null) {
        Ctx.drawImage(tmpCanvas, startCoor.x, startCoor.y);
        $("#shapeCanvas").remove();

        CumulativePoints.splice(CurIdx + 1);
        CumulativePoints.push(
          Ctx.getImageData(0, 0, Canvas.width, Canvas.height)
        );
        CurIdx++;
      }
    }
  });

  $("Canvas").on("mouseup", function () {
    isDrawing = false;
    if (ToolState === "Brush" || ToolState === "Eraser") {
      if (CurIdx >= 0) CumulativePoints.splice(CurIdx + 1);
      CumulativePoints.push(
        Ctx.getImageData(0, 0, Canvas.width, Canvas.height)
      );
      CurIdx++;
    }
  });

  function createShapeCanvas(curX, curY) {
    $("#shapeCanvas").remove();
    shapeCanvas = document.createElement("canvas");
    shapeCtx = shapeCanvas.getContext("2d");

    var shapeX = curX - startCoor.x;
    var shapeY = curY - startCoor.y;

    $(shapeCanvas)
      .attr("width", shapeX)
      .attr("height", shapeY)
      .attr("id", "shapeCanvas")
      .css({
        "background-color": "transparent",
        position: "absolute",
        left: startCoor.x,
        top: startCoor.y,
        "z-index": "100",
      });

    $(shapeCanvas).appendTo("body");
  }
}

// Texting on canvas
{
  function Texting(cx, cy) {
    console.log("Texting");
    var TextInput = document.createElement("input");

    $(TextInput).attr("type", "text").attr("id", "TextInput").css({
      position: "absolute",
      left: cx,
      top: cy,
      "z-index": "100",
      background: "transparent",
    });

    $(TextInput).appendTo("body");
    $(TextInput).focus();

    $(TextInput).on("keydown", function (event) {
      if (event.which === 13 || event.keyCode === 13) {
        console.log("Text is done.");

        Ctx.font = $("#TextSize").val() + "px " + $("#TextFont").val();
        Ctx.fillText(
          TextInput.value,
          cx - Canvas.offsetLeft,
          cy - Canvas.offsetTop
        );
        $(TextInput).remove();

        if (CurIdx >= 0) CumulativePoints.splice(CurIdx + 1);
        CumulativePoints.push(
          Ctx.getImageData(0, 0, Canvas.width, Canvas.height)
        );
        CurIdx++;
      }
    });
  }
}

// Reset all canvas
{
  $("#Reset").on("click", function () {
    const TextBox = document.querySelectorAll("input[type='text']");
    TextBox.forEach((element) => {
      element.remove();
    });
    Ctx.clearRect(0, 0, Canvas.width, Canvas.height);

    Canvas.height = CanvasHeight;
    Canvas.width = CanvasWidth;
    Ctx.lineWidth = BrushSize;
    Ctx.strokeStyle = BrushColor;
    console.log("Canvas is cleared.");
  });
}

// Upload image
{
  $("#UploadBtn").on("click", function () {
    $("#Upload").click();
  });

  $("#Upload").on("change", function (event) {
    console.log("Upload");
    var Reader = new FileReader();
    Reader.onload = function (event) {
      var Img = new Image();
      Img.onload = function () {
        Ctx.clearRect(0, 0, Canvas.width, Canvas.height);
        Canvas.height = Img.height;
        Canvas.width = Img.width;
        Ctx.drawImage(Img, 0, 0);
      };
      Img.src = event.target.result;
    };
    Reader.readAsDataURL(event.target.files[0]);
  });
}

// Download image
{
  $("#DownloadBtn").on("click", function () {
    var tmpCanvas = document.createElement("canvas");
    var tmpCtx = tmpCanvas.getContext("2d");

    tmpCanvas.width = Canvas.width;
    tmpCanvas.height = Canvas.height;

    tmpCtx.fillStyle = "rgb(217, 217, 217)";
    tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

    tmpCtx.drawImage(Canvas, 0, 0);

    var ImgData = tmpCanvas.toDataURL("image/png");
    var Download = document.createElement("a");
    Download.href = ImgData;
    Download.download = "Canvas_download.png";

    Download.click();
    console.log("Download");
  });
}

// Undo and Redo
{
  $("#Redo").click(function () {
    console.log(CurIdx);
    if (CurIdx + 1 < CumulativePoints.length) {
      CurIdx++;
      Ctx.clearRect(0, 0, Canvas.width, Canvas.height);
      Ctx.putImageData(CumulativePoints[CurIdx], 0, 0);
    }
    console.log("Redo");
  });

  $("#Undo").click(function () {
    console.log(CurIdx);
    if (CurIdx > 0) {
      CurIdx--;
      Ctx.clearRect(0, 0, Canvas.width, Canvas.height);
      Ctx.putImageData(CumulativePoints[CurIdx], 0, 0);
      console.log("Undo");
    }
  });
}

// Windlow initialize
{
  $(window).on("load", function () {
    // Initialize color
    cR = $("#ColorR").val();
    cG = $("#ColorG").val();
    cB = $("#ColorB").val();
    BrushColor = "#000000";
    SliderColor = "rgb(" + cR + ", " + cG + ", " + cB + ")";
    changePalette();

    // Initialize ToolState
    ToolState = "Brush";

    // Initialize BrushSize and EraserSize
    BrushSize = $("#BrushSize").val();
    EraserSize = $("#BrushSize").val();

    // Initialize re/undo proproty
    CurIdx = 0;
    CumulativePoints = [];
    CumulativePoints.push(Ctx.getImageData(0, 0, Canvas.width, Canvas.height));
  });
}
