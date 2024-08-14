const canvas4PixelSize = 64;
const canvas4PixelBorder = 2;

let nonogramWidth = 1;
let nonogramHeight = 1;
let numColors = 1;

let imageColorsMap = new Map();
let imageColorsArr = new Array();
let colorsArr = new Array();
let isBackgroundColor = new Array();
let pixelsArr = new Array();

let drawingCanvas4 = false;

function updateNonogramSize(e, increment, dim) {
	if (e.ctrlKey) {
		increment *= 10;
	} else if (e.shiftKey) {
		increment *= 5;
	}

	if (dim == 0) {
		let t = nonogramHeight + increment;
		nonogramHeight = Math.min(Math.max(t, 1), document.querySelector('#canvas-2').height);
		document.querySelector('#nonogram-height').innerText = nonogramHeight;
	} else if (dim == 1) {
		let t = nonogramWidth + increment;
		nonogramWidth = Math.min(Math.max(t, 1), document.querySelector('#canvas-2').width);
		document.querySelector('#nonogram-width').innerText = nonogramWidth;
	}
}

function updateNumColors(e, increment) {
	if (e.ctrlKey) {
		increment *= 10;
	} else if (e.shiftKey) {
		increment *= 5;
	}

	let t = numColors + increment;
	numColors = Math.min(Math.max(t, 1), Object.keys(imageColorsMap).length);
	document.querySelector('#nonogram-colors').innerText = numColors;
}

function resetNonogramSettings() {
	nonogramHeight = 1;
	nonogramWidth = 1;
	document.querySelector('#nonogram-height').innerText = nonogramHeight;
	document.querySelector('#nonogram-width').innerText = nonogramWidth;
}

async function downsample() {
	document.querySelector('#nonogram-settings-section').classList.add('concealed');

	numColors = 1;
	document.querySelector('#nonogram-colors').innerText = numColors;

	let consoleDiv = document.querySelector('#nonogram-console');
	Utils.clearDiv(consoleDiv);

	await printToConsole(consoleDiv, 'Downsampling...');

	let canvas2 = document.querySelector('#canvas-2');
	let canvas3 = document.querySelector('#canvas-3');
	canvas3.height = nonogramHeight;
	canvas3.width = nonogramWidth;

	if (canvas3.width > canvas3.height) {
		canvas3.style.height = 'auto';
		canvas3.style.width = '240px';
	} else {
		canvas3.style.height = '240px';
		canvas3.style.width = 'auto';
	}

	let ctx2 = canvas2.getContext('2d');
	let imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
	let data2 = imageData2.data;

	let ctx3 = canvas3.getContext('2d');
	let imageData3 = ctx3.createImageData(canvas3.width, canvas3.height);
	let data3 = imageData3.data;

	let iInc = canvas2.height / canvas3.height;
	let jInc = canvas2.width / canvas3.width;

	imageColorsMap = new Map();
	imageColorsArr = new Array(canvas3.width * canvas3.height);

	for (let i = 0; i < canvas3.height; i++) {
		for (let j = 0; j < canvas3.width; j++) {
			let iStart = Math.ceil(iInc * i);
			let iStop = Math.min(Math.ceil(iInc * (i + 1)), canvas2.height);
			let jStart = Math.ceil(jInc * j);
			let jStop = Math.min(Math.ceil(jInc * (j + 1)), canvas2.width);
			let n = (iStop - iStart) * (jStop - jStart);

			let avg = [0, 0, 0];
			for (let i1 = iStart; i1 < iStop; i1++) {
				for (let j1 = jStart; j1 < jStop; j1++) {
					let pI = i1 * canvas2.width + j1;
					for (let k = 0; k < 3; k++) {
						avg[k] += data2[pI * 4 + k] / n;
					}
				}
			}

			let pI = i * canvas3.width + j;
			for (let k = 0; k < 3; k++) {
				data3[pI * 4 + k] = avg[k];
			}
			data3[pI * 4 + 3] = 255;

			imageColorsMap[[data3[pI * 4], data3[pI * 4 + 1], data3[pI * 4 + 2]]] = null;
			imageColorsArr[pI] = [data3[pI * 4], data3[pI * 4 + 1], data3[pI * 4 + 2]];
		}
	}

	let numColorsFound = Object.keys(imageColorsMap).length;
	await printToConsole(consoleDiv, 'Counted ' + numColorsFound + ' unique colors', 1);
	document.querySelector('#color-caption').innerText = '(' + numColorsFound + ' color' + (numColorsFound > 1 ? 's' : '') + ')';

	ctx3.putImageData(imageData3, 0, 0);

	document.querySelector('#nonogram-settings-section').classList.remove('concealed');

	if (document.querySelector('#colorizer-container').style.opacity == '0') {
		document.querySelector('#colorizer-container').style.pointerEvents = null;
		await Animate.animate(document.querySelector('#colorizer-container'), {anim: Animate.fadeIn , shiftFrom: DOWN, runTime: 200, runTimeOffset: 200, rateFunc: RateFuncs.easeOutCubic});
	}
}

