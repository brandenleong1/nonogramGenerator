let kernelNumber = 1;
let currKernel = null;

function addKernel() {
	let list = document.querySelector('#kernel-list');
	let div = document.createElement('div');
	div.classList.add('content-container-horizontal', 'kernel-item');
	div.kernel = new Array(3).fill(0).map(() => new Array(3).fill(0));
	div.kernel[1][1] = 1;
	div.normalized = false;
	div.edgeHandling = 'extend';
	div.negativeHandling = 'clip';
	div.edgeColor = '#000000';
	div.useFFT = false;
	div.grayscale = false;

	let checkbox = document.createElement('div');
	checkbox.classList.add('checkbox', 'selected');
	checkbox.onclick = function() {
		checkbox.classList.toggle('selected');
	};

	let name = document.createElement('div');
	name.classList.add('kernel-name');
	name.innerText = 'Kernel ' + kernelNumber;
	name.setAttribute('placeHolder', 'Kernel ' + kernelNumber);
	name.contentEditable = true;

	let removeBtn = document.createElement('div');
	removeBtn.classList.add('button-positive-2');
	removeBtn.style.display = 'flex';
	removeBtn.innerHTML = '<svg width="10" height="10" style="fill: var(--color_btn);"><path d="M 0 4 H 10 V 6 H 0 V 4"></path></svg>';
	removeBtn.onclick = function() {
		if (currKernel == div) editKernel(null);
		div.remove();
	};

	let editBtn = document.createElement('div');
	editBtn.classList.add('button-positive-2');
	editBtn.style.display = 'flex';
	editBtn.style.lineHeight = '10px';
	editBtn.innerText = '✎';
	editBtn.onclick = function() {
		if (currKernel == div) editKernel(null);
		else editKernel(div);
	};

	div.appendChild(checkbox);
	div.appendChild(name);
	div.appendChild(editBtn);
	div.appendChild(removeBtn);
	list.appendChild(div);

	list.scrollTop = list.scrollHeight;

	kernelNumber++;
}

function clearKernelEditor() {
	document.querySelector('#kernel-size').innerText = 0;
	let editor = document.querySelector('#kernel-editor');
	while (editor.children.length) {
		editor.children[0].remove();
	}

	let d = document.querySelector('.kernel-item.selected');
	if (d) d.classList.remove('selected');

	document.querySelector('#normalize-checkbox').classList.remove('selected');
}

