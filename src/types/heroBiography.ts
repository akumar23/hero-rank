/**
 * Hero biography data extracted from SuperHero API response.
 * The API returns nested objects (biography, work, connections),
 * but we'll store a flattened version for easier access.
 */
export interface HeroBiography {
  "full-name": string;
  "alter-egos": string;
  aliases: string[];
  "place-of-birth": string;
  "first-appearance": string;
  publisher: string;
  alignment: string;
  occupation: string;
  "base-of-operations": string;
  "group-affiliation": string;
  relatives: string;
}

/**
 * Full SuperHero API response structure.
 * Used for type safety when fetching hero data.
 */
export interface SuperHeroApiResponse {
  response: string;
  id?: string;
  name?: string;
  error?: string;
  powerstats?: Record<string, string>;
  biography?: {
    "full-name": string;
    "alter-egos": string;
    aliases: string[];
    "place-of-birth": string;
    "first-appearance": string;
    publisher: string;
    alignment: string;
  };
  appearance?: Record<string, unknown>;
  work?: {
    occupation: string;
    base: string; // This is "base-of-operations"
  };
  connections?: {
    "group-affiliation": string;
    relatives: string;
  };
  image?: {
    url: string;
  };
}

/**
 * Extracts biography data from SuperHero API response and converts to HeroBiography format.
 */
export function extractBiographyData(apiResponse: SuperHeroApiResponse): HeroBiography {
  // Handle missing biography data gracefully
  const biography = apiResponse.biography || {
    "full-name": "",
    "alter-egos": "",
    aliases: [],
    "place-of-birth": "",
    "first-appearance": "",
    publisher: "",
    alignment: "",
  };
  const work = apiResponse.work || { occupation: "", base: "" };
  const connections = apiResponse.connections || { "group-affiliation": "", relatives: "" };
  
  return {
    "full-name": biography["full-name"] || "",
    "alter-egos": biography["alter-egos"] || "",
    aliases: biography.aliases || [],
    "place-of-birth": biography["place-of-birth"] || "",
    "first-appearance": biography["first-appearance"] || "",
    publisher: biography.publisher || "",
    alignment: biography.alignment || "",
    occupation: work.occupation || "",
    "base-of-operations": work.base || "",
    "group-affiliation": connections["group-affiliation"] || "",
    relatives: connections.relatives || "",
  };
}

