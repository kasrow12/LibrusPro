function clear() {
	chrome.storage.local.clear();
}
document.getElementById('clear').addEventListener('click', clear);

let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}

let klasaRegex = /<th class="big">Klasa <\/th>\n                <td>\n                (.*)\n                <\/td>/;
let nrRegex = /<th class="big">Nr w dzienniku <\/th>\n                <td>\n                    (.*)\n                <\/td>/;

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    browserAPI.storage.local.set({ ["klasa"]: this.responseText.match(klasaRegex)[1] });
    browserAPI.storage.local.set({ ["nr"]: this.responseText.match(nrRegex)[1] });
  }
};
xhttp.open("GET", "https://synergia.librus.pl/informacja", true);
xhttp.send();


// ----------------------------- DEBUG -------------------------
chrome.storage.local.get(null, function(result){
	console.log(result);
	for (var x in result)
	{
		var y = document.createElement("div");
		y.innerHTML = x + ' => ' + result[x];
		console.log(result[x]);
		y.style.marginBottom = "10px";
		document.body.appendChild(y);
	}
})
