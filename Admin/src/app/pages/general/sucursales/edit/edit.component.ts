import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
import { AuthenticationService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss'
})
export class EditComponent implements OnInit, OnDestroy {

  sucursalForm!: FormGroup;
  departamentos: Departamento[] = [];
  municipios: Municipio[] = [];

  // ID de la sucursal a editar
  sucursalId!: number;

  // Estados
  isLoading = true;
  isLoadingDepartamentos = false;
  isLoadingMunicipios = false;
  isSubmitting = false;
  isUploadingImage = false;

  // Imagen
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadedImageUrl: string | null = null;
  existingImageUrl: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private sucursalesService: SucursalesService,
    private ubicacionService: UbicacionService,
    private toastr: ToastrService,
    private authService: AuthenticationService
  ) {
    this.initForm();
  }

  /**
   * Obtiene el ID del usuario autenticado
   */
  private getAuthenticatedUserId(): number {
    const user = this.authService.getAuthenticatedUser();
    return user?.Usua_Id || 0;
  }

  ngOnInit(): void {
    // Obtener ID de la sucursal desde la ruta
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sucursalId = parseInt(id, 10);
      this.loadDepartamentos();
      this.loadSucursal();
    } else {
      this.toastr.error('ID de sucursal no válido', 'Error');
      this.router.navigate(['/general/sucursales/list']);
    }
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
      sucu_Codigo: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(20)]],
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
   * Carga los datos de la sucursal a editar desde el listado
   */
  loadSucursal(): void {
    this.isLoading = true;
    // Obtener desde el listado ya que el endpoint de obtener por ID no existe
    this.sucursalesService.listarSucursales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Buscar la sucursal por ID en el listado
            const sucursal = response.data.find(s => s.sucu_Id === this.sucursalId);

            if (sucursal) {
              console.log('✅ Sucursal cargada:', sucursal);

              // Poblar el formulario con los datos
              this.sucursalForm.patchValue({
                sucu_Codigo: sucursal.sucu_Codigo,
                sucu_Nombre: sucursal.sucu_Nombre,
                sucu_Direccion: sucursal.sucu_Direccion,
                muni_Codigo: sucursal.muni_Codigo
              });

              // Guardar imagen existente
              if (sucursal.sucu_Imagen) {
                this.existingImageUrl = sucursal.sucu_Imagen;
                this.imagePreview = sucursal.sucu_Imagen;
              }

              // Cargar el departamento basado en el municipio
              if (sucursal.muni_Codigo) {
                this.loadDepartamentoByMunicipio(sucursal.muni_Codigo);
              }
            } else {
              this.toastr.error('No se encontró la sucursal', 'Error');
              this.router.navigate(['/general/sucursales/list']);
            }
          } else {
            this.toastr.error('No se pudo cargar la sucursal', 'Error');
            this.router.navigate(['/general/sucursales/list']);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar sucursal:', error);
          this.toastr.error('Error al cargar la sucursal', 'Error');
          this.router.navigate(['/general/sucursales/list']);
          this.isLoading = false;
        }
      });
  }

  /**
   * Carga el departamento basado en el código del municipio
   */
  loadDepartamentoByMunicipio(muniCodigo: string): void {
    // Buscar el municipio en los departamentos cargados
    this.ubicacionService.listarDepartamentos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Buscar el departamento que contiene el municipio
            for (const depa of response.data) {
              this.ubicacionService.listarMunicipiosPorDepartamento(depa.depa_Codigo)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (muniResponse) => {
                    if (muniResponse.success) {
                      const municipioEncontrado = muniResponse.data.find(m => m.muni_Codigo === muniCodigo);
                      if (municipioEncontrado) {
                        // Establecer el departamento
                        this.sucursalForm.patchValue({ depa_Codigo: depa.depa_Codigo });
                        // Cargar los municipios de ese departamento
                        this.loadMunicipios(depa.depa_Codigo, muniCodigo);
                      }
                    }
                  }
                });
            }
          }
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
  loadMunicipios(codigoDepartamento: string, selectedMunicipio?: string): void {
    this.isLoadingMunicipios = true;
    this.municipios = [];

    this.ubicacionService.listarMunicipiosPorDepartamento(codigoDepartamento)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.municipios = response.data;
            console.log('✅ Municipios cargados:', this.municipios.length);

            // Si se especifica un municipio, seleccionarlo
            if (selectedMunicipio) {
              this.sucursalForm.patchValue({ muni_Codigo: selectedMunicipio });
            }
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
        // Marcar que hay una nueva imagen (no la existente)
        this.existingImageUrl = null;
      };
      reader.readAsDataURL(file);

      console.log('📷 Nueva imagen seleccionada:', file.name, file.size, 'bytes');
    }
  }

  /**
   * Elimina la imagen seleccionada
   */
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadedImageUrl = null;
    this.existingImageUrl = null;

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
   * Envía el formulario de actualización
   */
  async onSubmit(): Promise<void> {
    console.log('📝 Intentando actualizar sucursal...');
    console.log('   - Formulario válido?', this.sucursalForm.valid);

    // Validar formulario (ignorando el campo deshabilitado de código)
    if (this.sucursalForm.invalid) {
      Object.keys(this.sucursalForm.controls).forEach(key => {
        this.sucursalForm.get(key)?.markAsTouched();
      });
      this.toastr.warning('Por favor complete todos los campos requeridos correctamente', 'Formulario incompleto');
      return;
    }

    this.isSubmitting = true;

    try {
      // Subir imagen nueva si hay una seleccionada
      let imageUrl: string | null = null;
      if (this.selectedFile) {
        imageUrl = await this.uploadImage();
      } else if (this.existingImageUrl) {
        // Mantener la imagen existente si no se seleccionó una nueva
        imageUrl = this.existingImageUrl;
      }

      // Preparar datos de la sucursal
      const sucursal: Sucursal = {
        sucu_Id: this.sucursalId,
        sucu_Codigo: this.sucursalForm.getRawValue().sucu_Codigo, // getRawValue para obtener campos deshabilitados
        sucu_Nombre: this.sucursalForm.value.sucu_Nombre,
        sucu_Direccion: this.sucursalForm.value.sucu_Direccion,
        muni_Codigo: this.sucursalForm.value.muni_Codigo,
        sucu_Imagen: imageUrl || undefined,
        usua_Creacion: 0
        // usua_Modificacion ya se agrega automáticamente en el servicio
      };

      console.log('📤 Actualizando sucursal:', sucursal);

      // Actualizar sucursal
      this.sucursalesService.actualizarSucursal(sucursal)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.toastr.success('Sucursal actualizada exitosamente', 'Éxito', {
                timeOut: 2000
              });
              console.log('✅ Sucursal actualizada:', response.data);

              setTimeout(() => {
                this.router.navigate(['/general/sucursales/list']);
              }, 1500);
            } else {
              const errorMsg = response.message || 'Error al actualizar la sucursal';
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
