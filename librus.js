// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

// Wiadomości w konsoli
console.log("%cDzięki za korzystanie z rozszerzenia LibrusPro!", "color:#ce84c8;font-family:system-ui;font-size:2rem;-webkit-text-stroke: 1px black;font-weight:bold");
console.log("%cJeżeli znajduje się tutaj cokolwiek czerwonego, bądź nie działa coś związanego z wtyczką, proszę zgłoś to.", "color:#d63d4a;font-size:1rem;font-weight:bold");
console.log(" %cOficjalny Discord: https://discord.gg/e9EkVEvsDr", "color:#90e9f0;");

// Wyświetlanie charakterystycznych dymków po najechaniu na dane elementy
document.addEventListener('refreshjQueryTitles', () => {
  try {
    $('.librusPro_jqueryTitle').tooltip({
      track: true,
      show: {
        delay: 200,
        duration: 200
      },
      hide: {
        delay: 100,
        duration: 200
      }
    }).removeClass("librusPro_jqueryTitle");
  } catch (e) {
    console.log("[LibrusPro] Błąd podczas ładowania dymków jQuery");
  }
});

// Załadowanie strony w tle co 20 minut, aby utrzymać sesję i nie wylogowywało
function refreshLibrus() {
  fetch('https://synergia.librus.pl/wiadomosci', { cache: 'no-cache', credentials: 'same-origin' });
  fetch('https://synergia.librus.pl/refreshToken');
}

setInterval(refreshLibrus, 20*60*1000);

// Schowanie paska z zachowaniem
function collapseBehavior() {
  const sinceLastLoginView = document.querySelector("form > div > h2")?.innerText.includes("-") ?? false;

  if (sinceLastLoginView) {
    // Ukrycie zachowania, jeśli nie zostało zmienione
    const zachowanieTr = document.querySelector("form[name=\"PrzegladajOceny\"] > div > div > table > tbody > tr.bolded:not(.librusPro_no-grades-row)");
    let toHide = true;
    zachowanieTr.querySelectorAll(".center:not(:first-child)").forEach((e) => {
      if (e.innerText !== "-")
        toHide = false;
    });
    if (toHide)
      zachowanieTr.style.display = "none";
  } else {
    // Zwinięcie zachowania
    showHide.ShowHide("zachowanie")

    if (document.getElementById("przedmioty_OP_zachowanie_node"))
      showHideOP.ShowHide("zachowanie");
  }
}

if (window.location.href.indexOf("przegladaj_oceny/uczen") > -1) {
  collapseBehavior();
}
