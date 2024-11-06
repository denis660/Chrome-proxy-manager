// Применение настроек прокси
function applyProxyConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["proxyConfig"], (data) => {
      const config = data.proxyConfig || { scheme: "http", host: "127.0.0.1", port: 2080 };
      resolve({
        mode: "fixed_servers",
        rules: {
          singleProxy: {
            scheme: config.scheme,
            host: config.host,
            port: config.port
          }
        }
      });
    });
  });
}

// Сбрасываем прокси на прямое соединение
function clearProxy() {
  chrome.proxy.settings.set(
    { value: { mode: "direct" }, scope: "regular" },
    () => {}
  );
}

// Проверка и установка прокси
function checkAndApplyProxy(url) {
  chrome.storage.sync.get(["proxySites", "isProxyEnabled"], async (data) => {
    const proxySites = data.proxySites || [];
    const isProxyEnabled = data.isProxyEnabled || false;

    if (!isProxyEnabled) {
      clearProxy();
      return;
    }

    const shouldProxy = proxySites.some(site => {
      const domainPattern = new RegExp(`(^|\\.)${site.replace('.', '\\.')}(\\/|$)`);
      return domainPattern.test(new URL(url).hostname);
    });

    if (shouldProxy) {
      const proxyConfig = await applyProxyConfig();
      chrome.proxy.settings.set(
        { value: proxyConfig, scope: "regular" },
        () => {}
      );
    } else {
      clearProxy();
    }
  });
}

// Слушатель для обновления URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    checkAndApplyProxy(changeInfo.url);
  }
});

// Слушатель для переключения вкладок
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab.url) {
      checkAndApplyProxy(tab.url);
    }
  });
});

// Слушатель для изменения состояния прокси (активация/деактивация)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.isProxyEnabled) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        checkAndApplyProxy(tabs[0].url);
      }
    });
  }
});
