# Instalacja developerskiej wersji Librus Ultra

Wersja developerska jest ładowana bezpośrednio z rozpakowanego folderu. Zmiany w kodzie możesz wprowadzać lokalnie; po ich zapisaniu przeładuj rozszerzenie w przeglądarce.

## Chrome, Edge i inne przeglądarki Chromium

1. Pobierz repozytorium z GitHuba przez **Code → Download ZIP** albo sklonuj je poleceniem `git clone https://github.com/RUTUJEKWIELKI/LibrusUltra.git`.
2. Rozpakuj archiwum. Jeśli pobierasz wydanie z zakładki **Releases**, rozpakuj plik `Librus-Ultra-Chrome-WERSJA.zip`.
3. Otwórz stronę rozszerzeń:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
4. Włącz **Tryb programisty**.
5. Kliknij **Załaduj rozpakowane** i wskaż folder zawierający plik `manifest.json`. Dla pobranego repozytorium będzie to główny folder `LibrusUltra`; dla wydania — rozpakowany folder Chrome.
6. Otwórz Librus Synergia. Po zmianie plików kliknij przy rozszerzeniu **Odśwież**, a potem odśwież kartę Librusa.

## Firefox

Firefox używa osobnego manifestu. Najłatwiej zainstalować developerskie wydanie z pliku `Librus-Ultra-Firefox-WERSJA.zip` w sekcji **Releases**:

1. Pobierz i rozpakuj archiwum Firefox.
2. Otwórz `about:debugging#/runtime/this-firefox`.
3. Kliknij **Wczytaj tymczasowy dodatek…** i wybierz plik `manifest.json` z rozpakowanego folderu.
4. Po zmianach w kodzie kliknij **Przeładuj** przy dodatku i odśwież kartę Librusa.

Dodatek załadowany w ten sposób jest tymczasowy i znika po zamknięciu Firefoksa. Stała instalacja wymaga podpisanego dodatku `.xpi`; workflow tworzy archiwum `.zip` do instalacji developerskiej, nie podpisany pakiet sklepu.

## Pliki wydań na GitHubie

Workflow `.github/workflows/release-assets.yml` uruchamia się po opublikowaniu GitHub Release. Do wydania dołącza:

- `Librus-Ultra-Chrome-WERSJA.zip` — Chrome, Edge i Brave,
- `Librus-Ultra-Firefox-WERSJA.zip` — Firefox,
- `SHA256SUMS.txt` — sumy kontrolne obu archiwów.

Żeby przygotować wydanie:

1. Ustaw tę samą wersję w polach `version` w `manifest.json` i `manifest_ff.json`, np. `4.0.3`, i zapisz zmiany w repozytorium.
2. Najpierw wypchnij zmiany wraz z workflowem na domyślną gałąź repozytorium.
3. Na GitHubie otwórz **Releases → Draft a new release**.
4. Utwórz tag `v4.0.3` wskazujący na commit z tymi zmianami i opublikuj wydanie.
5. Workflow sprawdzi, czy wersje w obu manifestach zgadzają się z tagiem, po czym doda archiwa Chrome i Firefox oraz `SHA256SUMS.txt` do wydania. Wynik działania sprawdzisz w zakładce **Actions**.

Workflow uruchamia się po opublikowaniu wydania, nie po samym utworzeniu wersji roboczej. Nie publikuje dodatku w Chrome Web Store ani Mozilla Add-ons.
