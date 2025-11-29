import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

// Shared
import { SharedModule } from 'src/app/shared/shared.module';

// RxJS
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Services
import { ViajesService } from 'src/app/core/services/viajes.service';
import { ViajeListado, ColaboradorEnViaje } from 'src/app/models/viaje-list.model';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss'
})
export class DetailsComponent implements OnInit, OnDestroy {

  viaje: ViajeListado | null = null;
  viajeId: number = 0;
  isLoading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viajesService: ViajesService
  ) { }

  ngOnInit(): void {
    // Obtener el ID del viaje de la ruta
    this.viajeId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadViajeDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadViajeDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Usamos el endpoint de listar y filtramos por ID
    this.viajesService.listarViajes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            // Buscar el viaje específico
            this.viaje = response.data.find((v: ViajeListado) => v.viaj_Id === this.viajeId) || null;

            if (!this.viaje) {
              this.errorMessage = 'No se encontró el viaje con el ID especificado';
            }

            console.log('📦 Detalles del viaje cargados:', this.viaje);
          } else {
            this.errorMessage = response.message || 'Error al cargar los detalles del viaje';
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

  onEdit(): void {
    this.router.navigate(['/oper/viajes/edit', this.viajeId]);
  }

  onBack(): void {
    this.router.navigate(['/oper/viajes/list']);
  }

  /**
   * Calcula el porcentaje de costo de un colaborador respecto al total
   */
  calcularPorcentajeCosto(pagoIndividual: number): number {
    if (!this.viaje || this.viaje.totalPagar === 0) return 0;
    return (pagoIndividual / this.viaje.totalPagar) * 100;
  }

  /**
   * Obtiene el ícono según el sexo del colaborador
   */
  getSexoIcon(sexo: string): string {
    return sexo === 'M' ? 'ri-men-line' : 'ri-women-line';
  }

  /**
   * Obtiene la clase de color según el sexo
   */
  getSexoClass(sexo: string): string {
    return sexo === 'M' ? 'text-primary' : 'text-danger';
  }
}
