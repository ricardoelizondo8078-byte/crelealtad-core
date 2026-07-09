export const DEFAULT_STATE = 'NUEVO LEON';

export const NUEVO_LEON_MUNICIPALITIES = [
  'ABASOLO',
  'AGUALEGUAS',
  'LOS ALDAMAS',
  'ALLENDE',
  'ANAHUAC',
  'APODACA',
  'ARAMBERRI',
  'BUSTAMANTE',
  'CADEREYTA JIMENEZ',
  'CARMEN',
  'CERRALVO',
  'CIENEGA DE FLORES',
  'CHINA',
  'DOCTOR ARROYO',
  'DOCTOR COSS',
  'DOCTOR GONZALEZ',
  'GALEANA',
  'GARCIA',
  'GENERAL BRAVO',
  'GENERAL ESCOBEDO',
  'GENERAL TERAN',
  'GENERAL TREVIÑO',
  'GENERAL ZARAGOZA',
  'GENERAL ZUAZUA',
  'GUADALUPE',
  'HERRERAS',
  'HIDALGO',
  'HIGUERAS',
  'HUALAHUISES',
  'ITURBIDE',
  'JUAREZ',
  'LAMPAZOS DE NARANJO',
  'LINARES',
  'MARIN',
  'MELCHOR OCAMPO',
  'MIER Y NORIEGA',
  'MINA',
  'MONTEMORELOS',
  'MONTERREY',
  'PARAS',
  'PESQUERIA',
  'RAYONES',
  'SABINAS HIDALGO',
  'SALINAS VICTORIA',
  'SAN NICOLAS DE LOS GARZA',
  'SAN PEDRO GARZA GARCIA',
  'SANTA CATARINA',
  'SANTIAGO',
  'VALLECILLO',
  'VILLALDAMA',
] as const;

export interface AddressCatalogEntry {
  codigoPostal: string;
  colonia: string;
  municipio: string;
  estado: string;
}

export interface PostalCodeCatalogEntry {
  codigoPostal: string;
  colonias: string[];
  municipio: string;
  estado: string;
}

export const POSTAL_CODE_CATALOG_NL: PostalCodeCatalogEntry[] = [
  {
    codigoPostal: '66220',
    colonias: ['DEL VALLE', 'DEL VALLE ORIENTE', 'VALLE ORIENTE'],
    municipio: 'SAN PEDRO GARZA GARCIA',
    estado: DEFAULT_STATE,
  },
  {
    codigoPostal: '64610',
    colonias: ['CUMBRES', 'VISTA HERMOSA'],
    municipio: 'MONTERREY',
    estado: DEFAULT_STATE,
  },
  {
    codigoPostal: '67100',
    colonias: ['CENTRO GUADALUPE', 'LINDA VISTA'],
    municipio: 'GUADALUPE',
    estado: DEFAULT_STATE,
  },
];

const normalizePostalCode = (codigoPostal: string): string => codigoPostal.replace(/\D/g, '').slice(0, 5);

export const findPostalCodeEntry = (codigoPostal: string): PostalCodeCatalogEntry | undefined => {
  const normalizedPostalCode = normalizePostalCode(codigoPostal);
  if (normalizedPostalCode.length !== 5) {
    return undefined;
  }

  return POSTAL_CODE_CATALOG_NL.find((entry) => entry.codigoPostal === normalizedPostalCode);
};

export const getColoniasByPostalCode = (codigoPostal: string): string[] =>
  findPostalCodeEntry(codigoPostal)?.colonias ?? [];

// Placeholder for future API-backed catalog loading.
export const LOCAL_ADDRESS_CATALOG: AddressCatalogEntry[] = [];
