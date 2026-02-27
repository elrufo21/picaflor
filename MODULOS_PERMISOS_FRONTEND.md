# Permisos de Modulos en Frontend (Plan + Implementacion Inicial)

## Objetivo
Implementar control de acceso por **modulo** en frontend con fuente real desde login (`modulosPermitidos`), manteniendo fallback mock para continuidad local.

## Alcance actual
- Permisos por modulo: `fullday`, `citytour`, `paquete_viaje`, `cashflow`, `maintenance`.
- Proteccion de rutas por modulo.
- Filtrado de menu lateral por modulo permitido.
- Redireccion al primer modulo permitido.
- Pantalla `/403` cuando no hay acceso.

No incluye aun permisos por submodulo ni acciones (`read/create/edit/delete`).

## Arquitectura implementada

### 1) Fuente de permisos (login + fallback mock)
Archivo: `src/app/auth/mockModulePermissions.ts`

- Define tipo `ModuleCode`.
- Fallback de permisos cuando login no trae permisos.
- Define `BASE_MODULES_BY_AREA` (permisos base por area).
- Define `USER_OVERRIDES` (allow/deny por usuario local).
- Expone:
  - `resolveMockModulePermissions(user)`
  - `MODULE_DEFAULT_PATHS` (ruta principal por modulo)

### 2) Store de permisos
Archivo: `src/store/permissions/modulePermissions.store.ts`

Estado:
- `allowedModules: ModuleCode[]`
- `loaded: boolean`

Metodos:
- `loadForUser(user)`
- `clear()`
- `canAccessModule(moduleCode)`
- `getFirstAllowedPath()`

Resolucion actual:
1. Si `auth.user.permissionsFromLogin = true`, usa `auth.user.allowedModules`.
2. Si no, usa fallback mock (`resolveMockModulePermissions`).
3. Aplica override local por usuario (`allow/deny`) encima del resultado.

### 3) Store de submodulos (preparado)
Archivo: `src/store/permissions/submodulePermissions.store.ts`

Estado:
- `allowedSubmodules: string[]`
- `permissionsVersion: number | null`
- `loaded: boolean`

Metodos:
- `loadForUser(user)`
- `clear()`
- `canAccessSubmodule(code)`

### 4) Carga en ciclo de autenticacion
Archivo: `src/app/components/RequireAuth.tsx`

Comportamiento:
- Al hidratar auth y estar autenticado: carga `modulePermissionsStore` y `submodulePermissionsStore` desde `auth.user`.
- Si no autenticado: limpia ambos stores.

### 5) Guard de modulo
Archivo: `src/app/components/RequireModuleAccess.tsx`

Props:
- `moduleCode`
- `children`

Comportamiento:
- Si `loaded=false`: no renderiza (espera).
- Si tiene permiso: renderiza children.
- Si no tiene permiso: redirige a primer modulo permitido o `/403`.

### 6) Redireccion por defecto
Archivo: `src/app/components/ModuleDefaultRedirect.tsx`

Comportamiento:
- Redirige al primer modulo permitido.
- Si no hay permisos, redirige a `/403`.

### 7) Pantalla de acceso denegado
Archivo: `src/app/pages/Forbidden.tsx`

Ruta:
- `/403`

### 8) Integracion en router global
Archivo: `src/app/routes.tsx`

Cambios:
- `index` ahora usa `ModuleDefaultRedirect`.
- `*` ahora usa `ModuleDefaultRedirect`.
- Se agrega ruta `403`.
- Se envuelve cada grupo de rutas por modulo con `RequireModuleAccess`:
  - `fullday`
  - `citytour`
  - `paquete_viaje`
  - `cashflow`
  - `maintenance`

### 9) Filtrado de menu por modulo
Archivo: `src/layout/navigation.ts`

- `NavigationItem` ahora soporta `moduleCode`.
- Se agrega `filterNavigationItemsByModuleAccess`.
- Se asigna `moduleCode` a cada item principal.

Archivo: `src/layout/MainLayout.tsx`

- Se usa `canAccessModule` del store.
- Se filtra navegacion por area + permisos de modulo.

### 10) Persistencia en auth storage
Archivo: `src/store/auth/auth.store.ts`

