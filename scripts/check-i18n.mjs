import { readFile } from "node:fs/promises";

const dictionaryPaths = ["i18n/locales/pt-BR.json", "i18n/locales/en.json"];
const dictionaries = await Promise.all(
  dictionaryPaths.map(async (path) => JSON.parse(await readFile(path, "utf8"))),
);

const [reference, translated] = dictionaries.map((dictionary) =>
  flattenDictionary(dictionary),
);
const errors = [];

for (const key of new Set([...reference.keys(), ...translated.keys()])) {
  if (!reference.has(key)) errors.push(`Chave extra em en.json: ${key}`);
  if (!translated.has(key)) errors.push(`Chave ausente em en.json: ${key}`);
  if (!reference.has(key) || !translated.has(key)) continue;

  const referenceValue = reference.get(key);
  const translatedValue = translated.get(key);
  if (typeof referenceValue !== typeof translatedValue) {
    errors.push(`Tipo divergente em ${key}`);
    continue;
  }

  if (typeof referenceValue === "string") {
    const referenceVariables = interpolationVariables(referenceValue);
    const translatedVariables = interpolationVariables(translatedValue);
    if (referenceVariables.join("|") !== translatedVariables.join("|")) {
      errors.push(`Variáveis de interpolação divergentes em ${key}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Dicionários válidos: ${reference.size} valores equivalentes.`);
}

function flattenDictionary(value, prefix = "", output = new Map()) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    output.set(prefix, value);
    return output;
  }

  for (const [key, child] of Object.entries(value)) {
    flattenDictionary(child, prefix ? `${prefix}.${key}` : key, output);
  }

  return output;
}

function interpolationVariables(value) {
  return [...value.matchAll(/{{\s*([^},\s]+)[^}]*}}/g)]
    .map((match) => match[1])
    .sort();
}
