// utils/normalizeRowKeys.js

// Utility to convert "IG Link" => "igLink", "Avg View" => "avgView", etc.
const toCamelCase = (str) => {
  return str
    .replace(/\s+/g, " ") // normalize spaces
    .trim()
    .toLowerCase()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "");
};

const normalizeRowKeys = (row) => {
  const keyMap = {
    name: "name",
    iglink: "IG Link",
    genre: "genre",
    followers: "followers",
    avgview: "avg view",
    er: "er",
    location: "location",
    category: "category",
    contact: "contact",
    gender: "gender",
    contentquality: "content Quality",
    audiencetype: "Audience type",
    audienceauthenticity: "Audience  Authenticity",
    managedby: "Managed by",
    brandassociation: "brand association",
    audiencedemographics: "Audience demographics",
    lastcommunication: "Last communication",
    professionaloutlook: "professional outlook",
    businesspotential: "business potential",
    poc: "poc",
    response: "response",
    problems: "problems",
    ambitions: "ambitions",
    commercials: "commercials",
    collabReel: "collabReel",
    cpv: "cpv",
  };

  const normalized = {};
  for (const key in row) {
    const camelKey = toCamelCase(key);
    const finalKey = keyMap[camelKey] || camelKey;
    normalized[finalKey] = row[key];
  }

  return normalized;
};

export default normalizeRowKeys;
