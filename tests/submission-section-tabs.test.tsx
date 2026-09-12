import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SubmissionCatalog,
  SubmissionDialogContent,
  SubmissionFormDialog,
  SubmissionIdentificationDialog,
} from "@/app/(paginas)/submissoes/submission-catalog";
import { SubmissionTrackingCard } from "@/app/(paginas)/submissoes/submission-pre-evaluation";
import type {
  SubmissionDialogContentProps,
  SubmissionForm,
} from "@/types/Submissao";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const multiSectionForm: SubmissionForm = {
  form_instance_id: "form-1",
  template_key: "metodo",
  is_submitted: false,
  values: {},
  reviews: {},
  fields: [
    {
      field_key: "titulo",
      label: "Título",
      field_type: "text",
      is_required: true,
      order_index: 1,
      section: "Identificação",
      validation_rules: { min_length: 3 },
    },
    {
      field_key: "descricao",
      label: "Descrição",
      field_type: "textarea",
      is_required: true,
      order_index: 2,
      section: "Detalhes",
    },
    {
      field_key: "confirmacao",
      label: "Confirmo os dados",
      field_type: "boolean",
      is_required: true,
      order_index: 3,
      section: "Confirmação",
    },
  ],
};

function buildProps(
  overrides: Partial<SubmissionDialogContentProps> = {},
): SubmissionDialogContentProps {
  return {
    processId: "process-1",
    form: multiSectionForm,
    inputs: {},
    operation: "idle",
    onFieldChange: vi.fn(),
    onSave: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

describe("SubmissionDialogContent", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("bloqueia o avanço, mostra erro acessível e preserva o valor ao voltar", async () => {
    const user = userEvent.setup();
    let inputs: SubmissionDialogContentProps["inputs"] = {};
    const props = buildProps({
      onFieldChange: (fieldKey, value) => {
        inputs = { ...inputs, [fieldKey]: value };
        view.rerender(<SubmissionDialogContent {...props} inputs={inputs} />);
      },
    });
    const view = render(<SubmissionDialogContent {...props} inputs={inputs} />);

    expect(screen.getByRole("tab", { name: "Identificação" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Descrição/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Avançar" }));
    const invalidTitle = screen.getByLabelText(/Título/);
    const titleError = screen.getByRole("alert");
    expect(invalidTitle).toHaveAttribute("aria-invalid", "true");
    expect(invalidTitle).toHaveAttribute("aria-describedby", titleError.id);
    expect(titleError).toHaveTextContent("obrigatório");

    await user.type(screen.getByLabelText(/Título/), "Método A");
    await user.click(screen.getByRole("button", { name: "Avançar" }));
    expect(screen.getByLabelText(/Descrição/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByLabelText(/Título/)).toHaveValue("Método A");
  });

  it("valida seções anteriores ao selecionar uma aba posterior", async () => {
    const user = userEvent.setup();
    const props = buildProps({ inputs: { titulo: "Método A" } });
    render(<SubmissionDialogContent {...props} />);

    await user.click(screen.getByRole("tab", { name: "Confirmação" }));

    expect(screen.getByRole("tab", { name: /Detalhes/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText(/Descrição/)).toHaveAttribute("aria-invalid", "true");
  });

  it("não envia com erro e envia um formulário de seção única válido", async () => {
    const user = userEvent.setup();
    const onSubmitInvalid = vi.fn();
    render(
      <SubmissionDialogContent
        {...buildProps({
          inputs: { titulo: "Método A", descricao: "Descrição completa" },
          onSubmit: onSubmitInvalid,
        })}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Confirmação" }));
    await user.click(screen.getByRole("button", { name: "Enviar para análise" }));
    expect(onSubmitInvalid).not.toHaveBeenCalled();

    const singleForm: SubmissionForm = {
      ...multiSectionForm,
      form_instance_id: "form-2",
      fields: [multiSectionForm.fields[0]],
    };
    const onSubmitValid = vi.fn();
    const secondView = render(
      <SubmissionDialogContent
        {...buildProps({
          form: singleForm,
          inputs: { titulo: "Método A" },
          onSubmit: onSubmitValid,
        })}
      />,
    );
    const singleDialog = within(secondView.container);

    expect(singleDialog.queryByRole("button", { name: "Avançar" })).not.toBeInTheDocument();
    expect(singleDialog.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();
    await user.click(singleDialog.getByRole("button", { name: "Enviar para análise" }));
    expect(onSubmitValid).toHaveBeenCalledOnce();
  });

  it("ativa abas pelo teclado e mantém formulários submetidos somente para consulta", async () => {
    const user = userEvent.setup();
    const props = buildProps({ inputs: { titulo: "Método A", descricao: "Completa" } });
    render(<SubmissionDialogContent {...props} />);

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass(
      "sticky",
      "top-0",
      "z-10",
      "-mx-5",
      "overflow-x-auto",
      "bg-white",
      "px-5",
      "sm:-mx-6",
      "sm:px-6",
    );
    expect(tablist.closest("form")?.parentElement).toHaveClass("pb-5");
    expect(tablist.closest("form")?.parentElement).not.toHaveClass("py-5");
    const firstTab = screen.getByRole("tab", { name: "Identificação" });
    firstTab.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(screen.getByRole("tab", { name: "Detalhes" })).toHaveFocus());
    await user.keyboard("{End}");
    await waitFor(() => expect(screen.getByRole("tab", { name: "Confirmação" })).toHaveFocus());

    const submittedForm = { ...multiSectionForm, form_instance_id: "form-3", is_submitted: true };
    const submittedView = render(
      <SubmissionDialogContent {...buildProps({ form: submittedForm })} />,
    );
    const submittedDialog = within(submittedView.container);

    expect(submittedDialog.getAllByRole("tab")).toHaveLength(3);
    expect(submittedDialog.queryByRole("button", { name: "Salvar rascunho" })).not.toBeInTheDocument();
    expect(submittedDialog.queryByRole("button", { name: "Enviar para análise" })).not.toBeInTheDocument();
  });

  it("preserva a identificação do anexo ao navegar entre seções", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          field_key: "anexo",
          replaced_previous: false,
          attachment: {
            artifact_id: "artifact-1",
            filename: "metodo.pdf",
            size: 1200,
            extension: "pdf",
            checksum_sha256: "hash",
            uploaded_at: "2026-09-12T00:00:00Z",
          },
        }),
      }),
    );
    const form: SubmissionForm = {
      ...multiSectionForm,
      form_instance_id: "form-file",
      fields: [
        {
          ...multiSectionForm.fields[0],
          field_key: "anexo",
          label: "Anexo",
          field_type: "file_upload",
          is_required: false,
          validation_rules: { allowed_extensions: ["pdf"] },
        },
        {
          ...multiSectionForm.fields[1],
          field_key: "observacao",
          label: "Observação",
          is_required: false,
        },
      ],
    };
    render(<SubmissionDialogContent {...buildProps({ form })} />);

    await user.upload(
      screen.getByLabelText(/Anexo/),
      new File(["conteúdo"], "metodo.pdf", { type: "application/pdf" }),
    );
    expect(await screen.findByText("metodo.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Avançar" }));
    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.getByText("metodo.pdf")).toBeInTheDocument();
  });
});

