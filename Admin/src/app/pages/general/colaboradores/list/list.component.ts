import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Shared
import { SharedModule } from 'src/app/shared/shared.module';

// Bootstrap
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

// Services & Models
import { ColaboradoresService } from 'src/app/core/services/colaboradores.service';
import { Colaborador } from 'src/app/models/colaborador.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
    BsDropdownModule
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit, OnDestroy {

  colaboradores: Colaborador[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';

  // Modal de confirmación
  colaboradorToDelete: Colaborador | null = null;
  isDeleting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private colaboradoresService: ColaboradoresService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadColaboradores();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadColaboradores(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.colaboradoresService.listarColaboradores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.colaboradores = response.data;
            console.log('📦 Colaboradores cargados:', this.colaboradores);
          } else {
            this.errorMessage = response.message || 'Error al cargar colaboradores';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error cargando colaboradores:', error);
          this.errorMessage = 'Error al conectar con el servidor';
          this.isLoading = false;
        }
      });
  }

  filteredColaboradores(): Colaborador[] {
    if (!this.searchTerm) {
      return this.colaboradores;
    }

    const term = this.searchTerm.toLowerCase();
    return this.colaboradores.filter(c =>
      c.colb_NombreCompleto?.toLowerCase().includes(term) ||
      c.colb_Codigo?.toLowerCase().includes(term) ||
      c.colb_Identidad?.toLowerCase().includes(term)
    );
  }

  getAvatarImage(colaborador: Colaborador): string {
    // Imagen default según el sexo
    if (colaborador.colb_Sexo === 'F') {
      return 'assets/images/users/avatar-female.png';
    } else {
      return 'assets/images/users/avatar-male.png';
    }
  }

  getGenderIcon(sexo?: string): string {
    return sexo === 'F' ? 'ri-women-line' : 'ri-men-line';
  }

  getGenderBadgeClass(sexo?: string): string {
    return sexo === 'F' ? 'bg-pink-subtle text-pink' : 'bg-info-subtle text-info';
  }

  /**
   * Abre el modal de confirmación para eliminar
   */
  onDelete(id: number): void {
    const colaborador = this.colaboradores.find(c => c.colb_Id === id);
    if (colaborador) {
      this.colaboradorToDelete = colaborador;
    }
  }

  /**
   * Cancela la eliminación y cierra el modal
   */
  cancelDelete(): void {
    this.colaboradorToDelete = null;
  }

  /**
   * Confirma y ejecuta la eliminación
   */
  confirmDelete(): void {
    if (!this.colaboradorToDelete || !this.colaboradorToDelete.colb_Id) {
      return;
    }

    this.isDeleting = true;
    const colaboradorId = this.colaboradorToDelete.colb_Id;
    const colaboradorNombre = this.colaboradorToDelete.colb_NombreCompleto;

    this.colaboradoresService.eliminarColaborador(colaboradorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(
              `El colaborador "${colaboradorNombre}" ha sido eliminado exitosamente`,
              'Eliminado',
              { timeOut: 3000 }
            );

            // Recargar la lista
            this.loadColaboradores();
          } else {
            this.toastr.error(
              response.message || 'No se pudo eliminar el colaborador',
              'Error',
              { timeOut: 5000 }
            );
          }
          this.isDeleting = false;
          this.colaboradorToDelete = null;
        },
        error: (error) => {
          console.error('❌ Error al eliminar colaborador:', error);

          let errorMessage = 'Error al eliminar el colaborador';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.toastr.error(errorMessage, 'Error', {
            timeOut: 5000,
            progressBar: true
          });

          this.isDeleting = false;
          this.colaboradorToDelete = null;
        }
      });
  }
}
