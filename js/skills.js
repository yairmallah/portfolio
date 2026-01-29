let skl_dict = [];


fetch('./skills/skl.json')
	.then(res => res.json())
	.then(json => {
		skl_dict = json;
		populatePage();
		console.log(skl_dict);
	});

function skill_click(uidn) {
	const all_items = document.getElementsByClassName("menu-item");
	for (const itm of all_items){itm.classList.toggle("chosen", false);}
	const all_items_w = document.getElementsByClassName("menu-item-wrapper");
	for (const itm of all_items_w){itm.classList.toggle("chosen", false);}
	document.getElementById(("menu-item-" + uidn.toString())).classList.toggle("chosen", true);
	document.getElementById(("menu-item-wrapper-" + uidn.toString())).classList.toggle("chosen", true);
	let url = "https://yairmallah.github.io/portfolio/skills/skill.html" + "?file=" + skl_dict[uidn].url;
	if (window.location.host === '127.0.0.4:8080') url = url.replace("https://yairmallah.github.io/portfolio/", "http://127.0.0.4:8080/"); //TODO delete 
	document.getElementById("action-iframe").src = url;
}
function populatePage() {
	const action_iframe = document.getElementById("action-iframe");
	const menu = document.getElementById("menu");
	
	for (let i = 0; i < skl_dict.length; i++){
		let item_cont_w = document.createElement("div");
		item_cont_w.className = "menu-item-wrapper";
		item_cont_w.id = "menu-item-wrapper-" + i.toString();
		let item_cont = document.createElement("div");
		item_cont.className = "menu-item";
		item_cont.id = "menu-item-" + i.toString();
		let item_title = document.createElement("h3");
		item_title.className = "item-title"
		item_title.innerHTML = skl_dict[i]["title"];
		let item_elab = document.createElement("p");
		item_elab.className = "item-elab";
		item_elab.innerHTML = skl_dict[i]["par"];
		let pointer = document.createElement("div");
		pointer.className = "item-pointer";
		item_cont_w.appendChild(pointer);
		item_cont.appendChild(item_title);
		item_cont.appendChild(item_elab);
		item_cont_w.appendChild(item_cont);
		menu.appendChild(item_cont_w);
		item_cont.addEventListener("click", () => skill_click(i));
	}
	action_iframe.addEventListener("load", () => {
		const pRoot = document.documentElement;
		const iRoot = action_iframe.contentDocument.documentElement;

		function syncAll() {
			const styles = getComputedStyle(pRoot);
			for (let i = 0; i < styles.length; i++) {
				const prop = styles[i];
				if (prop.startsWith("--")) {
					iRoot.style.setProperty(prop, styles.getPropertyValue(prop));
				}
			}
		}

		syncAll();

		new MutationObserver(syncAll)
			.observe(pRoot, { attributes: true, attributeFilter: ["style"] });

	});
}