describe("SubmissionFormDialog", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("confirma o processo após o POST antes de concluir o fluxo na interface", async () => {
    const user = userEvent.setup();
    const onSubmitted = vi.fn();
    const confirmedProcess = {
      id: "process-1",
      code: "MET-001",
      title: "Método",
      status: "TRIAGE",
      template_key: "metodo",
      version_number: 1,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activity_key: "proposal_submission",
          run_number: 1,
          status: "COMPLETED",
          artifact_id: "artifact-1",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => confirmedProcess,
      });
    vi.stubGlobal("fetch", fetchMock);

    const singleSectionForm: SubmissionForm = {
      ...multiSectionForm,
      fields: [multiSectionForm.fields[0]],
    };

    render(
      <SubmissionFormDialog
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onSaved={vi.fn()}
        onSubmitted={onSubmitted}
        state={{
          kind: "ready",
          viewMode: "draft",
          template: {
            id: "template-1",
            key: "metodo",
            name: "Método",
            is_active: true,
          },
          process: {
            id: "process-1",
            code: "MET-001",
            title: "Método",
            status: "SUBMISSION",
            template_key: "metodo",
            version_number: 1,
          },
          form: singleSectionForm,
        }}
      />,
    );

    await user.type(screen.getByLabelText(/Título/), "Método A");
    await user.click(screen.getByRole("button", { name: "Enviar para análise" }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/submissions/process-1/form",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/submissions/process-1", {
      cache: "no-store",
    });
    expect(onSubmitted).toHaveBeenCalledWith({
      processId: "process-1",
      process: confirmedProcess,
    });
  });

  it("ocupa noventa por cento da largura da viewport", () => {
    render(
      <SubmissionFormDialog
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onSaved={vi.fn()}
        onSubmitted={vi.fn()}
        state={{
          kind: "ready",
          viewMode: "draft",
          template: {
            id: "template-1",
            key: "metodo",
            name: "Método",
            is_active: true,
          },
          process: {
            id: "process-1",
            code: "MET-001",
            title: "Método",
            status: "SUBMISSION",
            template_key: "metodo",
            version_number: 1,
          },
          form: multiSectionForm,
        }}
      />,
    );

    expect(screen.getByRole("dialog").firstElementChild).toHaveClass(
      "w-[90vw]",
      "max-w-none",
    );
  });

  it("mantém o formulário consultivo sem ações de edição", () => {
    render(
      <SubmissionFormDialog
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onSaved={vi.fn()}
        onSubmitted={vi.fn()}
        state={{
          kind: "ready",
          viewMode: "submitted",
          template: {
            id: "template-1",
            key: "metodo",
            name: "Método",
            is_active: true,
          },
          process: {
            id: "process-1",
            code: "MET-001",
            title: "Método",
            status: "TRIAGE",
            template_key: "metodo",
            version_number: 1,
          },
          form: multiSectionForm,
        }}
      />,
    );

    expect(screen.getByText("MET-001 · Submissão")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Salvar rascunho" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Avançar" }),
    ).not.toBeInTheDocument();
  });
});

