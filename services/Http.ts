import "server-only";

import axios from "axios";

export const http = axios.create({
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  config.baseURL ??= getApiConfiguration().baseURL;
  return config;
});

export function getApiOrigin() {
  return getApiConfiguration().origin;
}

function getApiConfiguration() {
  const configuredApiUrl = process.env.API_PIVMA;

  if (!configuredApiUrl) {
    throw new Error("A variável de ambiente API_PIVMA não foi configurada.");
  }

  const parsedApiUrl = new URL(configuredApiUrl);
  parsedApiUrl.hash = "";
  parsedApiUrl.search = "";
  parsedApiUrl.pathname = parsedApiUrl.pathname.replace(/\/docs\/?$/, "") || "/";

  return {
    baseURL: parsedApiUrl.toString().replace(/\/$/, ""),
    origin: parsedApiUrl.origin,
  };
}
