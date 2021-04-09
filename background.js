// LibrusPro
// Browser Extension
// Author: Maks Kowalski
// Contact: kasrow12 (at) gmail.com

let browserAPI;
if (typeof chrome != null) {
  browserAPI = chrome;
} else {
  browserAPI = browser;
}

let darkTheme = true;

browserAPI.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  if (tab.url != null) {
    if (tab.url.indexOf("https://synergia.librus.pl/") > -1 && darkTheme) {
      browserAPI.tabs.insertCSS({ file:"librusPro_stylesheet.css", runAt: "document_start" }, () => chrome.runtime.lastError);
    }
  }
});

browserAPI.tabs.onActivated.addListener(function(info) {
  browserAPI.tabs.get(info.tabId, function(tab) {
    if (tab.url != null) {
      if (tab.url.indexOf("https://synergia.librus.pl/") > -1 && darkTheme) {
        browserAPI.tabs.insertCSS({ file:"librusPro_stylesheet.css", runAt: "document_start" }, () => chrome.runtime.lastError);
      }
    }
  });
});

browserAPI.storage.sync.get(["options"], function(t) {
  options = t["options"];
  if (options != null) {
    darkTheme = options.darkTheme;
  }
});

browserAPI.storage.onChanged.addListener((changes, namespace) => {
  for (let key in changes) {
    if (key === "options") {
      darkTheme = changes.options.newValue.darkTheme;
    }
  }
});