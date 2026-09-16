import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import type { CurrentUser } from "@/types/Usuario";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

const baseUser: CurrentUser = {
  id: "user-1",
  username: "usuario.teste",
  email: "usuario@fiocruz.br",
  full_name: "Usuário Teste",
  permissions: [],
  profiles: [],
  isAdministrator: false,
  roles: [],
};

describe("AuthenticatedShell - Navegação de Submissões", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exibe o item de navegação Submissões para usuário autenticado sem perfil Proponente", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url === "/api/auth/me") {
        return Promise.resolve(
          new Response(JSON.stringify(baseUser), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.reject(new Error("URL desconhecida: " + url));
    });

    render(
      <AuthenticatedShell activePage="home">
        <div>Conteúdo da Página Inicial</div>
      </AuthenticatedShell>,
    );

    await waitFor(() => {
      expect(screen.getByText("Conteúdo da Página Inicial")).toBeInTheDocument();
    });

    const submissionsLink = screen.getByRole("link", { name: "Submissões" });
    expect(submissionsLink).toBeInTheDocument();
    expect(submissionsLink).toHaveAttribute("href", "/submissoes");
  });

  it("identifica o item Submissões como ativo quando a página ativa for submissions", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url === "/api/auth/me") {
        return Promise.resolve(
          new Response(JSON.stringify(baseUser), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.reject(new Error("URL desconhecida: " + url));
    });

    render(
      <AuthenticatedShell activePage="submissions">
        <div>Conteúdo de Submissões</div>
      </AuthenticatedShell>,
    );

    await waitFor(() => {
      expect(screen.getByText("Conteúdo de Submissões")).toBeInTheDocument();
    });

    const submissionsLink = screen.getByRole("link", { name: "Submissões" });
    expect(submissionsLink).toBeInTheDocument();
    expect(submissionsLink).toHaveAttribute("aria-current", "page");
  });
});
