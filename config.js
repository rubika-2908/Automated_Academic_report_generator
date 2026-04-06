(function setAppConfig() {
  const LOCAL_API_BASE_URL = "http://localhost:5000/api";
  const DEPLOYED_API_BASE_URL = "https://your-railway-app.up.railway.app/api";
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  let savedApiBaseUrl = "";
  try {
    savedApiBaseUrl = window.localStorage.getItem("academic_api_base_url") || "";
  } catch {
    savedApiBaseUrl = "";
  }

  const configuredApiBaseUrl =
    window.__API_BASE_URL__ || savedApiBaseUrl || (isLocalhost ? LOCAL_API_BASE_URL : DEPLOYED_API_BASE_URL);

  window.APP_CONFIG = {
    apiBaseUrl: configuredApiBaseUrl.replace(/\/+$/, ""),
  };
})();
