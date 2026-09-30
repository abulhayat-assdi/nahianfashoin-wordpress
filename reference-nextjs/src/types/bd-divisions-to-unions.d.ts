declare module 'bd-divisions-to-unions' {
  type GeoItem = { value: number; title: string };
  type GeoMap = Record<string, GeoItem[]>;

  export function getAllDivision(type?: 'en' | 'bn'): GeoItem[];
  export function getAllDistrict(type?: 'en' | 'bn'): GeoMap;
  export function getAllUpazila(type?: 'en' | 'bn'): GeoMap;
  export function getAllUnion(type?: 'en' | 'bn'): GeoMap;
}
