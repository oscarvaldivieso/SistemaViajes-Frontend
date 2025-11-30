import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

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
  selector: 'app-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule
  ],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss'
})
export class EditComponent implements OnInit, OnDestroy {

  transportistaForm!: FormGroup;
  transportistaId!: number;
  transportista?: Transportista;
  isLoading = false;
  isSubmitting = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private transportistasService: TransportistasService,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    console.log('✅ Componente de edición de transportistas cargado');

    // Obtener ID de la ruta
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.transportistaId = +params['id'];
      if (this.transportistaId) {
        this.loadTransportista();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.transportistaForm = this.fb.group({
      tran_Identidad: [{ value: '', disabled: true }], // Disabled, no se puede editar
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

  loadTransportista(): void {
    this.isLoading = true;

    // Cargar desde el listado completo y buscar por ID
    this.transportistasService.listarTransportistas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Buscar el transportista específico en la lista
            const transportista = response.data.find(t => t.tran_Id === this.transportistaId);

            if (transportista) {
              this.transportista = transportista;
              this.populateForm(transportista);
              console.log('✅ Transportista cargado:', transportista);
            } else {
              this.toastr.error('No se encontró el transportista', 'Error');
              this.router.navigate(['/general/transportistas/list']);
            }
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar transportista:', error);
          this.toastr.error('Error al cargar los datos del transportista', 'Error');
          this.isLoading = false;
          this.router.navigate(['/general/transportistas/list']);
        }
      });
  }

  populateForm(transportista: Transportista): void {
    this.transportistaForm.patchValue({
      tran_Identidad: transportista.tran_Identidad,
      tran_NombreCompleto: transportista.tran_NombreCompleto,
      tran_Telefono: transportista.tran_Telefono,
      tran_TarifaPorKm: transportista.tran_TarifaPorKm
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
      tran_Id: this.transportistaId,
      tran_Identidad: this.transportista?.tran_Identidad, // Mantener el original
      tran_NombreCompleto: this.transportistaForm.value.tran_NombreCompleto,
      tran_Telefono: this.transportistaForm.value.tran_Telefono,
      tran_TarifaPorKm: parseFloat(this.transportistaForm.value.tran_TarifaPorKm),
      usua_Creacion: 0 // Requerido por el backend
    };

    console.log('📤 Actualizando transportista:', transportista);

    this.transportistasService.actualizarTransportista(transportista)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(
              'Transportista actualizado exitosamente',
              'Éxito',
              { timeOut: 2000 }
            );
            console.log('✅ Transportista actualizado:', response.data);

            // Redirect to list after 1.5 seconds
            setTimeout(() => {
              this.router.navigate(['/general/transportistas/list']);
            }, 1500);
          } else {
            this.toastr.error(
              response.message || 'Error al actualizar el transportista',
              'Error',
              { timeOut: 5000 }
            );
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('❌ Error al actualizar transportista:', error);

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
