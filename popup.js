let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}

function clear() {
  if (confirm('Na pewno?'))
	  browserAPI.storage.sync.clear();
}

document.getElementById('clear').addEventListener('click', clear);


const klasaRegex = /<th class="big">Klasa <\/th>\n                <td>\n                (.*)\n                <\/td>/;
const nrRegex = /<th class="big">Nr w dzienniku <\/th>\n                <td>\n                    (.*)\n                <\/td>/;

const xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    browserAPI.storage.sync.set({ ["klasa"]: this.responseText.match(klasaRegex)[1] });
    browserAPI.storage.sync.set({ ["nr"]: this.responseText.match(nrRegex)[1] });
  }
};
xhttp.open("GET", "https://synergia.librus.pl/informacja", true);
xhttp.send();

document.getElementById("ver").innerText = browserAPI.runtime.getManifest().version;

// ----------------------------- DEBUG -------------------------
// browserAPI.storage.sync.get(null, function(result){
// 	console.log(result);
// 	for (var x in result)
// 	{
// 		var y = document.createElement("div");
// 		y.innerText = x + ' => ' + result[x];
// 		console.log(result[x]);
// 		y.style.marginBottom = "10px";
// 		document.body.appendChild(y);
// 	}
// })
