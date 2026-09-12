import { describe, expect, it } from "vitest";
import {
  groupDynamicFormSections,
  serializeDynamicFormOption,
  validateDynamicFormFile,
  validateDynamicFormValues,
} from "@/components/formulario";
import type { DynamicFormField } from "@/types/Submissao";

const baseField: DynamicFormField = {
  field_key: "campo",
  label: "Campo",
  field_type: "text",
  is_required: false,
  order_index: 1,
  section: "Geral",
  options: null,
  validation_rules: null,
};

describe("groupDynamicFormSections", () => {
  it("ordena campos e agrupa nomes vazios em Geral", () => {
    const sections = groupDynamicFormSections([
      { ...baseField, field_key: "terceiro", order_index: 3, section: "Detalhes" },
      { ...baseField, field_key: "primeiro", order_index: 1, section: "  " },
      { ...baseField, field_key: "segundo", order_index: 2, section: "Detalhes" },
    ]);

    expect(sections.map((section) => section.name)).toEqual(["Geral", "Detalhes"]);
    expect(sections[1].fields.map((field) => field.field_key)).toEqual([
      "segundo",
      "terceiro",
    ]);
    expect(new Set(sections.map((section) => section.key)).size).toBe(2);
  });

  it("mantém uma seção Geral para formulários sem campos", () => {
    expect(groupDynamicFormSections([])).toEqual([
      { key: "geral-0", name: "Geral", fields: [] },
    ]);
  });
});

describe("validateDynamicFormValues", () => {
  it("agrega erros de obrigatoriedade, tipo, limite, opção, data, arquivo e tipo desconhecido", () => {
    const fields: DynamicFormField[] = [
      { ...baseField, field_key: "nome", label: "Nome", is_required: true },
      {
        ...baseField,
        field_key: "idade",
        label: "Idade",
        field_type: "integer",
        validation_rules: { min: 18 },
        order_index: 2,
      },
      {
        ...baseField,
        field_key: "resumo",
        label: "Resumo",
        field_type: "textarea",
        validation_rules: { min_length: 5 },
        order_index: 3,
      },
      {
        ...baseField,
        field_key: "categoria",
        label: "Categoria",
        field_type: "select",
        options: [{ value: "a", label: "A" }],
        order_index: 4,
      },
      { ...baseField, field_key: "data", label: "Data", field_type: "date", order_index: 5 },
      { ...baseField, field_key: "anexo", label: "Anexo", field_type: "file_upload", is_required: true, order_index: 6 },
      { ...baseField, field_key: "futuro", label: "Futuro", field_type: "future", is_required: true, order_index: 7 },
    ];

    const result = validateDynamicFormValues(fields, {
      idade: "17.5",
      resumo: "oi",
      categoria: serializeDynamicFormOption("inexistente"),
      data: "2026-02-30",
    });

    expect(result.valid).toBe(false);
    expect(result.firstFieldKey).toBe("nome");
    expect(Object.keys(result.errors)).toEqual([
      "nome",
      "idade",
      "resumo",
      "categoria",
      "data",
      "anexo",
      "futuro",
    ]);
  });

  it("permite ausências no modo parcial, mas rejeita valores preenchidos inválidos", () => {
    const requiredNumber = {
      ...baseField,
      field_key: "quantidade",
      field_type: "integer",
      is_required: true,
    };

    expect(validateDynamicFormValues([requiredNumber], {}, "partial").valid).toBe(true);
    expect(
      validateDynamicFormValues([requiredNumber], { quantidade: "abc" }, "partial")
        .errors.quantidade,
    ).toContain("número válido");
  });

  it("aceita valores válidos, inclusive booleano falso", () => {
    const fields: DynamicFormField[] = [
      { ...baseField, field_key: "aceite", field_type: "boolean", is_required: true },
      { ...baseField, field_key: "quantidade", field_type: "integer", validation_rules: { min: 0, max: 2 }, order_index: 2 },
      { ...baseField, field_key: "categoria", field_type: "select", options: ["a"], order_index: 3 },
      { ...baseField, field_key: "data", field_type: "date", order_index: 4 },
    ];

    const result = validateDynamicFormValues(fields, {
      aceite: false,
      quantidade: "0",
      categoria: serializeDynamicFormOption("a"),
      data: "2026-09-12",
    });

    expect(result).toEqual({ valid: true, errors: {}, firstFieldKey: null });
  });
});

describe("validateDynamicFormFile", () => {
  const fileField: DynamicFormField = {
    ...baseField,
    field_type: "file_upload",
    validation_rules: { allowed_extensions: ["pdf"], max_size_mb: 1 },
  };

  it("valida extensão e tamanho de arquivo", () => {
    expect(validateDynamicFormFile(new File(["ok"], "metodo.pdf"), fileField)).toBeNull();
    expect(validateDynamicFormFile(new File(["x"], "metodo.txt"), fileField)).toContain("PDF");
    expect(
      validateDynamicFormFile(
        new File([new Uint8Array(1024 * 1024 + 1)], "metodo.pdf"),
        fileField,
      ),
    ).toContain("1 MB");
  });
});
