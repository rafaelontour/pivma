"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  LoaderCircle,
  Pencil,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import type {
  AccessPanelProps,
  AccessPanelState,
  AuthenticatedHomeProps,
  DirectoryMessageProps,
  WelcomeCardProps,
} from "@/types/AreaAutenticada";
import type {
  AssignedPermissionProfile,
  PermissionDefinition,
  PermissionProfile,
  UserAccess,
} from "@/types/Rbac";
import type { ApiRecord } from "@/types/Servico";
import type {
  UserListItem,
  UserListItemWithPositions,
  UserListWithPositions,
} from "@/types/Usuario";

const USER_PAGE_SIZE = 100;

export function AuthenticatedHome({ page = "home" }: AuthenticatedHomeProps) {
  return (
    <AuthenticatedShell activePage={page}>
      {page === "home" ? <HomeContent /> : <UserDirectory />}
    </AuthenticatedShell>
  );
}

function HomeContent() {
  return (
    <div className="grid flex-1 content-center gap-5 py-10 md:grid-cols-2">
      <WelcomeCard
        eyebrow="Seu ambiente"
        title="A plataforma está pronta para os próximos fluxos."
        description="Novos módulos de submissão, triagem e avaliação aparecerão nesta área conforme forem disponibilizados."
      />
      <WelcomeCard
        eyebrow="Navegação"
        title="Comece pelo menu lateral."
        description="A barra lateral pode ser recolhida para dar mais espaço ao conteúdo e continuará reunindo as próximas seções do pi*VMA."
      />
    </div>
  );
}

