import './style.css'


// Get the canvas element and its context
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d', {
  willReadFrequently: true  // Optimizes for frequent pixel manipulation
});


window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Clear the canvas
ctx.clearRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);



function resizeCanvas() {
  // Make canvas fill viewport width
  canvas.style.width = '100vw';
  // Keep square ratio in display size
  canvas.style.height = '100vw';

  // Keep internal resolution fixed (let's say 500x500)
  canvas.width = 300;
  canvas.height = 300;

  // Remove any margins/spacing
  canvas.style.display = 'block';
  canvas.style.margin = '0';
}



function setSinglePixelColor(x, y, pixel, r, g, b) {
  const index = (y * canvas.width + x) * 4;
  pixel[index] = r;
  pixel[index + 1] = g;
  pixel[index + 2] = b;
  return pixel;
}

function drawOnIndices(pixels, indices, r, g, b) {
  for (let i = 0; i < indices.length; i++) {
    pixels[indices[i]] = r;
    pixels[indices[i] + 1] = g;
    pixels[indices[i] + 2] = b;
  }
  return pixels
}


class turmiteobj {
  constructor(turmite1, color) {
    this.posx = parseInt(turmite1.posy);
    this.posy = parseInt(turmite1.posx);
    this.rule = turmite1.rule;
    this.direction = turmite1.direction;
    this.state = turmite1.state;
    this.color = color;
    this.gradient = 0;


    /// temp slots
    this.newDirection = 0;
    this.colorOfField = 0;
  }

  getPixelColor(x, y, pixels) {
    const index = (y * canvas.width + x) * 4;
    return {
      r: pixels[index],
      g: pixels[index + 1],
      b: pixels[index + 2],
      a: pixels[index + 3]
    };
  }


  /// rewritten to support gradient pixels

  chooseDirection(pixels) {
    var stateOfField = this.getPixelColor(this.posx, this.posy, pixels).r;
    //console.log(stateOfField, this.state)
    if (stateOfField == 0 && this.state == 0) {
      //0 0 change mirrow
      this.colorOfField = this.rule[0] + this.rule[1];
      this.newDirection = this.rule[2] + this.rule[3];
      this.state = parseInt(this.rule[4] + this.rule[5]);

      // change me back later pleease
      // } else if (stateOfField == 255 && this.state == 0) {
    } else if (this.state == 0) {
      //1 0
      this.colorOfField = this.rule[6] + this.rule[7];
      this.newDirection = this.rule[8] + this.rule[9];
      this.state = parseInt(this.rule[10] + this.rule[11]);
      //console.log("rule:2");
    } else if (stateOfField == 0 && this.state == 1) {
      // 0 1
      this.colorOfField = this.rule[12] + this.rule[13];
      this.newDirection = this.rule[14] + this.rule[15];
      this.state = parseInt(this.rule[16] + this.rule[17]);
      //console.log("rule:3");
      // change me back later pleease
      // } else if (stateOfField == 255 && this.state == 1) {
    } else if (this.state == 1) {
      //11
      this.colorOfField = this.rule[18] + this.rule[19];
      this.newDirection = this.rule[20] + this.rule[21];
      this.state = parseInt(this.rule[22] + this.rule[23]);
      //console.log("rule:4");
    }
  }


  changeDirection() {
    //change direction
    if (this.newDirection == "02") {
      //console.log("changedirection:left")
      this.direction = (this.direction + 1) % 4; // +
    } else if (this.newDirection == "08") {
      //console.log("changedirection:right")
      this.direction = (this.direction - 1) % 4; // -
      if (this.direction < 0) {
        this.direction = 3;
      }
    } else if (this.newDirection == "04") {
      //console.log("changedirection:uturn")
      this.direction = (this.direction + 2) % 4;
    }
  }

  takeStep() {
    //console.log("_____")
    //console.log(this.direction)
    if (this.direction == 0) {
      // 0 2 3 1
      //console.log("move:left");
      this.posy = (this.posy + 1) % 300;
    } else if (this.direction == 2) {
      //console.log("move:right");
      if (this.posy == 0) {
        this.posy = 299;
      } else {
        this.posy = this.posy - 1;
      }
    } else if (this.direction == 3) {
      //console.log("move:up");
      this.posx = (this.posx + 1) % 300;
    } else if (this.direction == 1) {
      //console.log("move:down");
      if (this.posx == 0) {
        this.posx = 299;
      } else {
        this.posx = this.posx - 1;
      }
    }
  }

