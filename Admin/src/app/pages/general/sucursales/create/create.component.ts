import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// Shared
import { SharedModule } from 'src/app/shared/shared.module';

// Services & Models
import { SucursalesService } from 'src/app/core/services/sucursales.service';
import { UbicacionService } from 'src/app/core/services/ubicacion.service';
import { Sucursal } from 'src/app/models/sucursal.model';
import { Departamento } from 'src/app/models/departamento.model';
import { Municipio } from 'src/app/models/municipio.model';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class CreateComponent implements OnInit, OnDestroy {

  sucursalForm!: FormGroup;
  departamentos: Departamento[] = [];
  municipios: Municipio[] = [];

  // Estados
  isLoading = false;
  isLoadingDepartamentos = false;
  isLoadingMunicipios = false;
  isSubmitting = false;
  isUploadingImage = false;

  // Imagen
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadedImageUrl: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sucursalesService: SucursalesService,
    private ubicacionService: UbicacionService,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadDepartamentos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  initForm(): void {
    this.sucursalForm = this.fb.group({
      sucu_Codigo: ['', [Validators.required, Validators.maxLength(20)]],
      sucu_Nombre: ['', [Validators.required, Validators.maxLength(100)]],
      sucu_Direccion: ['', [Validators.required, Validators.maxLength(250)]],
      depa_Codigo: ['', Validators.required],
      muni_Codigo: ['', Validators.required]
    });

    // Escuchar cambios en el departamento para cargar municipios
    this.sucursalForm.get('depa_Codigo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(depaCodigo => {
        if (depaCodigo) {
          this.loadMunicipios(depaCodigo);
          // Limpiar el municipio seleccionado cuando cambia el departamento
          this.sucursalForm.patchValue({ muni_Codigo: '' });
        } else {
          this.municipios = [];
        }
      });
  }

  /**
   * Carga la lista de departamentos desde el API
   */
  loadDepartamentos(): void {
    this.isLoadingDepartamentos = true;
    this.ubicacionService.listarDepartamentos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.departamentos = response.data;
            console.log('✅ Departamentos cargados:', this.departamentos.length);
          }
          this.isLoadingDepartamentos = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar departamentos:', error);
          this.toastr.error('Error al cargar los departamentos', 'Error');
          this.isLoadingDepartamentos = false;
        }
      });
  }

  /**
   * Carga los municipios de un departamento específico
   */
  loadMunicipios(codigoDepartamento: string): void {
    this.isLoadingMunicipios = true;
    this.municipios = [];

    this.ubicacionService.listarMunicipiosPorDepartamento(codigoDepartamento)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.municipios = response.data;
            console.log('✅ Municipios cargados:', this.municipios.length);
          }
          this.isLoadingMunicipios = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar municipios:', error);
          this.toastr.error('Error al cargar los municipios', 'Error');
          this.isLoadingMunicipios = false;
        }
      });
  }

  /**
   * Maneja la selección de archivo de imagen
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        this.toastr.error('Solo se permiten imágenes (JPG, PNG, WEBP)', 'Formato inválido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.toastr.error('La imagen no debe superar los 5MB', 'Archivo muy grande');
        return;
      }

      this.selectedFile = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      console.log('📷 Imagen seleccionada:', file.name, file.size, 'bytes');
    }
  }

  /**
   * Elimina la imagen seleccionada
   */
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadedImageUrl = null;

    // Limpiar el input file
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.toastr.info('Imagen eliminada', 'Información');
  }

  /**
   * Sube la imagen a Cloudinary
   */
  async uploadImage(): Promise<string | null> {
    if (!this.selectedFile) {
      return null;
    }

    this.isUploadingImage = true;

    try {
      const response: any = await this.sucursalesService
        .subirImagenCloudinary(this.selectedFile)
        .toPromise();

      this.uploadedImageUrl = response.secure_url;
      console.log('✅ Imagen subida a Cloudinary:', this.uploadedImageUrl);
      this.toastr.success('Imagen subida exitosamente', 'Éxito');

      return this.uploadedImageUrl;
    } catch (error) {
      console.error('❌ Error al subir imagen:', error);
      this.toastr.error('Error al subir la imagen', 'Error');
      throw error;
    } finally {
      this.isUploadingImage = false;
    }
  }

  /**
   * Envía el formulario
   */
  async onSubmit(): Promise<void> {
    console.log('📝 Intentando enviar formulario...');
    console.log('   - Formulario válido?', this.sucursalForm.valid);

    // Validar formulario
    if (this.sucursalForm.invalid) {
      Object.keys(this.sucursalForm.controls).forEach(key => {
        this.sucursalForm.get(key)?.markAsTouched();
      });
      this.toastr.warning('Por favor complete todos los campos requeridos correctamente', 'Formulario incompleto');
      return;
    }

    this.isSubmitting = true;

    try {
      // Subir imagen si hay una seleccionada
      let imageUrl: string | null = null;
      if (this.selectedFile) {
        imageUrl = await this.uploadImage();
      }

      // Preparar datos de la sucursal
      const sucursal: Sucursal = {
        sucu_Codigo: this.sucursalForm.value.sucu_Codigo,
        sucu_Nombre: this.sucursalForm.value.sucu_Nombre,
        sucu_Direccion: this.sucursalForm.value.sucu_Direccion,
        muni_Codigo: this.sucursalForm.value.muni_Codigo,
        sucu_Imagen: imageUrl || undefined
      };

      console.log('📤 Enviando sucursal:', sucursal);

      // Insertar sucursal
      this.sucursalesService.insertarSucursal(sucursal)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Sucursal registrada exitosamente', 'Éxito', {
                timeOut: 2000
              });
              console.log('✅ Sucursal creada:', response.data);

              setTimeout(() => {
                this.router.navigate(['/general/sucursales/list']);
              }, 1500);
            } else {
              const errorMsg = response.message || 'Error al registrar la sucursal';
              this.toastr.error(errorMsg, 'Error', { timeOut: 5000 });
              console.error('❌ Error de negocio:', response);
            }
            this.isSubmitting = false;
          },
          error: (error: any) => {
            console.error('❌ Error HTTP completo:', error);

            let errorMessage = 'Error al conectar con el servidor';

            if (typeof error === 'string') {
              errorMessage = error;
            } else if (error.error) {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (typeof error.error === 'string') {
                errorMessage = error.error;
              }
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
    } catch (error) {
      console.error('❌ Error en el proceso:', error);
      this.toastr.error('Error al procesar la solicitud', 'Error');
      this.isSubmitting = false;
    }
  }

  /**
   * Cancela y regresa al listado
   */
  onCancel(): void {
    if (this.sucursalForm.dirty || this.selectedFile) {
      if (confirm('¿Está seguro de cancelar? Se perderán los cambios no guardados.')) {
        this.router.navigate(['/general/sucursales/list']);
      }
    } else {
      this.router.navigate(['/general/sucursales/list']);
    }
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getFieldError(fieldName: string): string {
    const field = this.sucursalForm.get(fieldName);
    if (field?.hasError('required') && field.touched) {
      return 'Este campo es requerido';
    }
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  }

  /**
   * Verifica si un campo tiene error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.sucursalForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}
