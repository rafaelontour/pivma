"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AccessPanelProps,
  AccessPanelState,
  CreateProfileDialogProps,
  DirectoryMessageProps,
  ModalShellProps,
  UserEditDialogProps,
} from "@/types/AreaAutenticada";
import type {
  CreateProfileState,
  PermissionDefinition,
  PermissionProfile,
  UserAccess,
} from "@/types/Rbac";
import type { ApiRecord } from "@/types/Servico";
import type {
  CurrentUser,
  UserDirectoryFilters,
  UserDirectoryStatus,
  UserEditState,
  UserList,
  UserListItem,
  UserPublic,
} from "@/types/Usuario";

const USER_PAGE_SIZE = 100;
const EMPTY_PROFILE: CreateProfileState = {
  name: "",
  description: "",
  permissionCodes: [],
  isSaving: false,
};

export function UserDirectory() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<UserDirectoryFilters>({
    search: "",
    active: "true",
  });
  const [status, setStatus] = useState<UserDirectoryStatus>("loading");
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionDefinition[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [accessPanel, setAccessPanel] = useState<AccessPanelState>({ kind: "closed" });
  const [editState, setEditState] = useState<UserEditState | null>(null);
  const [profileState, setProfileState] = useState<CreateProfileState | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDirectory() {
      setStatus("loading");

      try {
        const query = createUserQuery(filters, 0);
        const [usersResponse, sessionResponse] = await Promise.all([
          fetch(`/api/users?${query}`, { cache: "no-store", signal: controller.signal }),
          fetch("/api/auth/me", { cache: "no-store", signal: controller.signal }),
        ]);
        const [usersPayload, sessionPayload] = await Promise.all([
          usersResponse.json().catch(() => null),
          sessionResponse.json().catch(() => null),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        if (sessionResponse.ok && isCurrentUser(sessionPayload)) {
          setPermissions(sessionPayload.permissions);
        }

        if (!usersResponse.ok || !isUserList(usersPayload)) {
          setStatus(usersResponse.status === 403 ? "denied" : "error");
          return;
        }

        setUsers(usersPayload.items);
        setNextOffset(usersPayload.offset + usersPayload.items.length);
        setHasMore(usersPayload.items.length === usersPayload.limit);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      }
    }

    void loadDirectory();
    return () => controller.abort();
  }, [filters, reloadKey]);

  useEffect(() => {
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setEditState(null);
      setProfileState(null);
      setAccessPanel({ kind: "closed" });
    }

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, []);

  const canManageUsers = permissions.includes("users.manage");
  const canReadRbac = permissions.includes("rbac.read");
  const canManageProfiles = permissions.includes("rbac.profiles.manage");
  const canManageAssignments = permissions.includes("rbac.assignments.manage");

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  }

  async function loadMoreUsers() {
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/users?${createUserQuery(filters, nextOffset)}`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || !isUserList(payload)) {
        toast.error(getApiMessage(payload, "Não foi possível carregar mais usuários."));
        return;
      }

      setUsers((current) => [...current, ...payload.items]);
      setNextOffset(payload.offset + payload.items.length);
      setHasMore(payload.items.length === payload.limit);
    } catch {
      toast.error("Não foi possível conectar ao serviço de usuários.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function loadRbacCatalog() {
    setIsCatalogLoading(true);

    try {
      const [profilesResponse, permissionsResponse] = await Promise.all([
        fetch("/api/rbac/profiles", { cache: "no-store" }),
        fetch("/api/rbac/permissions", { cache: "no-store" }),
      ]);
      const [profilesPayload, permissionsPayload] = await Promise.all([
        profilesResponse.json().catch(() => null),
        permissionsResponse.json().catch(() => null),
      ]);

      if (!profilesResponse.ok || !isPermissionProfileList(profilesPayload)) {
        throw new Error(getApiMessage(profilesPayload, "Não foi possível carregar os perfis."));
      }

      if (!permissionsResponse.ok || !isPermissionDefinitionList(permissionsPayload)) {
        throw new Error(
          getApiMessage(permissionsPayload, "Não foi possível carregar as permissões."),
        );
      }

      setPermissionCatalog(permissionsPayload);
      return { profiles: profilesPayload, permissions: permissionsPayload };
    } finally {
      setIsCatalogLoading(false);
    }
  }

  async function openAccessPanel(user: UserListItem) {
    setAccessPanel({ kind: "loading", user });

    try {
      const [catalog, accessResponse] = await Promise.all([
        loadRbacCatalog(),
        fetch(`/api/users/${user.id}/access`, { cache: "no-store" }),
      ]);
      const accessPayload = await accessResponse.json().catch(() => null);

      if (!accessResponse.ok || !isUserAccess(accessPayload)) {
        setAccessPanel({
          kind: "error",
          user,
          message: getApiMessage(accessPayload, "Não foi possível carregar este acesso."),
        });
        return;
      }

      const assignedIds = new Set(accessPayload.profiles.map((profile) => profile.id));
      const firstAvailable = catalog.profiles.find(
        (profile) => profile.active && !assignedIds.has(profile.id),
      );

      setAccessPanel({
        kind: "ready",
        user,
        profiles: catalog.profiles,
        permissionCatalog: catalog.permissions,
        access: accessPayload,
        selectedProfileId: firstAvailable?.id ?? "",
        isSaving: false,
        isRemovingProfileId: null,
      });
    } catch (error) {
      setAccessPanel({
        kind: "error",
        user,
        message: error instanceof Error ? error.message : "Não foi possível carregar os acessos.",
      });
    }
  }

  async function saveUserName() {
    if (!editState) {
      return;
    }

    const fullName = editState.fullName.trim();
    if (fullName.length < 1 || fullName.length > 255) {
      toast.error("Informe um nome completo com até 255 caracteres.");
      return;
    }

    setEditState({ ...editState, isSaving: true });

    try {
      const response = await fetch(`/api/users/${editState.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !isUserPublic(payload)) {
        setEditState({ ...editState, isSaving: false });
        toast.error(getApiMessage(payload, "Não foi possível atualizar o nome."));
        return;
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === editState.user.id ? { ...user, full_name: payload.full_name } : user,
        ),
      );
      setEditState(null);
      toast.success("Nome completo atualizado.");
    } catch {
      setEditState({ ...editState, isSaving: false });
      toast.error("Não foi possível conectar ao serviço de usuários.");
    }
  }

  async function saveProfile() {
    if (!profileState) {
      return;
    }

    const name = profileState.name.trim();
    const description = profileState.description.trim();
    if (name.length < 3 || name.length > 64 || description.length < 1 || description.length > 500) {
      toast.error("Informe nome e descrição válidos para o perfil.");
      return;
    }

    setProfileState({ ...profileState, isSaving: true });

    try {
      const response = await fetch("/api/rbac/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          permission_codes: profileState.permissionCodes,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !isPermissionProfile(payload)) {
        setProfileState({ ...profileState, isSaving: false });
        toast.error(getApiMessage(payload, "Não foi possível criar o perfil."));
        return;
      }

      setProfileState(null);
      toast.success("Perfil customizado criado.", {
        description: "O perfil está disponível, mas ainda não foi atribuído a nenhuma pessoa.",
      });
    } catch {
      setProfileState({ ...profileState, isSaving: false });
      toast.error("Não foi possível conectar ao serviço de perfis.");
    }
  }

  async function grantSelectedProfile() {
    if (accessPanel.kind !== "ready" || !accessPanel.selectedProfileId) {
      return;
    }

    const panel = accessPanel;
    setAccessPanel({ ...panel, isSaving: true });

    try {
      const response = await fetch(
        `/api/users/${panel.user.id}/profiles/${panel.selectedProfileId}`,
        { method: "POST" },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setAccessPanel({ ...panel, isSaving: false });
        toast.error(getApiMessage(payload, "Não foi possível atribuir o perfil."));
        return;
      }

      toast.success("Perfil atribuído.");
      setReloadKey((current) => current + 1);
      await openAccessPanel(panel.user);
    } catch {
      setAccessPanel({ ...panel, isSaving: false });
      toast.error("Não foi possível conectar ao serviço de perfis.");
    }
  }

  async function removeProfile(profileId: string) {
    if (accessPanel.kind !== "ready" || accessPanel.isRemovingProfileId) {
      return;
    }

    if (accessPanel.access.profiles.length <= 1) {
      toast.error("Todo usuário precisa manter pelo menos um perfil atribuído.");
      return;
    }

    const panel = accessPanel;
    setAccessPanel({ ...panel, isRemovingProfileId: profileId });

    try {
      const response = await fetch(
        `/api/users/${panel.user.id}/profiles/${profileId}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setAccessPanel({ ...panel, isRemovingProfileId: null });
        toast.error(getApiMessage(payload, "Não foi possível remover o perfil."));
        return;
      }

      toast.success("Perfil removido.");
      setReloadKey((current) => current + 1);
      await openAccessPanel(panel.user);
    } catch {
      setAccessPanel({ ...panel, isRemovingProfileId: null });
      toast.error("Não foi possível conectar ao serviço de perfis.");
    }
  }

  async function openProfileDialog() {
    setProfileState({ ...EMPTY_PROFILE });
    if (permissionCatalog.length > 0) {
      return;
    }

    try {
      await loadRbacCatalog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as permissões.");
    }
  }

  if (status === "loading") {
    return <DirectoryMessage message="Carregando usuários…" />;
  }

  if (status === "denied") {
    return <DirectoryMessage message="Você não possui permissão para consultar usuários." />;
  }

  if (status === "error") {
    return <DirectoryMessage message="Não foi possível carregar os usuários. Tente novamente." />;
  }

  return (
    <section aria-labelledby="user-directory-title" className="flex flex-1 flex-col py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form className="grid flex-1 gap-3 sm:grid-cols-[minmax(16rem,1fr)_12rem_auto]" onSubmit={submitFilters}>
          <label className="text-xs font-semibold text-slate-700">
            Buscar por nome ou e-mail
            <input
              className={inputClassName}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Digite um nome ou e-mail"
              type="search"
              value={searchInput}
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Situação
            <select
              className={inputClassName}
              onChange={(event) =>
                setFilters({ search: searchInput.trim(), active: event.target.value as "true" | "false" })
              }
              value={filters.active}
            >
              <option value="true">Contas ativas</option>
              <option value="false">Contas inativas</option>
            </select>
          </label>
          <button className={secondaryButtonClassName} type="submit">
            <Search aria-hidden="true" className="size-4" /> Buscar
          </button>
        </form>
        {canManageProfiles && (
          <button className={primaryButtonClassName} onClick={() => void openProfileDialog()} type="button">
            <Plus aria-hidden="true" className="size-4" /> Criar perfil
          </button>
        )}
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-700" id="user-directory-title">
        {users.length} {users.length === 1 ? "usuário listado" : "usuários listados"} · {filters.active === "true" ? "ativos" : "inativos"}
      </p>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-400/15">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Nome completo</th>
                <th className="px-5 py-3 font-semibold">Usuário</th>
                <th className="px-5 py-3 font-semibold">E-mail</th>
                <th className="px-5 py-3 font-semibold">Perfis</th>
                <th className="px-5 py-3 font-semibold">Situação</th>
                <th className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr className="text-slate-700" key={user.id}>
                  <td className="px-5 py-4 font-semibold text-slate-900">{user.full_name || "Não informado"}</td>
                  <td className="px-5 py-4 font-mono text-xs">{user.username}</td>
                  <td className="px-5 py-4">{user.email}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {user.profiles.length > 0 ? user.profiles.map((profile) => (
                        <span className="rounded-full bg-teal-600/10 px-2 py-1 text-xs font-semibold text-teal-800" key={profile.id}>{profile.name}</span>
                      )) : <span className="text-xs text-slate-500">Nenhum perfil</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? "bg-emerald-600/10 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                      {user.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {canManageUsers && (
                        <button aria-label={`Editar nome de ${user.username}`} className={iconButtonClassName} onClick={() => setEditState({ user, fullName: user.full_name ?? "", isSaving: false })} type="button">
                          <Pencil aria-hidden="true" className="size-4" />
                        </button>
                      )}
                      {canReadRbac && (
                        <button className={secondaryButtonClassName} onClick={() => void openAccessPanel(user)} type="button">
                          <ShieldCheck aria-hidden="true" className="size-4" /> Perfis
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-600">
            Nenhum usuário corresponde à pesquisa e ao filtro selecionado.
          </p>
        )}
      </div>

      {hasMore && (
        <button className={`mx-auto mt-5 ${secondaryButtonClassName}`} disabled={isLoadingMore} onClick={() => void loadMoreUsers()} type="button">
          {isLoadingMore && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          {isLoadingMore ? "Carregando…" : "Carregar mais"}
        </button>
      )}

      {editState && (
        <UserEditDialog
          onChange={(fullName) => setEditState({ ...editState, fullName })}
          onClose={() => setEditState(null)}
          onSave={() => void saveUserName()}
          state={editState}
        />
      )}
      {profileState && (
        <CreateProfileDialog
          isCatalogLoading={isCatalogLoading}
          onClose={() => setProfileState(null)}
          onDescriptionChange={(description) => setProfileState({ ...profileState, description })}
          onNameChange={(name) => setProfileState({ ...profileState, name })}
          onPermissionToggle={(permissionCode) =>
            setProfileState({
              ...profileState,
              permissionCodes: profileState.permissionCodes.includes(permissionCode)
                ? profileState.permissionCodes.filter((code) => code !== permissionCode)
                : [...profileState.permissionCodes, permissionCode],
            })
          }
          onSave={() => void saveProfile()}
          permissions={permissionCatalog}
          state={profileState}
        />
      )}
      {accessPanel.kind !== "closed" && (
        <AccessPanel
          canManageAssignments={canManageAssignments}
          onClose={() => setAccessPanel({ kind: "closed" })}
          onGrant={() => void grantSelectedProfile()}
          onProfileChange={(selectedProfileId) => setAccessPanel((current) => current.kind === "ready" ? { ...current, selectedProfileId } : current)}
          onRemoveProfile={(profileId) => void removeProfile(profileId)}
          onRetry={() => void openAccessPanel(accessPanel.user)}
          panel={accessPanel}
        />
      )}
    </section>
  );
}

function UserEditDialog({ state, onChange, onClose, onSave }: UserEditDialogProps) {
  return (
    <ModalShell label="Editar nome completo" onClose={onClose} titleId="edit-user-title">
      <h2 className="text-xl font-bold text-slate-900" id="edit-user-title">Editar {state.user.username}</h2>
      <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="edit-full-name">
        Nome completo
      </label>
      <input autoFocus className={inputClassName} disabled={state.isSaving} id="edit-full-name" maxLength={255} onChange={(event) => onChange(event.target.value)} value={state.fullName} />
      <div className="mt-6 flex justify-end gap-2">
        <button className={secondaryButtonClassName} disabled={state.isSaving} onClick={onClose} type="button">Cancelar</button>
        <button className={primaryButtonClassName} disabled={state.isSaving || !state.fullName.trim()} onClick={onSave} type="button">
          {state.isSaving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />} Salvar nome
        </button>
      </div>
    </ModalShell>
  );
}

function CreateProfileDialog({ state, permissions, isCatalogLoading, onNameChange, onDescriptionChange, onPermissionToggle, onClose, onSave }: CreateProfileDialogProps) {
  return (
    <ModalShell label="Criar perfil customizado" onClose={onClose} titleId="create-profile-title">
      <h2 className="text-xl font-bold text-slate-900" id="create-profile-title">Criar perfil customizado</h2>
      <p className="mt-2 text-sm text-amber-800">A criação não atribui o perfil automaticamente a nenhuma pessoa.</p>
      <div className="mt-5 grid gap-4">
        <label className="text-sm font-semibold text-slate-700">Nome
          <input autoFocus className={inputClassName} disabled={state.isSaving} maxLength={64} minLength={3} onChange={(event) => onNameChange(event.target.value)} value={state.name} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Descrição
          <textarea className={`${inputClassName} min-h-24 resize-y`} disabled={state.isSaving} maxLength={500} onChange={(event) => onDescriptionChange(event.target.value)} value={state.description} />
        </label>
        <fieldset disabled={state.isSaving || isCatalogLoading}>
          <legend className="text-sm font-semibold text-slate-700">Permissões</legend>
          {isCatalogLoading ? <p className="mt-2 text-sm text-slate-600">Carregando catálogo…</p> : (
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {permissions.map((permission) => (
                <li key={permission.code}>
                  <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
                    <input checked={state.permissionCodes.includes(permission.code)} className="mt-0.5 accent-teal-600" onChange={() => onPermissionToggle(permission.code)} type="checkbox" />
                    <span><span className="font-mono font-semibold text-teal-800">{permission.code}</span><span className="block text-slate-500">{permission.description}</span></span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className={secondaryButtonClassName} disabled={state.isSaving} onClick={onClose} type="button">Cancelar</button>
        <button className={primaryButtonClassName} disabled={state.isSaving || isCatalogLoading || state.name.trim().length < 3 || !state.description.trim()} onClick={onSave} type="button">
          {state.isSaving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />} Criar perfil
        </button>
      </div>
    </ModalShell>
  );
}

function AccessPanel({ panel, canManageAssignments, onClose, onRetry, onProfileChange, onGrant, onRemoveProfile }: AccessPanelProps) {
  return (
    <ModalShell label="Gerenciar perfis do usuário" onClose={onClose} titleId="access-panel-title">
      <h2 className="text-xl font-bold text-slate-900" id="access-panel-title">Perfis de {panel.user.full_name || panel.user.username}</h2>
      <p className="mt-1 text-sm text-slate-600">{panel.user.email}</p>
      {panel.kind === "loading" && <p className="mt-8 flex items-center gap-2 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Carregando acesso detalhado…</p>}
      {panel.kind === "error" && <div className="mt-6"><p className="rounded-xl bg-rose-600/10 p-3 text-sm text-rose-800">{panel.message}</p><button className={`mt-3 ${secondaryButtonClassName}`} onClick={onRetry} type="button">Tentar novamente</button></div>}
      {panel.kind === "ready" && (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Perfis atribuídos</h3>
            <ul className="mt-2 space-y-2">
              {panel.access.profiles.map((profile) => (
                <li className="flex items-center justify-between gap-3 rounded-xl bg-teal-600/10 px-3 py-2" key={profile.id}>
                  <span className="text-sm font-semibold text-teal-900">{profile.name}</span>
                  {canManageAssignments && (
                    <button aria-label={`Remover perfil ${profile.name}`} className={iconButtonClassName} disabled={panel.access.profiles.length <= 1 || panel.isRemovingProfileId !== null} onClick={() => onRemoveProfile(profile.id)} title={panel.access.profiles.length <= 1 ? "O usuário precisa manter ao menos um perfil." : undefined} type="button">
                      {panel.isRemovingProfileId === profile.id ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Trash2 aria-hidden="true" className="size-4" />}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {canManageAssignments && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm font-semibold text-slate-800" htmlFor="assign-profile">Atribuir perfil</label>
              <select className={inputClassName} id="assign-profile" onChange={(event) => onProfileChange(event.target.value)} value={panel.selectedProfileId}>
                <option value="">Selecione</option>
                {panel.profiles.filter((profile) => profile.active && !panel.access.profiles.some((assigned) => assigned.id === profile.id)).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
              </select>
              <button className={`mt-3 ${primaryButtonClassName}`} disabled={!panel.selectedProfileId || panel.isSaving} onClick={onGrant} type="button">
                {panel.isSaving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />} Atribuir
              </button>
            </div>
          )}
          <details className="rounded-xl border border-slate-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">Permissões efetivas ({panel.access.effective_permissions.length})</summary>
            <ul className="mt-3 flex flex-wrap gap-2">{panel.access.effective_permissions.map((permission) => <li className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px]" key={permission}>{permission}</li>)}</ul>
          </details>
        </div>
      )}
    </ModalShell>
  );
}

function ModalShell({ label, titleId, onClose, children }: ModalShellProps) {
  return (
    <div aria-label={label} aria-labelledby={titleId} aria-modal="true" className="fixed inset-0 z-50 flex items-end bg-slate-900/35 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="dialog">
      <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <button aria-label="Fechar diálogo" className={`absolute right-4 top-4 ${iconButtonClassName}`} onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button>
        {children}
      </div>
    </div>
  );
}

function DirectoryMessage({ message }: DirectoryMessageProps) {
  return <section aria-live="polite" className="grid flex-1 place-items-center py-10"><p className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">{message}</p></section>;
}

function createUserQuery(filters: UserDirectoryFilters, offset: number) {
  const query = new URLSearchParams({ active: filters.active, offset: String(offset), limit: String(USER_PAGE_SIZE) });
  if (filters.search) query.set("search", filters.search);
  return query.toString();
}

function isUserList(value: unknown): value is UserList {
  if (!value || typeof value !== "object") return false;
  const list = value as ApiRecord;
  return typeof list.offset === "number" && typeof list.limit === "number" && Array.isArray(list.items) && list.items.every(isUserListItem);
}

function isUserListItem(value: unknown): value is UserListItem {
  if (!value || typeof value !== "object") return false;
  const user = value as ApiRecord;
  return typeof user.id === "string" && typeof user.username === "string" && typeof user.email === "string" && (typeof user.full_name === "string" || user.full_name === null) && typeof user.active === "boolean" && Array.isArray(user.profiles) && user.profiles.every(isAssignedProfile);
}

function isUserPublic(value: unknown): value is UserPublic {
  if (!value || typeof value !== "object") return false;
  const user = value as ApiRecord;
  return typeof user.id === "string" && typeof user.username === "string" && typeof user.email === "string" && (typeof user.full_name === "string" || user.full_name === null);
}

function isCurrentUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== "object") return false;
  const user = value as ApiRecord;
  return Array.isArray(user.permissions) && user.permissions.every((permission) => typeof permission === "string");
}

function isPermissionProfileList(value: unknown): value is PermissionProfile[] { return Array.isArray(value) && value.every(isPermissionProfile); }
function isPermissionProfile(value: unknown): value is PermissionProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as ApiRecord;
  return typeof profile.id === "string" && typeof profile.name === "string" && typeof profile.description === "string" && typeof profile.active === "boolean" && typeof profile.official === "boolean" && Array.isArray(profile.permission_codes) && profile.permission_codes.every((code) => typeof code === "string");
}
function isPermissionDefinitionList(value: unknown): value is PermissionDefinition[] { return Array.isArray(value) && value.every((permission) => valueHasStrings(permission, "code", "description")); }
function isUserAccess(value: unknown): value is UserAccess {
  if (!value || typeof value !== "object") return false;
  const access = value as ApiRecord;
  return typeof access.user_id === "string" && Array.isArray(access.profiles) && access.profiles.every(isAssignedProfile) && Array.isArray(access.effective_permissions) && access.effective_permissions.every((permission) => typeof permission === "string");
}
function isAssignedProfile(value: unknown) { return valueHasStrings(value, "id", "name") && typeof (value as ApiRecord).active === "boolean"; }
function valueHasStrings(value: unknown, ...keys: string[]) { return Boolean(value && typeof value === "object" && keys.every((key) => typeof (value as ApiRecord)[key] === "string")); }
function getApiMessage(value: unknown, fallback: string) { return value && typeof value === "object" && "message" in value && typeof value.message === "string" ? value.message : fallback; }

const inputClassName = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-600/15 disabled:opacity-60";
const primaryButtonClassName = "inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClassName = "inline-flex items-center justify-center gap-2 self-end rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:border-teal-600 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50";
const iconButtonClassName = "inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-40";
