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

  it("preserva a barra recolhida quando o shell é montado novamente", async () => {
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
    expect(window.localStorage.getItem("pivma:sidebar")).toBe("collapsed");

    firstRender.unmount();
    render(
      <AuthenticatedShell activePage="submissions">
        <p>Segundo conteúdo</p>
      </AuthenticatedShell>,
    );

    await screen.findByText("Segundo conteúdo");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Expandir menu lateral" }),
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

  it("oculta os atalhos de observabilidade e os selos do shell", async () => {
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
      screen.queryByRole("link", { name: "Observabilidade operacional" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Observabilidade de IA" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ambiente seguro")).not.toBeInTheDocument();
    expect(screen.queryByText("pi*VMA", { selector: "span" })).not.toBeInTheDocument();
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
