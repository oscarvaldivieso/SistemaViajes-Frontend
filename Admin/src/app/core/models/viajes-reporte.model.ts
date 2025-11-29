// ============================================
// Modelos para el Reporte de Viajes
// ============================================

/**
 * Request DTO para generar el reporte de viajes
 */
export interface ViajesReporteRequest {
    fechaInicio: string | Date;
    fechaFin: string | Date;
    tran_Id?: number | null;
}

/**
 * Detalle de un viaje en el reporte
 */
export interface ViajeDetalleReporte {
    viaj_Id: number;
    viaj_Fecha: string | Date;

    // Transportista
    tran_Id: number;
    tran_Identidad: string;
    tran_Nombre: string;
    tran_Telefono: string;
    tran_TarifaPorKm: number;

    // Sucursal
    sucu_Id: number;
    sucu_Nombre: string;
    sucu_Direccion: string;

    // Colaborador
    colb_Id: number;
    colb_Codigo: string;
    colb_DNI: string;
    colb_Nombre: string;
    colb_Telefono: string;
    colb_Sexo: string;

    // Datos del viaje
    clVj_TarifaPorKm: number;
    clVj_DistanciaKm: number;
    montoPorColaborador: number;

    // Auditoría
    usua_Creacion: number;
    usuarioRegistro: string;
    viaj_FechaCreacion: string | Date;
}

/**
 * Resumen de viajes por transportista
 */
export interface TransportistaResumenReporte {
    tran_Id: number;
    tran_Identidad: string;
    tran_Nombre: string;
    tran_Telefono: string;
    tran_TarifaPorKm: number;
    totalViajes: number;
    totalColaboradores: number;
    totalKilometros: number;
    totalAPagar: number;
}

/**
 * Response DTO del reporte de viajes
 */
export interface ViajesReporteResponse {
    detalleViajes: ViajeDetalleReporte[];
    resumenTransportistas: TransportistaResumenReporte[];
}
