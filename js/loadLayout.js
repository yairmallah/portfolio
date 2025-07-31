// --- Extract ?file=layout1.json from URL ---
const params = new URLSearchParams(window.location.search);
const jsonFile = params.get('file') || 'projects/s4.json';  // fallback to default
function reformat_grid_row_col(rows, gap){
	var counter = "";
	rows.forEach(row => {
		const match = row.match(/repeat\((\d+),\s*1fr\)/);
		if (match) {
			const count = parseInt(match[1]);
			counter += `calc(${100 / count}% - ${count / (count+1) * parseFloat(gap)}vw) `.repeat(count);
		}
		else counter += row;
	});
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

// General display values
document.documentElement.style.setProperty('--imgsZ', '1');
document.documentElement.style.setProperty('--linesColor', 'rgba(0, 0, 0, 0)');
document.documentElement.style.setProperty('--gridEvents', 'all');
document.addEventListener("DOMContentLoaded", ()=>{setTimeout(() => {document.getElementById("layout-wrapper").classList.toggle("active", true);}, 1500);});

// --- Load the specified JSON file ---
fetch(jsonFile)
	.then(response => response.json())
	.then(data => {
		const container = document.getElementById('layout-wrapper');

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
		data.images.forEach(item => {
			const img = document.createElement('img');
			img.loading = 'lazy';
			img.src = item.src;
			img.classList.toggle('placed-img', true);
			if (item.classCSS) img.classList.toggle(item.className, true);
			else img.classList.toggle('comp-draw', true);
			img.style.gridColumn = item.gridColumn;
			img.style.gridRow = item.gridRow;
			img.classList.toggle('comp-' + (item.objectFit || 'cover'), true)
			container.appendChild(img);
			img.addEventListener('click', () => {
				img.classList.toggle('chosen-image');
				document.getElementById("block-bg").classList.toggle('hidden');
			});
			if (item.rotation && item.rotation != 0){
				rotateImage(img, item.rotation);
			}
		});
	})
	.catch(err => console.error('Failed to load layout:', err));
