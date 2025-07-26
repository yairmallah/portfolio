function waitForObj(objID, callback, timeout = 2000) {
	const start = Date.now();
	(function check() {
		const fn = document.getElementById(objID)
		if ( fn != null) {
			callback(fn); // success!
		} else if (Date.now() - start < timeout) {
			setTimeout(check, 50); // keep checking
		} else {
		console.warn(`${objID} not available in iframe after timeout`);
		}
	})();
}


function loadInclude(id, file) {
	fetch(file)
	.then(res => {
		if (!res.ok) throw new Error(`Failed to load ${file}`);
		return res.text();
	})
	.then(data => {
		document.getElementById(id).innerHTML = data;
	})
	.catch(err => console.error(err));
}

// header and footer
loadInclude("header", "header.html");
loadInclude("footer", "footer.html");

// dismplay modes
import { toggleMode, darkValues } from './displayModes.js';
window.toggleMode = toggleMode;

let isDark = sessionStorage.getItem("isDark") || true;
toggleMode(isDark);
let toggleModes = ["toggle-light", "toggle-dark"];
toggleModes.forEach(togId => {waitForObj(togId, ()=>{document.getElementById(togId).addEventListener("click", () => {toggleMode(togId.includes("dark") ? true : false)});})});
