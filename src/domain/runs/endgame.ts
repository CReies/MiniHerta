const endgameAliases: Readonly<Record<string, string>> = {
  aa: "Anomaly Arbitration",
  "anomaly arbitration": "Anomaly Arbitration",
  as: "Apocalyptic Shadow",
  "apocalyptic shadow": "Apocalyptic Shadow",
  moc: "Memory of Chaos",
  "memory of chaos": "Memory of Chaos",
  pf: "Pure Fiction",
  "pure fiction": "Pure Fiction",
};

export function canonicalEndgame(value: string): string {
  const trimmed = value.trim();
  return endgameAliases[trimmed.toLowerCase()] ?? trimmed;
}
