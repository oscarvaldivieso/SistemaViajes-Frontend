import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Transportista } from 'src/app/models/transportista.model';
import { AuthenticationService } from './auth.service';

interface ApiResponse<T> {
    type: number;
    code: number;
    success: boolean;
    message: string;
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class TransportistasService {

    private apiUrl = `${environment.apiUrl}/Transportistas`;

    constructor(
        private http: HttpClient,
        private authService: AuthenticationService
    ) { }

    /**
     * Obtiene el ID del usuario autenticado
     */
    private getAuthenticatedUserId(): number {
        const user = this.authService.getAuthenticatedUser();
        return user?.Usua_Id || 0;
    }

    /**
     * Crea los headers HTTP estándar
     */
    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'XApiKey': environment.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
    }

    /**
     * Lista todos los transportistas
     */
    listarTransportistas(): Observable<ApiResponse<Transportista[]>> {
        return this.http.get<ApiResponse<Transportista[]>>(
            `${this.apiUrl}/Listar`,
            { headers: this.getHeaders() }
        ).pipe(
            tap(response => {
                if (response.success) {
                    console.log('✅ Transportistas cargados:', response.data.length);
                }
            }),
            catchError(this.handleError)
        );
    }

    /**
     * Obtiene un transportista por ID
     */
    obtenerTransportista(id: number): Observable<ApiResponse<Transportista>> {
        return this.http.get<ApiResponse<Transportista>>(
            `${this.apiUrl}/Obtener/${id}`,
            { headers: this.getHeaders() }
        ).pipe(
            tap(response => {
                if (response.success) {
                    console.log('✅ Transportista obtenido:', response.data);
                }
            }),
            catchError(this.handleError)
        );
    }

    /**
     * Inserta un nuevo transportista
     * Automáticamente asigna el usuario de creación
     */
    insertarTransportista(transportista: Transportista): Observable<ApiResponse<Transportista>> {
        // Asignar el usuario autenticado como creador
        const transportistaConUsuario = {
            ...transportista,
            usua_Creacion: this.getAuthenticatedUserId()
        };

        console.log('📤 Insertando transportista:', transportistaConUsuario);

        return this.http.post<ApiResponse<Transportista>>(
            `${this.apiUrl}/Insertar`,
            transportistaConUsuario,
            { headers: this.getHeaders() }
        ).pipe(
            tap(response => {
                if (response.success) {
                    console.log('✅ Transportista creado exitosamente:', response.data);
                }
            }),
            catchError(error => {
                console.error('❌ Error al crear transportista:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Actualiza un transportista existente
     * Automáticamente asigna el usuario de modificación
     */
    actualizarTransportista(transportista: Transportista): Observable<ApiResponse<Transportista>> {
        // Asignar el usuario autenticado como modificador
        const transportistaConUsuario = {
            ...transportista,
            usua_Modificacion: this.getAuthenticatedUserId()
        };

        console.log('📤 Actualizando transportista:', transportistaConUsuario);

        return this.http.put<ApiResponse<Transportista>>(
            `${this.apiUrl}/Actualizar`,
            transportistaConUsuario,
            { headers: this.getHeaders() }
        ).pipe(
            tap(response => {
                if (response.success) {
                    console.log('✅ Transportista actualizado exitosamente:', response.data);
                }
            }),
            catchError(error => {
                console.error('❌ Error al actualizar transportista:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Elimina un transportista por ID
     */
    eliminarTransportista(id: number): Observable<ApiResponse<any>> {
        console.log('📤 Eliminando transportista ID:', id);

        return this.http.delete<ApiResponse<any>>(
            `${this.apiUrl}/Eliminar/${id}`,
            { headers: this.getHeaders() }
        ).pipe(
            tap(response => {
                if (response.success) {
                    console.log('✅ Transportista eliminado exitosamente');
                }
            }),
            catchError(error => {
                console.error('❌ Error al eliminar transportista:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Maneja los errores de las peticiones HTTP
     */
    private handleError(error: any) {
        let errorMessage = 'Ocurrió un error desconocido';

        if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Error del lado del servidor
            errorMessage = `Código de error: ${error.status}, mensaje: ${error.message}`;
        }

        console.error('❌ Error en servicio:', errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
