const root = document.documentElement;

async function loadResume() {
	const res = await fetch("js/resume.json");
	const data = await res.json();
	console.log(data);
	
	buildAbout(data);

	buildTimeline(data);

	buildSidebar(data);
}

function buildAbout(data){
	const container = document.getElementById("sub-header");
	const title = document.createElement("h2");
	title.id = "about-title";
	title.textContent = data.about.title;
	const textContainer = document.createElement("div");
	textContainer.id = "about-text-container";
	textContainer.innerHTML = data.about.text;
	container.appendChild(title);
	container.appendChild(textContainer);
}

function buildTimeline(data) {
	function sortYears(a, b){
		const numA = parseInt(a);
		const numB = parseInt(b);
		if (isNaN(numA)) return 1;   // put it last
		if (isNaN(numB)) return -1;  // put it last
		return numA - numB;
	}
	function rangesOverlap(a, b) {
		let aPar = generateGridYear(a);
		let bPar = generateGridYear(b);
		const [aStart, aEnd] = [aPar[0], aPar[aPar.length - 1]];
		const [bStart, bEnd] = [bPar[0], bPar[bPar.length - 1]];
		return (aStart < bEnd && bStart < aEnd); // overlap if ranges intersect
	}
	function rangesAdj(a, b) {
		let aPar = generateGridYear(a);
		let bPar = generateGridYear(b);
		const [aStart, aEnd] = [aPar[0], aPar[aPar.length - 1]];
		const [bStart, bEnd] = [bPar[0], bPar[bPar.length - 1]];
		return (aStart == bEnd || bStart == aEnd); // overlap if ranges intersect
	}
	var yCols = {};
	function generateGridYear(evenetItem){
		return `${yCols[evenetItem.start][0]} / ${yCols[evenetItem.end][yCols[evenetItem.end].length - 1]}`;
	}

	const categories = [
		"education",
		"projects"
	];
	const timelineGrid = document.createElement("div");
	timelineGrid.id = "timeline-grid";
	const gridAxis = document.createElement("div");
	gridAxis.id = "grid-axis";
	timelineGrid.appendChild(gridAxis);

	// collect all events
	let events = [];
	data.sections.forEach(sec => {
		sec.items.forEach(item => {
			let [start, end] = item.time.split(' ');
			if (sortYears(start, end) > 0) [start, end] = [end, start];
			events.push({ category: sec.title, start, end, action: item.action, elab: item.elab, title: item.title });
		});
	});	

	const years = [...new Set(events.flatMap(e => [e.start, e.end]))].sort(sortYears);
	root.style.setProperty("--gridRowCount", years.length);

	// === first column: the vertical time axis ===
	const yearsCol = document.createElement("div");
	yearsCol.id = "timeline-years";
	let yearIndex = 1;
	years.forEach(y => {
		const yDiv = document.createElement("div");
		yDiv.classList.add("timeline-year");
		yDiv.id = y;
		yDiv.textContent = y;
		const yMarker = document.createElement("div");
		yMarker.classList.toggle("marker", true);
		yDiv.appendChild(yMarker);
		timelineGrid.appendChild(yDiv);
		yCols[y] = `${yearIndex} / ${++yearIndex}`;
		yDiv.style.gridRow = yCols[y];
	});
	timelineGrid.appendChild(yearsCol);

	// === category columns ===
	var gridStartCol = 0;
	const occupied = {};
	console.log(events);
	categories.forEach(cat => {
		gridStartCol += 1;
		//root.style.setProperty("--gridColsMidle", 1);
		let gridEndCol = gridStartCol;
		years.forEach(y => {
			const evs = events.filter(e => e.category === cat && e.start == y);
			const yDiv = document.getElementById(y);
			evs.forEach(ev => {
				console.log(ev);
				const item = document.createElement("div");
				item.classList.add("timeline-item", "category-"+cat);
				item.style.gridRow = generateGridYear(ev);
				
				let colIndex = gridStartCol;
				if (!occupied[colIndex]) occupied[colIndex] = [];
				while (occupied[colIndex].some(r => rangesOverlap(r, ev))) {
					colIndex++;
					occupied[colIndex] = occupied[colIndex] || [];
				}
				occupied[colIndex].forEach(diff => {
					if (rangesAdj(ev, diff) && !diff.shited) {
						ev.shifted = true;
						item.classList.add("exdented");
					}
				});
				occupied[colIndex].push(ev);
				console.log(ev);
				
				if (colIndex > gridEndCol) gridEndCol = colIndex;
				if (cat == "education") item.style.gridColumn = `${colIndex} / ${colIndex + 1}`;
				else item.style.gridColumn = `${colIndex + 2} / ${colIndex + 3}`;
				item.innerHTML = 
				`<div class="timeline-marker top"></div>
				<div class="timeline-content">
					<span class="timeline-title">${ev.title}</span>
					<span class="action">${ev.action}</span>
					${ev.elab ? ev.elab.map(p => `<div class="elab">${p}</div>`).join("") : ""}
				</div>
				<div class="timeline-marker bottom"></div>
				`;
				const lines = document.createElement("div");
				lines.classList.toggle("border-line", true);
				lines.classList.toggle(cat == "education"? "right-side" : "left-side", true);
				if (ev.shifted) lines.classList.toggle("border-line-shifted", true);
				lines.style.gridRow = generateGridYear(ev);
				lines.style.setProperty("--gridColLoc", cat == "education"? colIndex + 1 : colIndex + 2);
				timelineGrid.appendChild(item);
				timelineGrid.appendChild(lines);
			});
			
		});
		gridStartCol = gridEndCol;
		if (cat == "education") root.style.setProperty("--gridColsMidle", gridStartCol);
	});
	root.style.setProperty("--gridColsCount", gridStartCol);

	// inject into your page
	const container = document.getElementById("text-right");
	container.innerHTML = ""; // clear old content
	container.appendChild(timelineGrid);
}

// === builds the left sidebar (skills + languages) ===
function buildSidebar(data) {
	const textLeft = document.getElementById("text-left");
	textLeft.innerHTML = `<h2 class="fact-title-1">מיומנויות</h2>`;

	data.skills.forEach(skill => {
		const div = document.createElement("div");
		div.classList.add("quick-fact", "fact-list");
		div.innerHTML = `<h3 class="fact-title-2">${skill.category}</h3>`;
		const itemsDiv = document.createElement("div");
		itemsDiv.classList.add("fact-data", "indented");
		skill.items.forEach(s => {
			itemsDiv.innerHTML += `<p class="fact-data-item">${s}</p>`;
		});
		div.appendChild(itemsDiv);
		textLeft.appendChild(div);
	});

	textLeft.innerHTML += `<h2 class="fact-title-1">שפות</h2>`;
	data.languages.forEach(lang => {
		textLeft.innerHTML += `
		<div class="quick-fact fact-oneline">
		<b class="fact-title">${lang.name}</b>
		<span class="fact-data">${lang.level}</span>
		</div>
		`;
	});
}

document.addEventListener("DOMContentLoaded", loadResume);
