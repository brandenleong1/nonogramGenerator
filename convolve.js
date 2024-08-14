function printToConsole(consoleDiv, string, indents = 0, id = null) {
	return new Promise((resolve) => {
		let container;

		if (id) {
			if (document.querySelector('#' + id)) {
				container = document.querySelector('#' + id);
				Utils.clearDiv(container);
			} else {
				container = document.createElement('div');
				container.id = id;
			}
		} else {
			container = document.createElement('div');
		}

		container.classList.add('content-container-horizontal');

		for (let i = 0; i < indents; i++) {
			let indent = document.createElement('div');
			indent.classList.add('indent');
			if (i == indents - 1) indent.innerText = '⤷';
			container.appendChild(indent);
		}

		let div = document.createElement('div');
		div.innerText = string;
		container.appendChild(div);
		consoleDiv.appendChild(container);
		setTimeout(resolve, 0);
	});
}

async function convolveSelected() {
	let consoleDiv = document.querySelector('#convolution-console');

	document.querySelector('#kernel-editor-section').classList.add('concealed');
	document.querySelector('#kernel-settings-section').classList.add('concealed');

	let canvas = document.querySelector('#canvas');
	let canvas2 = document.querySelector('#canvas-2');
	canvas2.height = canvas.height;
	canvas2.width = canvas.width;

	if (document.querySelector('#convolution-section').style.opacity == '0') {
		await Animate.animate(document.querySelector('#convolution-section'), {anim: Animate.fadeIn , shiftFrom: UP, runTime: 200, runTimeOffset: 200, rateFunc: RateFuncs.easeOutCubic});
	}

	let funcStartTime = performance.now();

	let selected = Array.from(document.querySelectorAll('.kernel-item')).filter((e) => e.querySelector('.checkbox.selected') != null);

	Utils.clearDiv(consoleDiv);

	let ctx = canvas.getContext('2d');
	let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let data = imageData.data;

	let ctx2 = canvas2.getContext('2d', {willReadFrequently: true});
	let imageData2 = ctx2.createImageData(canvas.width, canvas.height);
	let data2 = imageData2.data;

	let bgColor = document.querySelector('#background-color-select').value;
	let [bgR, bgG, bgB] = [1, 3, 5].map(e => parseInt(bgColor.substr(e, 2), 16));

	for (let i = 0; i < data.length; i += 4) {
		let alpha = 1 - (data[i + 3] / 255);
		data2[i + 0] = Utils.lerp(data[i + 0], bgR, alpha);
		data2[i + 1] = Utils.lerp(data[i + 1], bgG, alpha);
		data2[i + 2] = Utils.lerp(data[i + 2], bgB, alpha);
		data2[i + 3] = 255;
	}
	ctx2.putImageData(imageData2, 0, 0);

	if (!selected.length) {
		await printToConsole(consoleDiv, 'No kernels convolved');
	}

	for (let e of selected) {
		let iterStartTime = performance.now();

		await printToConsole(consoleDiv, 'Processing ' + e.querySelector('.kernel-name').innerText + '...');

		if (e.kernel.length > canvas2.width || e.kernel[0].length > canvas2.height) {
			await printToConsole(consoleDiv, 'Kernel dimension must not be larger than image dimension!');
			if (e.kernel.length > canvas2.width) {
				await printToConsole(consoleDiv, e.kernel.length + ' > ' + canvas2.width + ' (dim 0)');
			} else {
				await printToConsole(consoleDiv, e.kernel[0].length + ' > ' + canvas2.height + ' (dim 0)');
			}
			document.querySelector('#kernel-editor-section').classList.remove('concealed');
			document.querySelector('#kernel-settings-section').classList.remove('concealed');
			return;
		} 

		imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
		data2 = imageData2.data;
		let dataR = data2Image(data2, 0, canvas2.height, canvas2.width);
		let dataG = data2Image(data2, 1, canvas2.height, canvas2.width);
		let dataB = data2Image(data2, 2, canvas2.height, canvas2.width);

		let kernel = structuredClone(e.kernel);
		if (e.normalized) {
			let s = getKernelInfo(e)[0];
			kernel = kernel.map((row) => row.map((e) => e / s));
		}

		let convolve = e.useFFT ? fftConvolve : slowConvolve;

		dataR = convolve(dataR, kernel, e.edgeHandling, parseInt(e.edgeColor.substr(1, 2), 16));
		dataG = convolve(dataG, kernel, e.edgeHandling, parseInt(e.edgeColor.substr(3, 2), 16));
		dataB = convolve(dataB, kernel, e.edgeHandling, parseInt(e.edgeColor.substr(5, 2), 16));

		if (e.negativeHandling == 'clip') {
			dataR = dataR.map((row) => row.map((e) => Math.min(Math.max(e, 0), 255)));
			dataG = dataG.map((row) => row.map((e) => Math.min(Math.max(e, 0), 255)));
			dataB = dataB.map((row) => row.map((e) => Math.min(Math.max(e, 0), 255)));
		} else if (e.negativeHandling == 'magnitude') {
			dataR = dataR.map((row) => row.map((e) => Math.min(Math.abs(e), 255)));
			dataG = dataG.map((row) => row.map((e) => Math.min(Math.abs(e), 255)));
			dataB = dataB.map((row) => row.map((e) => Math.min(Math.abs(e), 255)));
		} else {
			throw new TypeError('Invalid negativeHandling argument');
		}

		canvas2.height = dataR.length;
		canvas2.width = dataR[0].length;
		let newImageData = ctx2.createImageData(canvas2.width, canvas2.height);
		for (let i = 0; i < newImageData.data.length / 4; i++) {
			let [r, g, b] = [dataR, dataG, dataB].map(e => e[Math.floor(i / canvas.width)][i % canvas.width]);
			if (e.grayscale) {
				let y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
				newImageData.data[i * 4 + 0] = y;
				newImageData.data[i * 4 + 1] = y;
				newImageData.data[i * 4 + 2] = y;
			} else {
				newImageData.data[i * 4 + 0] = r;
				newImageData.data[i * 4 + 1] = g;
				newImageData.data[i * 4 + 2] = b;
			}
			newImageData.data[i * 4 + 3] = 255;
		}

		ctx2.putImageData(newImageData, 0, 0);

		let iterEndTime = performance.now();

		await printToConsole(consoleDiv, convolve.name + 'd (' + ((iterEndTime - iterStartTime) / 1000).toFixed(3) + 's)', 1);
	}

	let funcEndTime = performance.now();
	await printToConsole(consoleDiv, 'Total execution time: ' + ((funcEndTime - funcStartTime) / 1000).toFixed(3) + 's');

	document.querySelector('#kernel-editor-section').classList.remove('concealed');
	document.querySelector('#kernel-settings-section').classList.remove('concealed');

	if (document.querySelector('#nonogram-settings-section').style.opacity == '0') {
		document.querySelector('#nonogram-settings-section').style.pointerEvents = null;
		await Animate.animateGroup([
			[document.querySelector('#nonogram-settings-section'), Animate.fadeIn, {shiftFrom: UP, runTime: 200, rateFunc: RateFuncs.easeOutCubic}],
			[document.querySelector('#nonogram-section'), Animate.fadeIn, {shiftFrom: UP, runTime: 200, runTimeOffset: 200, rateFunc: RateFuncs.easeOutCubic}]
		]);
		// await Animate.animate(document.querySelector('#nonogram-settings-section'), {anim: Animate.fadeIn , shiftFrom: UP, runTime: 200, runTimeOffset: 200, rateFunc: RateFuncs.easeOutCubic});
	}

	resetNonogramSettings();
}

