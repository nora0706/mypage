window.addEventListener("load", function () {
  const bigCanvas = 280;
  const smallCanvas = 28


  let net = new brain.NeuralNetwork();
  fetch("js/network.json")
  .then(response => response.text())
  .then(result => net.fromJSON(JSON.parse(result)))
  .catch(error => console.log('error', error));

  canvas = document.getElementById("can");
  canvas.width = canvas.height = bigCanvas;
  const ctx = canvas.getContext("2d");

  canvas2 = document.getElementById("can2");
  canvas2.width = canvas2.height = smallCanvas;
  const ctx2 = canvas2.getContext("2d");

  let ratio = 10;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 15;
  let drawing = false;

  // Prevent scrolling when touching the canvas
  document.body.addEventListener("touchstart", function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  },  { passive: false });
  document.body.addEventListener("touchend", function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  },  { passive: false });
  document.body.addEventListener("touchmove", function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  },  { passive: false });
  
  canvas.onmousedown = canvas.ontouchstart = (e) => {
    drawing = true;
    ctx.fillStyle = ctx.createPattern(canvas, "no-repeat");
    const pos = position(e);
    ctx.beginPath();
    ctx.moveTo(pos[0], pos[1]);
    draw.apply(null, pos);
  };
  
  canvas.onmousemove = canvas.ontouchmove = (e) => draw.apply(null, position(e));
  function draw(x, y) {
    if (!drawing) {
      return;
    }
    ctx.clearRect(0, 0, bigCanvas, bigCanvas);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, bigCanvas, bigCanvas);
    ctx.restore();
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function subSample(oriX, oriY, ratio) {
    let imgd = ctx.getImageData(0, 0, oriX, oriY);
    let pix = imgd.data;
    let result = [];

    for (var i = 0; i < oriY; i += ratio) {
      for (var j = 0; j < oriX; j += ratio) {
        let sumR = (sumG = sumB = sumA = 0);
        for (var x = 0; x < ratio; x += 1) {
          for (var y = 0; y < ratio; y += 1) {
            sumR += pix[(i * oriX + j + x * oriX + y) * 4];
            sumG += pix[(i * oriX + j + x * oriX + y) * 4 + 1];
            sumB += pix[(i * oriX + j + x * oriX + y) * 4 + 2];
            sumA += pix[(i * oriX + j + x * oriX + y) * 4 + 3];
          }
        }

        let avgR = Math.round(sumR / (ratio * ratio));
        let avgG = Math.round(sumG / (ratio * ratio));
        let avgB = Math.round(sumB / (ratio * ratio));
        let avgA = Math.round(sumA / (ratio * ratio));
        result.push(...[avgR, avgG, avgB, avgA]);
      }
    }
    let result255 = Uint8ClampedArray.from(result);
    ctx2.putImageData(new ImageData(result255, oriX / ratio), 0, 0);
  }
  function check (){
    subSample(bigCanvas, bigCanvas, ratio);
    let imgd = ctx2.getImageData(0, 0, smallCanvas, smallCanvas);
    let pix = imgd.data;
    let result = [];
    for (var i = 0, n = pix.length; i < n; i += 4) {
      result.push((255*3-pix[i] + pix[i+1] + pix[i+2])*(pix[i+3]/255.0)/3.0/255.0);
    }
    const output = Array.from(net.run(result));
    console.log(output);
    let max = maxId = 0;
    for (let i = 0; i < output.length; i++){
      if (max < output[i]){
        max = output[i];
        maxId = i;
      }
      document.getElementById(`result-${i}`).innerHTML = (output[i]*100).toFixed(8);
      document.getElementById(`label-${i}`).classList.remove('highest');
    }
    document.getElementById(`label-${maxId}`).classList.add('highest');
    ctx.clearRect(0, 0, bigCanvas, bigCanvas);
  }
  function position(e) {
    let touch = e.touches;
    if (touch)
      return [touch[0].clientX - canvas.getBoundingClientRect().left, touch[0].clientY - canvas.getBoundingClientRect().top]
    return [e.offsetX, e.offsetY];
  }
  
  canvas.onmouseup = canvas.onmouseleave = canvas.ontouchend = (e) => (drawing = false);
  canvas.parentNode.querySelector("input[value='check']").onclick = (e) =>
    check();
  canvas.parentNode.querySelector("input[value='clear']").onclick = (e) =>
    ctx.clearRect(0, 0, bigCanvas, bigCanvas);
});
