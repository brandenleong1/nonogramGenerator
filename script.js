async function changeTheme() {
	let btn = document.querySelector('#theme-btn');
	btn.onclick = null;
	btn.themeId = (btn.themeId + 1) % Themes.themes.length;

	let labels = btn.themeLabel1Shown ? [document.querySelector('#theme-label-1'), document.querySelector('#theme-label-2')] : [document.querySelector('#theme-label-2'), document.querySelector('#theme-label-1')];
	labels[1].innerText = Themes.themes[btn.themeId][0];
	await Animate.animateGroup([
		[labels[0], Animate.fadeOut, {shiftTo: UP}],
		[labels[1], Animate.fadeIn, {shiftFrom: DOWN}]
	]);
	document.querySelector('#theme-css').setAttribute('href', Themes.themes[btn.themeId][1]);
	Cookies.setCookie('themeID', btn.themeId, 5 * 365 * 24 * 60 * 60 * 1000);

	btn.themeLabel1Shown = !btn.themeLabel1Shown;
	await Animate.wait(1500);
	btn.onclick = changeTheme;
}

function loadImage() {
	let files = document.querySelector('#input-image').files;
	if (files.length) {
		console.log(files[0]);
		document.querySelector('#file-label').innerText = files[0].name;

		var reader = new FileReader();
		reader.onload = (e) => {
			let image = new Image();
			image.onload = async () => {
				let canvas = document.querySelector('#canvas');
				let ctx = canvas.getContext('2d');
				canvas.width = image.width;
				canvas.height = image.height;
				ctx.drawImage(image, 0, 0);

				let reduced = MathUtils.reduceFraction(image.width, image.height);
				document.querySelector('#img-size-caption').innerText = image.width + 'x' + image.height + ' (' + reduced.join('x') + ')';

				let canvas2 = document.querySelector('#canvas-2');
				if (image.width > image.height) {
					canvas.style.height = 'auto';
					canvas.style.width = '240px';
					canvas2.style.height = 'auto';
					canvas2.style.width = '240px';
				} else {
					canvas.style.height = '240px';
					canvas.style.width = 'auto';
					canvas2.style.height = '240px';
					canvas2.style.width = 'auto';
				}

				if (document.querySelector('#kernel-editor-section').style.pointerEvents == 'none') {
					document.querySelector('#kernel-editor-section').style.pointerEvents = null;
					document.querySelector('#kernel-settings-section').style.pointerEvents = null;

					await Utils.sleep(200);
					await Animate.animateGroup([
						[document.querySelector('#kernel-editor-section'), Animate.fadeIn, {shiftFrom: UP, runTime: 200, rateFunc: RateFuncs.easeOutCubic}],
						[document.querySelector('#kernel-settings-section'), Animate.fadeIn, {shiftFrom: UP, runTime: 200, runTimeOffset: 200, rateFunc: RateFuncs.easeOutCubic}]
					]);
				}
			};
			image.src = e.target.result;
		};
		reader.readAsDataURL(files[0]);
	} else {
		document.querySelector('#file-label').innerText = 'No file selected.';
	}
}