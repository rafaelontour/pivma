import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { getApiOrigin, http } from "./Http";
import type {
  Institution,
  InstitutionNameInput,
  InstitutionalCatalogSnapshot,
  InstitutionalListResponse,
  InstitutionalPagination,
  InstitutionRef,
  Laboratory,
  LaboratoryCreateInput,
} from "@/types/Institucional";
import type { ApiRecord, ServiceResult } from "@/types/Servico";

const PAGE_SIZE = 100;

export async function listInstitutionalCatalog(
  accessToken: string,
): Promise<ServiceResult<InstitutionalCatalogSnapshot>> {
  const [institutions, laboratories] = await Promise.all([
    listAllInstitutions(accessToken),
    listAllLaboratories(accessToken),
  ]);
  if (!institutions.ok) return institutions;
  if (!laboratories.ok) return laboratories;
  return {
    ok: true,
    data: { institutions: institutions.data, laboratories: laboratories.data },
  };
}

export async function createInstitution(
  accessToken: string,
  input: InstitutionNameInput,
): Promise<ServiceResult<Institution>> {
  return mutateInstitution(accessToken, "post", "/institutional/institutions", input);
}

export async function renameInstitution(
  accessToken: string,
  institutionId: string,
  input: InstitutionNameInput,
): Promise<ServiceResult<Institution>> {
  return mutateInstitution(accessToken, "patch", `/institutional/institutions/${institutionId}`, input);
}

export async function deactivateInstitution(
  accessToken: string,
  institutionId: string,
): Promise<ServiceResult<null>> {
  const [error] = await tryit(() =>
    http.delete(`/institutional/institutions/${institutionId}`, {
      headers: mutationHeaders(accessToken),
    }),
  )();
  return error ? { ok: false, status: getStatus(error) } : { ok: true, data: null };
}

export async function createLaboratory(
  accessToken: string,
  input: LaboratoryCreateInput,
): Promise<ServiceResult<Laboratory>> {
  return mutateLaboratory(accessToken, "post", "/institutional/laboratories", input);
}

export async function renameLaboratory(
  accessToken: string,
  laboratoryId: string,
  input: InstitutionNameInput,
): Promise<ServiceResult<Laboratory>> {
  return mutateLaboratory(accessToken, "patch", `/institutional/laboratories/${laboratoryId}`, input);
}

export async function deactivateLaboratory(
  accessToken: string,
  laboratoryId: string,
): Promise<ServiceResult<null>> {
  const [error] = await tryit(() =>
    http.delete(`/institutional/laboratories/${laboratoryId}`, {
      headers: mutationHeaders(accessToken),
    }),
  )();
  return error ? { ok: false, status: getStatus(error) } : { ok: true, data: null };
}

async function listAllInstitutions(accessToken: string): Promise<ServiceResult<Institution[]>> {
  const items: Institution[] = [];
  let page = 1;
  while (true) {
    const result = await listInstitutionPage(accessToken, page);
    if (!result.ok) return result;
    items.push(...result.data.items);
    if (!result.data.pagination.has_next) return { ok: true, data: items };
    page += 1;
  }
}

async function listAllLaboratories(accessToken: string): Promise<ServiceResult<Laboratory[]>> {
  const items: Laboratory[] = [];
  let page = 1;
  while (true) {
    const result = await listLaboratoryPage(accessToken, page);
    if (!result.ok) return result;
    items.push(...result.data.items);
    if (!result.data.pagination.has_next) return { ok: true, data: items };
    page += 1;
  }
}

async function listInstitutionPage(accessToken: string, page: number): Promise<ServiceResult<InstitutionalListResponse<Institution>>> {
  const [error, response] = await tryit(() => http.get<unknown>("/institutional/institutions", {
    headers: authHeaders(accessToken),
    params: { page, per_page: PAGE_SIZE },
  }))();
  if (error) return { ok: false, status: getStatus(error) };
  const data = normalizeList(response.data, normalizeInstitution);
  return data ? { ok: true, data } : { ok: false };
}

async function listLaboratoryPage(accessToken: string, page: number): Promise<ServiceResult<InstitutionalListResponse<Laboratory>>> {
  const [error, response] = await tryit(() => http.get<unknown>("/institutional/laboratories", {
    headers: authHeaders(accessToken),
    params: { page, per_page: PAGE_SIZE },
  }))();
  if (error) return { ok: false, status: getStatus(error) };
  const data = normalizeList(response.data, normalizeLaboratory);
  return data ? { ok: true, data } : { ok: false };
}

async function mutateInstitution(
  accessToken: string,
  method: "post" | "patch",
  path: string,
  input: InstitutionNameInput,
): Promise<ServiceResult<Institution>> {
  const [error, response] = await tryit(() => http.request<unknown>({
    method,
    url: path,
    data: input,
    headers: mutationHeaders(accessToken),
  }))();
  if (error) return { ok: false, status: getStatus(error) };
  const data = normalizeInstitution(response.data);
  return data ? { ok: true, data } : { ok: false };
}

async function mutateLaboratory(
  accessToken: string,
  method: "post" | "patch",
  path: string,
  input: InstitutionNameInput | LaboratoryCreateInput,
): Promise<ServiceResult<Laboratory>> {
  const [error, response] = await tryit(() => http.request<unknown>({
    method,
    url: path,
    data: input,
    headers: mutationHeaders(accessToken),
  }))();
  if (error) return { ok: false, status: getStatus(error) };
  const data = normalizeLaboratory(response.data);
  return data ? { ok: true, data } : { ok: false };
}

function normalizeList<T>(
  value: unknown,
  normalizeItem: (item: unknown) => T | null,
): InstitutionalListResponse<T> | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  const pagination = normalizePagination(value.pagination);
  const items = value.data.map(normalizeItem);
  if (!pagination || items.some((item) => item === null)) return null;
  return { items: items as T[], pagination };
}

function normalizePagination(value: unknown): InstitutionalPagination | null {
  if (!isRecord(value)) return null;
  return typeof value.page === "number" && typeof value.per_page === "number" &&
    typeof value.total_items === "number" && typeof value.total_pages === "number" &&
    typeof value.has_next === "boolean" && typeof value.has_prev === "boolean"
    ? value as InstitutionalPagination
    : null;
}

function normalizeInstitution(value: unknown): Institution | null {
  if (!isRecord(value) || !isInstitutionRef(value) || !isAuditRecord(value)) return null;
  return value as Institution;
}

function normalizeLaboratory(value: unknown): Laboratory | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" ||
    typeof value.active !== "boolean" || !isInstitutionRef(value.institution) || !isAuditRecord(value)) return null;
  return value as Laboratory;
}

function isInstitutionRef(value: unknown): value is InstitutionRef {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.active === "boolean";
}

function isAuditRecord(value: ApiRecord) {
  return nullableString(value.created_by) && typeof value.created_at === "string" &&
    nullableString(value.updated_by) && nullableString(value.updated_at) &&
    nullableString(value.deleted_by) && nullableString(value.deleted_at);
}

function nullableString(value: unknown) {
  return value === null || typeof value === "string";
}

function authHeaders(accessToken: string) {
  return { Cookie: `access_token=${accessToken}` };
}

function mutationHeaders(accessToken: string) {
  return { ...authHeaders(accessToken), Origin: getApiOrigin() };
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
