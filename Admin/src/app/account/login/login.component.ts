import { Component, OnInit } from '@angular/core';
import { FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  submitted = false;
  fieldTextType = false;
  error = '';
  loading = false;
  returnUrl: string = '/';

  // Set the current year
  year: number = new Date().getFullYear();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Obtener la URL de retorno desde los query params o usar '/' por defecto
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    console.log('📍 Return URL configurada:', this.returnUrl);

    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      this.router.navigate([this.returnUrl]);
    }

    // Inicializar el formulario con validaciones
    this.loginForm = this.formBuilder.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      contrasena: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  // Convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Maneja el envío del formulario de login
   */
  login(event?: Event) {
    // Prevenir el comportamiento por defecto del formulario
    if (event) {
      event.preventDefault();
    }

    this.submitted = true;

    // Mostrar errores de validación
    if (this.loginForm.invalid) {
      if (this.f['usuario'].errors) {
        if (this.f['usuario'].errors['required']) {
          this.toastr.warning('El usuario es requerido', 'Validación');
        } else if (this.f['usuario'].errors['minlength']) {
          this.toastr.warning('El usuario debe tener al menos 3 caracteres', 'Validación');
        }
      } else if (this.f['contrasena'].errors) {
        if (this.f['contrasena'].errors['required']) {
          this.toastr.warning('La contraseña es requerida', 'Validación');
        } else if (this.f['contrasena'].errors['minlength']) {
          this.toastr.warning('La contraseña debe tener al menos 4 caracteres', 'Validación');
        }
      }
      return;
    }

    this.loading = true;
    this.error = '';

    const usuario = this.f['usuario'].value;
    const contrasena = this.f['contrasena'].value;

    // Llamar al servicio de autenticación
    this.authService.loginWithJWT(usuario, contrasena).subscribe({
      next: (response) => {
        this.loading = false;


        // Mostrar mensaje de éxito con toastr
        this.toastr.success(
          `Bienvenido ${response.Usua_Usuario}`,
          'Autenticación exitosa',
          {
            timeOut: 2000,
            progressBar: true,
            positionClass: 'toast-top-right'
          }
        );

        // Validar y redirigir a la URL de retorno o a sucursales
        console.log('🔄 Redirigiendo a:', this.returnUrl);
        setTimeout(() => {
          this.router.navigate([this.returnUrl]).then(
            success => console.log('✅ Redirección exitosa:', success),
            error => console.error('❌ Error en redirección:', error)
          );
        }, 500);
      },
      error: (error) => {
        console.error('🔴 Error completo recibido en componente:', error);
        console.error('🔴 Tipo de error:', typeof error);
        console.error('🔴 error.message:', error?.message);

        this.loading = false;

        // Extraer el mensaje de error con múltiples fallbacks
        let errorMessage = 'Usuario o contraseña incorrectos';

        if (typeof error === 'string') {
          // Si el error es un string directamente
          errorMessage = error;
        } else if (error?.message) {
          // Si tiene propiedad message
          errorMessage = error.message;
        } else if (error?.error?.message) {
          // Si está dentro de error.error.message
          errorMessage = error.error.message;
        }

        this.error = errorMessage;
        console.log('📢 Mensaje a mostrar en toast:', errorMessage);

        // Mostrar mensaje de error con toastr
        this.toastr.error(
          errorMessage,
          'Error de autenticación',
          {
            timeOut: 4000,
            progressBar: true,
            positionClass: 'toast-top-right'
          }
        );
      }
    });
  }

  /**
   * Toggle password visibility
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  /**
   * Getter alternativo para form controls
   */
  get form() {
    return this.loginForm.controls;
  }
}
