// Country centroids for map bubbles.
// Source: approximate geographic centroids (WGS84 lng/lat).
// Used to place bubbles when the topojson lookup by name fails.

export interface Centroid { name: string; lng: number; lat: number; iso3?: string; }

export const COUNTRY_CENTROIDS: Record<string, Centroid> = {
  GB: { name: "United Kingdom", lng: -2.5, lat: 54.0, iso3: "GBR" },
  US: { name: "United States", lng: -98.5, lat: 39.8, iso3: "USA" },
  IE: { name: "Ireland", lng: -8.0, lat: 53.4, iso3: "IRL" },
  DE: { name: "Germany", lng: 10.4, lat: 51.2, iso3: "DEU" },
  FR: { name: "France", lng: 2.4, lat: 46.6, iso3: "FRA" },
  ES: { name: "Spain", lng: -3.7, lat: 40.4, iso3: "ESP" },
  IT: { name: "Italy", lng: 12.6, lat: 42.8, iso3: "ITA" },
  NL: { name: "Netherlands", lng: 5.3, lat: 52.1, iso3: "NLD" },
  AU: { name: "Australia", lng: 133.8, lat: -25.3, iso3: "AUS" },
  CA: { name: "Canada", lng: -106.3, lat: 56.1, iso3: "CAN" },
  NZ: { name: "New Zealand", lng: 174.9, lat: -40.9, iso3: "NZL" },
  ZA: { name: "South Africa", lng: 22.9, lat: -30.6, iso3: "ZAF" },
  AE: { name: "United Arab Emirates", lng: 53.8, lat: 23.4, iso3: "ARE" },
  IN: { name: "India", lng: 78.9, lat: 20.6, iso3: "IND" },
  PT: { name: "Portugal", lng: -8.2, lat: 39.4, iso3: "PRT" },
  PL: { name: "Poland", lng: 19.1, lat: 51.9, iso3: "POL" },
  SE: { name: "Sweden", lng: 18.6, lat: 60.1, iso3: "SWE" },
  NO: { name: "Norway", lng: 8.5, lat: 60.5, iso3: "NOR" },
  DK: { name: "Denmark", lng: 9.5, lat: 56.3, iso3: "DNK" },
  FI: { name: "Finland", lng: 25.7, lat: 61.9, iso3: "FIN" },
  BE: { name: "Belgium", lng: 4.5, lat: 50.5, iso3: "BEL" },
  CH: { name: "Switzerland", lng: 8.2, lat: 46.8, iso3: "CHE" },
  AT: { name: "Austria", lng: 14.6, lat: 47.5, iso3: "AUT" },
  BR: { name: "Brazil", lng: -51.9, lat: -14.2, iso3: "BRA" },
  MX: { name: "Mexico", lng: -102.6, lat: 23.6, iso3: "MEX" },
  JP: { name: "Japan", lng: 138.3, lat: 36.2, iso3: "JPN" },
  SG: { name: "Singapore", lng: 103.8, lat: 1.35, iso3: "SGP" },
  HK: { name: "Hong Kong", lng: 114.2, lat: 22.3, iso3: "HKG" },
  KR: { name: "South Korea", lng: 127.8, lat: 35.9, iso3: "KOR" },
  TR: { name: "Turkey", lng: 35.2, lat: 38.9, iso3: "TUR" },
  GR: { name: "Greece", lng: 21.8, lat: 39.1, iso3: "GRC" },
  CZ: { name: "Czechia", lng: 15.5, lat: 49.8, iso3: "CZE" },
  RO: { name: "Romania", lng: 24.9, lat: 45.9, iso3: "ROU" },
  HU: { name: "Hungary", lng: 19.5, lat: 47.2, iso3: "HUN" },
  IL: { name: "Israel", lng: 34.9, lat: 31.0, iso3: "ISR" },
  TH: { name: "Thailand", lng: 100.9, lat: 15.9, iso3: "THA" },
  MY: { name: "Malaysia", lng: 101.9, lat: 4.2, iso3: "MYS" },
  PH: { name: "Philippines", lng: 121.7, lat: 12.9, iso3: "PHL" },
  ID: { name: "Indonesia", lng: 113.9, lat: -0.8, iso3: "IDN" },
  VN: { name: "Vietnam", lng: 108.3, lat: 14.1, iso3: "VNM" },
  CL: { name: "Chile", lng: -71.5, lat: -35.7, iso3: "CHL" },
  AR: { name: "Argentina", lng: -63.6, lat: -38.4, iso3: "ARG" },
  CO: { name: "Colombia", lng: -74.3, lat: 4.6, iso3: "COL" },
  NG: { name: "Nigeria", lng: 8.7, lat: 9.1, iso3: "NGA" },
  KE: { name: "Kenya", lng: 37.9, lat: -0.02, iso3: "KEN" },
  EG: { name: "Egypt", lng: 30.8, lat: 26.8, iso3: "EGY" },
  SA: { name: "Saudi Arabia", lng: 45.1, lat: 23.9, iso3: "SAU" },
  QA: { name: "Qatar", lng: 51.2, lat: 25.4, iso3: "QAT" },
  CN: { name: "China", lng: 104.2, lat: 35.9, iso3: "CHN" },
};

export function centroidFor(cc: string | null | undefined): Centroid | null {
  if (!cc || cc.length !== 2) return null;
  return COUNTRY_CENTROIDS[cc.toUpperCase()] ?? null;
}