  setSinglePixelColor(x, y, pixel, r, g, b) {
    const index = (y * canvas.width + x) * 4;
    pixel[index] = r;
    pixel[index + 1] = g;
    pixel[index + 2] = b;
    return pixel;
  }

  newSetField(pixels) {
    //console.log("______")
    //console.log(this.colorOfField)
    //console.log("______")
    if (this.colorOfField == "ff") {
      /// change me back later please
      //return setSinglePixelColor(this.posx, this.posy, pixels, [40, 80, 150, 200, 250][Math.floor(this.gradient / 51.2)], 0, 0);
      return setSinglePixelColor(this.posx, this.posy, pixels, [40, 80, 150, 200, 250, 200, 150, 80][Math.floor(this.gradient / 32)], 0, 0)
    } else {
      return setSinglePixelColor(this.posx, this.posy, pixels, 0, 0, 0);
    }
  }

  step(pixels) {
    //console.log("GET HERE")
    this.chooseDirection(pixels);
    const newPixels = this.newSetField(pixels);
    this.changeDirection();
    this.takeStep();
    //this.gradient = (this.gradient + 1) % 256
    this.gradient = (this.gradient + 1) % 256;
    return newPixels
  }
}

class Cleaner {
  constructor(posx, posy) {
    this.posx = posx;
    this.posy = posy;
    this.gridSize = 300;
  }

  setSinglePixelColor(x, y, pixel, r, g, b) {
    const index = (y * canvas.width + x) * 4;
    pixel[index] = r;
    pixel[index + 1] = g;
    pixel[index + 2] = b;
    return pixel;
  }

  move() {
    // Random direction: 0 = up, 1 = right, 2 = down, 3 = left
    const direction = Math.floor(Math.random() * 4);

    switch (direction) {
      case 0: // up
        //this.posy = (this.posy - 1 + this.gridSize) % this.gridSize;
        break;
      case 1: // right
        this.posx = (this.posx - 25) % this.gridSize;
        break;
      case 2: // down
        //this.posy = (this.posy + 1) % this.gridSize;
        break;
      case 3: // left
        this.posx = (this.posx - 1 + this.gridSize) % this.gridSize;
        break;
    }
  }

  drawAllArround(x, y) {
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, 1, 300)

  }

  step() {
    this.move();
    this.drawAllArround(this.posx, this.posy);
  }

}

class PixelPusher {
  constructor(area, direction, steps) {
    this.steps = steps
    this.currentSteps = 0;
    this.direction = direction;
    // area is  {x1, y1, x2, y2}
    this.area = area;
  }


  shiftRectangleLeft(pixels, canvasWidth) {
    const newPixels = new Uint8ClampedArray(pixels);
    const startX = Math.min(this.area.x1, this.area.x2);
    const endX = Math.max(this.area.x1, this.area.x2);
    const startY = Math.min(this.area.y1, this.area.y2);
    const endY = Math.max(this.area.y1, this.area.y2);

    for (let y = startY; y < endY; y++) {
      const rowStart = (y * canvasWidth + startX) * 4;
      const temp = [
        newPixels[rowStart],
        newPixels[rowStart + 1],
        newPixels[rowStart + 2],
        newPixels[rowStart + 3]
      ];

      for (let x = startX; x < endX - 1; x++) {
        const currentIndex = (y * canvasWidth + x) * 4;
        const nextIndex = currentIndex + 4;
        for (let i = 0; i < 4; i++) {
          newPixels[currentIndex + i] = newPixels[nextIndex + i];
        }
      }

      const lastIndex = (y * canvasWidth + endX - 1) * 4;
      for (let i = 0; i < 4; i++) {
        newPixels[lastIndex + i] = temp[i];
      }
    }

    return { pixels: newPixels, width: canvasWidth, height: pixels.length / (4 * canvasWidth) };
  }

