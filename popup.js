const siteInput = document.getElementById("siteInput");
const siteList = document.getElementById("siteList");
const addSiteButton = document.getElementById("addSite");
const toggleProxyCheckbox = document.getElementById("toggleProxy");
const proxyInput = document.getElementById("proxyInput");
const saveProxyConfigButton = document.getElementById("saveProxyConfig");

let isProxyEnabled = false;

// Проверка корректности URL для сайта
function isValidUrl(site) {
  const pattern = /^(https?:\/\/)?([\w\-]+\.)+[a-z]{2,6}(:\d+)?(\/[^\s]*)?$/i;
  return pattern.test(site);
}

// Загрузка дефолтных настроек прокси и сайтов
function loadDefaults() {
  chrome.storage.sync.get(["proxyConfig", "proxySites", "isProxyEnabled"], (data) => {
    // Загрузка дефолтного прокси
    const defaultProxy = data.proxyConfig || { scheme: "http", host: "127.0.0.1", port: 2080 };
    proxyInput.value = `${defaultProxy.scheme}://${defaultProxy.host}:${defaultProxy.port}`;

    // Загрузка дефолтных сайтов
    const defaultSites = data.proxySites || ["chatgpt.com", "play.google.com"];
    chrome.storage.sync.set({ proxySites: defaultSites });
    displaySites(defaultSites);

    // Установка состояния переключателя прокси
    isProxyEnabled = data.isProxyEnabled || false;
    toggleProxyCheckbox.checked = isProxyEnabled;
  });
}

// Отображение списка сайтов
function displaySites(sites) {
  siteList.innerHTML = "";
  sites.forEach((site, index) => {
    const li = document.createElement("li");
    li.textContent = site;

    const removeButton = document.createElement("button");
    removeButton.textContent = "Удалить";
    removeButton.addEventListener("click", () => {
      removeSite(index);
    });

    li.appendChild(removeButton);
    siteList.appendChild(li);
  });
}

// Добавление нового сайта
function addSite() {
  const newSite = siteInput.value.trim();
  if (newSite && isValidUrl(newSite)) {
    chrome.storage.sync.get("proxySites", (data) => {
      const sites = data.proxySites || [];
      sites.push(newSite);
      chrome.storage.sync.set({ proxySites: sites }, () => displaySites(sites));
      siteInput.value = "";  // Очистка поля ввода
    });
  } else {
    alert("Введите корректный URL");
  }
}

// Удаление сайта
function removeSite(index) {
  chrome.storage.sync.get("proxySites", (data) => {
    const sites = data.proxySites || [];
    sites.splice(index, 1);
    chrome.storage.sync.set({ proxySites: sites }, () => displaySites(sites));
  });
}

// Проверка корректности прокси
function isValidProxy(proxy) {
  const pattern = /^(https?|socks5):\/\/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}):(\d{1,5})$/;
  return pattern.test(proxy);
}

// Сохранение настроек прокси
function saveProxyConfig() {
  const proxy = proxyInput.value.trim();
  
  if (isValidProxy(proxy)) {
    const [scheme, hostPort] = proxy.split("://");
    const [host, port] = hostPort.split(":");

    chrome.storage.sync.set({
      proxyConfig: { scheme, host, port: parseInt(port, 10) }
    }, () => {
      alert("Настройки прокси сохранены!");
    });
  } else {
    alert("Введите корректный прокси в формате схема://хост:порт");
  }
}

// Обработка переключателя активации прокси
toggleProxyCheckbox.addEventListener("change", () => {
  isProxyEnabled = toggleProxyCheckbox.checked;
  chrome.storage.sync.set({ isProxyEnabled }, () => {
    alert(`Прокси ${isProxyEnabled ? 'включен' : 'выключен'}`);
  });
});

// Слушатели событий
addSiteButton.addEventListener("click", addSite);
saveProxyConfigButton.addEventListener("click", saveProxyConfig);
siteInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    addSite();
  }
});

// Загрузка начальных данных
loadDefaults();
