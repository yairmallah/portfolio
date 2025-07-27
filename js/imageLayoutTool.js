let siteGraph = { nodes: {} };
let selectedImage = null;
let firstClick = null;

fetch('./site_graph.json')
  .then(res => res.json())
  .then(json => {
    siteGraph = json;
    populateDirectories();
  });

function populateDirectories() {
	const select = document.getElementById('directory-select');
	const dirs = new Set();
	for (const key in siteGraph) {
		if (key) dirs.add(key);
	}

	[...dirs].forEach(dir => {
		const option = document.createElement('option');
		option.value = dir;

		option.textContent = dir;
		select.appendChild(option);
	});

	select.addEventListener('change', () => {
		loadImagesFromDirectory(select.value);
	});

	// trigger first load
	if (select.options.length > 0) {
		select.selectedIndex = 0;
		loadImagesFromDirectory(select.value);
	}
}

function loadImagesFromDirectory(dir) {
	const container = document.getElementById('image-list');
	container.innerHTML = '';
	for (const key in siteGraph[dir]) {

		const img = document.createElement('img');
		img.src = siteGraph[dir][key];
		img.addEventListener('click', () => {
			document.querySelectorAll('#image-list img').forEach(i => i.classList.remove('selected'));
			img.classList.add('selected');
			selectedImage = siteGraph[dir][key];
		});
		container.appendChild(img);

	}
}

function defineGrid(){
	const rows = parseInt(document.getElementById('rows-input').value);
	const cols = parseInt(document.getElementById('cols-input').value);
	const gapPercent = parseFloat(document.getElementById('gap-input').value);
	const ratio_h = parseInt(document.getElementById('ratio-h').value);
	const ratio_w = parseInt(document.getElementById('ratio-w').value);

	const sandbox = document.getElementById('sandbox');
	
	sandbox.innerHTML = ''; // clear previous grid
	
	// css variables defs
	document.documentElement.style.setProperty('--gridRows', `repeat(${rows}, 1fr)`);
	document.documentElement.style.setProperty('--gridColumns', `repeat(${cols}, 1fr)`);
	document.documentElement.style.setProperty('--gridGap', `${gapPercent}vh`);
	document.documentElement.style.setProperty('--gridRatio', `${ratio_w} / ${ratio_h}`);
	
	const gap = gapPercent;
	const stepX = (100 - gapPercent * cols + gapPercent) / cols ;
	const stepY = (100 - gapPercent * rows + gapPercent) / rows;
	for (let i = 0; i <= cols; i++) {
		let line = document.createElement('div');
		line.className = 'grid-line';
		line.style.left = `${i * (stepX + gapPercent) - gapPercent}%`;
		line.style.top = '0';
		line.style.width = '1px';
		line.style.height = '100%';
		sandbox.appendChild(line);
		
		line = document.createElement('div');
		line.className = 'grid-line';
		line.style.left = `${i * (stepX + gapPercent)}%`;

		line.style.top = '0';
		line.style.width = '1px';
		line.style.height = '100%';
		sandbox.appendChild(line);
	}

	for (let i = 0; i <= rows; i++) {
		let line = document.createElement('div');
		line.className = 'grid-line';
		line.style.top = `${i * (stepY + gapPercent) - gapPercent}%`;
		line.style.left = '0';
		line.style.height = '1px';
		line.style.width = '100%';
		sandbox.appendChild(line);
		
		line = document.createElement('div');
		line.className = 'grid-line';
		line.style.top = `${i * (stepY + gapPercent)}%`;
		line.style.left = '0';
		line.style.height = '1px';
		line.style.width = '100%';
		sandbox.appendChild(line);
	}

	sandbox.onclick = e => {
		if (!selectedImage) return;

		const rect = sandbox.getBoundingClientRect();
		/*const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
		const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

		const snappedX = Math.round(xPercent / stepX) * stepX;
		const snappedY = Math.round(yPercent / stepY) * stepY;*/
		
		const xGrid = Math.round((e.clientX - rect.left) / rect.width * cols) + 1;
		const yGrid = Math.round((e.clientY - rect.top) / rect.height * rows) + 1;
		console.log('xGrid', xGrid);
		console.log('yGrid', yGrid);

		if (!firstClick) {
			/*firstClick = { x: snappedX, y: snappedY };*/
			firstClick = { x: xGrid, y: yGrid };
			return;
		}

		// Place image from firstClick to secondClick
		/*const minX = Math.min(firstClick.x, snappedX);
		const minY = Math.min(firstClick.y, snappedY);
		const maxX = Math.max(firstClick.x, snappedX);
		const maxY = Math.max(firstClick.y, snappedY);*/
		const minX = Math.min(firstClick.x, xGrid);
		const minY = Math.min(firstClick.y, yGrid);
		const maxX = Math.max(firstClick.x, xGrid);
		const maxY = Math.max(firstClick.y, yGrid);

		const img = document.createElement('img');
		img.className = 'placed-img';
		img.src = selectedImage;
		/*img.style.left = `${minX}%`;
		img.style.top = `${minY}%`;
		img.style.width = `${maxX - minX}%`;
		img.style.height = `${maxY - minY}%`;*/
		img.style.gridColumn = `${minX} / ${maxX}`;
		img.style.gridRow = `${minY} / ${maxY}`;


		sandbox.appendChild(img);
		logOutput();

		// Reset for next placement
		firstClick = null;
	};
}

document.getElementById('generate-grid').addEventListener('click', defineGrid);

function logOutput() {
	const placements = [];
	document.querySelectorAll('.placed-img').forEach(img => {
		placements.push({
			src: img.src,
			gridColumn: img.style.gridColumn,
			gridRow: img.style.gridRow
		});
	});
	document.getElementById('output').textContent = JSON.stringify(placements, null, 2);
}