async function generateNonogram() {
	let consoleDiv = document.querySelector('#nonogram-console');
	Utils.clearDiv(consoleDiv);

	document.querySelector('#nonogram-settings-section').classList.add('concealed');

	let colorsList = document.querySelector('#colors-list');
	Utils.clearDiv(colorsList);

	let canvas3 = document.querySelector('#canvas-3');
	let canvas4 = document.querySelector('#canvas-4');
	canvas4.height = canvas3.height * canvas4PixelSize;
	canvas4.width = canvas3.width * canvas4PixelSize;

	let ctx3 = canvas3.getContext('2d');
	let imageData3 = ctx3.getImageData(0, 0, canvas3.width, canvas3.height);
	let data3 = imageData3.data;

	let startTime = performance.now();

	if (document.querySelector('#blackwhite-checkbox').classList.contains('selected')) {
		await printToConsole(consoleDiv, 'Converting to black/white...');
		colorsArr = [[0, 0, 0], [255, 255, 255]];

		let invert = document.querySelector('#invert-checkbox').classList.contains('selected');
		for (let i = 0; i < data3.length; i += 4) {
			let rgb = Array.from(data3.slice(i, i + 3)).map(e => e / 255);
			let hsl = Colors.rgb2Hsl(...rgb);
			let l = hsl[2] * 100;
			if (invert) l = 100 - l;

			imageColorsMap[[data3[i], data3[i + 1], data3[i + 2]]] = (l < parseInt(document.querySelector('#grayscale-cutoff').value, 10)) ? 0 : 1;
		}
		await printToConsole(consoleDiv, 'Converted', 1);
	} else {
		let quantize;
		if (document.querySelector('#quantization').value == 'median-cut') {
			quantize = medianCut;
		} else if (document.querySelector('#quantization').value == 'k-means') {
			quantize = kMeans;
		} else {
			return;
		}

		await printToConsole(consoleDiv, 'Quantizing colors using ' + quantize.name + '...');
		await quantize();
	}

	pixelsArr = new Array(colorsArr.length).fill(0).map(_ => new Array());
	isBackgroundColor = new Array(colorsArr.length).fill(false);

	for (let i = 0; i < data3.length; i += 4) {
		let colorIdx = imageColorsMap[[data3[i], data3[i + 1], data3[i + 2]]];
		let x = Math.round(i / 4) % canvas3.width, y = Math.floor(Math.round(i / 4) / canvas3.width);
		pixelsArr[colorIdx].push([x, y]);
	}

	for (let i = 0; i < colorsArr.length; i++) {
		let div = document.createElement('div');
		div.style.backgroundColor = 'rgb(' + colorsArr[i].join(', ') + ')';
		div.style.color = Colors.whiteOrBlackText(colorsArr[i].join(' '));
		div.innerText = i;
		div.classList.add('content-container-vertical');
		div.title = '#' + colorsArr[i].map(e => Math.round(e).toString(16).padStart(2, '0')).join('') + '\n' + 'rgb(' + colorsArr[i].map(e => Math.round(e)).join(', ') + ')' + '\n' + pixelsArr[i].length + ' pixels';

		div.onclick = function() {
			isBackgroundColor[i] = !isBackgroundColor[i];
			if (isBackgroundColor[i]) div.classList.add('selected');
			else div.classList.remove('selected');

			drawCanvas4();
		};

		colorsList.appendChild(div);
	}

	let endTime = performance.now();
	await printToConsole(consoleDiv, 'Total execution time: ' + ((endTime - startTime) / 1000).toFixed(3) + 's');

	drawCanvas4();

	document.querySelector('#nonogram-settings-section').classList.remove('concealed');
}

