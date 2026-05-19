export interface LevelConfig {
  bricks: { col: number; row: number }[];
  steels: { col: number; row: number }[];
  enemyCount: number;
  playerCol: number;
  playerRow: number;
}

function baseWalls(): { col: number; row: number }[] {
  return [
    { col: 10, row: 18 },
    { col: 12, row: 18 },
    { col: 14, row: 18 },
    { col: 10, row: 20 },
    { col: 14, row: 20 },
  ];
}

export const LEVEL_1: LevelConfig = {
  playerCol: 8,
  playerRow: 19,
  enemyCount: 4,
  bricks: [
    ...baseWalls(),
    { col: 4, row: 4 }, { col: 8, row: 4 }, { col: 14, row: 4 }, { col: 18, row: 4 },
    { col: 4, row: 8 }, { col: 18, row: 8 },
    { col: 2, row: 10 }, { col: 10, row: 10 }, { col: 14, row: 10 }, { col: 22, row: 10 },
    { col: 6, row: 12 }, { col: 18, row: 12 },
    { col: 4, row: 14 }, { col: 10, row: 14 }, { col: 14, row: 14 }, { col: 20, row: 14 },
    { col: 4, row: 16 },
    { col: 8, row: 2 }, { col: 16, row: 2 },
  ],
  steels: [
    { col: 6, row: 6 }, { col: 18, row: 6 },
  ],
};

export const LEVEL_2: LevelConfig = {
  playerCol: 8,
  playerRow: 16,
  enemyCount: 6,
  bricks: [
    ...baseWalls(),
    { col: 2, row: 2 }, { col: 6, row: 2 }, { col: 10, row: 2 }, { col: 14, row: 2 }, { col: 18, row: 2 }, { col: 22, row: 2 },
    { col: 4, row: 4 }, { col: 20, row: 4 },
    { col: 2, row: 6 }, { col: 10, row: 6 }, { col: 14, row: 6 }, { col: 22, row: 6 },
    { col: 6, row: 8 }, { col: 18, row: 8 },
    { col: 2, row: 10 }, { col: 8, row: 10 }, { col: 10, row: 10 }, { col: 14, row: 10 }, { col: 16, row: 10 }, { col: 22, row: 10 },
    { col: 4, row: 12 }, { col: 20, row: 12 },
    { col: 6, row: 14 }, { col: 10, row: 14 }, { col: 14, row: 14 }, { col: 18, row: 14 },
    { col: 8, row: 16 }, { col: 16, row: 16 },
    { col: 4, row: 18 }, { col: 20, row: 18 },
    { col: 6, row: 20 }, { col: 10, row: 20 }, { col: 14, row: 20 }, { col: 18, row: 20 },
  ],
  steels: [
    { col: 2, row: 4 }, { col: 22, row: 4 },
    { col: 12, row: 8 },
  ],
};

export const LEVEL_3: LevelConfig = {
  playerCol: 8,
  playerRow: 16,
  enemyCount: 8,
  bricks: [
    ...baseWalls(),
    { col: 0, row: 0 }, { col: 4, row: 0 }, { col: 8, row: 0 }, { col: 12, row: 0 }, { col: 16, row: 0 }, { col: 20, row: 0 }, { col: 24, row: 0 },
    { col: 2, row: 2 }, { col: 6, row: 2 }, { col: 10, row: 2 }, { col: 14, row: 2 }, { col: 18, row: 2 }, { col: 22, row: 2 },
    { col: 0, row: 4 }, { col: 24, row: 4 },
    { col: 4, row: 6 }, { col: 8, row: 6 }, { col: 16, row: 6 }, { col: 20, row: 6 },
    { col: 2, row: 8 }, { col: 12, row: 8 }, { col: 22, row: 8 },
    { col: 6, row: 10 }, { col: 10, row: 10 }, { col: 14, row: 10 }, { col: 18, row: 10 },
    { col: 0, row: 12 }, { col: 24, row: 12 },
    { col: 4, row: 14 }, { col: 8, row: 14 }, { col: 16, row: 14 }, { col: 20, row: 14 },
    { col: 2, row: 16 }, { col: 12, row: 16 }, { col: 22, row: 16 },
    { col: 6, row: 18 }, { col: 10, row: 18 }, { col: 14, row: 18 }, { col: 18, row: 18 },
    { col: 0, row: 20 }, { col: 24, row: 20 },
    { col: 4, row: 22 }, { col: 8, row: 22 }, { col: 16, row: 22 }, { col: 20, row: 22 },
  ],
  steels: [
    { col: 6, row: 4 }, { col: 18, row: 4 },
    { col: 12, row: 6 },
    { col: 2, row: 12 }, { col: 22, row: 12 },
    { col: 12, row: 14 },
    { col: 6, row: 16 }, { col: 18, row: 16 },
  ],
};

export const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];
