export const darkValues={
	false: {
		"--bgBody":"#fff",
		"--textColor": "black",
		"--invBg": "black",

		"--scrollbarColor":"#ccc",
		"--scrollbarHover":"#666",
		"--darkButtonRot": "0 0 1 180deg"
	},
	true: {
		"--bgBody":"#000",
		"--textColor": "white",
		"--invBg": "white",
		
		"--scrollbarColor":"#333",
		"--scrollbarHover":"#999",
		"--darkButtonRot": "0 0 1 0deg"
	}
	
};


export const toggleMode=(isDark)=>{
	Object.keys(darkValues[isDark]).forEach(varMode => {
		const root = document.documentElement;
		root.style.setProperty(varMode, darkValues[isDark][varMode]);
	});
	sessionStorage.setItem("isDark", isDark);
};
