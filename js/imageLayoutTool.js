let siteGraph = { nodes: {} };
let selectedImage = null;
let firstClick = null;
var gridRowsPer = null;
var gridColsPer = null;
var lineDragged

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
function logOutput() {
	const placements = [];

	document.querySelectorAll('.placed-img').forEach(img => {
		placements.push({
			src: img.src,
			gridColumn: img.style.gridColumn,
			gridRow: img.style.gridRow,
			objectFit: img.getAttribute('data'),
			rotation: img.getAttribute('rotation')
		});
	});

	const computedStyle = getComputedStyle(document.documentElement);

	const layout = {
		grid: {
			columns: computedStyle.getPropertyValue('--gridColumns').trim().split(/\s+/),
			rows: computedStyle.getPropertyValue('--gridRows').trim().split(/\s+/),
			gap: computedStyle.getPropertyValue('--gridGap').trim()
		},
		images: placements
	};

	const jsonStr = JSON.stringify(layout, null, 2);

	// Show in output panel
	document.getElementById('output').textContent = jsonStr;
}

function downloadOutput(){
	let jsonStr = document.getElementById('output').textContent;
	
	const blob = new Blob([jsonStr], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = "layout.json";
	a.click();
	URL.revokeObjectURL(url);
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
	document.documentElement.style.setProperty('--gridGap', `${gapPercent}vw`);
	document.documentElement.style.setProperty('--gridRatio', `${ratio_w} / ${ratio_h}`);
	
	const gap = gapPercent;
	const stepX = 100 / cols;
	const stepY = 100 / rows;
	for (let i = 1; i <= cols; i++) {
		let line = document.createElement('div');
		line.className = 'grid-line';
		line.id = `c${i}`;
		line.style.left = `calc(${i * stepX }% - ${(cols - i) * gapPercent / cols}vw)`;
		line.style.top = '0';
		line.style.width = `${gapPercent}vw`;
		line.style.height = '100%';
		sandbox.appendChild(line);
	}

	for (let i = 1; i <= rows; i++) {
		let line = document.createElement('div');
		line.className = 'grid-line';
		line.id = `r${i}`;
		line.style.top = `calc(${i * stepY }% - ${(rows - i) * gapPercent / rows}vw)`;
		line.style.left = '0';
		line.style.height = `${gapPercent}vw`;
		line.style.width = '100%';
		sandbox.appendChild(line);
	}




	sandbox.onclick = e => {
		if (!selectedImage) return;

		const rect = sandbox.getBoundingClientRect();
		
		const xGrid = Math.round((e.clientX - rect.left) / rect.width * cols) + 1;
		const yGrid = Math.round((e.clientY - rect.top) / rect.height * rows) + 1;
		
		if (!firstClick) {
			firstClick = { x: xGrid, y: yGrid };
			return;
		}

		// Place image from firstClick to secondClick
		const minX = Math.min(firstClick.x, xGrid);
		const minY = Math.min(firstClick.y, yGrid);
		const maxX = Math.max(firstClick.x, xGrid);
		const maxY = Math.max(firstClick.y, yGrid);
		if (minX === maxX) return;
		if (minY === maxY) return;

		const img = document.createElement('img');
		img.className = 'placed-img';
		img.src = selectedImage;
		img.style.gridColumn = `${minX} / ${maxX}`;
		img.style.gridRow = `${minY} / ${maxY}`;
		img.setAttribute('data', 'contain');
		img.setAttribute('rotation', 0);


		sandbox.appendChild(img);
		img.addEventListener('contextmenu', (e) => {
			e.preventDefault();

		});
		img.addEventListener('mousedown', (e) => {
			e.preventDefault();
			if (e.button == 1){
				e.preventDefault();
				img.setAttribute('rotation', parseInt(img.getAttribute('rotation')) + 90);
				img.style.transform = `rotate(${img.getAttribute('rotation')}deg)`;
			}
			if (e.button == 2){
				e.preventDefault();
				img.remove();
			}
			if (e.button == 0){
				if (img.getAttribute('data') == 'contain') {
					img.style.objectFit = 'cover';
					img.setAttribute('data', 'cover');
				}
				else{
					img.style.objectFit = 'contain';
					img.setAttribute('data', 'contain');
				}
			}
		});
		/*img.addEventListener('dblclick', (e) => {
			console.log(img);
			if (img.getAttribute('data') == 'contain') {
				img.style.objectFit = 'cover';
				img.setAttribute('data', 'cover');
			}
			else{
				img.style.objectFit = 'contain';
				img.setAttribute('data', 'contain');
			}
		});*/
		
		logOutput();

		// Reset for next placement
		firstClick = null;
	};
	

	function markGridPoint(col, row) {

		function parseCalcExpression(expr, containerWidth) {
			// Supports only "a% - bvw" format
			const match = expr.trim().match(/calc\(([\d.]+)%\s*-\s*([\d.]+)vw\)/);
			if (!match) return 0;
			const percent = parseFloat(match[1]);
			const vw = parseFloat(match[2]);
			return (containerWidth * percent / 100) - (window.innerWidth * vw / 100);
		}
		const grid = document.getElementById('sandbox');
		const rect = grid.getBoundingClientRect();
		const colDef = getComputedStyle(document.documentElement).getPropertyValue('--gridColumns').trim().split(' ');
		const rowDef = getComputedStyle(document.documentElement).getPropertyValue('--gridRows').trim().split(' ');
		const gapExpr = getComputedStyle(document.documentElement).getPropertyValue('--gridGap');
		const gridGap = parseFloat(gapExpr) * window.innerWidth / 100;

		let colWidths = colDef.map(expr => parseCalcExpression(expr, grid.clientWidth));
		let rowHeights = rowDef.map(expr => parseCalcExpression(expr, grid.clientHeight));

		// Add grid gap between cells (not after last)
		for (let i = 0; i < colWidths.length - 1; i++) colWidths[i] += gridGap;
		for (let i = 0; i < rowHeights.length - 1; i++) rowHeights[i] += gridGap;

		let x = colWidths.slice(0, col).reduce((a, b) => a + b, 0);
		let y = rowHeights.slice(0, row).reduce((a, b) => a + b, 0);

		// Create marker
		const marker = document.createElement('div');
		marker.className = 'grid-corner-marker';
		marker.style.position = 'absolute';
		marker.style.left = `${rect.left + x}%`;
		marker.style.top = `${rect.top + y}%`;
		marker.style.width = '10px';
		marker.style.height = '10px';
		marker.style.backgroundColor = 'red';
		marker.style.borderRadius = '50%';
		marker.style.zIndex = '9999';
		marker.style.pointerEvents = 'none';
		marker.style.animation = 'blink 0.8s infinite';
		document.body.appendChild(marker);
	}
	
	
	/*sandbox.onclick = e => {
	if (!selectedImage) return;
	const rect = sandbox.getBoundingClientRect();

	let x = ((e.clientX - rect.left) / rect.width) * 100;
	let y = ((e.clientY - rect.top) / rect.height) * 100;

	function getSnapIndex(coord, gridArr) {
		let acc = 0;
		for (let i = 0; i < gridArr.length; i++) {
			let next = acc + gridArr[i];
			if (coord < next) return i + 1;
			acc = next;
		}
		return gridArr.length;
	}

	const xGrid = getSnapIndex(x, gridColsPer || Array(parseInt(document.getElementById('cols-input').value)).fill(100 / parseInt(document.getElementById('cols-input').value))) + 1;
	const yGrid = getSnapIndex(y, gridRowsPer || Array(parseInt(document.getElementById('rows-input').value)).fill(100 / parseInt(document.getElementById('rows-input').value))) + 1;
	console.log(xGrid);
	console.log(yGrid);
	if (!firstClick) {
		firstClick = { x: xGrid, y: yGrid };
		markGridPoint(xGrid, yGrid); // add this
		return;
	}

	const minX = Math.min(firstClick.x, xGrid);
	const minY = Math.min(firstClick.y, yGrid);
	const maxX = Math.max(firstClick.x, xGrid);
	const maxY = Math.max(firstClick.y, yGrid);
	if (minX === maxX || minY === maxY) return;

	const img = document.createElement('img');
	img.className = 'placed-img';
	img.src = selectedImage;
	img.style.gridColumn = `${minX} / ${maxX}`;
	img.style.gridRow = `${minY} / ${maxY}`;
	sandbox.appendChild(img);

	img.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		img.remove();
	});
	img.addEventListener('dblclick', (e) => {
		img.style.objectFit = img.style.objectFit === 'cover' ? 'contain' : 'cover';
	});
	logOutput();
	firstClick = null;

};*/

	
}
/*
function editGrid() {
	const gap = parseFloat(document.documentElement.style.getPropertyValue('--gridGap'));
	document.documentElement.style.setProperty('--imgsZ', 1);
	document.documentElement.style.setProperty('--linesColor', 'rgba(127, 0, 0, 0.5)');
	document.documentElement.style.setProperty('--gridEvents', 'all');

	function applyTemplate(propertyName, templateArr) {
		function wave_check(arg, ind){
			if (100 % arg === 0) return (templateArr.length - ind/2 - 1) * gap / templateArr.length;
			return ind === 0? 0 : gap;
		}
		const newTemplate = templateArr.map((val, i) =>
			`calc(${val.toFixed(4)}% - ${wave_check(val, i)}vw)`
		).join(' ');
		document.documentElement.style.setProperty(propertyName, newTemplate);
	}

	function enableDrag(line, axis, index, values, cssVar) {
		let container = document.getElementById("sandbox");
		let isDragging = false;

		line.style.cursor = axis === 'x' ? 'ew-resize' : 'ns-resize';

		line.addEventListener('mousedown', (e) => {
			isDragging = true;
			e.preventDefault();
			document.body.style.userSelect = "none";
		});

		window.addEventListener('mouseup', () => {
			isDragging = false;
			document.body.style.userSelect = "";
		});

		window.addEventListener('mousemove', (e) => {
			if (!isDragging) return;

			const rect = container.getBoundingClientRect();
			let pos;
			if (axis === 'x') {
				let x = e.clientX - rect.left;
				pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
			} else {
				let y = e.clientY - rect.top;
				pos = Math.max(0, Math.min(100, (y / rect.height) * 100));
			}

			const totalBefore = values.slice(0, index).reduce((a, b) => a + b, 0);
			
			const totalAfter = values.slice(index + 1).reduce((a, b) => a + b, 0);
			const newVal = pos - totalBefore;
			console.log(totalBefore);
			console.log(totalAfter);

			if (newVal < 1 || newVal > values[index] + values[index + 1] - 1) return;
			
			values[index + 1] = values[index + 1] - newVal + values[index];
			values[index] = newVal;
			
			if (axis === 'x'){
				line.style.left = `${pos}%`;
				gridColsPer = values;
			}
			else{
				line.style.top = `${pos}%`;
				gridRowsPer = values;
			}
			applyTemplate(cssVar, values);
		});
	}

	function parseTemplate(defStr) {
		return defStr.trim().split(/\s+/).map(v => parseFloat(v));
	}

	function convertRepeat(defStr) {
		const match = defStr.match(/repeat\((\d+),\s*1fr\)/);
		if (match) {
			const count = parseInt(match[1]);
			return Array(count).fill(100 / count);
		}
		return parseTemplate(defStr);
	}

	// Get grid definitions
	let colDef = getComputedStyle(document.documentElement).getPropertyValue('--gridColumns');
	let rowDef = getComputedStyle(document.documentElement).getPropertyValue('--gridRows');

	let colVals = convertRepeat(colDef);
	let rowVals = convertRepeat(rowDef);

	applyTemplate('--gridColumns', colVals);
	applyTemplate('--gridRows', rowVals);

	for (let i = 0; i < colVals.length - 1; i++) {
		enableDrag(document.getElementById(`c${i + 1}`), 'x', i, colVals, '--gridColumns');
	}
	for (let i = 0; i < rowVals.length - 1; i++) {
		enableDrag(document.getElementById(`r${i + 1}`), 'y', i, rowVals, '--gridRows');
	}
}
*/

let isEditingGrid = false;
let gridListeners = [];

function editGrid() {
	if (isEditingGrid) {
		// Turn OFF edit mode
		document.documentElement.style.setProperty('--imgsZ', 2);
		document.documentElement.style.setProperty('--linesColor', 'transparent');
		document.documentElement.style.setProperty('--gridEvents', 'none');
		isEditingGrid = false;

		// Remove listeners
		gridListeners.forEach(({ element, type, handler }) => {
			element.removeEventListener(type, handler);
		});
		gridListeners = [];
		return;
	}

	isEditingGrid = true;
	const gap = parseFloat(document.documentElement.style.getPropertyValue('--gridGap'));

	document.documentElement.style.setProperty('--imgsZ', 1);
	document.documentElement.style.setProperty('--linesColor', 'rgba(127, 0, 0, 0.5)');
	document.documentElement.style.setProperty('--gridEvents', 'all');

	function applyTemplate(propertyName, templateArr) {
		function wave_check(arg, ind) {
			if (100 % arg === 0) return (templateArr.length - ind / 2 - 1) * gap / templateArr.length;
			return ind === 0 ? 0 : gap;
		}
		const newTemplate = templateArr.map((val, i) =>
			`calc(${val.toFixed(4)}% - ${wave_check(val, i)}vw)`
		).join(' ');
		document.documentElement.style.setProperty(propertyName, newTemplate);
	}

	function enableDrag(line, axis, index, values, cssVar) {
		let container = document.getElementById("sandbox");
		let isDragging = false;

		line.style.cursor = axis === 'x' ? 'ew-resize' : 'ns-resize';

		const down = (e) => {
			isDragging = true;
			e.preventDefault();
			document.body.style.userSelect = "none";
		};
		const up = () => {
			isDragging = false;
			document.body.style.userSelect = "";
		};
		const move = (e) => {
			if (!isDragging) return;
			const rect = container.getBoundingClientRect();
			let pos;
			if (axis === 'x') {
				let x = e.clientX - rect.left;
				pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
			} else {
				let y = e.clientY - rect.top;
				pos = Math.max(0, Math.min(100, (y / rect.height) * 100));
			}

			const totalBefore = values.slice(0, index).reduce((a, b) => a + b, 0);
			const newVal = pos - totalBefore;
			if (newVal < 1 || newVal > values[index] + values[index + 1] - 1) return;

			values[index + 1] = values[index + 1] - newVal + values[index];
			values[index] = newVal;

			if (axis === 'x') {
				line.style.left = `${pos}%`;
				gridColsPer = values.slice();
			} else {
				line.style.top = `${pos}%`;
				gridRowsPer = values.slice();
			}
			applyTemplate(cssVar, values);
		};

		line.addEventListener('mousedown', down);
		window.addEventListener('mouseup', up);
		window.addEventListener('mousemove', move);

		gridListeners.push({ element: line, type: 'mousedown', handler: down });
		gridListeners.push({ element: window, type: 'mouseup', handler: up });
		gridListeners.push({ element: window, type: 'mousemove', handler: move });
	}

	function parseTemplate(defStr) {
		return defStr.trim().split(/\s+/).map(v => parseFloat(v));
	}

	function convertRepeat(defStr) {
		const match = defStr.match(/repeat\((\d+),\s*1fr\)/);
		if (match) {
			const count = parseInt(match[1]);
			return Array(count).fill(100 / count);
		}
		return parseTemplate(defStr);
	}

	let colDef = getComputedStyle(document.documentElement).getPropertyValue('--gridColumns');
	let rowDef = getComputedStyle(document.documentElement).getPropertyValue('--gridRows');

	let colVals = convertRepeat(colDef);
	let rowVals = convertRepeat(rowDef);

	gridColsPer = colVals.slice();
	gridRowsPer = rowVals.slice();

	applyTemplate('--gridColumns', colVals);
	applyTemplate('--gridRows', rowVals);

	for (let i = 0; i < colVals.length - 1; i++) {
		enableDrag(document.getElementById(`c${i + 1}`), 'x', i, colVals, '--gridColumns');
	}
	for (let i = 0; i < rowVals.length - 1; i++) {
		enableDrag(document.getElementById(`r${i + 1}`), 'y', i, rowVals, '--gridRows');
	}
}


document.getElementById('generate-grid').addEventListener('click', defineGrid);
document.getElementById('download').addEventListener('click', downloadOutput);
//document.getElementById('edit-grid').addEventListener('click', editGrid);



let offsetX, offsetY, isDragging = false;
const sidebar = document.getElementById("sidebar");
sidebar.addEventListener("mousedown", (e) => {
	isDragging = true;
	offsetX = e.clientX - sidebar.offsetLeft;
	offsetY = e.clientY - sidebar.offsetTop;
	sidebar.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
	if (isDragging) {
		let newX = e.clientX - offsetX;
		let newY = e.clientY - offsetY;
		sidebar.style.left = `${newX}px`;
		sidebar.style.top = `${newY}px`;
	}
});

document.addEventListener("mouseup", () => {
	if (isDragging) {
		localStorage.setItem("sidebarX", sidebar.style.left.replace("px", ""));
		localStorage.setItem("sidebarY", sidebar.style.top.replace("px", ""));
		// adj sub menu positio
	}
	isDragging = false;
	sidebar.style.cursor = "grab";
});