En login se guardan en session:
- `allowedModules`
- `allowedSubmodules`
- `permissionsVersion`
- `rawAllowedModules`
- `rawAllowedSubmodules`
- `permissionsFromLogin`

Normalizacion:
1. Si backend envia array (`modulosPermitidos`, `subModulosPermitidos`), se usa ese valor.
2. Si no, se parsea CSV (`modulosPermitidosRaw`, `subModulosPermitidosRaw`).
3. Se persiste en localStorage dentro de `picaflor.auth.session`.

### 11) Limpieza en logout/reset
Archivo: `src/store/resetAllStores.ts`

- Se reinicia `modulePermissionsStore` en `resetAllStores`.
- Se reinicia `submodulePermissionsStore` en `resetAllStores`.

## Flujo funcional
1. Usuario inicia sesion.
2. Backend devuelve `modulosPermitidos`, `subModulosPermitidos`, `permisosVersion`.
3. `auth.store` normaliza y persiste esos permisos en `picaflor.auth.session`.
4. `RequireAuth` hidrata sesion y carga stores de modulo/submodulo.
5. Menu muestra solo modulos permitidos.
6. Si usuario entra a ruta sin permiso:
   - guard redirige al primer modulo permitido o `/403`.
7. Si cierra sesion:
   - se limpian stores, query cache y permisos.

## Control de botones por accion (actual)
Pantallas adaptadas:
- `src/modules/fullday/pages/fulldayList.tsx`
- `src/modules/citytour/pages/cityTourList.tsx`

Regla aplicada:
1. Si existen submodulos en sesion (`allowedSubmodules.length > 0`), se evalua por `SubModuloCode` de boton:
- `fullday.programacion_liquidaciones.btn_agregar`
- `fullday.programacion_liquidaciones.btn_guardar`
- `citytour.programacion_liquidaciones.btn_agregar`
- `citytour.programacion_liquidaciones.btn_guardar`
2. Si no existen submodulos en sesion, usa fallback por modulo:
- `canAccessAction(moduleCode, "create")` para `Agregar`
- `canAccessAction(moduleCode, "edit")` para `Guardar`
3. Si no hay permiso:
- boton se deshabilita visualmente.
- handler bloquea accion y muestra toast de "Sin permiso".

## Como editar permisos mock hoy
Archivo: `src/app/auth/mockModulePermissions.ts`

1. Cambiar base por area:
- `BASE_MODULES_BY_AREA["6"] = [...]`

2. Dar permiso extra puntual por usuario:
- `USER_OVERRIDES["123"] = { allow: ["maintenance"] }`

3. Quitar modulo puntual a un usuario:
- `USER_OVERRIDES["456"] = { deny: ["cashflow"] }`

## Migracion futura a backend (sin romper frontend)
Cuando exista API:

1. Mantener `modulePermissions.store.ts` sin cambios de interfaz.
2. Reemplazar internamente `resolveMockModulePermissions(user)` por llamada API:
   - ejemplo `GET /auth/me/modules`
3. Mantener guard, navegación y redirecciones tal cual.

Contrato recomendado del backend:
```json
{
  "modules": ["fullday", "citytour", "cashflow"]
}
```

## Siguiente fase sugerida
1. Agregar permisos por submodulo (`fullday.programacion_liquidaciones`).
2. Agregar permisos por accion (`read/create/update/delete/export/print`).
3. Proteger botones y acciones de tabla.
4. Agregar auditoria de cambios de permisos.

## Backend y DB requeridos (para reemplazar mock correctamente)

### Contrato actual usado desde login
Endpoint actual:
- `POST /User/acceso`

Campos consumidos en frontend:
- `modulosPermitidos` (`string[]`)
- `subModulosPermitidos` (`string[]`)
- `modulosPermitidosRaw` (csv fallback)
- `subModulosPermitidosRaw` (csv fallback)
- `permisosVersion` (`number|string`)

### Respuesta recomendada de backend
Endpoint sugerido:
- `GET /auth/me/modules`

