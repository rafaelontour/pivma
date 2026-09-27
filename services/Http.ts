import "server-only";

import axios from "axios";

const configuredApiUrl = process.env.API_PIVMA;

if (!configuredApiUrl) {
  throw new Error("A variável de ambiente API_PIVMA não foi configurada.");
}

const parsedApiUrl = new URL(configuredApiUrl);
parsedApiUrl.hash = "";
parsedApiUrl.search = "";
parsedApiUrl.pathname = parsedApiUrl.pathname.replace(/\/docs\/?$/, "") || "/";

const baseURL = parsedApiUrl.toString().replace(/\/$/, "");

export const apiOrigin = parsedApiUrl.origin;

export const http = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});