function updateKernelSettingsInfo() {
	if (currKernel) {
		let info = getKernelInfo(currKernel);

		document.querySelector('#kernel-size').innerText = currKernel.kernel.length;
		if (currKernel.normalized) document.querySelector('#normalize-checkbox').classList.add('selected');
		else document.querySelector('#normalize-checkbox').classList.remove('selected');
		document.querySelector('#kernel-sum').innerText = +info[0].toFixed(4);
		document.querySelector('#kernel-max').innerText = +info[1].toFixed(4);
		document.querySelector('#kernel-min').innerText = +info[2].toFixed(4);
		document.querySelector('#edge-handling').value = currKernel.edgeHandling;
		if (currKernel.edgeHandling == 'constant') {
			document.querySelector('#constant-color-select').style.display = 'flex';
		} else {
			document.querySelector('#constant-color-select').style.display = 'none';
		}
		document.querySelector('#constant-color-select input[type=color]').value = currKernel.edgeColor;
		document.querySelector('#negative-handling').value = currKernel.negativeHandling;
		if (currKernel.useFFT) document.querySelector('#fft-checkbox').classList.add('selected');
		else document.querySelector('#fft-checkbox').classList.remove('selected');
		if (currKernel.grayscale) document.querySelector('#grayscale-output-checkbox').classList.add('selected');
		else document.querySelector('#grayscale-output-checkbox').classList.remove('selected');

		let canvas = document.querySelector('#kernel-visualizer');
		let ctx = canvas.getContext('2d');
		canvas.width = currKernel.kernel.length;
		canvas.height = currKernel.kernel.length;
		let imageData = ctx.createImageData(canvas.width, canvas.height);
		let data = imageData.data;

		let absMax = Math.max(Math.abs(info[1]), Math.abs(info[2]))
		for (let i = 0; i < currKernel.kernel.length; i++) {
			for (let j = 0; j < currKernel.kernel.length; j++) {
				let idx = (i * currKernel.kernel.length + j) * 4;
				data[idx] = Math.max(-currKernel.kernel[i][j], 0) / absMax * 255;
				data[idx + 1] = Math.max(currKernel.kernel[i][j], 0) / absMax * 255;
				data[idx + 2] = 0;
				data[idx + 3] = 255;
			}
		}

		ctx.putImageData(imageData, 0, 0);
	} else {
		document.querySelector('#kernel-size').innerText = 0;
		document.querySelector('#normalize-checkbox').classList.remove('selected');
		document.querySelector('#kernel-sum').innerText = 0;
		document.querySelector('#kernel-max').innerText = 0;
		document.querySelector('#kernel-min').innerText = 0;
		document.querySelector('#edge-handling').value = 'extend';
		document.querySelector('#constant-color-select').style.display = 'none';
		document.querySelector('#constant-color-select input[type=color]').value = '#000000';
		document.querySelector('#negative-handling').value = 'clip';
		document.querySelector('#fft-checkbox').classList.remove('selected');
		document.querySelector('#grayscale-output-checkbox').classList.remove('selected');

		let canvas = document.querySelector('#kernel-visualizer');
		canvas.width = 1;
		canvas.height = 1;
	}
}
function editKernel(kernel) {
	currKernel = kernel;

	clearKernelEditor();
	updateKernelSettingsInfo();

	if (kernel) {
		let editor = document.querySelector('#kernel-editor');
		editor.style.gridTemplateRows = 'repeat(' + kernel.kernel.length + ', 40px)';
		editor.style.gridTemplateColumns = 'repeat(' + kernel.kernel.length + ', 80px)';
		for (let i = 0; i < kernel.kernel.length; i++) {
			for (let j = 0; j < kernel.kernel.length; j++) {
				let div = document.createElement('div');
				div.classList.add('kernel-cell');
				div.style.gridRow = i + 1;
				div.style.gridColumn = j + 1;

				if (i == Math.floor(kernel.kernel.length / 2) && j == Math.floor(kernel.kernel.length / 2)) {
					div.classList.add('kernel-center');
				}

				let inner = document.createElement('input');
				inner.type = 'number';
				inner.step = 'any';
				inner.placeholder = 0;
				inner.value = kernel.kernel[i][j];
				inner.kernelID = i + '-' + j;
				inner.onchange = function() {
					kernel.kernel[i][j] = parseFloat(inner.value || 0);
					updateKernelSettingsInfo();
				};

				div.appendChild(inner);
				editor.appendChild(div);
			}
		}

		for (let i = 0; i < kernel.kernel.length; i++) {
			let div_c = document.createElement('div');
			div_c.classList.add('kernel-cell-label');
			div_c.innerText = i + 1;
			div_c.style.gridRow = kernel.kernel.length;
			div_c.style.gridColumn = i + 1;

			let div_r = document.createElement('div');
			div_r.classList.add('kernel-cell-label');
			div_r.innerText = i + 1;
			div_r.style.gridRow = i + 1;
			div_r.style.gridColumn = kernel.kernel.length;

			editor.appendChild(div_c);
			if (i != kernel.kernel.length) editor.appendChild(div_r);
		}

		kernel.classList.add('selected');
	}
}

function updateKernelSize(increment) {
	if (currKernel) {
		if (currKernel.kernel.length + increment > 0) {

			if (increment > 0) {
				for (let iter = 0; iter < increment / 2; iter++) {
					for (let i = 0; i < currKernel.kernel.length; i++) {
						currKernel.kernel[i].unshift(0);
						currKernel.kernel[i].push(0);
					}
					currKernel.kernel.unshift(new Array(currKernel.kernel[0].length).fill(0));
					currKernel.kernel.push(new Array(currKernel.kernel[0].length).fill(0));
				}
			} else {
				for (let iter = 0; iter < -increment / 2; iter++) {
					currKernel.kernel.splice(0, 1);
					currKernel.kernel.splice(currKernel.kernel.length - 1, 1);
					for (let i = 0; i < currKernel.kernel.length; i++) {
						currKernel.kernel[i].splice(0, 1);
						currKernel.kernel[i].splice(currKernel.kernel[i].length - 1, 1);
					}
				}
			}

			editKernel(currKernel);
		}
	}
}

