import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Shared
import { SharedModule } from 'src/app/shared/shared.module';

// Service
import { TransportistasService } from 'src/app/core/services/transportistas.service';

// Models
import { Transportista } from 'src/app/models/transportista.model';

// RxJS
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class CreateComponent implements OnInit, OnDestroy {

  transportistaForm!: FormGroup;
  isSubmitting = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private transportistasService: TransportistasService,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    console.log('✅ Componente de creación de transportistas cargado');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.transportistaForm = this.fb.group({
      tran_Identidad: ['', [
        Validators.required,
        Validators.minLength(13),
        Validators.maxLength(13),
        Validators.pattern(/^[0-9]{13}$/)
      ]],
      tran_NombreCompleto: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]],
      tran_Telefono: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(8),
        Validators.pattern(/^[0-9]{8}$/)
      ]],
      tran_TarifaPorKm: ['', [
        Validators.required,
        Validators.min(0.01),
        Validators.max(9999.99)
      ]]
    });
  }

  onSubmit(): void {
    if (this.transportistaForm.invalid) {
      this.toastr.warning('Por favor complete todos los campos correctamente', 'Formulario incompleto');

      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.transportistaForm.controls).forEach(key => {
        this.transportistaForm.get(key)?.markAsTouched();
      });

      return;
    }

    this.isSubmitting = true;

    const transportista: Transportista = {
      tran_Identidad: this.transportistaForm.value.tran_Identidad,
      tran_NombreCompleto: this.transportistaForm.value.tran_NombreCompleto,
      tran_Telefono: this.transportistaForm.value.tran_Telefono,
      tran_TarifaPorKm: parseFloat(this.transportistaForm.value.tran_TarifaPorKm)
    };

    console.log('📤 Enviando transportista:', transportista);

    this.transportistasService.insertarTransportista(transportista)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(
              'Transportista registrado exitosamente',
              'Éxito',
              { timeOut: 2000 }
            );
            console.log('✅ Transportista creado:', response.data);

            // Redirect to list after 1.5 seconds
            setTimeout(() => {
              this.router.navigate(['/general/transportistas/list']);
            }, 1500);
          } else {
            this.toastr.error(
              response.message || 'Error al registrar el transportista',
              'Error',
              { timeOut: 5000 }
            );
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('❌ Error al crear transportista:', error);

          let errorMessage = 'Error al conectar con el servidor';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.toastr.error(errorMessage, 'Error', {
            timeOut: 5000,
            progressBar: true
          });

          this.isSubmitting = false;
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/general/transportistas/list']);
  }

  // Helper methods for validation messages
  getErrorMessage(fieldName: string): string {
    const control = this.transportistaForm.get(fieldName);

    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }

    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `No debe exceder ${maxLength} caracteres`;
    }

    if (control?.hasError('pattern')) {
      if (fieldName === 'tran_Identidad') {
        return 'Debe ser un número de identidad válido (13 dígitos)';
      }
      if (fieldName === 'tran_Telefono') {
        return 'Debe ser un número de teléfono válido (8 dígitos)';
      }
    }

    if (control?.hasError('min')) {
      return 'El valor debe ser mayor a 0';
    }

    if (control?.hasError('max')) {
      return 'El valor es demasiado alto';
    }

    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.transportistaForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
