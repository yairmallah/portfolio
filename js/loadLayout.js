// --- Extract ?file=layout1.json from URL ---
const params = new URLSearchParams(window.location.search);
const jsonFile = params.get('file') || 'projects/s1.json';  // fallback to default
const root = document.documentElement;
function reformat_grid_row_col(row, gap){
	var counter = "";
	const match = row.match(/repeat\((\d+),\s*1fr\)/);
	if (match) {
		const count = parseInt(match[1]);
		counter += `calc(${100 / count}% - ${count / (count+1) * parseFloat(gap)}vw) `.repeat(count);
	}
	else counter += row;
	return counter;
}
function extract_percents(cssProp){
	return percentages = [...cssProp.matchAll(/calc\(([\d.]+)%/g)].map(match => parseFloat(match[1]));
}
function rotateImage(img, angleDegrees) {
	if (img.dataset.rotated === 'true') return;
	
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	// Wait until the image is fully loaded
	if (!img.complete) {
		img.onload = () => rotateImage(img, angleDegrees);
		return;
	}

	const angle = angleDegrees % 360;
	const width = img.naturalWidth;
	const height = img.naturalHeight;

	// Adjust canvas size and context based on rotation
	if (angle === 90 || angle === 270) {
		canvas.width = height;
		canvas.height = width;
	} else {
		canvas.width = width;
		canvas.height = height;
	}

	ctx.save();
	if (angle === 90) {
		ctx.translate(height, 0);
		ctx.rotate(Math.PI / 2);
	} else if (angle === 180) {
		ctx.translate(width, height);
		ctx.rotate(Math.PI);
	} else if (angle === 270) {
		ctx.translate(0, width);
		ctx.rotate(3 * Math.PI / 2);
	}
	ctx.drawImage(img, 0, 0);
	ctx.restore();
	img.dataset.rotated = 'true';
	try {img.src = canvas.toDataURL();} 
	catch (error) {console.warn(error);}
}
function applyRotatedBackground(div, imageSrc, angleDeg, objectFit = 'cover') {
	const img = new Image();
	img.onload = function () {
		const angleRad = angleDeg * Math.PI / 180;
		const sin = Math.abs(Math.sin(angleRad));
		const cos = Math.abs(Math.cos(angleRad));

		const width = img.width;
		const height = img.height;

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		// Calculate size of rotated canvas
		canvas.width = width * cos + height * sin;
		canvas.height = width * sin + height * cos;

		// Move to center and rotate
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(angleRad);
		ctx.drawImage(img, -width / 2, -height / 2);

		// Use canvas as background image
		div.style.backgroundImage = `url('${canvas.toDataURL()}')`;
		div.style.backgroundSize = objectFit;
		div.style.backgroundRepeat = 'no-repeat';
		div.style.backgroundPosition = 'center';
	};
	img.src = imageSrc;
}

// General display values
document.documentElement.style.setProperty('--imgsZ', '1');
document.documentElement.style.setProperty('--linesColor', 'rgba(0, 0, 0, 0)');
document.documentElement.style.setProperty('--gridEvents', 'all');
document.addEventListener("DOMContentLoaded", ()=>{
	const mainSect = document.getElementById("layout-container");
	const rightSect = document.getElementById("text-right");
	const leftSect = document.getElementById("text-left");
	mainSect.addEventListener('mouseenter', () => {
		mainSect.classList.toggle("active", true);
		leftSect.classList.toggle("active", false);
		rightSect.classList.toggle("active", false);
	});
	mainSect.addEventListener('mouseleave', () => {
		mainSect.classList.toggle("active", false);
		leftSect.classList.toggle("active", true);
		rightSect.classList.toggle("active", true);
	});
});

// --- Load the specified JSON file ---
fetch(jsonFile)
	.then(response => response.json())
	.then(data => {
		function setCoshenImg(itemObj){
			const bgContainer = document.getElementById("block-bg");
			let chnImg;
			if (itemObj.src.substr(-3) == "mp4"){
				chnImg = document.createElement('video');
				chnImg.autoplay = true;
				chnImg.loop = true;
				chnImg.muted = true;
				chnImg.playsInline = true;
			}
			else{
				chnImg = document.createElement('img');
			}
			chnImg.src = itemObj.src;
			if (itemObj.rotation && itemObj.rotation != 0){
				rotateImage(chnImg, itemObj.rotation);
			}
			chnImg.id = 'chosen-image';
			if (itemObj.additionals) {
				itemObj.additionals.forEach(attr => {
					chnImg[attr[0]] = attr[1];
				});
			};
			
			bgContainer.innerHTML = "";
			const intermediary = document.createElement("div");
			intermediary.appendChild(chnImg);
			intermediary.id = "chosen-image-intermediary";
			if (itemObj.title){
				imgTitle = document.createElement("h1");
				imgTitle.id = "chosen-image-title";
				imgTitleCont = document.createElement("div");
				imgTitleCont.id = "chosen-image-title-container";
				imgTitle.innerHTML = itemObj.title;
				imgTitleCont.appendChild(imgTitle);
				intermediary.appendChild(imgTitleCont);
			}
			bgContainer.appendChild(intermediary);
			chnImg.addEventListener('click', (e) => {
				e.stopPropagation();
				const screenMiddle = window.innerWidth / 2;
				const clickX = event.clientX;
			
				if (clickX < screenMiddle) {
					for (let i = 0; i < data.images.length; i++){
						if (data.images[i] === itemObj){
							return setCoshenImg(data.images[(i + data.images.length - 1) % data.images.length]);
						}
					}
					console.error(`image list Exception, coulden fin match for ${itemObj}`);
				}else{
					for (let i = 0; i < data.images.length; i++){
						if (data.images[i] === itemObj){
							return setCoshenImg(data.images[(i + data.images.length + 1) % data.images.length]);
						}
					}
					console.error(`image list Exception, coulden fin match for ${itemObj}`);
				}
				
			});
			root.style.setProperty("--chosenImageZoom", 1);
			chnImg.addEventListener('mousemove', (e) => {
				const rect = chnImg.getBoundingClientRect();
				const x = ((e.clientX - rect.left) / rect.width) * 100;
				const y = ((e.clientY - rect.top) / rect.height) * 100;
				chnImg.style.transformOrigin = `${x}% ${y}%`;
			});

			chnImg.addEventListener('mouseleave', () => {chnImg.style.transformOrigin = 'center';});
			chnImg.addEventListener('wheel', (e) => {
				let dir = -e.deltaY / Math.abs(e.deltaY);
				if (!root.style.getPropertyValue("--chosenImageZoom")) root.style.setProperty("--chosenImageZoom", "1.1");
				let newZoom = Math.max(1, parseFloat(root.style.getPropertyValue("--chosenImageZoom"))*(dir >= 0? 1.1 : 0.9));
				root.style.setProperty("--chosenImageZoom", newZoom);
			});
			document.getElementById("block-bg").classList.toggle('hidden', false);
		}
		
		const container = document.getElementById('layout-container');
		const rightSect = document.getElementById("text-right");
		const leftSect = document.getElementById("text-left");
		
		if(data.text){
			document.title = data.text.title;
			leftApp = "";
			leftApp += `<div class="quick-fact"><b class="fact-title">שם: </b><span class="fact-data">${data.text.title || '-'}</span></div>`;
			leftApp += `<div class="quick-fact"><b class="fact-title">פרוגרמה: </b><span class="fact-data">${data.text.program || '-'}</span></div>`;
			leftApp += `<div class="quick-fact"><b class="fact-title">מקום: </b><span class="fact-data">${data.text.loaction || '-'}</span></div>`;
			leftApp += `<div class="quick-fact"><b class="fact-title">זמן: </b><span class="fact-data">${data.text.date || '-'}</span></div>`;
			leftApp += `<div class="quick-fact"><b class="fact-title">שטח: </b><span class="fact-data">${data.text.area || '-'}${data.text.units? data.text.units + '²' : ''}</span></div>`;
			leftApp += `<div class="quick-fact"><b class="fact-title">סטטוס: </b><span class="fact-data">${data.text.status || '-'}</span></div>`;
			rightSect.innerHTML = `<div class="exp-text"><h3>${data.text.title}</h3>${data.text.textR}</div>`
			leftSect.innerHTML = leftApp;
		}
		

		// Set CSS variables
		if (data.grid.columns) {
			document.documentElement.style.setProperty('--gridColumns', reformat_grid_row_col(data.grid.columns, data.grid.gap));
		}
		if (data.grid.rows) {
			document.documentElement.style.setProperty('--gridRows', reformat_grid_row_col(data.grid.rows, data.grid.gap));
		}
		if (data.grid.gap) {
			document.documentElement.style.setProperty('--gridGap', data.grid.gap);
		}
		if (data.grid.ratio) {
			document.documentElement.style.setProperty('--gridRatio', data.grid.ratio);
		}
		
		// Grid lines
		const rows_temp = extract_percents(document.documentElement.style.getPropertyValue('--gridRows'));
		const cols_temp = extract_percents(document.documentElement.style.getPropertyValue('--gridColumns'));
		let p_sum = 0;
		for (let i = 1; i <= cols_temp.length; i ++){
			const line = document.createElement('line');
			line.className = 'grid-line grid-line-x';
			line.id = `r${i}`;
			p_sum += cols_temp[i-1];
			line.style.left = `calc(${p_sum}% - ${(cols_temp.length - i) * parseFloat(data.grid.gap) / cols_temp.length}vw)`;
			container.appendChild(line);
		}
		p_sum = 0;
		for (let i = 1; i <= rows_temp.length; i ++){
			const line = document.createElement('line');
			line.className = 'grid-line grid-line-y';
			line.id = `c${i}`;
			p_sum += rows_temp[i-1];
			line.style.top = `calc(${p_sum}% - ${(rows_temp.length - i) * parseFloat(data.grid.gap) / rows_temp.length}vw)`;
			container.appendChild(line);
		}

		// Add images
		/*data.images.forEach(item => {
			let img;
			if (item.src.substr(-3) == "mp4"){
				img = document.createElement('video');
				img.autoplay = true;
				img.loop = true;
				img.muted = true;
				img.playsInline = true;
			}
			else{
				img = document.createElement('img');
			}
			img.src = item.src;
			img.classList.toggle('placed-img', true);
			if (item.classCSS) img.classList.toggle(item.classCSS, true);
			else img.classList.toggle('comp-draw', true);
			if (item.additionals) {
				item.additionals.forEach(attr => {
					img[attr[0]] = attr[1];
				});
			};
			img.style.gridColumn = item.gridColumn;
			img.style.gridRow = item.gridRow;
			img.classList.toggle('comp-' + (item.objectFit || 'cover'), true)
			container.appendChild(img);
			if (item.rotation && item.rotation != 0){
				rotateImage(img, item.rotation);
			}
			img.addEventListener('click', (e) => {
				setCoshenImg(item);
			});
		});*/
		data.images.forEach(item => {
			let el;

			if (item.src.substr(-3) === "mp4") {
				// Keep video element for video files
				el = document.createElement('video');
				el.autoplay = true;
				el.loop = true;
				el.muted = true;
				el.playsInline = true;
				el.src = item.src;
			} else {
				// Use <div> with background-image for images
				el = document.createElement('div');
				el.style.backgroundImage = `url('${item.src}')`;
				if (item.rotation && item.rotation != 0) applyRotatedBackground(el, item.src, item.rotation, (item.objectFit || 'cover'));
			}

			el.classList.add('placed-img');

			if (item.classCSS) {
				el.classList.add(item.classCSS);
			} else {
				el.classList.add('comp-draw');
			}

			if (item.additionals) {
				item.additionals.forEach(attr => {
					el[attr[0]] = attr[1];
				});
			}

			el.style.gridColumn = item.gridColumn;
			el.style.gridRow = item.gridRow;

			el.classList.add('comp-' + (item.objectFit || 'cover'));

			container.appendChild(el);

			el.addEventListener('click', (e) => {
				setCoshenImg(item);
			});
		});

		document.getElementById("block-bg").addEventListener('click', () => {
			document.getElementById("block-bg").classList.toggle('hidden', true);
		});
	})
	.catch(err => console.error('Failed to load layout:', err));
