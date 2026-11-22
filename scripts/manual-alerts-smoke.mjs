import fs from "node:fs";

const env = readEnv(".env.test.local");
const apiDocs = env.API_PIVMA;
if (!apiDocs) throw new Error("API_PIVMA ausente em .env.test.local");
const apiBase = new URL(apiDocs);
apiBase.pathname = apiBase.pathname.replace(/\/docs\/?$/, "") || "/";
apiBase.search = "";
apiBase.hash = "";
const baseUrl = apiBase.toString().replace(/\/$/, "");

const accounts = [
  ["proponent", "PIVMA_DEMO_PROPONENTE_EMAIL", "PIVMA_DEMO_PROPONENTE_PASSWORD"],
  ["bracvam", "PIVMA_DEMO_BRACVAM_EMAIL", "PIVMA_DEMO_BRACVAM_PASSWORD"],
  ["admin", "PIVMA_DEMO_ADMIN_EMAIL", "PIVMA_DEMO_ADMIN_PASSWORD"],
  ["group_manager", "PIVMA_DEMO_GESTOR_EMAIL", "PIVMA_DEMO_GESTOR_PASSWORD"],
  ["sponsor", "PIVMA_DEMO_PATROCINADOR_EMAIL", "PIVMA_DEMO_PATROCINADOR_PASSWORD"],
  ["sample_selection_group", "PIVMA_DEMO_SELECAO_EMAIL", "PIVMA_DEMO_SELECAO_PASSWORD"],
  ["statistician", "PIVMA_DEMO_ESTATISTICO_EMAIL", "PIVMA_DEMO_ESTATISTICO_PASSWORD"],
  ["collaborator", "PIVMA_DEMO_COLABORADOR_EMAIL", "PIVMA_DEMO_COLABORADOR_PASSWORD"],
  ["adhoc_evaluator", "PIVMA_DEMO_ADHOC_EMAIL", "PIVMA_DEMO_ADHOC_PASSWORD"],
  ["lead_laboratory", "PIVMA_DEMO_LAB_LIDER_EMAIL", "PIVMA_DEMO_LAB_LIDER_PASSWORD"],
  ["laboratory_a", "PIVMA_DEMO_LAB_A_EMAIL", "PIVMA_DEMO_LAB_A_PASSWORD"],
  ["laboratory_b", "PIVMA_DEMO_LAB_B_EMAIL", "PIVMA_DEMO_LAB_B_PASSWORD"],
];

let failures = 0;
for (const [role, userKey, passwordKey] of accounts) {
  const username = env[userKey];
  const password = env[passwordKey];
  if (!username || !password) { report(role, "skipped_missing_credentials"); continue; }
  let cookie;
  try {
    const login = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: username, password }),
    });
    cookie = getAccessCookie(login.headers.get("set-cookie"));
    if (!login.ok || !cookie) throw new Error(`login_${login.status}`);

    const all = await getJson(`${baseUrl}/alerts?page=1&per_page=20`, cookie);
    const unread = await getJson(`${baseUrl}/alerts?page=1&per_page=20&unread=true`, cookie);
    const read = await getJson(`${baseUrl}/alerts?page=1&per_page=20&unread=false`, cookie);
    assert(all.response.ok && isAlertList(all.payload), "list_all");
    assert(unread.response.ok && isAlertList(unread.payload) && unread.payload.data.every((item) => item.read_at === null), "list_unread");
    assert(read.response.ok && isAlertList(read.payload) && read.payload.data.every((item) => item.read_at !== null), "list_read");
    assert(all.payload.unread_count === unread.payload.unread_count, "global_unread_count");
    assert(unread.payload.unread_count === read.payload.unread_count, "filter_independent_count");

    const afterLast = await getJson(`${baseUrl}/alerts?page=${Math.max(1, all.payload.pagination.total_pages + 1)}&per_page=20`, cookie);
    assert(afterLast.response.ok && isAlertList(afterLast.payload) && afterLast.payload.data.length === 0, "pagination_after_last_page");
    assert(afterLast.payload.unread_count === all.payload.unread_count, "count_after_last_page");

    const taskIds = all.payload.data.filter((item) => item.target?.type === "task" && typeof item.target.id === "string").map((item) => item.target.id);
    let taskDetailsChecked = 0;
    for (const taskId of taskIds.slice(0, 5)) {
      const detail = await getJson(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`, cookie);
      if (detail.response.ok && typeof detail.payload?.activity_key === "string") taskDetailsChecked += 1;
      else if (detail.response.status !== 404) throw new Error(`task_detail_${detail.response.status}`);
    }
    report(role, `ok alerts=${all.payload.pagination.total_items} unread=${all.payload.unread_count} task_details=${taskDetailsChecked}`);
  } catch (error) {
    failures += 1;
    report(role, `failed ${error instanceof Error ? error.message : "unknown_error"}`);
  } finally {
    if (cookie) await fetch(`${baseUrl}/auth/logout`, { method: "POST", headers: { Cookie: cookie } }).catch(() => undefined);
  }
}

if (failures > 0) process.exitCode = 1;

function readEnv(file) {
  return Object.fromEntries(fs.readFileSync(file, "utf8").split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return [];
    return [[match[1], match[2].replace(/^(['"])(.*)\1$/, "$2")]];
  }));
}

function getAccessCookie(header) {
  const match = header?.match(/(?:^|[,;]\s*)access_token=([^;,\s]+)/);
  return match ? `access_token=${match[1]}` : null;
}

async function getJson(url, cookie) {
  const response = await fetch(url, { headers: { Cookie: cookie }, cache: "no-store" });
  return { response, payload: await response.json().catch(() => null) };
}

function isAlertList(value) {
  return Boolean(value && Array.isArray(value.data) && value.pagination && typeof value.unread_count === "number");
}

function assert(condition, label) {
  if (!condition) throw new Error(label);
}

function report(role, result) {
  process.stdout.write(`${role}: ${result}\n`);
}