async function medianCut() {
	let consoleDiv = document.querySelector('#nonogram-console');

	await printToConsole(consoleDiv, 'Generating buckets...', 0);

	let buckets = [imageColorsArr];
	await printToConsole(consoleDiv, buckets.length + '/' + numColors, 1, 'num-buckets');

	while (buckets.length < numColors) {
		let max_range_idx = 0, max_range_channel = 0, max_range = 0;

		for (let i = 0; i < buckets.length; i++) {
			let bucket = buckets[i];
			let min = [255, 255, 255], max = [0, 0, 0];
			for (let color of bucket) {
				for (let i = 0; i < 3; i++) {
					min[i] = Math.min(min[i], color[i]);
					max[i] = Math.max(max[i], color[i]);
				}
			}

			for (let j = 0; j < 3; j++) {
				if ((max[j] - min[j]) > max_range) {
					max_range_idx = i;
					max_range_channel = j;
					max_range = (max[j] - min[j]);
				}
			}
		}

		buckets[max_range_idx].sort((a, b) => a[max_range_channel] - b[max_range_channel]);
		let splitIdx = Math.floor(buckets[max_range_idx].length / 2);
		let first = buckets[max_range_idx].slice(0, splitIdx);
		let second = buckets[max_range_idx].slice(splitIdx);
		buckets.splice(max_range_idx, 1, first, second);
		await printToConsole(consoleDiv, buckets.length + '/' + numColors, 1, 'num-buckets');
	}

	colorsArr = buckets.map(e => getRGBMean(e));
	for (let i = 0; i < buckets.length; i++) {
		for (let color of buckets[i]) {
			imageColorsMap[color] = i;
		}
	}
}

