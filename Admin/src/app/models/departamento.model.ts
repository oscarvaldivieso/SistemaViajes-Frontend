/**
 * Modelo de Departamento
 * Representa un departamento del sistema
 */
export interface Departamento {
    depa_Codigo: string;
    depa_Nombre: string;
    depa_FechaModificacion?: string | null;
    depa_FechaCreacion?: string;
    usua_Creacion?: number;
    usua_Modificacion?: number;
}
