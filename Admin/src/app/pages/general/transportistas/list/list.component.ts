import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Bootstrap modules
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ModalModule } from 'ngx-bootstrap/modal';

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

interface ApiResponse<T> {
  type: number;
  code: number;
  success: boolean;
  message: string;
  data: T;
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    BsDropdownModule,
    PaginationModule,
    ModalModule
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit, OnDestroy {

  transportistas: Transportista[] = [];
  isLoading = false;
  searchTerm = '';
  errorMessage = '';

  // Modal de confirmación
  transportistaToDelete: Transportista | null = null;
  isDeleting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private transportistasService: TransportistasService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    console.log('✅ Componente de lista de transportistas cargado');
    this.loadTransportistas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTransportistas(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.transportistasService.listarTransportistas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.transportistas = response.data;
            console.log('📦 Transportistas cargados:', this.transportistas);
          } else {
            this.errorMessage = response.message || 'Error al cargar los transportistas';
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          this.errorMessage = 'Error al conectar con el servidor: ' + error.message;
          console.error('❌ Error:', error);
          this.isLoading = false;
        }
      });
  }

  onEdit(id: number): void {
    this.router.navigate(['/general/transportistas/edit', id]);
  }

  /**
   * Abre el modal de confirmación para eliminar
   */
  onDelete(id: number): void {
    const transportista = this.transportistas.find(t => t.tran_Id === id);
    if (transportista) {
      this.transportistaToDelete = transportista;
    }
  }

  /**
   * Cancela la eliminación y cierra el modal
   */
  cancelDelete(): void {
    this.transportistaToDelete = null;
  }

  /**
   * Confirma y ejecuta la eliminación
   */
  confirmDelete(): void {
    if (!this.transportistaToDelete || !this.transportistaToDelete.tran_Id) {
      return;
    }

    this.isDeleting = true;
    const transportistaId = this.transportistaToDelete.tran_Id;
    const transportistaNombre = this.transportistaToDelete.tran_NombreCompleto;

    this.transportistasService.eliminarTransportista(transportistaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(
              `El transportista "${transportistaNombre}" ha sido eliminado exitosamente`,
              'Eliminado',
              { timeOut: 3000 }
            );

            // Recargar la lista
            this.loadTransportistas();
          } else {
            this.toastr.error(
              response.message || 'No se pudo eliminar el transportista',
              'Error',
              { timeOut: 5000 }
            );
          }
          this.isDeleting = false;
          this.transportistaToDelete = null;
        },
        error: (error) => {
          console.error('❌ Error al eliminar transportista:', error);

          let errorMessage = 'Error al eliminar el transportista';
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
          this.transportistaToDelete = null;
        }
      });
  }

  filteredTransportistas(): Transportista[] {
    if (!this.searchTerm) {
      return this.transportistas;
    }
    return this.transportistas.filter(t =>
      t.tran_NombreCompleto?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      t.tran_Identidad?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
