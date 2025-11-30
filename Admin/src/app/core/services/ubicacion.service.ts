import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Departamento } from 'src/app/models/departamento.model';
import { Municipio } from 'src/app/models/municipio.model';

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
export class UbicacionService {

    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

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
     * Lista todos los departamentos
     */
    listarDepartamentos(): Observable<ApiResponse<Departamento[]>> {
        console.log('📍 Obteniendo lista de departamentos...');

        return this.http.get<ApiResponse<Departamento[]>>(`${this.apiUrl}/Departamentos/Listar`, {
            headers: this.getHeaders()
        }).pipe(
            tap(response => {
                if (response.success) {
                    console.log('✅ Departamentos obtenidos:', response.data.length);
                }
            }),
            catchError(error => {
                console.error('❌ Error al obtener departamentos:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Lista los municipios de un departamento específico
     * @param codigoDepartamento Código del departamento (ej: "05" para Cortés)
     */
    listarMunicipiosPorDepartamento(codigoDepartamento: string): Observable<ApiResponse<Municipio[]>> {
        console.log('📍 Obteniendo municipios del departamento:', codigoDepartamento);

        return this.http.get<ApiResponse<Municipio[]>>(`${this.apiUrl}/Municipios/Listar/${codigoDepartamento}`, {
            headers: this.getHeaders()
        }).pipe(
            tap(response => {
                if (response.success) {
                    console.log('✅ Municipios obtenidos:', response.data.length);
                }
            }),
            catchError(error => {
                console.error('❌ Error al obtener municipios:', error);
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
