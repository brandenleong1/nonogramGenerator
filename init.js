async function init() {
	await initTheme(parseInt(Cookies.getCookie('themeID'), 10) || 0);

	await Animate.remove(document.querySelector('#kernel-editor-section'));
	await Animate.remove(document.querySelector('#kernel-settings-section'));
	await Animate.remove(document.querySelector('#convolution-section'));
	await Animate.remove(document.querySelector('#nonogram-settings-section'));
	await Animate.remove(document.querySelector('#grayscale-container'));
	await Animate.remove(document.querySelector('#colorizer-container'));
	await Animate.remove(document.querySelector('#nonogram-section'));
	await Animate.remove(document.querySelector('#invert-checkbox').parentNode);

	let link = document.createElement('link');
	link.href = 'https://cdn.jsdelivr.net/gh/brandenleong1/utils@latest/themes/transition.css';
	link.rel = 'stylesheet';
	link.type = 'text/css';
	document.head.appendChild(link);

	let font = new FontFace('Proxima Nova', 'url(https://cdn.jsdelivr.net/gh/brandenleong1/utils@latest/themes/proximanova.ttf)');
	await font.load();
	document.fonts.add(font);

	document.querySelector('#help').onclick = () => {Popup.popup(document.querySelector('#popup-help'));};
	document.querySelector('#settings').onclick = () => {Popup.popup(document.querySelector('#popup-settings'));};

	document.querySelector('#input-image').addEventListener('change', loadImage);
	document.querySelector('#normalize-checkbox').onclick = () => {
		if (currKernel) {
			document.querySelector('#normalize-checkbox').classList.toggle('selected');
			currKernel.normalized = document.querySelector('#normalize-checkbox').classList.contains('selected');
		}
	};
	document.querySelector('#edge-handling').onchange = () => {
		if (document.querySelector('#edge-handling').value == 'constant') {
			document.querySelector('#constant-color-select').style.display = 'flex';
		} else {
			document.querySelector('#constant-color-select').style.display = 'none';
		}

		if (currKernel) {
			currKernel.edgeHandling = document.querySelector('#edge-handling').value;
		}
	};
	document.querySelector('#constant-color-select input[type=color]').oninput = () => {
		if (currKernel) {
			currKernel.edgeColor = document.querySelector('#constant-color-select input[type=color]').value;
		}
	};
	document.querySelector('#negative-handling').onchange = () => {
		if (currKernel) {
			currKernel.negativeHandling = document.querySelector('#negative-handling').value;
		}
	};
	document.querySelector('#background-color-select').oninput = () => {
		document.querySelector('#canvas').style.backgroundColor = document.querySelector('#background-color-select').value;
	};
	document.querySelector('#fft-checkbox').onclick = () => {
		if (currKernel) {
			document.querySelector('#fft-checkbox').classList.toggle('selected');
			currKernel.useFFT = document.querySelector('#fft-checkbox').classList.contains('selected');
		}
	};
	document.querySelector('#grayscale-output-checkbox').onclick = () => {
		if (currKernel) {
			document.querySelector('#grayscale-output-checkbox').classList.toggle('selected');
			currKernel.grayscale = document.querySelector('#grayscale-output-checkbox').classList.contains('selected');
		}
	};
	document.querySelector('#blackwhite-checkbox').onclick = () => {
		document.querySelector('#blackwhite-checkbox').classList.toggle('selected');
		if (document.querySelector('#blackwhite-checkbox').classList.contains('selected')) {
			document.querySelector('#nonogram-colors-container').style.pointerEvents = 'none';
			document.querySelector('#quantization-container').style.pointerEvents = 'none';
			document.querySelector('#grayscale-container').style.pointerEvents = null;
			document.querySelector('#invert-checkbox').parentNode.style.pointerEvents = null;
			Animate.remove(document.querySelector('#nonogram-colors-container'));
			Animate.remove(document.querySelector('#quantization-container'));
			Animate.add(document.querySelector('#grayscale-container'));
			Animate.add(document.querySelector('#invert-checkbox').parentNode);
		} else {
			document.querySelector('#nonogram-colors-container').style.pointerEvents = null;
			document.querySelector('#quantization-container').style.pointerEvents = null;
			document.querySelector('#grayscale-container').style.pointerEvents = 'none';
			document.querySelector('#invert-checkbox').parentNode.style.pointerEvents = 'none';
			Animate.add(document.querySelector('#nonogram-colors-container'));
			Animate.add(document.querySelector('#quantization-container'));
			Animate.remove(document.querySelector('#grayscale-container'));
			Animate.remove(document.querySelector('#invert-checkbox').parentNode);
		}
	};
	document.querySelector('#grayscale-cutoff').oninput = () => {
		document.querySelector('#grayscale-cutoff-label').innerText = document.querySelector('#grayscale-cutoff').value + '%';
	};
	document.querySelector('#invert-checkbox').onclick = () => {
		document.querySelector('#invert-checkbox').classList.toggle('selected');
	};
	document.querySelector('#gridline-checkbox').onclick = () => {
		document.querySelector('#gridline-checkbox').classList.toggle('selected');
		if (document.querySelector('#gridline-checkbox').classList.contains('selected')) {
			document.querySelector('#gridline-color-select').parentNode.style.display = null;
		} else {
			document.querySelector('#gridline-color-select').parentNode.style.display = 'none';
		}
	};

	window.scrollTo({left: 0});
}

function initTheme(id = 0) {
	Themes.createThemeCSS(id);
	document.querySelector('#theme-btn').onclick = changeTheme;
	document.querySelector('#theme-btn').themeId = id;
	document.querySelector('#theme-btn').themeLabel1Shown = false;
	document.querySelector('#theme-label-2').innerText = Themes.themes[id][0];
	document.querySelector('#theme-css').setAttribute('href', Themes.themes[id][1]);
	Cookies.setCookie('themeID', id, 5 * 365 * 24 * 60 * 60 * 1000);
}

window.addEventListener('load', async function() {
	await Utils.sleep(100);
	document.querySelector('#loading-css').remove();
	document.querySelector('#loading').style.display = 'none';
	await init();
});