  shiftRectangleRight(pixels, canvasWidth) {
    const newPixels = new Uint8ClampedArray(pixels);
    const startX = Math.min(this.area.x1, this.area.x2);
    const endX = Math.max(this.area.x1, this.area.x2);
    const startY = Math.min(this.area.y1, this.area.y2);
    const endY = Math.max(this.area.y1, this.area.y2);

    for (let y = startY; y < endY; y++) {
      // Save last pixel instead of first for right shift
      const lastIndex = (y * canvasWidth + endX - 1) * 4;
      const temp = [
        newPixels[lastIndex],
        newPixels[lastIndex + 1],
        newPixels[lastIndex + 2],
        newPixels[lastIndex + 3]
      ];

      for (let x = endX - 1; x > startX; x--) {
        const currentIndex = (y * canvasWidth + x) * 4;
        const prevIndex = currentIndex - 4;
        for (let i = 0; i < 4; i++) {
          newPixels[currentIndex + i] = newPixels[prevIndex + i];
        }
      }

      // Put saved pixel at start
      const firstIndex = (y * canvasWidth + startX) * 4;
      for (let i = 0; i < 4; i++) {
        newPixels[firstIndex + i] = temp[i];
      }
    }

    return { pixels: newPixels, width: canvasWidth, height: pixels.length / (4 * canvasWidth) };
  }

  shiftRectangleUp(pixels, canvasWidth) {
    const newPixels = new Uint8ClampedArray(pixels);
    const startX = Math.min(this.area.x1, this.area.x2);
    const endX = Math.max(this.area.x1, this.area.x2);
    const startY = Math.min(this.area.y1, this.area.y2);
    const endY = Math.max(this.area.y1, this.area.y2);

    for (let x = startX; x < endX; x++) {
      const colStart = (startY * canvasWidth + x) * 4;
      const temp = [
        newPixels[colStart],
        newPixels[colStart + 1],
        newPixels[colStart + 2],
        newPixels[colStart + 3]
      ];

      for (let y = startY; y < endY - 1; y++) {
        const currentIndex = (y * canvasWidth + x) * 4;
        const nextIndex = ((y + 1) * canvasWidth + x) * 4;
        for (let i = 0; i < 4; i++) {
          newPixels[currentIndex + i] = newPixels[nextIndex + i];
        }
      }

      const lastIndex = ((endY - 1) * canvasWidth + x) * 4;
      for (let i = 0; i < 4; i++) {
        newPixels[lastIndex + i] = temp[i];
      }
    }

    return { pixels: newPixels, width: canvasWidth, height: pixels.length / (4 * canvasWidth) };
  }

  shiftRectangleDown(pixels, canvasWidth) {
    const newPixels = new Uint8ClampedArray(pixels);
    const startX = Math.min(this.area.x1, this.area.x2);
    const endX = Math.max(this.area.x1, this.area.x2);
    const startY = Math.min(this.area.y1, this.area.y2);
    const endY = Math.max(this.area.y1, this.area.y2);

    for (let x = startX; x < endX; x++) {
      // Save bottom pixel instead of top for down shift
      const bottomIndex = ((endY - 1) * canvasWidth + x) * 4;
      const temp = [
        newPixels[bottomIndex],
        newPixels[bottomIndex + 1],
        newPixels[bottomIndex + 2],
        newPixels[bottomIndex + 3]
      ];

      for (let y = endY - 1; y > startY; y--) {
        const currentIndex = (y * canvasWidth + x) * 4;
        const prevIndex = ((y - 1) * canvasWidth + x) * 4;
        for (let i = 0; i < 4; i++) {
          newPixels[currentIndex + i] = newPixels[prevIndex + i];
        }
      }

      // Put saved pixel at top
      const topIndex = (startY * canvasWidth + x) * 4;
      for (let i = 0; i < 4; i++) {
        newPixels[topIndex + i] = temp[i];
      }
    }

    return { pixels: newPixels, width: canvasWidth, height: pixels.length / (4 * canvasWidth) };
  }


  shift(pixels, canvasWidth) {
    this.currentSteps = this.currentSteps + 1;
    switch (this.direction) {
      case 'left': return this.shiftRectangleLeft(pixels, canvasWidth);
      case 'right': return this.shiftRectangleRight(pixels, canvasWidth);
      case 'up': return this.shiftRectangleUp(pixels, canvasWidth);
      case 'down': return this.shiftRectangleDown(pixels, canvasWidth);
      default: return this.shiftRectangleLeft(pixels, canvasWidth);
    }
  }
}



