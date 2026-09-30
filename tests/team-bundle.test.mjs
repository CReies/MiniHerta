import assert from "node:assert/strict";
import test from "node:test";

import { selectThreeTeamRuns, supportsThreeTeamSelection } from "../.test-dist/domain/scoring/team-bundle.js";

function makeRun({ id, boss = "Boss", endgame = "Pure Fiction", characters, missingScore }) {
  return {
    id,
    boss,
    endgame,
    missingScore,
    team: characters.map((char, index) => ({ slot: index + 1, char })),
  };
}

test("the three-team selection keeps three teams without repeated characters", () => {
  const selected = selectThreeTeamRuns(
    [
      makeRun({ id: "best", characters: ["A", "B", "C", "D"], missingScore: 0 }),
      makeRun({ id: "overlap", characters: ["A", "E", "F", "G"], missingScore: 1 }),
      makeRun({ id: "second", characters: ["H", "I", "J", "K"], missingScore: 2 }),
      makeRun({ id: "third", characters: ["L", "M", "N", "O"], missingScore: 3 }),
    ],
    "PF"
  );

  assert.deepEqual(
    selected.map((run) => run.id),
    ["best", "second", "third"]
  );

  const characters = selected.flatMap((run) => run.team.map((member) => member.char));
  assert.equal(new Set(characters).size, characters.length);
});

test("the selection searches past an overlapping top team when necessary", () => {
  const selected = selectThreeTeamRuns(
    [
      makeRun({ id: "overlapping-best", characters: ["A", "B", "C", "D"], missingScore: 0 }),
      makeRun({ id: "alternative-1", characters: ["A", "E", "F", "G"], missingScore: 1 }),
      makeRun({ id: "alternative-2", characters: ["B", "H", "I", "J"], missingScore: 2 }),
      makeRun({ id: "alternative-3", characters: ["C", "K", "L", "M"], missingScore: 3 }),
    ],
    "PF"
  );

  assert.deepEqual(
    selected.map((run) => run.id),
    ["alternative-1", "alternative-2", "alternative-3"]
  );
});

test("the AA selection ignores King runs and only uses Knights", () => {
  const selected = selectThreeTeamRuns(
    [
      makeRun({ id: "king", endgame: "AA", boss: "King (Plight)", characters: ["A", "B", "C", "D"], missingScore: 0 }),
      makeRun({ id: "king-normal", endgame: "AA", boss: "King", characters: ["Q", "R", "S", "T"], missingScore: 1 }),
      makeRun({ id: "knight-1", endgame: "AA", boss: "Argenti", characters: ["E", "F", "G", "H"], missingScore: 2 }),
      makeRun({ id: "knight-2", endgame: "AA", boss: "Svarog", characters: ["I", "J", "K", "L"], missingScore: 3 }),
      makeRun({
        id: "knight-3",
        endgame: "AA",
        boss: "Illwish Archlotus",
        characters: ["M", "N", "O", "P"],
        missingScore: 4,
      }),
    ],
    "AA"
  );

  assert.deepEqual(
    selected.map((run) => run.id),
    ["knight-1", "knight-2", "knight-3"]
  );
});

test("the bundle option is supported only by the four requested endgames", () => {
  assert.equal(supportsThreeTeamSelection("PF"), true);
  assert.equal(supportsThreeTeamSelection("AS"), true);
  assert.equal(supportsThreeTeamSelection("MoC"), true);
  assert.equal(supportsThreeTeamSelection("AA"), true);
  assert.equal(supportsThreeTeamSelection("Todos"), false);
});
