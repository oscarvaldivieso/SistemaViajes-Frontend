/**
 * Modelo de Municipio
 * Representa un municipio del sistema
 */
export interface Municipio {
    muni_Codigo: string;
    muni_Nombre: string;
    depa_Codigo: string;
    depa_Nombre: string;
    usua_Creacion?: number;
    munic_FechaCreacion?: string;
    usua_Modificacion?: number;
    munic_FechaModificacion?: string;
}
