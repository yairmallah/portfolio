// --- Extract ?file=layout1.json from URL ---
const params = new URLSearchParams(window.location.search);
const jsonFile = params.get('file') || 'projects/s4.json';  // fallback to default

// --- Load the specified JSON file ---
fetch(jsonFile)
	.then(response => response.json())
	.then(data => {
		const container = document.getElementById('layout-wrapper');

		// Set CSS variables
		if (data.grid.columns) {
			document.documentElement.style.setProperty('--gridColumns', data.grid.columns);
		}
		if (data.grid.rows) {
			document.documentElement.style.setProperty('--gridRows', data.grid.rows);
		}
		if (data.grid.gap) {
			document.documentElement.style.setProperty('--gridGap', data.grid.gap);
		}
		if (data.grid.ratio) {
			document.documentElement.style.setProperty('--gridRatio', data.grid.ratio);
		}
		console.log(data.grid);

		// Add images
		data.images.forEach(item => {
			const img = document.createElement('img');
			img.loading = 'lazy';
			img.src = item.src;
			img.className = 'placed-img';
			img.style.gridColumn = item.gridColumn;
			img.style.gridRow = item.gridRow;
			img.style.objectFit = item.objectFit || 'cover';
			container.appendChild(img);
		});
	})
	.catch(err => console.error('Failed to load layout:', err));
