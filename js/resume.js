const root = document.documentElement;

async function loadResume() {
	const res = await fetch("js/resume.json");
	const data = await res.json();
	
	buildAbout(data);

	buildTimeline(data);

	buildSidebar(data);
	
	packEvents();
}

function buildAbout(data){
	const container = document.getElementById("sub-header");
	const title = document.createElement("h2");
	title.id = "about-title";
	title.textContent = data.about.title;
	const textContainer = document.createElement("div");
	textContainer.id = "about-text-container";
	textContainer.innerHTML = data.about.text;
	const aboutImg = document.createElement("img");
	aboutImg.src = "https://yairmallah.github.io/portfolio/imgs/s1/dr2.jpg";
	const subContainer = document.createElement("div");
	
	subContainer.appendChild(title);
	subContainer.appendChild(textContainer);
	container.appendChild(subContainer);
	container.appendChild(aboutImg);
	
}

function buildTimeline(data) {
	const container = document.getElementById("text-right");
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
		return `${yCols[evenetItem.start][0]} / ${yCols[evenetItem.end][yCols[evenetItem.end].length - 1] - (evenetItem.start == evenetItem.end ? 0 : 1)}`;
	}
	function loadLegend(container){
		const catTrans = {
			"education": "השכלה",
			"exhibitions": "תערוכות",
			"jobs": "עבודות",
			"projects": "פרוייקטים אישיים"
		}
		
		const legendContainer = document.createElement("div");
		legendContainer.id = "timeline-legend-container";
		legendContainer.classList.add("hidden");
		
		const legendTable = document.createElement("table");
		legendTable.id = "timeline-legend-table";

		categories.forEach(cat => {
			const tr = document.createElement("tr");
			const tdr = document.createElement("td");
			const tdl = document.createElement("td");
			tr.appendChild(tdr);
			tr.appendChild(tdl);
			const legendTag = document.createElement("p");
			legendTag.classList.add("legend-tag");
			legendTag.textContent = catTrans[cat]? catTrans[cat] : cat;
			const legendColor = document.createElement("div");
			legendColor.classList.add(`category-${cat}`, "legend-color");
			tdl.appendChild(legendTag);
			tdr.appendChild(legendColor);
			legendTable.appendChild(tr);
		});
		
		legendContainer.appendChild(legendTable);
		container.appendChild(legendContainer);
	}
	function toggleLegend(){
		document.getElementById("timeline-legend-container").classList.toggle("hidden");
	}
	function parseElab(text) {
		return text.replace(/@([^$@]+)\$@([^$@]+)\$/g,
			(_, label, data) => `<span class="elab-link" data-link="${data}">${label}</span>`
		);
	}
	function presLink(dataLink){
		document.querySelector("#preview-wrapper").classList.toggle("hidden", false);;
		const prevPage = document.querySelector("#preview-img-page");
		prevPage.src = `https://yairmallah.github.io/portfolio/imgDisplay.html?${dataLink}`;
	}
	window.presLink = presLink;




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

	const categories = [...new Set(events.flatMap(e => e.category))];
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
	let gridEndCol = gridStartCol;
	const occupied = {};
	categories.forEach(cat => {
		gridStartCol += 1;
		root.style.setProperty("--gridColsMiddle", 0);
		//let gridEndCol = gridStartCol;
		years.forEach(y => {
			const evs = events.filter(e => e.category === cat && e.start == y);
			const yDiv = document.getElementById(y);
			evs.forEach(ev => {
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
				
				if (colIndex > gridEndCol) gridEndCol = colIndex;
				/*if (cat == "education") item.style.gridColumn = `${colIndex} / ${colIndex + 1}`;
				else */item.style.gridColumn = `${colIndex + 2} / ${colIndex + 3}`;
				item.innerHTML = 
				`<div class="timeline-marker top"></div>
				<div class="timeline-content">
					<div class="content-title">
						<span class="timeline-title">${ev.title}</span> | 
						<span class="action">${ev.action}</span>
					</div>
					${ev.elab ? ev.elab.map(p => `<div class="elab">${parseElab(p)}</div>`).join("") : ""}
				</div>
				<div class="timeline-marker bottom"></div>
				`;
				const lines = document.createElement("div");
				lines.classList.toggle("border-line", true);
				lines.classList.toggle(/*cat == "education"? "right-side" :*/ "left-side", true);
				if (ev.shifted) lines.classList.toggle("border-line-shifted", true);
				lines.style.gridRow = generateGridYear(ev);
				lines.style.setProperty("--gridColLoc", /*cat == "education"? colIndex + 1 :*/ colIndex + 2);
				timelineGrid.appendChild(item);
				timelineGrid.appendChild(lines);
			});
			
		});
		gridStartCol = 0;//gridEndCol;
		//if (cat == "education") root.style.setProperty("--gridColsMiddle", gridStartCol);
	});
	root.style.setProperty("--gridColsCount", /*gridStartCol*/ gridEndCol);
	
	const legend = document.createElement("div");
	legend.id = "timeline-legend";
	legend.addEventListener("click", toggleLegend);
	timelineGrid.appendChild(legend);
	

	// inject into page
	container.innerHTML = ""; // clear old content
	container.appendChild(timelineGrid);
	loadLegend(container);
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

function packEvents(){
	function clearChosenTimlineElenets(){
		document.querySelectorAll(".timeline-item").forEach(elt => {elt.classList.toggle("chosen", false);});
	}
	document.querySelectorAll(".elab-link").forEach(el => {el.addEventListener("click", () => presLink(el.dataset.link));});
	document.querySelector("body").addEventListener("click", e => {
		console.log(!document.querySelector("#timeline-grid").contains(e.target));
		if (e.target === document.querySelector("#timeline-grid")) clearChosenTimlineElenets();;
		if (!e.target.closest("#timeline-grid")) clearChosenTimlineElenets();;
	});
	document.querySelectorAll(".timeline-item").forEach(el => {
		el.addEventListener("click", () => {
			clearChosenTimlineElenets();
			el.classList.toggle("chosen", true);
		});
	});
}

document.addEventListener("DOMContentLoaded", loadResume);
