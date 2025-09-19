const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a canvas with the dimensions of our favicon
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Create a rounded rectangle with gradient
ctx.beginPath();
ctx.roundRect(0, 0, 32, 32, 8);

// Create gradient
const gradient = ctx.createLinearGradient(0, 0, 32, 32);
gradient.addColorStop(0, '#ff7a00');
gradient.addColorStop(1, '#ff5500');
ctx.fillStyle = gradient;
ctx.fill();

// Add the "R" text
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = '#ffffff';
ctx.fillText('R', 16, 16);

// Add the shine at the bottom
ctx.beginPath();
ctx.moveTo(4, 22);
ctx.lineTo(28, 22);
ctx.bezierCurveTo(24, 28, 8, 28, 4, 22);
ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
ctx.fill();

// Save the PNG file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./favicon.png', buffer);

console.log('Favicon PNG generated successfully!');

/**
 * Note: To run this script, you'll need to install the canvas package:
 * npm install canvas
 * 
 * Then run:
 * node generate-favicon.js
 */ 