function getRectangleIndices(canvasWidth, x1, y1, x2, y2) {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);

  // Returns array of indices that make up the rectangle
  const indices = [];

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const index = (y * canvasWidth + x) * 4;
      indices.push(index); // R index
    }
  }

  return indices;
}

function generateRandomRectangles(canvas, count, minSize = 2, maxSize = 60) {
  const rectangles = [];

  for (let i = 0; i < count; i++) {
    // Generate random starting point
    const x1 = Math.floor(Math.random() * (canvas.width - maxSize));
    const y1 = Math.floor(Math.random() * (canvas.height - maxSize));

    // Generate random width and height between min and max size
    const width = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
    const height = Math.floor(Math.random() * (maxSize - minSize)) + minSize;

    // Ensure we don't exceed canvas bounds
    const x2 = Math.min(x1 + width, canvas.width);
    const y2 = Math.min(y1 + height, canvas.height);

    rectangles.push({
      x1,
      y1,
      x2,
      y2
    });
  }

  return rectangles;
}

/// svg convert function here

function redBlackCanvasToSVG(canvas) {
  const width = canvas.width;
  const height = canvas.height;

  // Create SVG element with black background
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add black background
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', width);
  background.setAttribute('height', height);
  background.setAttribute('x', 0);
  background.setAttribute('y', 0);
  background.setAttribute('fill', 'black');
  svg.appendChild(background);

  // Get canvas image data
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Check for red pixels and add them to SVG
  // Red is roughly (255, 0, 0) in RGB
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      // Check if pixel is red (allowing some tolerance)
      if (r > 0) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', 1);
        rect.setAttribute('height', 1);
        rect.setAttribute('fill', `rgb(${r}, ${g}, ${b})`);
        svg.appendChild(rect);
      }
    }
  }

  // Convert SVG to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);

  return svgString;
}


function exportAndDownloadSVG(canvas, writefunction) {
  const svgString = writefunction(canvas);

  // Create a Blob from the SVG string
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  // Create a temporary link element
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'cipher.svg'; // Name of the downloaded file
  downloadLink.style.display = 'none';     // Hide the link
  document.body.appendChild(downloadLink);

  // Trigger download and clean up
  downloadLink.click();                    // Automatically start download

  // Clean up: remove link and revoke object URL after download starts
  setTimeout(() => {
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }, 100);
}



