# 📋 PLANIFICACIÓN DEL FORMULARIO -- Paquete de viaje

------------------------------------------------------------------------

## 🧱 1. ESTRUCTURA GENERAL DEL FORMULARIO

El formulario se divide en 6 bloques principales:

1.  Datos Generales\
2.  Canal / Agencia\
3.  Pasajeros\
4.  Servicios Generales Contratados\
5.  Itinerario (Por Fecha)\
6.  Condiciones del Servicio

------------------------------------------------------------------------

# 1️⃣ DATOS GENERALES

Campos:

-   Fecha de emisión\
-   Destinos (Multiselect)\
-   Programa (texto libre)\
-   Fecha inicio viaje\
-   Fecha fin viaje

📌 Nota:\
El campo **Destinos** es solo informativo/comercial.\
No genera automáticamente bloques en el itinerario.

------------------------------------------------------------------------

# 2️⃣ CANAL / AGENCIA

Campos:

-   Agencia (Autocomplete desde tabla CanalVenta)\
-   Counter (readonly -- desde localStorage)\
-   Contacto\
-   Teléfono\
-   Email

------------------------------------------------------------------------

# 3️⃣ PASAJEROS (TABLA DINÁMICA)

Tabla editable con botón para agregar filas.

  -------------------------------------------------------------------------
  N°   Nombres y Apellidos   Documento   Nacionalidad   Fecha Nacimiento
  ---- --------------------- ----------- -------------- -------------------

  -------------------------------------------------------------------------

Acciones: - ➕ Agregar pasajero\
- 🗑 Eliminar pasajero

------------------------------------------------------------------------

# 4️⃣ SERVICIOS GENERALES CONTRATADOS

⚠️ Esta sección NO es el itinerario diario.

## 4.1 Movilidad Principal

-   Tipo (BUS \| AÉREO \| CRUCERO)\
-   Empresa (Ej: LATAM, Cruz del Sur)

## 4.2 Hoteles Generales por Destino

  Destino   Hotel   Tipo Habitación   Alimentación
  --------- ------- ----------------- --------------

------------------------------------------------------------------------

# 5️⃣ ITINERARIO (Estructura Principal)

## 🔥 REGLA BASE:

**1 Fecha = 1 Bloque de Itinerario**

Cada bloque representa un **Día del viaje**.

------------------------------------------------------------------------

## 🟨 5.1 BLOQUE: DÍA DEL ITINERARIO

Cada bloque contiene:

-   Fecha\
-   Título del día (Ej: AREQUIPA - CITY TOUR PM)\
-   Origen (opcional)\
-   Destino (opcional)\
-   Lista de eventos del día

Ejemplo:

28 SEPTIEMBRE: AREQUIPA - CITY TOUR PM\
- Llegada a Arequipa y traslado\
- City Tour\
- Noche de alojamiento

------------------------------------------------------------------------

## 🟨 5.2 EVENTOS DENTRO DEL DÍA

Cada bloque puede contener múltiples eventos.

Un evento puede ser:

-   Traslado\
-   Actividad / Tour\
-   Hotel\
-   Vuelo\
-   Día libre\
-   Nota libre

### Estructura del Evento

-   Tipo de evento (select)\
-   Hora (opcional)\
-   Descripción\
-   ¿Es salida o llegada? (si aplica)

Ejemplo:

Tipo: Traslado\
Hora: 07:00 AM\
Descripción: Traslado de hotel al terminal

------------------------------------------------------------------------

# 6️⃣ CONDICIONES DEL SERVICIO

Campos finales:

-   Idioma\
-   Incluye (textarea)\
-   No incluye (textarea)\
-   Impuestos adicionales (monto)\
-   Observaciones

Ejemplo:

NO INCLUYE: - Impuesto turístico USD 21.00\
- Alimentación no especificada

------------------------------------------------------------------------

# 🧠 ABSTRACCIÓN FINAL DEL MODELO

Viaje\
├── Datos Generales\
├── Agencia\
├── Pasajeros\[\]\
├── Servicios Generales\
├── Itinerario\[\]\
│ ├── Día\
│ │ ├── Fecha\
│ │ ├── Título\
│ │ ├── Eventos\[\]\
│ │ │ ├── Tipo\
│ │ │ ├── Hora\
│ │ │ ├── Descripción\
└── Condiciones

------------------------------------------------------------------------

# 🎯 CONCLUSIÓN CLAVE

-   El campo **Destino (cabecera)** es solo resumen.\
-   El itinerario real se construye por **fecha**.\
-   Cada fecha genera un bloque.\
-   Cada bloque contiene múltiples eventos.