Respuesta opcion completa:
```json
{
  "userId": "123",
  "areaId": "6",
  "modules": [
    { "code": "fullday", "allowed": true },
    { "code": "citytour", "allowed": true },
    { "code": "paquete_viaje", "allowed": true },
    { "code": "maintenance", "allowed": true }
  ],
  "version": 1
}
```

Respuesta opcion simple:
```json
{
  "modules": ["fullday", "citytour", "paquete_viaje", "maintenance"],
  "version": 1
}
```

Regla: no enviar permisos inactivos/no permitidos en la respuesta; el backend debe devolver solo modulos activos y permitidos.

### Regla de prioridad esperada (area + usuario)
1. `deny` de usuario (gana siempre).
2. `allow` de usuario.
3. permiso base del area.
4. si no existe asignacion: denegado.

### Modelo minimo de tablas para modulos
1. `Modulos`
- `IdModulo`, `ModuloCode`, `Activo`

2. `AreaModuloPermiso`
- `AreaId`, `IdModulo`, `Allow` (`bit`)

3. `UsuarioModuloPermiso`
- `UsuarioId`, `IdModulo`, `Effect` (`allow`/`deny`)

### Como se integra en este frontend
1. Se mantiene `useModulePermissionsStore`.
2. Se reemplaza la carga mock por llamada a API dentro de `loadForUser`.
3. No cambian guards, rutas ni menu.

## Plan completo para submodulos

### Objetivo
Pasar de permisos por modulo a permisos por submodulo y luego por accion, sin romper lo ya implementado.

### Fase 1: Inventario y codigos
1. Definir `SubmoduleCode` por modulo.
2. Definir convención estable:
- `modulo.submodulo` (ej. `fullday.programacion_liquidaciones`)
3. Mapear cada ruta a un `submoduleCode`.

### Fase 2: Backend para submodulos (lectura)
Endpoint sugerido:
- `GET /auth/me/submodules`

Respuesta sugerida:
```json
{
  "submodules": [
    "fullday.programacion_liquidaciones",
    "fullday.listado",
    "citytour.programacion_liquidaciones"
  ],
  "version": 3
}
```

### Fase 3: Store y helpers en frontend
1. Crear `submodulePermissions.store.ts`.
2. Exponer:
- `canAccessSubmodule(code)`
- `getFirstAllowedSubmodulePath()`
3. Mantener store de modulo para navegación macro.

### Fase 4: Guard de submodulo en rutas
1. Crear `RequireSubmoduleAccess`.
2. En rutas específicas, envolver componente por submodulo.
3. Fallback: primer submodulo permitido del mismo modulo.

### Fase 5: Menú por submodulo
1. Añadir `submoduleCode` a items/children de navegación.
2. Filtrar hijos por `canAccessSubmodule`.
3. Si modulo queda sin hijos visibles, ocultar modulo padre.

### Fase 6: Permisos por accion
1. Definir keys:
- `fullday.programacion_liquidaciones.read`
- `fullday.programacion_liquidaciones.export`
- `fullday.programacion_liquidaciones.verify`
2. Guardar acciones en backend y devolverlas en `/auth/me/permissions`.
3. Frontend:
- rutas por `read`
- botones por accion puntual (`export`, `delete`, etc.)

### Fase 7: Auditoria y cache
1. Backend incrementa `version` cuando cambian permisos.
2. Frontend refresca permisos cuando cambia `version`.
3. Registrar cambios de permisos en tabla de auditoria.

## Modelo de datos recomendado para submodulos

1. `SubModulos`
- `IdSubModulo`, `IdModulo`, `SubModuloCode`, `Activo`

2. `AreaSubModuloPermiso`
- `AreaId`, `IdSubModulo`, `Allow`

3. `UsuarioSubModuloPermiso`
- `UsuarioId`, `IdSubModulo`, `Effect` (`allow`/`deny`)

4. Opcional para acciones:
- `Permisos` (catalogo de acciones por submodulo)
- `AreaPermisoAccion`
- `UsuarioPermisoAccion`

## Orden de implementacion recomendado
1. Backend: `/auth/me/modules` real.
2. Frontend: reemplazar mock de modulos.
3. Backend: `/auth/me/submodules`.
4. Frontend: guard y filtro de submodulos.
5. Backend + frontend: acciones (`read/create/update/delete/export/print/verify`).
