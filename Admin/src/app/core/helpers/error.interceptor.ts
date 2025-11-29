import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private authenticationService: AuthenticationService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if (err.status === 401) {
                // NO recargar la página si el error viene del endpoint de Login
                // En ese caso, solo queremos mostrar el mensaje de error
                const isLoginRequest = request.url.includes('/Login');

                if (!isLoginRequest) {
                    // auto logout if 401 response returned from api (sesión expirada)
                    this.authenticationService.logout();
                    location.reload();
                }
            }
            // Devolver el error completo para que el servicio lo maneje
            return throwError(() => err);
        }))
    }
}
