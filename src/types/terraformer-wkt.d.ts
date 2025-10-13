// Type definitions for @terraformer/wkt
declare module '@terraformer/wkt' {
  /**
   * Converts a WKT (Well-Known Text) string to GeoJSON
   * @param wkt The WKT string to convert
   * @returns GeoJSON object
   */
  export function wktToGeoJSON(wkt: string): any;

  /**
   * Converts a GeoJSON object to WKT (Well-Known Text)
   * @param geojson The GeoJSON object to convert
   * @returns WKT string
   */
  export function geojsonToWKT(geojson: any): string;
}
