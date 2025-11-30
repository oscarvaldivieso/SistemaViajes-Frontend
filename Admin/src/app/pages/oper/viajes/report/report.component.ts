import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ViajesService } from 'src/app/core/services/viajes.service';
import { TransportistasService } from 'src/app/core/services/transportistas.service';
import { ViajeDetalleReporte, TransportistaResumenReporte, ViajesReporteResponse } from 'src/app/core/models/viajes-reporte.model';
import { Transportista } from 'src/app/models/transportista.model';
import * as XLSX from 'xlsx';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss'
})
export class ReportComponent implements OnInit {

  reportForm!: FormGroup;
  transportistas: Transportista[] = [];
  detalleViajes: ViajeDetalleReporte[] = [];
  resumenTransportistas: TransportistaResumenReporte[] = [];

  isLoading = false;
  isLoadingTransportistas = false;
  errorMessage = '';
  reportGenerated = false;

  // Métricas totales
  totalViajes = 0;
  totalColaboradores = 0;
  totalKilometros = 0;
  totalAPagar = 0;

  constructor(
    private fb: FormBuilder,
    private viajesService: ViajesService,
    private transportistasService: TransportistasService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadTransportistas();
    this.initDatePickers();
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initForm(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.reportForm = this.fb.group({
      fechaInicio: [firstDayOfMonth.toISOString().split('T')[0], Validators.required],
      fechaFin: [today.toISOString().split('T')[0], Validators.required],
      tran_Id: [null]
    });
  }

  /**
   * Inicializa los date pickers con flatpickr
   */
  private initDatePickers(): void {
    setTimeout(() => {
      const fechaInicioInput = document.getElementById('fechaInicio') as HTMLInputElement;
      const fechaFinInput = document.getElementById('fechaFin') as HTMLInputElement;

      if (fechaInicioInput) {
        flatpickr(fechaInicioInput, {
          locale: Spanish,
          dateFormat: 'Y-m-d',
          defaultDate: this.reportForm.get('fechaInicio')?.value,
          onChange: (selectedDates, dateStr) => {
            this.reportForm.patchValue({ fechaInicio: dateStr });
          }
        });
      }

      if (fechaFinInput) {
        flatpickr(fechaFinInput, {
          locale: Spanish,
          dateFormat: 'Y-m-d',
          defaultDate: this.reportForm.get('fechaFin')?.value,
          onChange: (selectedDates, dateStr) => {
            this.reportForm.patchValue({ fechaFin: dateStr });
          }
        });
      }
    }, 100);
  }

  /**
   * Carga la lista de transportistas
   */
  private loadTransportistas(): void {
    this.isLoadingTransportistas = true;
    this.transportistasService.listarTransportistas().subscribe({
      next: (response) => {
        if (response.success) {
          this.transportistas = response.data;
        }
        this.isLoadingTransportistas = false;
      },
      error: (error) => {
        console.error('Error al cargar transportistas:', error);
        this.isLoadingTransportistas = false;
      }
    });
  }

  /**
   * Genera el reporte
   */
  generarReporte(): void {
    if (this.reportForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos requeridos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.reportGenerated = false;

    const formValue = this.reportForm.value;

    // Preparar el request, asegurando que tran_Id sea null si está vacío o es "null"
    const tranId = formValue.tran_Id;
    const request = {
      fechaInicio: formValue.fechaInicio,
      fechaFin: formValue.fechaFin,
      tran_Id: (tranId === null || tranId === 'null' || tranId === '' || tranId === undefined) ? null : Number(tranId)
    };

    console.log('📊 Generando reporte con request:', request);

    this.viajesService.obtenerReporte(request).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        if (response.success) {
          this.detalleViajes = response.data.detalleViajes || [];
          this.resumenTransportistas = response.data.resumenTransportistas || [];
          this.calculateTotals();
          this.reportGenerated = true;
          console.log('📈 Reporte generado exitosamente:', {
            viajes: this.detalleViajes.length,
            transportistas: this.resumenTransportistas.length
          });
        } else {
          this.errorMessage = response.message || 'Error al generar el reporte';
          console.error('❌ Error en respuesta:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error completo al generar reporte:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error error:', error.error);

        let errorMsg = 'Error al generar el reporte. Por favor, intente nuevamente.';
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.message) {
          errorMsg = error.message;
        }

        this.errorMessage = errorMsg;
        this.isLoading = false;
      }
    });
  }

  /**
   * Calcula los totales generales
   */
  private calculateTotals(): void {
    // Contar viajes únicos (un viaje puede tener múltiples colaboradores)
    const viajesUnicos = new Set(this.detalleViajes.map(v => v.viaj_Id));
    this.totalViajes = viajesUnicos.size;

    // Contar colaboradores únicos
    const colaboradoresUnicos = new Set(this.detalleViajes.map(v => v.colb_Id));
    this.totalColaboradores = colaboradoresUnicos.size;

    // Sumar totales del resumen
    this.totalKilometros = this.resumenTransportistas.reduce((sum, t) => sum + t.totalKilometros, 0);
    this.totalAPagar = this.resumenTransportistas.reduce((sum, t) => sum + t.totalAPagar, 0);
  }

  /**
   * Exporta el reporte a Excel
   */
  exportarExcel(): void {
    if (!this.reportGenerated || this.detalleViajes.length === 0) {
      return;
    }

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();

    // Hoja 1: Detalle de Viajes
    const detalleData = this.detalleViajes.map(v => ({
      'ID Viaje': v.viaj_Id,
      'Fecha': new Date(v.viaj_Fecha).toLocaleDateString('es-HN'),
      'Sucursal': v.sucu_Nombre,
      'Dirección Sucursal': v.sucu_Direccion,
      'Transportista': v.tran_Nombre,
      'Teléfono Transportista': v.tran_Telefono,
      'Tarifa/Km Transportista': v.tran_TarifaPorKm,
      'Colaborador': v.colb_Nombre,
      'DNI Colaborador': v.colb_DNI,
      'Código Colaborador': v.colb_Codigo,
      'Distancia (Km)': v.clVj_DistanciaKm,
      'Tarifa/Km': v.clVj_TarifaPorKm,
      'Monto': v.montoPorColaborador,
      'Usuario Registro': v.usuarioRegistro,
      'Fecha Registro': new Date(v.viaj_FechaCreacion).toLocaleString('es-HN')
    }));

    const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle de Viajes');

    // Hoja 2: Resumen por Transportista
    const resumenData = this.resumenTransportistas.map(t => ({
      'Transportista': t.tran_Nombre,
      'Identidad': t.tran_Identidad,
      'Teléfono': t.tran_Telefono,
      'Tarifa/Km': t.tran_TarifaPorKm,
      'Total Viajes': t.totalViajes,
      'Total Colaboradores': t.totalColaboradores,
      'Total Kilómetros': t.totalKilometros,
      'Total a Pagar': t.totalAPagar
    }));

    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Transportistas');

    // Generar archivo
    const fechaInicio = this.reportForm.get('fechaInicio')?.value;
    const fechaFin = this.reportForm.get('fechaFin')?.value;
    const fileName = `Reporte_Viajes_${fechaInicio}_${fechaFin}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }

  /**
   * Limpia el reporte
   */
  limpiarReporte(): void {
    this.detalleViajes = [];
    this.resumenTransportistas = [];
    this.reportGenerated = false;
    this.totalViajes = 0;
    this.totalColaboradores = 0;
    this.totalKilometros = 0;
    this.totalAPagar = 0;
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Formatea un número como moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  }
}
