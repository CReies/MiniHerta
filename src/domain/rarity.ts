import type { Rarity } from "./types.js";

const fourStarCharacters = new Set([
  "Arlan",
  "Asta",
  "Dan Heng",
  "Gallagher",
  "Guinaifen",
  "Hanya",
  "Herta",
  "Hook",
  "Luka",
  "Lynx",
  "March 7th",
  "Misha",
  "Moze",
  "Natasha",
  "Pela",
  "Qingque",
  "Sampo",
  "Serval",
  "Sushang",
  "Tingyun",
  "Trailblazer (Elation)",
  "Trailblazer (Harmony)",
  "Trailblazer (Remembrance)",
  "Xueyi",
  "Yukong",
]);

const fourStarLightCones = new Set([
  "A Secret Vow",
  "After the Charmony Fall",
  "Boundless Choreo",
  "Concert for Two",
  "Dance! Dance! Dance!",
  "Dance Dance Dance",
  "Day One of My New Life",
  "Dream's Montage",
  "Eyes of the Prey",
  "Geniuses' Greetings",
  "Geniuses' Repose",
  "Good Night and Sleep Well",
  "Indelible Promise",
  "Landau's Choice",
  "Make the World Clamor",
  "Memories of the Past",
  "Only Silence Remains",
  "Perfect Timing",
  "Planetary Rendezvous",
  "Poised to Bloom",
  "Post-Op Conversation",
  "Resolution Shines As Pearls of Sweat",
  "Shadowed by Night",
  "Shared Feeling",
  "Subscribe for More!",
  "Swordplay",
  "The Birth of the Self",
  "The Moles Welcome You",
  "The Story's Next Page",
  "Trend of the Universal Market",
  "Under the Blue Sky",
]);

export function getCharacterRarity(name: string): Rarity {
  return fourStarCharacters.has(name) ? 4 : 5;
}

export function getLightConeRarity(name: string): Rarity {
  return fourStarLightCones.has(name) ? 4 : 5;
}