function selectKernel(kernelName) {
	if (!currKernel) {
		Popup.toastPopup('No kernel selected to overwrite');
		return;
	}

	let center = Math.floor(currKernel.kernel.length / 2);
	switch (kernelName) {
		case 'identity':
			for (let i = 0; i < currKernel.kernel.length; i++) {
				for (let j = 0; j < currKernel.kernel.length; j++) {
					if (i == center && j == center) {
						currKernel.kernel[i][j] = 1;
					} else {
						currKernel.kernel[i][j] = 0;
					}
				}
			}

			currKernel.normalized = true;
			showKernelEditor();
			updateKernelSettingsInfo();
			break;
		case 'edgeDetect4':
			if (currKernel.kernel.length < 3) {
				Popup.toastPopup('Kernel size must be ≥3x3');
				return;
			} else {
				for (let i = 0; i < currKernel.kernel.length; i++) {
					for (let j = 0; j < currKernel.kernel.length; j++) {
						if (i == center && j == center) {
							currKernel.kernel[i][j] = 1;
						} else {
							currKernel.kernel[i][j] = 0;
						}
					}
				}

				currKernel.kernel[center][center] = 4;
				currKernel.kernel[center - 1][center] = -1;
				currKernel.kernel[center + 1][center] = -1;
				currKernel.kernel[center][center - 1] = -1;
				currKernel.kernel[center][center + 1] = -1;

				currKernel.normalized = false;
				showKernelEditor();
				updateKernelSettingsInfo();
			}
			break;
		case 'edgeDetect8':
			if (currKernel.kernel.length < 3) {
				Popup.toastPopup('Kernel size must be ≥3x3');
				return;
			} else {
				for (let i = 0; i < currKernel.kernel.length; i++) {
					for (let j = 0; j < currKernel.kernel.length; j++) {
						if (i == center && j == center) {
							currKernel.kernel[i][j] = 1;
						} else {
							currKernel.kernel[i][j] = 0;
						}
					}
				}

				currKernel.kernel[center][center] = 8;
				currKernel.kernel[center - 1][center] = -1;
				currKernel.kernel[center + 1][center] = -1;
				currKernel.kernel[center][center - 1] = -1;
				currKernel.kernel[center][center + 1] = -1;
				currKernel.kernel[center - 1][center - 1] = -1;
				currKernel.kernel[center + 1][center - 1] = -1;
				currKernel.kernel[center - 1][center + 1] = -1;
				currKernel.kernel[center + 1][center + 1] = -1;

				currKernel.normalized = false;
				showKernelEditor();
				updateKernelSettingsInfo();
			}
			break;
		case 'sharpen':
			if (currKernel.kernel.length < 3) {
				Popup.toastPopup('Kernel size must be ≥3x3');
				return;
			} else {
				for (let i = 0; i < currKernel.kernel.length; i++) {
					for (let j = 0; j < currKernel.kernel.length; j++) {
						if (i == center && j == center) {
							currKernel.kernel[i][j] = 1;
						} else {
							currKernel.kernel[i][j] = 0;
						}
					}
				}

				currKernel.kernel[center][center] = 5;
				currKernel.kernel[center - 1][center] = -1;
				currKernel.kernel[center + 1][center] = -1;
				currKernel.kernel[center][center - 1] = -1;
				currKernel.kernel[center][center + 1] = -1;

				currKernel.normalized = true;
				showKernelEditor();
				updateKernelSettingsInfo();
			}
			break;
		case 'boxBlur':
			for (let i = 0; i < currKernel.kernel.length; i++) {
				for (let j = 0; j < currKernel.kernel.length; j++) {
					currKernel.kernel[i][j] = 1;
				}
			}

			currKernel.normalized = true;
			showKernelEditor();
			updateKernelSettingsInfo();
			break;
		case 'gaussianBlur':
			function gaussian(x, y, sigma = 1) {
				let sigma2 = sigma * sigma;
				return Math.exp(-(x * x + y * y) / (2 * sigma2)) / (2 * Math.PI * sigma2);
			}

			for (let i = 0; i < currKernel.kernel.length; i++) {
				for (let j = 0; j < currKernel.kernel.length; j++) {
					currKernel.kernel[i][j] = gaussian(i - center, j - center);
				}
			}

			currKernel.normalized = true;
			showKernelEditor();
			updateKernelSettingsInfo();
			break;
		default:
			Popup.toastPopup('Invalid kernel ID');
	}
}

function showKernelEditor() {
	editKernel(currKernel);

	let editor = document.querySelector('#kernel-editor');
	let list = document.querySelector('#predefined-kernel-list');
	editor.style.display = 'grid';
	list.style.display = 'none';
}

function showKernelList() {
	let editor = document.querySelector('#kernel-editor');
	let list = document.querySelector('#predefined-kernel-list');
	editor.style.display = 'none';
	list.style.display = 'flex';
}

function getKernelInfo(kernel) {
	// Returns [sum, max, min]
	let s = 0, max = kernel.kernel[0][0], min = kernel.kernel[0][0];
	for (let i = 0; i < kernel.kernel.length; i++) {
		for (let j = 0; j < kernel.kernel.length; j++) {
			s += kernel.kernel[i][j];
			max = Math.max(max, kernel.kernel[i][j]);
			min = Math.min(min, kernel.kernel[i][j]);
		}
	}
	return [s, max, min];
}