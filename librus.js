// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

// Wiadomość w konsoli
console.log("%cDzięki za korzystanie z rozszerzenia LibrusPro!", "color:#ce84c8;font-family:system-ui;font-size:2rem;-webkit-text-stroke: 1px black;font-weight:bold");
console.log("%cJeżeli znajduje się tutaj cokolwiek czerwonego, bądź nie działa coś związanego z wtyczką, proszę zgłoś to.", "color:#d63d4a;font-size:1rem;font-weight:bold");
console.log(" %cOficjalny Discord: https://discord.gg/e9EkVEvsDr", "color:#90e9f0;");

// Wyświetlanie charakterystycznych dymków po najechaniu na dane elementy
document.addEventListener("refreshjQueryTitles", () => {
  $(".librusPro_jqueryTitle")
    .tooltip({
      track: true,
      show: {
        delay: 200,
        duration: 200,
      },
      hide: {
        delay: 100,
        duration: 200,
      },
    })
    .removeClass("librusPro_jqueryTitle");
});

// Załadowanie strony w tle co 20 minut, aby utrzymać sesję i nie wylogowywało
function refreshLibrus() {
  fetch('https://synergia.librus.pl/wiadomosci', { cache: 'no-cache', credentials: 'same-origin' });
  fetch('https://synergia.librus.pl/refreshToken');
}

setInterval(refreshLibrus, 20*60*1000);