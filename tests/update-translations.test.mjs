import assert from "node:assert/strict";
import test from "node:test";

import { buildTranslationMaps, collectItemNames, renderTranslationModule } from "../scripts/update-translations.mjs";

const indexes = {
  character: bilingualLookup(
    {
      1001: { id: "1001", name: "Firefly" },
      1224: { id: "1224", name: "March 7th" },
    },
    {
      1001: { id: "1001", name: "Luciérnaga" },
      1224: { id: "1224", name: "Siete de Marzo" },
    }
  ),
  lightCone: bilingualLookup(
    {
      21018: { id: "21018", name: "Dance! Dance! Dance!" },
    },
    {
      21018: { id: "21018", name: "¡A bailar!" },
    }
  ),
};

test("collects unique character and Light Cone names from both run shapes", () => {
  const names = collectItemNames([
    { p1_char: "Firefly", p1_lc: "Dance Dance Dance" },
    { data: { p1_char: "Firefly", p2_char: "March 7th (Hunt)" } },
  ]);

  assert.deepEqual([...names.characters].sort(), ["Firefly", "March 7th (Hunt)"]);
  assert.deepEqual([...names.lightCones], ["Dance Dance Dance"]);
});

test("joins locales by ID and applies run-name aliases", () => {
  const result = buildTranslationMaps(
    {
      characters: new Set(["Firefly", "March 7th (Hunt)", "Trailblazer: Destruction", "Unknown"]),
      lightCones: new Set(["Dance Dance Dance"]),
    },
    indexes
  );

  assert.equal(result.characters.get("Firefly"), "Luciérnaga");
  assert.equal(result.characters.get("March 7th (Hunt)"), "Siete de Marzo (Cacería)");
  assert.equal(result.characters.get("Trailblazer: Destruction"), "Trazacaminos (Destrucción)");
  assert.equal(result.lightCones.get("Dance Dance Dance"), "¡A bailar!");
  assert.deepEqual(result.unresolvedCharacters, ["Unknown"]);
});

test("renders a deterministic TypeScript translation module", () => {
  const output = renderTranslationModule(
    {
      characters: new Map([["Firefly", "Luciérnaga"]]),
      lightCones: new Map(),
    },
    "2026-07-24"
  );

  assert.match(output, /Last synchronized on 2026-07-24/);
  assert.match(output, /"Firefly": "Luciérnaga"/);
  assert.match(output, /spanishLightConeNames: Record<string, string> = \{\}/);
});

function bilingualLookup(englishById, spanishById) {
  return {
    englishById,
    spanishById,
    englishByName: new Map(Object.values(englishById).map((item) => [item.name, item])),
  };
}
