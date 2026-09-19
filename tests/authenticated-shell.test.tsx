import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticatedShell } from "@/app/_components/authenticated-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

const CURRENT_USER = {
  id: "user-1",
  username: "proponente",
  email: "proponente@example.org",
  full_name: "Pessoa Proponente",
  permissions: [],
  roles: [],
  profiles: [
    {
      id: "profile-1",
      name: "Proponente",
      active: true,
    },
  ],
  isAdministrator: false,
};

describe("AuthenticatedShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => CURRENT_USER,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recalcula a barra pela viewport quando o shell é montado novamente", async () => {
    setViewport(true);
    const user = userEvent.setup();
    const firstRender = render(
      <AuthenticatedShell activePage="home">
        <p>Primeiro conteúdo</p>
      </AuthenticatedShell>,
    );

    await screen.findByText("Primeiro conteúdo");
    await screen.findByRole("button", { name: "Recolher menu lateral" });
    await user.click(
      screen.getByRole("button", { name: "Recolher menu lateral" }),
    );

    expect(
      screen.getByRole("button", { name: "Expandir menu lateral" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("pivma:sidebar")).toBeNull();

    firstRender.unmount();
    render(
      <AuthenticatedShell activePage="submissions">
        <p>Segundo conteúdo</p>
      </AuthenticatedShell>,
    );

    await screen.findByText("Segundo conteúdo");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Recolher menu lateral" }),
      ).toBeInTheDocument(),
    );
  });

  it("usa a largura da viewport quando ainda não existe preferência", async () => {
    setViewport(true);

    render(
      <AuthenticatedShell activePage="home">
        <p>Conteúdo inicial</p>
      </AuthenticatedShell>,
    );

    await screen.findByText("Conteúdo inicial");
    expect(
      await screen.findByRole("button", { name: "Recolher menu lateral" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("pivma:sidebar")).toBeNull();
  });

  it("não libera Submissões sem o perfil global Proponente", async () => {
    setViewport(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ...CURRENT_USER,
          profiles: [],
          roles: ["proponent"],
        }),
      }),
    );

    render(
      <AuthenticatedShell activePage="home">
        <p>Conteúdo do proponente</p>
      </AuthenticatedShell>,
    );

    await screen.findByText("Conteúdo do proponente");
    expect(
      screen.queryByRole("link", { name: "Submissões" }),
    ).not.toBeInTheDocument();
  });

  it("não usa o papel local proponent para liberar Submissões a outro perfil", async () => {
    setViewport(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ...CURRENT_USER,
          permissions: ["rbac.read"],
          roles: ["proponent"],
          profiles: [
            {
              id: "profile-admin",
              name: "Administrador",
              active: true,
            },
          ],
          isAdministrator: true,
        }),
      }),
    );

    render(
      <AuthenticatedShell activePage="home">
        <p>Conteúdo administrativo</p>
      </AuthenticatedShell>,
    );

    await screen.findByText("Conteúdo administrativo");
    expect(
      screen.queryByRole("link", { name: "Submissões" }),
    ).not.toBeInTheDocument();
  });

  it("exibe observabilidade e os selos do shell para administradores", async () => {
    setViewport(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...CURRENT_USER, isAdministrator: true }),
      }),
    );

    render(
      <AuthenticatedShell activePage="home">
        <p>Conteúdo administrativo</p>
      </AuthenticatedShell>,
    );

    await screen.findByText("Conteúdo administrativo");
    expect(
      screen.getByRole("link", { name: "Observabilidade operacional" }),
    ).toHaveAttribute("href", "/observabilidade/operacional");
    expect(
      screen.getByRole("link", { name: "Observabilidade de IA" }),
    ).toHaveAttribute("href", "/observabilidade/ia");
    expect(screen.getByText("Ambiente seguro")).toBeInTheDocument();
    expect(screen.getByText("pi*VMA", { selector: "span" })).toBeInTheDocument();
  });
});

function setViewport(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(min-width: 768px)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  );
}
