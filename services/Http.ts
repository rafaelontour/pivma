import "server-only";

import axios from "axios";

const baseURL = process.env.PIVMA_API_URL ?? "https://api.pivma.acerola.dev.br";

export const apiOrigin = new URL(baseURL).origin;

export const http = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});
