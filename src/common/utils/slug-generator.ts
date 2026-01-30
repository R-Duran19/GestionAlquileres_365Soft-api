/**
 * Genera un slug URL-friendly a partir de un nombre
 * @param name - Nombre de la empresa (ej: "Inmuebles Bolivia SRL")
 * @returns Slug generado (ej: "inmuebles-bolivia-srl")
 */
export function generateSlug(name: string): string {
  return name
    .toString() // Convertir a string
    .toLowerCase() // Convertir a minúsculas
    .trim() // Remover espacios al inicio y final
    .normalize('NFD') // Normalizar caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[^\w\s-]/g, '') // Remover caracteres no alfanuméricos (excepto guiones y espacios)
    .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones bajos con un solo guión
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}

/**
 * Genera un slug único agregando un sufijo numérico si es necesario
 * @param name - Nombre base
 * @param existingSlugs - Array de slugs que ya existen
 * @returns Slug único
 */
export function generateUniqueSlug(name: string, existingSlugs: string[] = []): string {
  let slug = generateSlug(name);
  let counter = 1;
  let originalSlug = slug;

  // Si el slug ya existe, agregar número
  while (existingSlugs.includes(slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  return slug;
}