function UserDirectory() {
  const [users, setUsers] = useState<UserListItemWithPositions[]>([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [accessPanel, setAccessPanel] = useState<AccessPanelState>({ kind: "closed" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      try {
        const response = await fetch(`/api/users?limit=${USER_PAGE_SIZE}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | UserListWithPositions
          | { message?: string }
          | null;

        if (controller.signal.aborted) {
          return;
        }

        if (!response.ok || !isUserList(payload)) {
          setState(response.status === 403 ? "denied" : "error");
          return;
        }

        setUsers(payload.items);
        setNextOffset(payload.offset + payload.items.length);
        setHasMore(payload.items.length === payload.limit);
        setState("ready");
      } catch {
        if (!controller.signal.aborted) {
          setState("error");
        }
      }
    }

    void loadUsers();
    return () => controller.abort();
  }, []);

  async function loadMoreUsers() {
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/users?offset=${nextOffset}&limit=${USER_PAGE_SIZE}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => null)) as
        | UserListWithPositions
        | null;

      if (!response.ok || !isUserList(payload)) {
        toast.error("Não foi possível carregar mais usuários.");
        return;
      }

      setUsers((currentUsers) => [...currentUsers, ...payload.items]);
      setNextOffset(payload.offset + payload.items.length);
      setHasMore(payload.items.length === payload.limit);
    } catch {
      toast.error("Não foi possível conectar ao serviço de usuários.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function openAccessPanel(user: UserListItem) {
    setAccessPanel({ kind: "loading", user });

    try {
      const [profilesResponse, accessResponse, permissionsResponse] = await Promise.all([
        fetch("/api/rbac/profiles", { cache: "no-store" }),
        fetch(`/api/users/${user.id}/access`, { cache: "no-store" }),
        fetch("/api/rbac/permissions", { cache: "no-store" }),
      ]);
      const [profilesPayload, accessPayload, permissionsPayload] = await Promise.all([
        profilesResponse.json().catch(() => null),
        accessResponse.json().catch(() => null),
        permissionsResponse.json().catch(() => null),
      ]);

      if (!profilesResponse.ok || !isPermissionProfileList(profilesPayload)) {
        setAccessPanel({
          kind: "error",
          user,
          message: getApiMessage(
            profilesPayload,
            "Não foi possível carregar os perfis de permissão.",
          ),
        });
        return;
      }

      if (!accessResponse.ok || !isUserAccess(accessPayload)) {
        setAccessPanel({
          kind: "error",
          user,
          message: getApiMessage(
            accessPayload,
            "Não foi possível carregar os acessos deste usuário.",
          ),
        });
        return;
      }

      if (!permissionsResponse.ok || !isPermissionDefinitionList(permissionsPayload)) {
        setAccessPanel({
          kind: "error",
          user,
          message: getApiMessage(
            permissionsPayload,
            "Não foi possível carregar os códigos de permissão.",
          ),
        });
        return;
      }

      const assignedProfileIds = new Set(
        accessPayload.profiles.map((profile) => profile.id),
      );
      const firstAvailableProfile = profilesPayload.find(
        (profile) => profile.active && !assignedProfileIds.has(profile.id),
      );

      setAccessPanel({
        kind: "ready",
        user,
        profiles: profilesPayload,
        permissionCatalog: permissionsPayload,
        access: accessPayload,
        selectedProfileId: firstAvailableProfile?.id ?? "",
        isSaving: false,
        editingProfileId: null,
        editedPermissionCodes: [],
        isUpdatingPermissions: false,
        isRemovingProfileId: null,
      });
    } catch {
      setAccessPanel({
        kind: "error",
        user,
        message: "Não foi possível conectar ao serviço de permissões.",
      });
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
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        setAccessPanel({ ...panel, isSaving: false });
        toast.error(
          getApiMessage(
            payload,
            "Não foi possível atribuir o perfil de permissão.",
          ),
        );
        return;
      }

      const selectedProfile = panel.profiles.find(
        (profile) => profile.id === panel.selectedProfileId,
      );
      const assignedProfileIds = new Set([
        ...panel.access.profiles.map((profile) => profile.id),
        panel.selectedProfileId,
      ]);
      const nextProfile = panel.profiles.find(
        (profile) => profile.active && !assignedProfileIds.has(profile.id),
      );

      setAccessPanel({
        ...panel,
        isSaving: false,
        selectedProfileId: nextProfile?.id ?? "",
        access: {
          ...panel.access,
          profiles: selectedProfile
            ? [
                ...panel.access.profiles,
                {
                  id: selectedProfile.id,
                  name: selectedProfile.name,
                  active: selectedProfile.active,
                },
              ]
            : panel.access.profiles,
          effective_permissions: Array.from(
            new Set([
              ...panel.access.effective_permissions,
              ...(selectedProfile?.permission_codes ?? []),
            ]),
          ),
        },
      });
      if (selectedProfile) {
        setUsers((currentUsers) =>
          currentUsers.map((user) =>
            user.id === panel.user.id
              ? {
                  ...user,
                  positions: [
                    ...user.positions,
                    {
                      profileId: selectedProfile.id,
                      name: selectedProfile.name,
                      description: selectedProfile.description,
                    },
                  ],
                }
              : user,
          ),
        );
      }
      toast.success("Perfil de permissão atribuído com sucesso.");
    } catch {
      setAccessPanel({ ...panel, isSaving: false });
      toast.error("Não foi possível conectar ao serviço de permissões.");
    }
  }

  function beginPermissionEdit(profileId: string) {
    if (accessPanel.kind !== "ready") {
      return;
    }

    const profile = accessPanel.profiles.find((item) => item.id === profileId);

    if (!profile) {
      toast.error("Não foi possível carregar as permissões deste perfil.");
      return;
    }

    setAccessPanel({
      ...accessPanel,
      editingProfileId: profileId,
      editedPermissionCodes: profile.permission_codes,
    });
  }

  function cancelPermissionEdit() {
    setAccessPanel((currentPanel) =>
      currentPanel.kind === "ready"
        ? {
            ...currentPanel,
            editingProfileId: null,
            editedPermissionCodes: [],
          }
        : currentPanel,
    );
  }

  function togglePermissionCode(permissionCode: string) {
    setAccessPanel((currentPanel) => {
      if (currentPanel.kind !== "ready") {
        return currentPanel;
      }

      const permissionCodes = currentPanel.editedPermissionCodes.includes(permissionCode)
        ? currentPanel.editedPermissionCodes.filter((code) => code !== permissionCode)
        : [...currentPanel.editedPermissionCodes, permissionCode];

      return { ...currentPanel, editedPermissionCodes: permissionCodes };
    });
  }

  async function saveProfilePermissions() {
    if (accessPanel.kind !== "ready" || !accessPanel.editingProfileId) {
      return;
    }

    const panel = accessPanel;
    setAccessPanel({ ...panel, isUpdatingPermissions: true });

    try {
      const response = await fetch(`/api/rbac/profiles/${panel.editingProfileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionCodes: panel.editedPermissionCodes }),
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        setAccessPanel({ ...panel, isUpdatingPermissions: false });
        toast.error(
          getApiMessage(
            payload,
            "Não foi possível salvar as permissões do perfil.",
          ),
        );
        return;
      }

      const profiles = panel.profiles.map((profile) =>
        profile.id === panel.editingProfileId
          ? { ...profile, permission_codes: panel.editedPermissionCodes }
          : profile,
      );

      setAccessPanel({
        ...panel,
        profiles,
        editingProfileId: null,
        editedPermissionCodes: [],
        isUpdatingPermissions: false,
        access: {
          ...panel.access,
          effective_permissions: getEffectivePermissions(panel.access.profiles, profiles),
        },
      });
      toast.success("Permissões do perfil atualizadas.");
    } catch {
      setAccessPanel({ ...panel, isUpdatingPermissions: false });
      toast.error("Não foi possível conectar ao serviço de permissões.");
    }
  }

  async function removeProfile(profileId: string) {
    if (accessPanel.kind !== "ready" || accessPanel.isRemovingProfileId) {
      return;
    }

    if (accessPanel.access.profiles.length <= 1) {
      toast.error("Todo usuário precisa manter pelo menos um cargo atribuído.");
      return;
    }

    const panel = accessPanel;
    setAccessPanel({ ...panel, isRemovingProfileId: profileId });

    try {
      const response = await fetch(
        `/api/users/${panel.user.id}/profiles/${profileId}`,
        { method: "DELETE" },
      );
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        setAccessPanel({ ...panel, isRemovingProfileId: null });
        toast.error(
          getApiMessage(payload, "Não foi possível remover o cargo deste usuário."),
        );
        return;
      }

      const profiles = panel.access.profiles.filter((profile) => profile.id !== profileId);
      const firstAvailableProfile = panel.profiles.find(
        (profile) => profile.active && !profiles.some((item) => item.id === profile.id),
      );

      setAccessPanel({
        ...panel,
        isRemovingProfileId: null,
        editingProfileId: panel.editingProfileId === profileId ? null : panel.editingProfileId,
        editedPermissionCodes:
          panel.editingProfileId === profileId ? [] : panel.editedPermissionCodes,
        selectedProfileId: firstAvailableProfile?.id ?? "",
        access: {
          ...panel.access,
          profiles,
          effective_permissions: getEffectivePermissions(profiles, panel.profiles),
        },
      });
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === panel.user.id
            ? {
                ...user,
                positions: user.positions.filter((position) => position.profileId !== profileId),
              }
            : user,
        ),
      );
      toast.success("Cargo removido com sucesso.");
    } catch {
      setAccessPanel({ ...panel, isRemovingProfileId: null });
      toast.error("Não foi possível conectar ao serviço de permissões.");
    }
  }

  if (state === "loading") {
    return <DirectoryMessage message="Carregando usuários…" />;
  }

  if (state === "denied") {
    return <DirectoryMessage message="Você não possui permissão para consultar usuários." />;
  }

  if (state === "error") {
    return <DirectoryMessage message="Não foi possível carregar os usuários. Tente atualizar a página." />;
  }

  return (
    <section className="flex flex-1 flex-col py-8" aria-labelledby="user-directory-title">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="user-directory-title" className="text-sm font-semibold text-slate-700">
          {users.length} {users.length === 1 ? "usuário listado" : "usuários listados"}
        </h2>
        <span className="rounded-full border border-teal-700/20 bg-teal-600/10 px-3 py-1 text-xs font-semibold text-teal-800">
          Gestão de acesso
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-400/15">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Nome de usuário</th>
                <th className="px-5 py-3 font-semibold">E-mail</th>
                <th className="px-5 py-3 font-semibold">Cargo</th>
                <th className="px-5 py-3 font-semibold">Situação</th>
                <th className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr className="text-slate-700" key={user.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{user.username}</td>
                  <td className="px-5 py-4 text-slate-600">{user.email}</td>
                  <td className="px-5 py-4">
                    {user.positions.length > 0 ? (
                      <ul className="space-y-1 text-xs text-slate-700">
                        {user.positions.map((position) => (
                          <li key={position.profileId} title={position.name}>
                            {position.description}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-slate-500">Não atribuído</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? "bg-emerald-600/10 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                      {user.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      className="inline-flex items-center gap-2 rounded-lg border border-teal-700/25 bg-teal-600/10 px-3 py-2 text-xs font-semibold text-teal-800 transition hover:border-teal-600 hover:bg-teal-600/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                      onClick={() => void openAccessPanel(user)}
                      type="button"
                    >
                      <ShieldCheck aria-hidden="true" className="size-4" />
                      Gerenciar perfis
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-600">
            Nenhuma conta foi encontrada.
          </p>
        )}
      </div>

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:border-teal-600 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-wait disabled:opacity-60"
            disabled={isLoadingMore}
            onClick={() => void loadMoreUsers()}
            type="button"
          >
            {isLoadingMore ? "Carregando usuários…" : "Carregar mais usuários"}
          </button>
        </div>
      )}

      {accessPanel.kind !== "closed" && (
        <AccessPanel
          onClose={() => setAccessPanel({ kind: "closed" })}
          onGrant={() => void grantSelectedProfile()}
          onBeginPermissionEdit={beginPermissionEdit}
          onCancelPermissionEdit={cancelPermissionEdit}
          onPermissionToggle={togglePermissionCode}
          onProfileChange={(selectedProfileId) =>
            setAccessPanel((currentPanel) =>
              currentPanel.kind === "ready"
                ? { ...currentPanel, selectedProfileId }
                : currentPanel,
            )
          }
          onRetry={() => void openAccessPanel(accessPanel.user)}
          onRemoveProfile={(profileId) => void removeProfile(profileId)}
          onSavePermissions={() => void saveProfilePermissions()}
          panel={accessPanel}
        />
      )}
    </section>
  );
}

function AccessPanel({
  panel,
  onClose,
  onRetry,
  onProfileChange,
  onGrant,
  onBeginPermissionEdit,
  onCancelPermissionEdit,
  onPermissionToggle,
  onSavePermissions,
  onRemoveProfile,
}: AccessPanelProps) {
  const user = panel.user;

  return (
    <div
      aria-labelledby="access-panel-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-slate-900/35 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
    >
      <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20 sm:max-w-xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
              Gestão de acesso
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900" id="access-panel-title">
              Perfis de {user.username}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          </div>
          <button
            aria-label="Fechar gestão de perfis"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {panel.kind === "loading" && (
          <div aria-live="polite" className="flex items-center gap-3 py-12 text-sm text-slate-600">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />
            Carregando perfis e permissões…
          </div>
        )}

        {panel.kind === "error" && (
          <div className="py-8">
            <p className="rounded-xl border border-rose-700/20 bg-rose-600/10 px-4 py-3 text-sm text-rose-800">
              {panel.message}
            </p>
            <button
              className="mt-4 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:border-teal-600 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              onClick={onRetry}
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {panel.kind === "ready" && (
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Cargos e perfis atribuídos</h3>
              {panel.access.profiles.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {panel.access.profiles.map((assignedProfile) => {
                    const profile = panel.profiles.find(
                      (availableProfile) => availableProfile.id === assignedProfile.id,
                    );
                    const isOnlyProfile = panel.access.profiles.length === 1;

                    return (
                      <li
                        className="rounded-xl border border-teal-700/20 bg-teal-600/10 px-3 py-2.5"
                        key={assignedProfile.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-semibold text-teal-900">
                            {assignedProfile.name}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              aria-label={`Editar permissões do cargo ${assignedProfile.name}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700/30 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-teal-800 shadow-sm shadow-teal-900/10 transition hover:border-teal-600 hover:bg-teal-50 hover:text-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!profile || panel.isRemovingProfileId === assignedProfile.id}
                              onClick={() => onBeginPermissionEdit(assignedProfile.id)}
                              type="button"
                            >
                              <Pencil aria-hidden="true" className="size-3.5" />
                              Editar permissões
                            </button>
                            <button
                              aria-label={`Remover o cargo ${assignedProfile.name}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-700/25 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-rose-800 shadow-sm shadow-rose-900/10 transition hover:border-rose-600 hover:bg-rose-50 hover:text-rose-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-wait disabled:opacity-60"
                              disabled={panel.isRemovingProfileId !== null || isOnlyProfile}
                              onClick={() => onRemoveProfile(assignedProfile.id)}
                              title={
                                isOnlyProfile
                                  ? "Todo usuário precisa manter pelo menos um cargo atribuído."
                                  : undefined
                              }
                              type="button"
                            >
                              {panel.isRemovingProfileId === assignedProfile.id ? (
                                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 aria-hidden="true" className="size-3.5" />
                              )}
                              {panel.isRemovingProfileId === assignedProfile.id ? "Removendo…" : "Remover cargo"}
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-700">
                          Cargo: {profile?.description ?? "Descrição do cargo não disponível."}
                        </p>
                        {isOnlyProfile && (
                          <p className="mt-2 text-xs font-medium text-amber-800">
                            Este é o único cargo atribuído e não pode ser removido.
                          </p>
                        )}
                        {panel.editingProfileId === assignedProfile.id && profile && (
                          <div className="mt-4 border-t border-teal-700/15 pt-4">
                            <p className="text-xs font-semibold text-slate-900">
                              Códigos de permissão de {profile.name}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-amber-800">
                              Esta alteração vale para todas as pessoas que possuem este perfil.
                            </p>
                            <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                              {panel.permissionCatalog.map((permission) => (
                                <li key={permission.code}>
                                  <label className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 text-xs text-slate-700 hover:bg-white/80">
                                    <input
                                      checked={panel.editedPermissionCodes.includes(permission.code)}
                                      className="mt-0.5 size-3.5 accent-teal-600"
                                      disabled={panel.isUpdatingPermissions}
                                      onChange={() => onPermissionToggle(permission.code)}
                                      type="checkbox"
                                    />
                                    <span>
                                      <span className="font-mono text-teal-800">{permission.code}</span>
                                      <span className="mt-0.5 block text-slate-600">
                                        {permission.description}
                                      </span>
                                    </span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <button
                                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-wait disabled:opacity-60"
                                disabled={panel.isUpdatingPermissions}
                                onClick={onSavePermissions}
                                type="button"
                              >
                                {panel.isUpdatingPermissions && (
                                  <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                                )}
                                {panel.isUpdatingPermissions
                                  ? "Salvando permissões…"
                                  : "Salvar permission_codes"}
                              </button>
                              <button
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={panel.isUpdatingPermissions}
                                onClick={onCancelPermissionEdit}
                                type="button"
                              >
                                <X aria-hidden="true" className="size-3.5" />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Nenhum cargo ou perfil atribuído.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-800" htmlFor="permission-profile">
                Conceder perfil de permissão
              </label>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Escolha um perfil ativo. As permissões do perfil serão aplicadas ao usuário.
              </p>
              <select
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={panel.isSaving || panel.selectedProfileId === ""}
                id="permission-profile"
                onChange={(event) => onProfileChange(event.target.value)}
                value={panel.selectedProfileId}
              >
                {panel.selectedProfileId === "" && <option value="">Nenhum perfil disponível</option>}
                {panel.profiles
                  .filter((profile) => profile.active)
                  .map((profile) => {
                    const assigned = panel.access.profiles.some(
                      (assignedProfile) => assignedProfile.id === profile.id,
                    );

                    return (
                      <option disabled={assigned} key={profile.id} value={profile.id}>
                        {profile.name}{assigned ? " — já atribuído" : ""}
                      </option>
                    );
                  })}
              </select>
              {panel.selectedProfileId && (
                <p className="mt-2 text-xs text-slate-600">
                  {panel.profiles.find((profile) => profile.id === panel.selectedProfileId)?.description}
                </p>
              )}
              <button
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-wait disabled:opacity-50"
                disabled={!panel.selectedProfileId || panel.isSaving}
                onClick={onGrant}
                type="button"
              >
                {panel.isSaving ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck aria-hidden="true" className="size-4" />
                )}
                {panel.isSaving ? "Salvando perfil…" : "Salvar perfil"}
              </button>
            </div>

            <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                Permissões efetivas ({panel.access.effective_permissions.length})
              </summary>
              <ul className="mt-3 flex flex-wrap gap-2">
                {panel.access.effective_permissions.map((permission) => (
                  <li className="rounded-md bg-white px-2 py-1 font-mono text-[11px] text-slate-700 ring-1 ring-slate-200" key={permission}>
                    {permission}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function DirectoryMessage({ message }: DirectoryMessageProps) {
  return (
    <section className="grid flex-1 place-items-center py-10" aria-live="polite">
      <p className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm shadow-slate-300/30">
        {message}
      </p>
    </section>
  );
}

function WelcomeCard({
  eyebrow,
  title,
  description,
}: WelcomeCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-400/15">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-teal-700">
        Em breve <ChevronRight aria-hidden="true" className="size-4" />
      </div>
    </article>
  );
}

function isUserList(value: unknown): value is UserListWithPositions {
  if (!value || typeof value !== "object") {
    return false;
  }

  const list = value as ApiRecord;
  return (
    typeof list.offset === "number" &&
    typeof list.limit === "number" &&
    Array.isArray(list.items) &&
    list.items.every(isUserListItem)
  );
}

function isUserListItem(value: unknown): value is UserListItemWithPositions {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as ApiRecord;
  return (
    typeof user.id === "string" &&
    typeof user.username === "string" &&
    typeof user.email === "string" &&
    typeof user.active === "boolean" &&
    Array.isArray(user.positions) &&
    user.positions.every(isUserPosition)
  );
}

function isUserPosition(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const position = value as ApiRecord;
  return (
    typeof position.profileId === "string" &&
    typeof position.name === "string" &&
    typeof position.description === "string"
  );
}

function isPermissionProfileList(value: unknown): value is PermissionProfile[] {
  return Array.isArray(value) && value.every(isPermissionProfile);
}

function isPermissionProfile(value: unknown): value is PermissionProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as ApiRecord;
  return (
    typeof profile.id === "string" &&
    typeof profile.name === "string" &&
    typeof profile.description === "string" &&
    typeof profile.active === "boolean" &&
    typeof profile.official === "boolean" &&
    Array.isArray(profile.permission_codes) &&
    profile.permission_codes.every((permission) => typeof permission === "string")
  );
}

function isPermissionDefinitionList(value: unknown): value is PermissionDefinition[] {
  return Array.isArray(value) && value.every(isPermissionDefinition);
}

function isPermissionDefinition(value: unknown): value is PermissionDefinition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const permission = value as ApiRecord;
  return (
    typeof permission.code === "string" &&
    typeof permission.description === "string"
  );
}

function getEffectivePermissions(
  assignedProfiles: AssignedPermissionProfile[],
  profiles: PermissionProfile[],
) {
  return Array.from(
    new Set(
      assignedProfiles.flatMap(
        (assignedProfile) =>
          profiles.find((profile) => profile.id === assignedProfile.id)
            ?.permission_codes ?? [],
      ),
    ),
  );
}

function isUserAccess(value: unknown): value is UserAccess {
  if (!value || typeof value !== "object") {
    return false;
  }

  const access = value as ApiRecord;
  return (
    typeof access.user_id === "string" &&
    Array.isArray(access.profiles) &&
    access.profiles.every(isAssignedProfile) &&
    Array.isArray(access.effective_permissions) &&
    access.effective_permissions.every((permission) => typeof permission === "string")
  );
}

function isAssignedProfile(value: unknown): value is AssignedPermissionProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as ApiRecord;
  return (
    typeof profile.id === "string" &&
    typeof profile.name === "string" &&
    typeof profile.active === "boolean"
  );
}

function getApiMessage(value: unknown, fallback: string) {
  return value && typeof value === "object" && "message" in value && typeof value.message === "string"
    ? value.message
    : fallback;
}
