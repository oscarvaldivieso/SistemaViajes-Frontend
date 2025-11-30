import { MenuItem } from "./menu.model";

export const MENU: MenuItem[] = [

    {
        id: 24,
        label: 'MENUITEMS.APPS.LIST.VIAJES',
        icon: 'ri ri-bus-fill ',
        link: '/oper/viajes/list',
        parentId: 8
    },
    {
        id: 25,
        label: 'MENUITEMS.APPS.LIST.REPORTE',
        icon: 'ri ri-file-text-fill ',
        link: '/oper/viajes/report',
        parentId: 8
    },
    {
        id: 26,
        label: 'MENUITEMS.APPS.LIST.SUCURSALES',
        icon: 'ri ri-store-fill ',
        link: '/general/sucursales/list',
        parentId: 8
    },
    {
        id: 27,
        label: 'MENUITEMS.APPS.LIST.COLABORADORES',
        icon: 'ri ri-user-fill ',
        link: '/general/colaboradores/list',
        parentId: 8
    },
    {
        id: 28,
        label: 'MENUITEMS.APPS.LIST.TRANSPORTISTAS',
        icon: 'ph-truck',
        link: '/general/transportistas/list',
        parentId: 8
    }
]