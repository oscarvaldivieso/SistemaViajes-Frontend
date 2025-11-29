import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { User } from '../../store/Authentication/auth.models';
import { getFirebaseBackend } from 'src/app/authUtils';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { GlobalComponent } from "../../global-component";
import { environment } from 'src/environments/environment';

// Action
import { login, loginSuccess, loginFailure, logout, logoutSuccess, RegisterSuccess } from '../../store/Authentication/authentication.actions';

// Firebase
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';

// Auth Models
import { LoginRequest, LoginResponse, JwtResponse, AuthenticatedUser } from '../../models/auth.models';



const AUTH_API = GlobalComponent.AUTH_API;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    user!: User;
    currentUserValue: any;

    private currentUserSubject: BehaviorSubject<User>;
    private apiUrl = `${environment.apiUrl}/Usuarios`;

    constructor(private http: HttpClient, private store: Store, private afAuth: AngularFireAuth) {
        this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')!));
    }

    /**
     * Login con JWT usando el endpoint Usuarios/Login del backend
     * @param usuario - Nombre de usuario
     * @param clave - Contraseña del usuario
     * @returns Observable con la respuesta JWT
     */
    loginWithJWT(usuario: string, clave: string): Observable<any> {
        const headers = new HttpHeaders({
            'XApiKey': environment.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });

        const loginRequest: LoginRequest = {
            Usua_Usuario: usuario,
            Usua_Clave: clave
        };

        return this.http.post<any>(`${this.apiUrl}/Login`, loginRequest, { headers }).pipe(
            map((response: any) => {
                console.log('📥 Respuesta completa del backend:', response);

                // El backend puede devolver la respuesta directamente o en un wrapper
                // Intentar extraer los datos del token
                let jwtData: any;

                // Si la respuesta es directamente el JwtResponse
                if (response.token) {
                    jwtData = response;
                }
                // Si viene en un wrapper (data, resultado, etc.)
                else if (response.data && response.data.token) {
                    jwtData = response.data;
                }
                else {
                    console.error('❌ Estructura de respuesta inesperada:', response);
                    throw new Error('Formato de respuesta inválido');
                }

                console.log('✅ Datos JWT extraídos:', jwtData);

                // Guardar token y datos del usuario en localStorage
                const authenticatedUser: AuthenticatedUser = {
                    token: jwtData.token,
                    Usua_Id: jwtData.Usua_Id || jwtData.usua_Id,
                    Usua_Usuario: jwtData.Usua_Usuario || jwtData.usua_Usuario,
                    Role_Id: jwtData.Role_Id || jwtData.role_Id,
                    Role_Descripcion: jwtData.Role_Descripcion || jwtData.role_Descripcion,
                    expires_at: jwtData.expires_at || jwtData.expiresAt
                };

                console.log('👤 Usuario autenticado:', authenticatedUser);

                localStorage.setItem('token', jwtData.token);
                localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));

                // Dispatch success action
                this.store.dispatch(loginSuccess({ user: authenticatedUser as any }));

                // Retornar los datos del usuario autenticado para que el componente pueda usarlos
                return authenticatedUser;
            }),
            catchError((error: any) => {
                console.error('❌ Error en login:', error);
                const errorMessage = error?.error?.Mensaje || error?.error?.message || 'Error al iniciar sesión';
                this.store.dispatch(loginFailure({ error: errorMessage }));
                return throwError(() => new Error(errorMessage));
            })
        );
    }

    /**
     * Obtiene el usuario autenticado actual desde localStorage
     */
    getAuthenticatedUser(): AuthenticatedUser | null {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                return JSON.parse(userStr) as AuthenticatedUser;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated(): boolean {
        const token = localStorage.getItem('token');
        const user = this.getAuthenticatedUser();

        if (!token || !user) {
            return false;
        }

        // Verificar si el token ha expirado
        if (user.expires_at) {
            const expiresAt = new Date(user.expires_at);
            const now = new Date();
            return now < expiresAt;
        }

        // Si no hay fecha de expiración, considerar el token válido
        return true;
    }

    // Sign in with Google provider
    signInWithGoogle(): Promise<User> {
        const provider = new firebase.auth.GoogleAuthProvider();
        return this.signInWithPopup(provider);
    }

    // Sign in with Facebook provider
    signInWithFacebook(): Promise<User> {
        const provider = new firebase.auth.FacebookAuthProvider();
        return this.signInWithPopup(provider);
    }

    // Sign in with a popup for the specified provider
    private async signInWithPopup(provider: firebase.auth.AuthProvider): Promise<User> {
        try {
            const result = await this.afAuth.signInWithPopup(provider);
            const user = result.user;
            return {
                //     uid: user.uid,
                //     displayName: user.displayName,
                //     email: user.email,
                //     // Add other user properties as needed
            };
        } catch (error) {
            throw new Error('Failed to sign in with the specified provider.');
        }
    }

    // Sign out the current user
    signOut(): Promise<void> {
        return this.afAuth.signOut();
    }


    register(email: string, first_name: string, password: string) {
        return this.http.post(AUTH_API + 'signup', {
            email,
            first_name,
            password,
        }, httpOptions).pipe(
            map((response: any) => {
                const user = response;
                this.store.dispatch(RegisterSuccess({ user }));
                return user;
            }),
            catchError((error: any) => {
                const errorMessage = 'Login failed'; // Customize the error message as needed
                this.store.dispatch(loginFailure({ error: errorMessage }));
                return throwError(errorMessage);
            })
        );
    }

    login(email: string, password: string) {
        this.store.dispatch(login({ email, password }));

        return this.http.post(AUTH_API + 'signin', {
            email,
            password
        }, httpOptions).pipe(
            map((response: any) => {
                const user = response;
                this.store.dispatch(loginSuccess({ user }));
                return user;
            }),
            catchError((error: any) => {
                const errorMessage = 'Login failed'; // Customize the error message as needed
                this.store.dispatch(loginFailure({ error: errorMessage }));
                return throwError(errorMessage);
            })
        );
    }

    logout(): Observable<void> {
        this.store.dispatch(logout());
        // Perform any additional logout logic, e.g., calling an API to invalidate the token

        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        this.currentUserSubject.next(null!);
        this.store.dispatch(logoutSuccess());

        // Return an Observable<void> indicating the successful logout
        return of(undefined).pipe(
            tap(() => {
                // Perform any additional logic after the logout is successful
            })
        );
    }

    resetPassword(email: string) {
        return this.http.post(AUTH_API + 'reset-password', { email }, httpOptions);
    }

    /**
 * Returns the current user
 */
    public currentUser(): any {
        return getFirebaseBackend()!.getAuthenticatedUser();
    }
}