function data2Image(data, channelIdx, length_i, length_j) {
	let res = new Array(length_i).fill(0).map(() => new Array(length_j).fill(0));
	for (let i = 0; i < data.length / 4; i++) {
		let res_i = Math.floor(i / length_j), res_j = i % length_j;
		res[res_i][res_j] = data[i * 4 + channelIdx];
	}
	return res;
}

function padImage(image, length, type, constant = 0) {
	if (type == 'crop') return structuredClone(image);

	let img_i = image.length, img_j = image[0].length;
	let res = new Array(img_i + 2 * length).fill(0).map(() => new Array(img_j + 2 * length).fill(0));

	for (let i = -length; i < img_i + length; i++) {
		for (let j = -length; j < img_j + length; j++) {
			let res_i = i + length, res_j = j + length;

			if (i >= 0 && i < img_i && j >= 0 && j < img_j) {
				res[res_i][res_j] = image[i][j];
			} else if (type == 'extend') {
				res[res_i][res_j] = image[Math.min(Math.max(i, 0), img_i - 1)][Math.min(Math.max(j, 0), img_j - 1)];
			} else if (type == 'wrap') {
				res[res_i][res_j] = image[(i + img_i) % img_i][(j + img_j) % img_j];
			} else if (type == 'mirror') {
				res[res_i][res_j] = image[(i < 0) ? (-1 - i) : ((i >= img_i) ? (img_i - (i - (img_i - 1))) : i)][(j < 0) ? (-1 - j) : ((j >= img_j) ? (img_j - (j - (img_j - 1))) : j)];
			} else if (type == 'constant') {
				res[res_i][res_j] = constant;
			} else {
				throw new TypeError('Invalid type argument');
			}
		}
	}

	return res;
}

function slowConvolve(image, kernel, type, constant = 0) {
	let padLength = Math.floor(kernel.length / 2)
	let paddedImage = padImage(image, padLength, type, constant);

	let img_i = paddedImage.length, img_j = paddedImage[0].length;
	let ker_i = kernel.length, ker_j = kernel[0].length;
	let res_i = img_i - 2 * Math.floor(ker_i / 2), res_j = img_j - 2 * Math.floor(ker_j / 2)

	let res = new Array(res_i).fill(0).map(() => new Array(res_j).fill(0));

	for (let i = 0; i < res_i; i++) {
		for (let j = 0; j < res_j; j++) {
			let s = 0;

			for (let x = 0; x < ker_i; x++) {
				for (let y = 0; y < ker_j; y++) {
					s += paddedImage[i + x][j + y] * kernel[ker_i - 1 - x][ker_j - 1 - y];
				}
			}

			res[i][j] = s;
		}
	}

	return res;
}

