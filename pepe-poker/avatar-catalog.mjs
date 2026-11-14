export const DEFAULT_AVATAR_ID = "emerald";

export const AVATARS = Object.freeze([
  { id: "emerald", label: "Emerald Champion", src: "./avatars/emerald.webp" },
  { id: "royal", label: "Royal Pepe", src: "./cards/chip-stamp.webp" },
  { id: "bandit", label: "Jade Bandit", src: "./avatars/bandit.webp" },
  { id: "ninja", label: "Shadow Ninja", src: "./avatars/ninja.webp" },
  { id: "fallen", label: "Fallen Fighter", src: "./avatars/fallen.webp" },
  { id: "mecha", label: "Mecha Pepe", src: "./avatars/mecha.webp" },
  { id: "archer", label: "Emerald Archer", src: "./avatars/archer.webp" },
  { id: "brawler", label: "Jade Brawler", src: "./avatars/brawler.webp" },
  { id: "mage", label: "Relic Mage", src: "./avatars/mage.webp" },
  { id: "crown", label: "Crown Swordsman", src: "./avatars/crown.webp" }
].map(avatar => Object.freeze(avatar)));
