/* eslint-disable @typescript-eslint/no-require-imports -- Node's built-in test runner loads this CommonJS test directly. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "../types/Alerta.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const alertModule = new Module(sourcePath, module);
alertModule.filename = sourcePath;
alertModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
alertModule._compile(compiled, sourcePath);
const {
  normalizeAlertDate,
  normalizeUserAlert,
  normalizeAlertList,
  normalizeAlertReadAll,
  resolveAlertDestination,
  reconcileAlertRead,
  reconcileAllAlertsRead,
} = alertModule.exports;

const validAlert = {
  id: "6f1c2a9e-5b1d-4c7e-9a40-0d3b8f1e2a11",
  kind: "future_alert_kind",
  target: { type: "future_target", process_id: "a3b2c1d0-1111-4a2b-8c3d-4e5f6a7b8c9d", id: null },
  params: { process_code: "VAL-2026-0012", count: 2, active: true, optional: null },
  read_at: null,
  created_at: "2026-11-21T14:00:00",
};

test("interprets timestamps without an offset as UTC regardless of host timezone", () => {
  const previous = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
  try {
    assert.equal(normalizeAlertDate("2026-11-24T14:00:00"), "2026-11-24T14:00:00.000Z");
    assert.equal(normalizeAlertDate("2026-11-24T14:00:00-03:00"), "2026-11-24T17:00:00.000Z");
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("rejects invalid date strings", () => {
  assert.equal(normalizeAlertDate("yesterday"), null);
  assert.equal(normalizeAlertDate("2026-11-24"), null);
});

test("normalizes alerts while preserving future kinds, targets, and scalar params", () => {
  const alert = normalizeUserAlert(validAlert);
  assert.equal(alert.kind, "future_alert_kind");
  assert.equal(alert.target.type, "future_target");
  assert.deepEqual(alert.params, validAlert.params);
  assert.equal(alert.created_at, "2026-11-21T14:00:00.000Z");
});

test("rejects alerts with nested params or malformed required fields", () => {
  assert.equal(normalizeUserAlert({ ...validAlert, params: { nested: { secret: true } } }), null);
  assert.equal(normalizeUserAlert({ ...validAlert, target: { ...validAlert.target, process_id: null } }), null);
  assert.equal(normalizeUserAlert({ ...validAlert, created_at: "invalid" }), null);
});

test("normalizes the list envelope and rejects invalid pagination", () => {
  const envelope = {
    data: [validAlert],
    pagination: { page: 1, per_page: 20, total_items: 1, total_pages: 1, has_next: false, has_prev: false },
    filters_applied: { unread: null },
    sort: { by: "created_at", order: "desc" },
    unread_count: 1,
  };
  assert.equal(normalizeAlertList(envelope).data.length, 1);
  assert.equal(normalizeAlertList({ ...envelope, pagination: { ...envelope.pagination, page: 0 } }), null);
});

test("normalizes read-all counts and rejects negative values", () => {
  assert.deepEqual(normalizeAlertReadAll({ updated: 3 }), { updated: 3 });
  assert.equal(normalizeAlertReadAll({ updated: -1 }), null);
});

test("resolves process, task, and sample receipt targets to internal routes", () => {
  const processId = validAlert.target.process_id;
  assert.equal(resolveAlertDestination({ ...validAlert.target, type: "process" }, "sponsor"), `/acompanhamento/${processId}`);
  assert.equal(resolveAlertDestination({ ...validAlert.target, type: "task", id: validAlert.id }, "bracvam", "triage_evaluation"), `/triagem?processId=${processId}`);
  assert.equal(resolveAlertDestination({ ...validAlert.target, type: "sample_receipt", id: validAlert.id }, "participating_laboratory"), `/processos/${processId}/recebimento-amostras?vialId=${validAlert.id}`);
});

test("does not resolve malformed identifiers or unknown target types", () => {
  assert.equal(resolveAlertDestination({ ...validAlert.target, type: "process", process_id: "bad" }, "platform"), null);
  assert.equal(resolveAlertDestination(validAlert.target, "platform"), null);
});

test("optimistically reconciles individual reads for all and unread filters", () => {
  const list = normalizeAlertList({
    data: [validAlert, { ...validAlert, id: "9d0e8f7a-2222-4b3c-9d4e-5f6a7b8c9d0e", read_at: "2026-11-21T15:00:00Z" }],
    pagination: { page: 1, per_page: 20, total_items: 2, total_pages: 1, has_next: false, has_prev: false },
    filters_applied: { unread: null },
    sort: { by: "created_at", order: "desc" },
    unread_count: 1,
  });
  const readAt = "2026-11-22T12:00:00.000Z";
  const all = reconcileAlertRead(list, validAlert.id, readAt, false);
  assert.equal(all.data[0].read_at, readAt);
  assert.equal(all.data[1].read_at, "2026-11-21T15:00:00.000Z");
  assert.equal(all.unread_count, 0);
  const unreadList = { ...list, data: list.data.filter((alert) => alert.read_at === null) };
  const unread = reconcileAlertRead(unreadList, validAlert.id, readAt, true);
  assert.equal(unread.data.length, 0);
  assert.equal(unread.unread_count, 0);
});

test("optimistically marks all visible alerts read and retains the all filter history", () => {
  const list = normalizeAlertList({
    data: [validAlert],
    pagination: { page: 1, per_page: 20, total_items: 1, total_pages: 1, has_next: false, has_prev: false },
    filters_applied: { unread: true },
    sort: { by: "created_at", order: "desc" },
    unread_count: 1,
  });
  const readAt = "2026-11-22T12:00:00.000Z";
  assert.equal(reconcileAllAlertsRead(list, readAt, true).data.length, 0);
  const all = reconcileAllAlertsRead(list, readAt, false);
  assert.equal(all.data[0].read_at, readAt);
  assert.equal(all.unread_count, 0);
});

test("keeps alert message keys aligned across Portuguese and English dictionaries", () => {
  const pt = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../i18n/locales/pt-BR.json"), "utf8")).alerts;
  const en = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../i18n/locales/en.json"), "utf8")).alerts;
  assert.deepEqual(Object.keys(pt.kinds).sort(), Object.keys(en.kinds).sort());
  assert.deepEqual(Object.keys(pt.taskOpened).sort(), Object.keys(en.taskOpened).sort());
  assert.deepEqual(Object.keys(pt.submissionStatus).sort(), Object.keys(en.submissionStatus).sort());
  assert.equal(pt.generic.includes("{{code}}"), en.generic.includes("{{code}}"));
});
