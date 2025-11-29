import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '', redirectTo: 'general/sucursales/list', pathMatch: 'full'
  },
  {
    path: 'general', loadChildren: () => import('./general/general.module').then(m => m.GeneralModule)
  },
  {
    path: 'oper', loadChildren: () => import('./oper/oper.module').then(m => m.OperModule)
  },
  {
    path: 'acceso', loadChildren: () => import('./acceso/acceso.module').then(m => m.AccesoModule)
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
