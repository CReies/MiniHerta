import assert from "node:assert/strict";
import test from "node:test";
import { filterCharacters } from "../dist/ui/inventory.js";

const characters = [
  { name: "Acheron", rarity: 5 },
  { name: "Castorice", rarity: 5 },
];

const usage = new Map([
  ["Acheron", [{ name: "Along the Passing Shore", uses: 16 }]],
  ["Castorice", [{ name: "Make Farewells More Beautiful", uses: 8 }]],
]);

test("inventory character search matches character names", () => {
  assert.deepEqual(
    filterCharacters(characters, usage, "acheron").map((character) => character.name),
    ["Acheron"]
  );
});

test("inventory character search also matches recommended light cones", () => {
  assert.deepEqual(
    filterCharacters(characters, usage, "passing shore").map((character) => character.name),
    ["Acheron"]
  );
});

test("inventory character search remains accent and case insensitive", () => {
  assert.deepEqual(
    filterCharacters(characters, usage, "FAREWELLS").map((character) => character.name),
    ["Castorice"]
  );
});
