import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components (Standalone)
import { ListComponent } from './list/list.component';
import { CreateComponent } from './create/create.component';
import { DetailsComponent } from './details/details.component';
import { EditComponent } from './edit/edit.component';
import { ReportComponent } from './report/report.component';

const routes: Routes = [
    {
        path: 'list',
        component: ListComponent
    },
    {
        path: 'create',
        component: CreateComponent
    },
    {
        path: 'details/:id',
        component: DetailsComponent
    },
    {
        path: 'edit/:id',
        component: EditComponent
    },
    {
        path: 'report',
        component: ReportComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ViajesRoutingModule { }
