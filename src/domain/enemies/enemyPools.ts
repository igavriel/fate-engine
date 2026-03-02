/**
 * Enemy content pack: species with name pools and baseline stat multipliers.
 * Used for deterministic enemy generation (species + name) and encounter stat scaling.
 */

export interface EnemySpeciesDef {
  names: readonly string[];
  hpMult: number;
  atkMult: number;
  defMult: number;
  /** Cosmetic only, no game logic */
  flavor?: string;
}

/** All species IDs (keys of ENEMY_POOLS). */
export const ENEMY_SPECIES_IDS = [
  "BANDIT",
  "GOBLIN",
  "SKELETON",
  "CULTIST",
  "WARG",
  "TROLL",
  "OGRE",
  "SHADE",
  "WARLOCK",
  "HARPY",
  "IMP",
  "WRAITH",
  "ORC",
  "SPIDER",
  "WOLF",
] as const;

export type EnemySpeciesId = (typeof ENEMY_SPECIES_IDS)[number];

export const ENEMY_POOLS: Record<EnemySpeciesId, EnemySpeciesDef> = {
  BANDIT: {
    names: [
      "Cutthroat Mick",
      "Black Bess",
      "One-Eye Jax",
      "Rusty Blade",
      "Sly Tom",
      "Gutter Gin",
      "Dirk the Quick",
      "Smuggler Sal",
      "Highway Hal",
      "Pocket Pick",
      "Shadow Sam",
      "Brigand Bram",
    ],
    hpMult: 1.0,
    atkMult: 1.1,
    defMult: 0.9,
    flavor: "outlaw",
  },
  GOBLIN: {
    names: [
      "Snikk",
      "Grikk",
      "Blarg",
      "Nikkit",
      "Sprogg",
      "Drikk",
      "Wikkit",
      "Gnak",
      "Zib",
      "Krikk",
      "Blorp",
      "Snagg",
      "Grub",
      "Snik",
      "Blikk",
    ],
    hpMult: 0.85,
    atkMult: 1.0,
    defMult: 0.8,
    flavor: "greenskin",
  },
  SKELETON: {
    names: [
      "Bone Grinder",
      "Rattler",
      "Crestfallen",
      "Old Bones",
      "Clatter",
      "Dust Walker",
      "Ribcage",
      "Skull Face",
      "Hollow",
      "Brittle",
      "Grim Jaw",
      "Ash Bone",
      "Weary Bones",
      "Bone Shard",
    ],
    hpMult: 0.9,
    atkMult: 1.0,
    defMult: 1.1,
    flavor: "undead",
  },
  CULTIST: {
    names: [
      "Brother Void",
      "Sister Whisper",
      "Acolyte Dusk",
      "Hooded One",
      "Elder Murk",
      "Disciple of the Eye",
      "Chant Keeper",
      "Rite Master",
      "Dark Veil",
      "Shadow Priest",
      "Blood Scribbler",
      "Candle Bearer",
    ],
    hpMult: 0.95,
    atkMult: 1.15,
    defMult: 0.85,
    flavor: "fanatic",
  },
  WARG: {
    names: [
      "Fang",
      "Grey Maw",
      "Shadow Pelt",
      "Blood Howl",
      "Winter Coat",
      "Ash Tooth",
      "Pack Leader",
      "Swift Claw",
      "Black Ear",
      "Red Eye",
      "Iron Jaw",
      "Storm Runner",
      "Night Stalker",
    ],
    hpMult: 1.1,
    atkMult: 1.2,
    defMult: 0.9,
    flavor: "beast",
  },
  TROLL: {
    names: [
      "Boulder Fist",
      "Cave Grunt",
      "Moss Back",
      "Stone Belly",
      "Regenerator",
      "Bone Crusher",
      "Rock Hide",
      "Swamp Stomper",
      "Grim Tooth",
      "Thick Skin",
      "Boulder",
      "Gutter Troll",
    ],
    hpMult: 1.4,
    atkMult: 1.2,
    defMult: 1.1,
    flavor: "brute",
  },
  OGRE: {
    names: [
      "Grom",
      "Thunk",
      "Bash",
      "Heavy Hand",
      "Club Bearer",
      "Mountain Gut",
      "Smash",
      "Big Lug",
      "Boulder Shoulder",
      "Crush",
      "Dumb Ox",
      "Hulk",
    ],
    hpMult: 1.35,
    atkMult: 1.25,
    defMult: 1.05,
    flavor: "brute",
  },
  SHADE: {
    names: [
      "Dusk Walker",
      "Veil",
      "Echo",
      "Silent One",
      "Shadow Step",
      "Phantom",
      "Wraithkin",
      "Fade",
      "Gloom",
      "Drift",
      "Murmur",
      "Unseen",
    ],
    hpMult: 0.8,
    atkMult: 1.1,
    defMult: 0.95,
    flavor: "spirit",
  },
  WARLOCK: {
    names: [
      "Malachar",
      "Vex",
      "Dreadweaver",
      "Soul Binder",
      "Dark Covenant",
      "Hex",
      "Blight Hand",
      "Curse Bearer",
      "Void Speaker",
      "Thorn",
    ],
    hpMult: 0.9,
    atkMult: 1.3,
    defMult: 0.85,
    flavor: "caster",
  },
  HARPY: {
    names: [
      "Screech",
      "Feather Claw",
      "Wind Caller",
      "Sky Dancer",
      "Talon",
      "Shriek",
      "Storm Wing",
      "Razor Plume",
      "Wind Witch",
      "Claw",
      "Scream",
      "Hag Wing",
    ],
    hpMult: 0.85,
    atkMult: 1.15,
    defMult: 0.9,
    flavor: "flyer",
  },
  IMP: {
    names: [
      "Fizz",
      "Spit",
      "Cinder",
      "Poke",
      "Nettle",
      "Ember",
      "Spite",
      "Giggle",
      "Soot",
      "Trick",
      "Blaze",
      "Prank",
    ],
    hpMult: 0.7,
    atkMult: 1.05,
    defMult: 0.75,
    flavor: "demon",
  },
  WRAITH: {
    names: [
      "The Hungry",
      "Soul Drinker",
      "Cold Touch",
      "Wail",
      "Dread",
      "Lament",
      "Sorrow",
      "Chill",
      "Frost Breath",
      "Ethereal",
    ],
    hpMult: 0.85,
    atkMult: 1.2,
    defMult: 0.9,
    flavor: "undead",
  },
  ORC: {
    names: [
      "Gash",
      "Grimjaw",
      "Blood Axe",
      "Iron Fist",
      "Bone Breaker",
      "War Cry",
      "Gore",
      "Thrak",
      "Snag",
      "Grishnak",
      "Uruk",
      "Bruiser",
    ],
    hpMult: 1.15,
    atkMult: 1.15,
    defMult: 1.0,
    flavor: "warrior",
  },
  SPIDER: {
    names: [
      "Venom",
      "Silk Spinner",
      "Eight Eyes",
      "Web Weaver",
      "Fang",
      "Lurker",
      "Egg Sac",
      "Crawler",
      "Widow",
      "Spinner",
      "Hatchling",
      "Brood Mother",
    ],
    hpMult: 0.9,
    atkMult: 1.1,
    defMult: 0.85,
    flavor: "beast",
  },
  WOLF: {
    names: [
      "Alpha",
      "Grey",
      "Frost",
      "Shadow",
      "Fang",
      "Howler",
      "Pack",
      "Lone",
      "Swift",
      "Red",
      "Winter",
      "Ash",
    ],
    hpMult: 1.0,
    atkMult: 1.1,
    defMult: 0.95,
    flavor: "beast",
  },
};

/** Species IDs as a list for RNG pick. */
export const SPECIES_LIST: readonly EnemySpeciesId[] = ENEMY_SPECIES_IDS;

/**
 * Get stat multipliers for a species. Returns defaults (1, 1, 1) if species is unknown.
 */
export function getSpeciesStats(species: string): {
  hpMult: number;
  atkMult: number;
  defMult: number;
} {
  const def = ENEMY_POOLS[species as EnemySpeciesId];
  if (!def) {
    return { hpMult: 1, atkMult: 1, defMult: 1 };
  }
  return {
    hpMult: def.hpMult,
    atkMult: def.atkMult,
    defMult: def.defMult,
  };
}

/**
 * Get name pool for a species. Returns empty array if unknown (caller should not pick).
 */
export function getNamePoolForSpecies(species: string): readonly string[] {
  const def = ENEMY_POOLS[species as EnemySpeciesId];
  return def?.names ?? [];
}