describe("modais e acesso ao formulário", () => {
  it("usa largura de noventa por cento na identificação da nova submissão", () => {
    render(
      <SubmissionIdentificationDialog
        isCreating={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        onTitleChange={vi.fn()}
        template={{
          id: "template-1",
          key: "metodo",
          name: "Método",
          is_active: true,
        }}
        title=""
      />,
    );

    expect(screen.getByRole("dialog")).toHaveClass("w-[90vw]", "max-w-none");
  });

  it("permite abrir o formulário de uma submissão enviada", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const submission = {
      id: "process-1",
      code: "MET-001",
      title: "Método enviado",
      status: "TRIAGE",
      template_key: "metodo",
      version_number: 1,
    };

    render(
      <SubmissionTrackingCard
        isOpening={false}
        isOpeningLocked={false}
        onOpen={onOpen}
        onProcessChanged={vi.fn()}
        submission={submission}
        templateName="Método"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ver formulário" }));
    expect(onOpen).toHaveBeenCalledWith(submission);
  });
});

describe("reconciliação após o envio", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("remove o processo de Rascunhos e o apresenta em Submissões", async () => {
    const user = userEvent.setup();
    const draft = {
      id: "process-1",
      code: "MET-001",
      title: "Método enviado",
      status: "SUBMISSION",
      template_key: "metodo",
      version_number: 1,
    };
    const confirmedProcess = { ...draft, status: "TRIAGE" };
    const form: SubmissionForm = {
      ...multiSectionForm,
      fields: [multiSectionForm.fields[0]],
    };

    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === "/api/submissions/templates") {
          return {
            ok: true,
            json: async () => [
              {
                id: "template-1",
                key: "metodo",
                name: "Método",
                is_active: true,
              },
            ],
          };
        }
        if (url === "/api/submissions/drafts") {
          return { ok: true, json: async () => [draft] };
        }
        if (url === "/api/submissions/sent") {
          return { ok: true, json: async () => [] };
        }
        if (url === "/api/submissions/process-1/pre-evaluation") {
          return {
            ok: false,
            status: 404,
            json: async () => ({ message: "Pré-avaliação não encontrada." }),
          };
        }
        if (
          url === "/api/submissions/process-1/form" &&
          init?.method === "POST"
        ) {
          return {
            ok: true,
            json: async () => ({
              activity_key: "proposal_submission",
              run_number: 1,
              status: "COMPLETED",
              artifact_id: "artifact-1",
            }),
          };
        }
        if (url === "/api/submissions/process-1/form") {
          return { ok: true, json: async () => form };
        }
        if (url === "/api/submissions/process-1") {
          return { ok: true, json: async () => confirmedProcess };
        }

        throw new Error(`Requisição inesperada: ${url}`);
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<SubmissionCatalog />);

    await user.click(
      await screen.findByRole("button", { name: "Retomar edição" }),
    );
    await user.type(await screen.findByLabelText(/Título/), "Método A");
    await user.click(
      screen.getByRole("button", { name: "Enviar para análise" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Submissões" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    expect(
      screen.queryByRole("button", { name: "Retomar edição" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver formulário" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Método enviado")).toBeInTheDocument();
  });
});