async function kMeans() {
	let consoleDiv = document.querySelector('#nonogram-console');

	await printToConsole(consoleDiv, 'Generating initial centroids...', 0);

	let possibleCentroids = structuredClone(imageColorsArr);
	let centroids = [];

	let [c, idx] = Random.arrayChoice(possibleCentroids, 1, true, true);
	centroids.push(c[0]);
	possibleCentroids.splice(idx[0], 0);
	await printToConsole(consoleDiv, centroids.length + '/' + numColors, 1, 'num-centroids');

	while (centroids.length < numColors) {
		let s = 0;
		let d2 = possibleCentroids.map(e => {
			let min = -1;
			for (let centroid of centroids) {
				let d = MathUtils.vectorDistance(e, centroid);
				if (min == -1 || d < min) min = d;
			}
			s += min * min;
			return min * min;
		});
		d2 = d2.map(e => e / s);

		let s2 = 0;
		for (let d of d2) s2 += d;

		let [c2, idx2] = Random.arrayChoiceWeighted(possibleCentroids, d2, 1, true);
		centroids.push(c2[0]);
		possibleCentroids.splice(idx2[0], 0);

		await printToConsole(consoleDiv, centroids.length + '/' + numColors, 1, 'num-centroids');
	}

	let clusters = new Array(centroids.length).fill(0).map(e => new Array(0));

	await printToConsole(consoleDiv, 'Updating centroids...', 0);

	let converged = false;
	while (!converged) {
		clusters = new Array(centroids.length).fill(0).map(e => new Array(0));

		for (let color of imageColorsArr) {
			let min = -1, min_idx = -1;
			for (let i = 0; i < centroids.length; i++) {
				let d = MathUtils.vectorDistance(color, centroids[i]);
				if (min == -1 || d < min) {
					min = d;
					min_idx = i;
				}
			}

			clusters[min_idx].push(color);
		}

		converged = true;
		let dists = [];
		let WCSSSum = 0;
		for (let i = 0; i < centroids.length; i++) {
			let mean = [0, 0, 0];
			for (let point of clusters[i]) {
				for (let j = 0; j < 3; j++) mean[j] += point[j] / clusters[i].length;
			}
			if (MathUtils.vectorDistance(mean, centroids[i]) > 1e-5) converged = false;
			dists.push(MathUtils.vectorDistance(mean, centroids[i]));
			centroids[i] = mean;
			WCSSSum += dists[i];
		}

		await printToConsole(consoleDiv, 'Sum of WCSS: ' + WCSSSum.toExponential(2), 1, 'WCSS-sum');
	}

	await printToConsole(consoleDiv, 'Converged', 1);

	colorsArr = centroids;
	for (let i = 0; i < centroids.length; i++) {
		for (let color of clusters[i]) {
			imageColorsMap[color] = i;
		}
	}
}

function getRGBMean(arr) {
	let s = [0, 0, 0];
	for (let color of arr) {
		for (let i = 0; i < 3; i++) {
			s[i] += color[i] / arr.length;
		}
	}

	return s;
}

