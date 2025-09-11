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
function applyRotatedBackground(div, imageSrc, angleDeg, objectFit = 'cover') {
	const img = new Image();
	img.onload = function () {
		try {
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
			/*div.style.backgroundImage = `url('${canvas.toDataURL()}')`;
			div.style.backgroundSize = objectFit;
			div.style.backgroundRepeat = 'no-repeat';
			div.style.backgroundPosition = 'center';*/
			div.src = canvas.toDataURL();
		}
		catch(e) {console.warn("rotationg img aborted due to ", e);}
	};
	img.src = imageSrc;
	
}
function setNestedProperty(obj, keyPath, value) {
	const keys = keyPath.split('.');
	const lastKey = keys.pop(); // Get the last key (where the value should be assigned)

	let current = obj;
	for (const key of keys) {
		current = current[key]; // Traverse down the path
		if (current === undefined) return; // Safety check
	}

	current[lastKey] = value; // Set the final value
}

// General display values
document.documentElement.style.setProperty('--imgsZ', '1');
document.documentElement.style.setProperty('--linesColor', 'rgba(0, 0, 0, 0)');
document.documentElement.style.setProperty('--gridEvents', 'all');
document.addEventListener("DOMContentLoaded", ()=>{
	const mainSect = document.getElementById("layout-container");
	const toggleLayoutButton = document.getElementById("toggle-layout-button");
	const rightSect = document.getElementById("text-right");
	const leftSect = document.getElementById("text-left");
	mainSect.classList.toggle("active", false);
	toggleLayoutButton.classList.toggle("active", false);
	leftSect.classList.toggle("hidden", false);
	rightSect.classList.toggle("hidden", false);
	toggleLayoutButton.addEventListener('click', () => {
		mainSect.classList.toggle("active");
		toggleLayoutButton.classList.toggle("active");
		leftSect.classList.toggle("hidden");
		rightSect.classList.toggle("hidden");
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
			/*if (itemObj.rotation && itemObj.rotation != 0){}*/
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
		const junctions = [];

		function calculateJunctions() {
			const containerRect = container.getBoundingClientRect();
			const xLines = Array.from(document.querySelectorAll('.grid-line-x')).map(line =>
				line.getBoundingClientRect().left - containerRect.left
			);
			const yLines = Array.from(document.querySelectorAll('.grid-line-y')).map(line =>
				line.getBoundingClientRect().top - containerRect.top
			);

			for (let x of xLines) {
				for (let y of yLines) {
					junctions.push({ x, y });
				}
			}
		}

		
		
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
		for (let i = 1; i < cols_temp.length; i ++){
			const line = document.createElement('line');
			line.className = 'grid-line grid-line-x';
			line.id = `r${i}`;
			p_sum += cols_temp[i-1];
			line.style.left = `calc(${p_sum}% - ${(cols_temp.length - i) * parseFloat(data.grid.gap) / cols_temp.length}vw)`;
			container.appendChild(line);
		}
		
		p_sum = 0;
		for (let i = 1; i < rows_temp.length; i ++){
			const line = document.createElement('line');
			line.className = 'grid-line grid-line-y';
			line.id = `c${i}`;
			p_sum += rows_temp[i-1];
			line.style.top = `calc(${p_sum}% - ${(rows_temp.length - i) * parseFloat(data.grid.gap) / rows_temp.length}vw)`;
			container.appendChild(line);
		}
		calculateJunctions();
		
		data.images.forEach(item => {
			let el;

			if (item.src.substr(-3) === "mp4") {
				el = document.createElement('video');
				el.autoplay = true;
				el.loop = true;
				el.muted = true;
				el.playsInline = true;
				el.src = item.src;
			} else {
				/*el = document.createElement('div');
				el.style.backgroundImage = `url('${item.src}')`;*/
				el = document.createElement('img');
				el.src = `${item.src}`;
				el.loading = "lazy";
				
				if (item.rotation && item.rotation != 0) applyRotatedBackground(el, item.src, item.rotation, (item.objectFit || 'cover'));
			}
			
			el.classList.add('placed-img');
			el.style.setProperty('--rotation', `${item.rotation}deg`);
			if (item.classCSS) {
				if (typeof item.classCSS  === 'object') item.classCSS.forEach( classCss => {el.classList.add(classCss);});
				else el.classList.add(item.classCSS);
			} else {
				el.classList.add('comp-draw');
			}

			if (item.additionals) {
				item.additionals.forEach(attr => {
					setNestedProperty(el, attr[0], attr[1]);
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
		
		
		
		
		/*document.querySelectorAll('.placed-img').forEach(img => {
			img.addEventListener('mouseenter', (e) => {
				const rect = img.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				const corners = [
					{ x: rect.left - containerRect.left, y: rect.top - containerRect.top }, // top-left
					{ x: rect.right - containerRect.left, y: rect.top - containerRect.top }, // top-right
					{ x: rect.right - containerRect.left, y: rect.bottom - containerRect.top }, // bottom-right
					{ x: rect.left - containerRect.left, y: rect.bottom - containerRect.top } // bottom-left
				];
				corners.forEach(corner => {if (Math.random() > 0.3) emitWave(corner.x, corner.y)});
			});
		});*/
		const waveSpeed = 300; // pixels/sec
		const waveRadius = 4;
		const directionList = [
						{ dx: 1, dy: 0 },
						{ dx: -1, dy: 0 },
						{ dx: 0, dy: 1 },
						{ dx: 0, dy: -1 }
					];
		function randomDir(){
			return directionList[Math.floor(Math.random() * 4)];
		}
		
		function emitWave(x, y) {
			const visited = new Set();

			// initial directions
			for (let i=0; i < 3; i ++){
				let dir = randomDir();
				propagate(x, y, dir.dx, dir.dy, visited);
			}

		}

		function propagate(x, y, dx, dy, visited, age=0) {
			console.log(age);
			if ( ++ age >= 40) return;
			const dot = document.createElement('div');
			dot.className = 'wave-dot';
			container.appendChild(dot);
			let lastTime = null;

			function move(timestamp) {
				if (!lastTime) lastTime = timestamp;
				const elapsed = (timestamp - lastTime) / 1000;
				lastTime = timestamp;

				const step = waveSpeed * elapsed;
				x += dx * step;
				y += dy * step;

				dot.style.left = `${x - waveRadius}px`;
				dot.style.top = `${y - waveRadius}px`;

				// check for junction
				const junction = checkJunction(x, y);
				const key = `${Math.round(x)}-${Math.round(y)}`;

				if (junction && !visited.has(key)) {
					visited.add(key);

					let direction = directionList[Math.floor(Math.random() * 4)];
					if (direction.dx !== -dx || direction.dy !== -dy) {
						propagate(x, y, direction.dx, direction.dy, visited, age);
						if (Math.random() > 0.8){
							direction = directionList[Math.floor(Math.random() * 4)];
							if (direction.dx !== -dx || direction.dy !== -dy) propagate(x, y, direction.dx, direction.dy, visited, age);
						}
						dot.remove();
						return;
					}

				}

				// stop if outside container
				if (x < 0 || x > container.clientWidth || y < 0 || y > container.clientHeight) {
					dot.remove();
					return;
				}
				requestAnimationFrame(move);
			}
			requestAnimationFrame(move);
		}

		function checkJunction(x, y) {
			const margin = 4;
			let junctionX = false;
			let junctionY = false;
			document.querySelectorAll('.grid-line-x').forEach(line => {
				const lineX = line.getBoundingClientRect().left - container.getBoundingClientRect().left;
				if (Math.abs(lineX - x) < margin) junctionX = true;
			});
			document.querySelectorAll('.grid-line-y').forEach(line => {
				const lineY = line.getBoundingClientRect().top - container.getBoundingClientRect().top;
				if (Math.abs(lineY - y) < margin) junctionY = true;
			});
			return junctionX && junctionY;
		}
	})
	.catch(err => console.error('Failed to load layout:', err));
