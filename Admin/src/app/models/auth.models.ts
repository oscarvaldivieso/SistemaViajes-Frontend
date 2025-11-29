/**
 * Modelos de Autenticación
 * Basados en los DTOs del backend para el sistema de login con JWT
 */

/**
 * Modelo para la solicitud de login
 * Corresponde a LoginRequestDTO del backend
 */
export interface LoginRequest {
    Usua_Usuario: string;
    Usua_Clave: string;
}

/**
 * Modelo para la respuesta de login
 * Corresponde a LoginResponseDTO del backend
 */
export interface LoginResponse {
    Resultado: string;
    Mensaje: string;
    Usua_Id?: number;
    Usua_Usuario?: string;
    Role_Id?: number;
    Role_Descripcion?: string;
}

/**
 * Modelo para la respuesta JWT
 * Corresponde a JwtResponseDTO del backend
 */
export interface JwtResponse {
    token: string;
    Usua_Id?: number;
    Usua_Usuario?: string;
    Role_Id?: number;
    Role_Descripcion?: string;
    expires_at: Date;
}

/**
 * Modelo para el usuario autenticado
 * Se almacena en localStorage
 */
export interface AuthenticatedUser {
    token: string;
    Usua_Id: number;
    Usua_Usuario: string;
    Role_Id: number;
    Role_Descripcion: string;
    expires_at: Date;
}
