const root = document.documentElement;
const params = new URLSearchParams(window.location.search);
const jsonFile = params.get('file') || '/skills/parDesign.json';  // fallback to default
/*
data has 
{	title:"",
	exmaples: [
		{main: {type:"", url:""}
		text: ""
		supp: {type:"", url:""}},
		...
	]
}
types are: "html", "image", "video"
*/

async function load() {
	const res = await fetch(jsonFile);
	const data = await res.json();
	await unpackData(data);
	
	packEvents();
}


async function getItem(item) {
	if (item.type === "html") {
		const response = await fetch(item.url);
		const html = await response.text();

		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");

		const holder = document.createElement("div");
		holder.className = doc.body.className;
		holder.id = doc.body.id;
		holder.classList.toggle("code", true);
		holder.append(...doc.body.childNodes); // copy content

		return holder;
	}

	if (item.type === "image") {
		const holder = document.createElement("img");
		holder.src = item.url;
		return holder;
	}

	if (item.type === "video") {
		const holder = document.createElement("video");
		holder.src = item.url;
		return holder;
	}
}


async function unpackData(data){
	document.querySelector("title").textContext = data.title;
	const examples_container = document.getElementById("examples-container");
	for (const item of data.examples){
		const cont = document.createElement("div");
		cont.className = "item-cont";
		const main = document.createElement("div");
		main.className = "main";
		main.dataset.link = item.main.url;
		const main_cont = await getItem(item.main);
		main.appendChild(main_cont);
		const supp = document.createElement("div");
		supp.className = "supp";
		supp.dataset.link = item.supp.url;
		const supp_cont = await getItem(item.supp);
		supp.appendChild(supp_cont);
		const text_container = document.createElement("div");
		text_container.className = "text-container"
		text_container.innerHTML = item.text;
		cont.appendChild(main);
		cont.appendChild(supp);
		cont.appendChild(text_container);
		examples_container.appendChild(cont);
	}
}

function packEvents(){
	document.querySelectorAll(".main").forEach(el => {
		el.addEventListener("click", () => {
			parent.childClicked(el.dataset.link);
		});
	});
	document.querySelectorAll(".supp").forEach(el => {
		el.addEventListener("click", () => {
			parent.childClicked(el.dataset.link);
		});
	});
	
}

document.addEventListener("DOMContentLoaded", load);