async function drawCanvas4() {
	if (drawingCanvas4) return;

	drawingCanvas4 = true;

	let consoleDiv = document.querySelector('#nonogram-console');

	await printToConsole(consoleDiv, 'Drawing...');

	let canvas3 = document.querySelector('#canvas-3');
	let canvas4 = document.querySelector('#canvas-4');
	canvas4.height = canvas3.height * canvas4PixelSize;
	canvas4.width = canvas3.width * canvas4PixelSize;

	let ctx3 = canvas3.getContext('2d');
	let imageData3 = ctx3.getImageData(0, 0, canvas3.width, canvas3.height);
	let data3 = imageData3.data;

	let ctx4 = canvas4.getContext('2d');

	ctx4.textAlign = 'center';
	ctx4.textBaseline = 'middle';
	ctx4.font = Math.round(canvas4PixelSize / 3) + 'px Proxima Nova';

	let numBackgroundPixels = 0;
	for (let i = 0; i < colorsArr.length; i++) {
		if (isBackgroundColor[i]) numBackgroundPixels += pixelsArr[i].length;
	}

	let backgroundColor = [0, 0, 0];
	let backgroundIndices = [];
	for (let i = 0; i < colorsArr.length; i++) {
		if (isBackgroundColor[i]) {
			backgroundIndices.push(i);
			for (let j = 0; j < 3; j++) {
				backgroundColor[j] += colorsArr[i][j] * pixelsArr[i].length / numBackgroundPixels;
			}
		}
	}

	if (backgroundIndices.length) {
		document.querySelector('#background-color-span').innerText = '(#' + backgroundColor.map(e => Math.round(e).toString(16).padStart(2, '0')).join('') + ')';
	} else {
		document.querySelector('#background-color-span').innerText = '';
	}

	let hsl = colorsArr.concat([backgroundColor]).map(color => Colors.rgb2Hsl(...color.map(e => e / 255)));
	let brighter = hsl.map(color => Colors.hsl2Rgb(color[0], color[1], Math.min(color[2] * 1.25, 1)).map(e => e * 255));
	let darker = hsl.map(color => Colors.hsl2Rgb(color[0], color[1], color[2] * 0.5).map(e => e * 255));

	for (let i = 0; i < pixelsArr.length; i++) {
		ctx4.beginPath();
		ctx4.fillStyle = 'rgb(' + (isBackgroundColor[i] ? backgroundColor : colorsArr[i]).join(', ') + ')';
		for (let j = 0; j < pixelsArr[i].length; j++) {
			ctx4.rect(pixelsArr[i][j][0] * canvas4PixelSize, pixelsArr[i][j][1] * canvas4PixelSize, canvas4PixelSize, canvas4PixelSize);
		}
		ctx4.fill();

		ctx4.beginPath();
		ctx4.fillStyle = 'rgb(' + darker[isBackgroundColor[i] ? darker.length - 1 : i].join(', ') + ')';
		for (let j = 0; j < pixelsArr[i].length; j++) {
			ctx4.rect(pixelsArr[i][j][0] * canvas4PixelSize, (pixelsArr[i][j][1] + 1) * canvas4PixelSize - canvas4PixelBorder, canvas4PixelSize, canvas4PixelBorder);
			ctx4.rect((pixelsArr[i][j][0] + 1) * canvas4PixelSize - canvas4PixelBorder, pixelsArr[i][j][1] * canvas4PixelSize, canvas4PixelBorder, canvas4PixelSize);
		}
		ctx4.fill();

		ctx4.beginPath();
		ctx4.fillStyle = 'rgb(' + brighter[isBackgroundColor[i] ? brighter.length - 1 : i].join(', ') + ')';
		for (let j = 0; j < pixelsArr[i].length; j++) {
			ctx4.rect(pixelsArr[i][j][0] * canvas4PixelSize, pixelsArr[i][j][1] * canvas4PixelSize, canvas4PixelSize, canvas4PixelBorder);
			ctx4.rect(pixelsArr[i][j][0] * canvas4PixelSize, pixelsArr[i][j][1] * canvas4PixelSize, canvas4PixelBorder, canvas4PixelSize);
		}
		ctx4.fill();

		await printToConsole(consoleDiv, 'Drawn ' + (i + 1) + '/' + pixelsArr.length + ' colors', 1, 'color-num');
	}

	if (document.querySelector('#gridline-checkbox').classList.contains('selected')) {
		ctx4.beginPath();
		ctx4.fillStyle = document.querySelector('#gridline-color-select').value;
		for (let i = 4; i < canvas3.height; i += 5) {
			for (let j = 4; j < canvas3.width; j += 5) {
				ctx4.rect((j + 1) * canvas4PixelSize - canvas4PixelBorder * 2, 0, canvas4PixelBorder * 2, canvas4.height);
				ctx4.rect(0, (i + 1) * canvas4PixelSize - canvas4PixelBorder * 2, canvas4.width, canvas4PixelBorder * 2);
			}
		}
		ctx4.fill();
	}

	for (let i = 0; i < data3.length; i += 4) {
		let colorIdx = imageColorsMap[[data3[i], data3[i + 1], data3[i + 2]]];

		if (!isBackgroundColor[colorIdx]) {
			let color = colorsArr[colorIdx];

			let x = (Math.round(i / 4) % canvas3.width) * canvas4PixelSize + Math.round(canvas4PixelSize / 2);
			let y = Math.floor(Math.round(i / 4) / canvas3.width) * canvas4PixelSize + Math.round(canvas4PixelSize / 2);

			ctx4.fillStyle = Colors.whiteOrBlackText(color.join(' '));
			ctx4.fillText(colorIdx, x, y);
		}
	}

	canvas4.onmousemove = function(e) {
		let bounding = canvas4.getBoundingClientRect();
		let x = (e.clientX - bounding.left) * canvas4.width / bounding.width;
		let y = (e.clientY - bounding.top) * canvas4.height / bounding.height;
		canvas4.title = 'x: ' + Math.floor(x / canvas4PixelSize) + '\n' + 'y: ' + Math.floor(y / canvas4PixelSize);
	};

	drawingCanvas4 = false;
}