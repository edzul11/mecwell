# Documentación General del Proyecto "Camila" (HR & Inventario)

Este documento centraliza toda la información de la arquitectura, el historial de cambios, y las planificaciones a futuro del sistema Camila.

---

## 1. Historial de Cambios y Estado Actual

El sistema actual cuenta con una arquitectura Full-Stack utilizando **React (Frontend)**, **FastAPI (Backend en Python)** y **Supabase (Base de Datos PostgreSQL y Almacenamiento)**.

### Módulos Implementados (Fase 1: Recursos Humanos)
- **Gestión de Trabajadores:** Creación, lectura y modificación de perfiles de trabajadores (`workers.py`, `WorkersList.jsx`). Integración con `site_id` (Faena) como contexto principal.
- **Gestión de Sitios/Obras:** Manejo de lugares físicos de trabajo (`sites.py`, `SitesList.jsx`).
- **Contratos y Documentos:** Generación de contratos y actas (en PDF), almacenamiento de referencias y visualización en modales (`contracts.py`, `documents.py`, `DocumentsList.jsx`).
- **Remuneraciones y Anticipos:** Registro y gestión de liquidaciones de sueldo, y nuevo flujo de anticipos mensuales limitados al sueldo base (`payslips.py`, `advances.py`, `PayslipsList.jsx`).
- **Finiquitos:** Cálculo automático de finiquitos con exportación a PDF, ahora incluyendo conversión de montos a palabras (`finiquitos.py`, `FiniquitoWizardPage.jsx`).

---

## 2. Planificación de Nuevas Funcionalidades (Fase 2: Inventario, Gastos y EPP)

Se expandirá el sistema para manejar el stock físico (materiales y equipos) y los gastos de la empresa al reabastecer dicho stock.

### A. Arquitectura de Carga de Archivos (Supabase Storage)
Para los comprobantes de gastos (imágenes, facturas) y documentos firmados (PDFs):
1. **Buckets en Supabase:** Se crearán buckets (`documents` para PDFs privados y `receipts` para comprobantes de gastos).
2. **Flujo de Carga:** El frontend sube el archivo a Supabase Storage con `@supabase/supabase-js`.
3. **Persistencia:** Supabase Storage devuelve una URL. El frontend envía esta URL al backend en FastAPI, quien la guarda como texto en la base de datos (ej. `receipt_url` en la tabla de Gastos).

### B. Módulo de Inventario y Control de Gastos
En lugar de "cobros", el sistema se enfocará en el **Control de Gastos de la Empresa** relacionados a la compra de stock.
- **Tabla `InventoryItem`:** Almacena los materiales (ej. Cemento, Cascos, Guantes).
- **Tabla `CompanyExpense` (Gastos):** Registra cada vez que la empresa compra materiales. Incluye monto gastado, fecha, imagen de la factura (`receipt_url`), y opcionalmente el `site_id` (Obra) a la que se destinan los materiales.

### C. Manejo de EPP y Trabajadores (Propuesta Optimizada)
En lugar de saturar el perfil del trabajador con una lista directa de EPP, se utilizará un enfoque más escalable y seguro:

**Propuesta de Arquitectura para EPP:**
1. **Módulo de Entregas (Actas de Entrega):** Crear una tabla `PPE_Assignment` (Asignación de EPP). Cuando a un trabajador se le da un equipo, se crea un registro de entrega. Esto descuenta automáticamente el stock del Inventario.
2. **Generación de Acta:** Al entregar el EPP, el sistema generará un "Acta de Entrega" en PDF para que el trabajador firme.
3. **Perfil del Trabajador Limpio:** En la vista del trabajador (Frontend), solo habrá un botón llamado "Historial de EPP". Al hacer clic, se abre un modal que muestra qué EPP tiene en su posesión y los PDFs de las actas de entrega, manteniendo el perfil principal limpio.
4. **EPP Retornable vs Consumible:** En el inventario, cada EPP tendrá un valor `is_returnable` (ej. Casco = True, Mascarilla = False).

---

## 3. Objeciones y Consideraciones Arquitectónicas Críticas

Para evitar problemas a futuro a medida que la empresa crezca, se han identificado las siguientes vulnerabilidades arquitectónicas que debemos cubrir:

1. **Pérdida de Trazabilidad (El problema de sumar/restar):**
   - *Riesgo:* Si solo tenemos una columna `stock_quantity` en el inventario, al sumar o restar stock nadie sabrá *quién* ni *por qué* lo hizo.
   - *Solución:* Implementar una tabla obligatoria **`InventoryMovement` (Movimientos de Inventario)**. Cada vez que el stock cambie, se registra una fila: Fecha, Ítem, Cantidad (+5 o -2), Tipo (Compra, Asignación a Trabajador, Pérdida) y el Usuario responsable.
2. **Proceso de Desvinculación (Trabajadores que se van con equipo):**
   - *Riesgo:* Un trabajador renuncia o es despedido y se lleva equipos costosos (herramientas, cascos, arneses).
   - *Solución:* Usar la lógica de "EPP Retornable". Al iniciar el proceso de desvinculación en el sistema, debe saltar una alerta automática si el trabajador tiene "EPP Retornable" activo en su historial que aún no ha devuelto.
3. **Rentabilidad por Obra (Gastos Ciegos):**
   - *Riesgo:* Registrar los gastos de compra sin asociarlos a un proyecto impide saber si una obra está perdiendo dinero.
   - *Solución:* La tabla de Gastos (`CompanyExpense`) siempre debe permitir vincular el gasto a un `site_id` (Obra) específico, o marcarlo como "Gasto de Oficina Central". Así, en el Dashboard podremos ver: "La Obra X lleva $5,000 en gastos de materiales".

---

## 4. Actualización del Sistema (18 de Mayo de 2026)

Se implementaron las siguientes mejoras en la arquitectura base:
- **Centralización en Faenas**: Los tableros y listas (como Trabajadores) ahora muestran de forma explícita la Faena a la que pertenece cada trabajador, corrigiendo estados de inactividad erróneos.
- **Generación Dinámica de PDFs**: Se incorporaron botones en múltiples vistas (Inventario, Vacaciones) para generar automáticamente PDFs en tiempo real (ej. Actas de Entrega de EPP y Permisos de Ausencia).
- **Módulo de Anticipos**: Se creó el flujo de Anticipo de Sueldo (tabla `salary_advances`), el cual genera un comprobante PDF para firma y se descuenta de manera automática en la liquidación de sueldo del mes en curso, previniendo anticipos por sobre el sueldo base.
- **Monto en Palabras**: Los documentos legales y finiquitos ahora traducen automáticamente los montos totales a texto formal (ej. "UN MILLÓN QUINIENTOS MIL PESOS").

---

## 5. Cosas Urgentes por Hacer

1. **Lector de Liquidaciones de Sueldo Externas (OCR / Parser de PDFs):**
   - **Requerimiento:** Implementar un lector de documentos inteligente (OCR o extractor de texto de PDFs) que permita al usuario subir liquidaciones de sueldo generadas de manera externa (fuera de Camila HR), extraer automáticamente los montos de sueldo base, descuentos y gastos, y vincularlos directamente en la ficha o base de datos de cada trabajador correspondiente.
   - **Nota de Preservación:** El módulo nativo de liquidaciones internas de Camila HR (`payslips.py` / `PayslipsList.jsx`) debe mantenerse intacto y sin modificaciones en caso de que en el futuro la empresa decida volver a utilizar las herramientas nativas.

