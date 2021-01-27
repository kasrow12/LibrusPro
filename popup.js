function clear() {
	chrome.storage.local.clear();
}
document.getElementById('clear').addEventListener('click', clear);

// ----------------------------- DEBUG -------------------------
// chrome.storage.local.get(null, function(result){
// 	console.log(result);
// 	for (var x in result)
// 	{
// 		var y = document.createElement("div");
// 		y.innerHTML = x + ' => ' + result[x];
// 		console.log(result[x]);
// 		y.style.marginBottom = "10px";
// 		document.body.appendChild(y);
// 	}
// })