function main(turmites) {
  var pixelPusher = [];
  //var turmites = [];

  var lastTurmiteUpdate = 0;
  var lastPusherUpdate = 0;
  var lastCleanerUpdate = 0;

  // 1
  const TURMITE_INTERVAL = 1;    // Update every 50ms (faster)
  // 100
  const PUSHER_INTERVAL = 100;    // Update every 200ms (slower)
  //20
  const CLEANER_INTERVAL = 15;
  //50
  const RECTANGLE_PUSHER_NUMBER = 30;

  //"ff0401000801ff0001000200"

  // the classic 
  // const turmiteData1 = { posx: 100, posy: 30, rule: "ff0800000801000400000400", state: 0, direction: 1 };
  // const turmiteobj1 = new turmiteobj(turmiteData1, "red");
  // const turmiteData2 = { posx: 30, posy: 100, rule: "ff0800000801000400000400", state: 0, direction: 0 };
  // const turmiteobj2 = new turmiteobj(turmiteData2, "red");
  // const turmiteData3 = { posx: 200, posy: 30, rule: "ff0800000801000400000400", state: 0, direction: 1 };
  // const turmiteobj3 = new turmiteobj(turmiteData3, "red");
  // const turmiteData4 = { posx: 200, posy: 200, rule: "ff0800000801000400000400", state: 0, direction: 1 };
  // const turmiteobj4 = new turmiteobj(turmiteData4, "red");


  // const turmiteData5 = { posx: 100, posy: 30, rule: "ff0401000801ff0001000200", state: 0, direction: 1 };
  // const turmiteobj5 = new turmiteobj(turmiteData5, "red");
  // const turmiteData6 = { posx: 30, posy: 100, rule: "ff0800ff0001ff0000000201", state: 0, direction: 1 };
  // const turmiteobj6 = new turmiteobj(turmiteData6, "red");
  // const turmiteData7 = { posx: 200, posy: 30, rule: "ff0401000801ff0001000200", state: 0, direction: 1 };
  // const turmiteobj7 = new turmiteobj(turmiteData7, "red");
  // const turmiteData8 = { posx: 200, posy: 200, rule: "ff0800ff0001ff0000000201", state: 0, direction: 1 };
  // const turmiteobj8 = new turmiteobj(turmiteData8, "red");
  // turmites.push(turmiteobj1, turmiteobj2, turmiteobj3, turmiteobj4, turmiteobj5, turmiteobj6, turmiteobj7, turmiteobj8)

  const newcleaner = new Cleaner(150, 0);


  var listofSelections = generateRandomRectangles(canvas, RECTANGLE_PUSHER_NUMBER);
  var choice = ["up", "down", "left", "right"];

  listofSelections.forEach(rect => {
    const pusher = new PixelPusher(rect, choice[Math.floor(Math.random() * choice.length)], 70);
    pixelPusher.push(pusher);
  });

  function animate(timestamp) {
    //console.log(timestamp)
    // if (timestamp > 35000 & timestamp < 35020) {
    //   console.log("geth ehr")
    //   exportAndDownloadSVG(canvas, redBlackCanvasToSVG);
    //   //console.log(exportSVG);

    // }


    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let currentPixels = imageData.data;

    // Turmite updates more frequently
    if (timestamp - lastTurmiteUpdate > TURMITE_INTERVAL) {
      turmites.forEach(turmite => {
        currentPixels = turmite.step(currentPixels);
      })
      lastTurmiteUpdate = timestamp;
    }

    // Pixel pushers update less frequently
    if (timestamp - lastPusherUpdate > PUSHER_INTERVAL) {
      pixelPusher = pixelPusher.filter(pusher => {
        return pusher.currentSteps < pusher.steps;
      });

      if (pixelPusher.length == 0) {
        var listofSelections = generateRandomRectangles(canvas, RECTANGLE_PUSHER_NUMBER);
        var choice = ["up", "down", "left", "right"];
        var choice2 = [2, 20, 30, 40];
        //console.log("get here")

        listofSelections.forEach(rect => {
          // You can create a PixelPusher for each rectangle
          const pusher = new PixelPusher(rect, choice[Math.floor(Math.random() * choice.length)], choice2[Math.floor(Math.random() * choice2.length)]);
          pixelPusher.push(pusher)
        });
      }
      pixelPusher.forEach(pusher => {
        const result = pusher.shift(currentPixels, canvas.width);
        currentPixels = result.pixels;
      });
      lastPusherUpdate = timestamp;
    }


    imageData.data.set(currentPixels);
    ctx.putImageData(imageData, 0, 0);

    if (timestamp - lastCleanerUpdate > CLEANER_INTERVAL) {
      newcleaner.step(currentPixels);
      lastCleanerUpdate = timestamp;

    }
    requestAnimationFrame(animate);
  }

  // Start the animation
  animate();
}

const builders = ["ff0800ff0201ff0800000001", "ff0801000200000800ff0800", "ff0801000200000800ff0800", "ff0201000201ff0400000000", "ff0201000801ff0000000000", "ff0201000800ff0000000801", "ff0001000001ff0801000000", "ff0001000201ff0000000800"]

const crawler = ["ff0000ff0801000000000200", "ff0000ff0801000201000000", "ff0000ff0801000201000200", "ff0000ff0801ff0400000200", "ff0001000200000200000200", "ff0001000200000200ff0000", "ff0001000801ff0000ff0200", "ff0001ff0201ff0000ff0800"]

var allturmites = [];

for (var a = 0; a < 15; a++) {
  var gene = builders[Math.floor(Math.random() * builders.length)];
  const turmiteData = { posx: Math.floor(Math.random() * 300), posy: Math.floor(Math.random() * 300), rule: gene, state: 0, direction: 1 };
  const turmiteobjNew = new turmiteobj(turmiteData, "red");
  allturmites.push(turmiteobjNew)
}

for (var a = 0; a < 5; a++) {
  var gene = crawler[Math.floor(Math.random() * crawler.length)];
  const turmiteData = { posx: Math.floor(Math.random() * 300), posy: Math.floor(Math.random() * 300), rule: gene, state: 0, direction: 1 };
  const turmiteobjNew = new turmiteobj(turmiteData, "red");
  allturmites.push(turmiteobjNew)
}


// Start the animation
main(allturmites);

