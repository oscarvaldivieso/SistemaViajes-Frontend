/**
 * Modelo de Colaborador en Viaje (para el listado)
 * Representa la información de un colaborador asociado a un viaje
 */
export interface ColaboradorEnViaje {
    viaj_Id: number;
    colb_Id: number;
    colb_Codigo: string;
    colb_Identidad: string;
    colb_NombreCompleto: string;
    colb_Telefono: string | null;
    colb_Sexo: string;
    clVj_DistanciaKm: number;
    clVj_TarifaPorKm: number;
    pagoIndividual: number;
    usua_Creacion: number;
    clVj_FechaCreacion: string;
    usua_Modificacion: number | null;
    clVj_FechaModificacion: string | null;
}

/**
 * Modelo de Viaje para Listado
 * Representa un viaje con toda la información necesaria para mostrar en el listado
 */
export interface ViajeListado {
    viaj_Id: number;
    viaj_Fecha: string;
    sucu_Id: number;
    sucu_Nombre: string;
    sucu_Direccion: string;
    tran_Id: number;
    transportista: string;
    transportistaTelefono: string;
    tarifaTransportista: number;
    usua_Creacion: number;
    usuarioCreacion: string;
    viaj_FechaCreacion: string;
    usua_Modificacion: number | null;
    usuarioModificacion: string | null;
    viaj_FechaModificacion: string | null;
    totalKm: number;
    totalPagar: number;
    cantidadColaboradores: number;
    colaboradores: ColaboradorEnViaje[];
}

/**
 * Respuesta de la API para el listado de viajes
 */
export interface ViajesListResponse {
    type: number;
    code: number;
    success: boolean;
    message: string;
    data: ViajeListado[];
}
