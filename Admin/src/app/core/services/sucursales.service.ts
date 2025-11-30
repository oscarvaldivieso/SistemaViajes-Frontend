import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Sucursal } from 'src/app/models/sucursal.model';
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
export class SucursalesService {

  private apiUrl = `${environment.apiUrl}/Sucursales`;

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
   * Lista todas las sucursales
   */
  listarSucursales(): Observable<ApiResponse<Sucursal[]>> {
    return this.http.get<ApiResponse<Sucursal[]>>(`${this.apiUrl}/Listar`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene una sucursal por ID
   */
  obtenerSucursal(id: number): Observable<ApiResponse<Sucursal>> {
    return this.http.get<ApiResponse<Sucursal>>(`${this.apiUrl}/Obtener/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Inserta una nueva sucursal
   * Automáticamente asigna el usuario de creación
   */
  insertarSucursal(sucursal: Sucursal): Observable<ApiResponse<Sucursal>> {
    // Asignar el usuario autenticado como creador
    const sucursalConUsuario = {
      ...sucursal,
      usua_Creacion: this.getAuthenticatedUserId()
    };

    console.log('📤 Insertando sucursal:', sucursalConUsuario);

    return this.http.post<ApiResponse<Sucursal>>(
      `${this.apiUrl}/Insertar`,
      sucursalConUsuario,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Sucursal insertada exitosamente:', response.data);
        }
      }),
      catchError(error => {
        console.error('❌ Error al insertar sucursal:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza una sucursal existente
   * Automáticamente asigna el usuario de modificación
   */
  actualizarSucursal(sucursal: Sucursal): Observable<ApiResponse<Sucursal>> {
    // Asignar el usuario autenticado como modificador
    const sucursalConUsuario = {
      ...sucursal,
      usua_Modificacion: this.getAuthenticatedUserId()
    };

    console.log('📤 Actualizando sucursal:', sucursalConUsuario);

    return this.http.post<ApiResponse<Sucursal>>(
      `${this.apiUrl}/Actualizar`,
      sucursalConUsuario,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Sucursal actualizada exitosamente:', response.data);
        }
      }),
      catchError(error => {
        console.error('❌ Error al actualizar sucursal:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina una sucursal
   */
  eliminarSucursal(id: number): Observable<ApiResponse<any>> {
    console.log('🗑️ Eliminando sucursal ID:', id);

    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/Eliminar/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Sucursal eliminada exitosamente');
        }
      }),
      catchError(error => {
        console.error('❌ Error al eliminar sucursal:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sube una imagen a Cloudinary
   * @param file Archivo de imagen a subir
   * @returns Observable con la URL de la imagen subida
   */
  subirImagenCloudinary(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', environment.cloudinaryUploadPreset);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinaryCloudName}/image/upload`;

    console.log('📤 Subiendo imagen a Cloudinary...');
    console.log('   - Cloud Name:', environment.cloudinaryCloudName);
    console.log('   - Upload Preset:', environment.cloudinaryUploadPreset);
    console.log('   - Archivo:', file.name, file.size, 'bytes');

    // No usar headers personalizados para FormData
    return this.http.post(cloudinaryUrl, formData).pipe(
      tap((response: any) => {
        console.log('Imagen subida a Cloudinary:', response.secure_url);
      }),
      catchError(error => {
        console.error('Error al subir imagen a Cloudinary:', error);
        console.error('   - Status:', error.status);
        console.error('   - Error completo:', error.error);
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

    console.error('Error en servicio:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