function fft(arr) {
	while (Math.log2(arr.length) % 1 != 0) {
		arr.push(new Complex());
	}

	let n = arr.length;
	if (n == 1) return [arr[0]];

	let omega = 2 * Math.PI / n; // = e ^ (i * 2 * pi / n) = sin(2 * pi / n) + i cos(2 * pi / n)

	let arrE = new Array(n / 2), arrO = new Array(n / 2);
	for (let i = 0; i < n / 2; i++) {
		arrE[i] = arr[i * 2];
		arrO[i] = arr[i * 2 + 1];
	}

	let yE = fft(arrE), yO = fft(arrO);
	let y = new Array(n).fill(0);

	for (let i = 0; i < Math.floor(n / 2); i++) {
		let omegaRe = Math.cos(omega * i);
		let omegaIm = Math.sin(omega * i);
		let eOmega = new Complex(omegaRe, omegaIm);
		y[i] = Complex.add(yE[i], Complex.multiply(eOmega, yO[i]));
		y[i + Math.floor(n / 2)] = Complex.add(yE[i], Complex.multiply(eOmega, yO[i]).addInverse);
	}

	return y;
}

function ifft(arr) {
	function conjugate(array) {
		return array.map((e) => e.conjugate);
	}
	return conjugate(fft(conjugate(arr))).map((e) => Complex.multiply(e, 1 / arr.length));
}

function fft2d(arr) {
	let arrFFT1 = arr.map((e) => fft(e));
	let arrFFT2 = Utils.transpose2DArray(Utils.transpose2DArray(arrFFT1).map((e) => fft(e)));
	return arrFFT2;
}

function ifft2d(arr) {
	function conjugate(array) {
		return array.map((row) => row.map((e) => e.conjugate));
	}
	return conjugate(fft2d(conjugate(arr))).map((row) => {
		return row.map((e) => Complex.multiply(e, 1 / arr.length / arr[0].length));
	});
}

function padArrayWithZeros(arr, begin0, end0, begin1, end1) {
	let a = structuredClone(arr);

	for (let i = 0; i < a.length; i++) {
		a[i].unshift(...Array(begin1).fill(0));
		a[i].push(...Array(end1).fill(0));
	}
	a.unshift(...Array(begin0).fill(0).map(() => new Array(a[0].length).fill(0)));
	a.push(...Array(end0).fill(0).map(() => new Array(a[0].length).fill(0)));

	return a;
}

function fftConvolve(image, kernel, type, constant = 0) {
	let padLength = Math.floor(kernel.length / 2);

	let paddedImage = padImage(image, padLength, type, constant);
	let p_i = 1, p_j = 1;
	while (p_i < paddedImage.length) p_i *= 2;
	while (p_j < paddedImage[0].length) p_j *= 2;
	paddedImage = padArrayWithZeros(paddedImage, 0, p_i - paddedImage.length, 0, p_j - paddedImage[0].length);

	let img_i = paddedImage.length, img_j = paddedImage[0].length;
	let ker_i = kernel.length, ker_j = kernel[0].length;

	let pad0Low = Math.floor(img_i / 2) - Math.floor(ker_i / 2);
    let pad0High = img_i - ker_i - pad0Low;
    let pad1Low = Math.floor(img_j / 2) - Math.floor(ker_j / 2);
    let pad1High = img_j - ker_j - pad1Low;
	let paddedKernel = padArrayWithZeros(kernel, pad0Low, pad0High, pad1Low, pad1High);

	let pKer_i = paddedKernel.length, pKer_j = paddedKernel[0].length;
	let shiftedKernel = new Array(pKer_i).fill(0).map(() => new Array(pKer_j).fill(0));
	for (let i = 0; i < pKer_i; i++) {
		for (let j = 0; j < pKer_j; j++) {
			shiftedKernel[i][j] = paddedKernel[(Math.floor(pKer_i / 2) + i) % pKer_i][(Math.floor(pKer_j / 2) + j) % pKer_j];
		}
	}

	let imageComplex = paddedImage.map((row) => row.map((e) => new Complex(e)));
	let kernelComplex = shiftedKernel.map((row) => row.map((e) => new Complex(e)));

	let imageFFT = fft2d(imageComplex);
	let kernelFFT = fft2d(kernelComplex);

	let resFFT = new Array(img_i).fill(0).map((_, i) => {
		return new Array(img_j).fill(0).map((_, j) => {
			return Complex.multiply(imageFFT[i][j], kernelFFT[i][j]);
		});
	});

	let res = ifft2d(resFFT);

	res = res.slice(padLength, padLength + image.length).map((row) => row.slice(padLength, padLength + image[0].length));

	return res.map((row) => row.map((e) => e.Re));
	// return res.map((row) => row.map((e) => +e.Re.toFixed(2)));
}