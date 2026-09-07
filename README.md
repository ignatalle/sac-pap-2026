# SAC-PAP 2026
**Sistema de Control de Gestión — PAP 2026**  
Ejército Argentino · Dir. Gral. Personal y Bienestar

---

## Setup en 5 pasos

### PASO 1 — Crear cuenta Supabase
1. Ir a [supabase.com](https://supabase.com) → Sign up (gratis)
2. Crear nuevo proyecto → poner nombre `sac-pap-2026`
3. Guardar la contraseña del proyecto (no se recupera)
4. Esperar ~2 min a que se provisione

### PASO 2 — Crear las tablas
1. En Supabase → **SQL Editor**
2. Pegar todo el contenido de `schema.sql`
3. Clic en **Run**
4. Verificar que no haya errores rojos

### PASO 3 — Importar los datos del PAP
1. Instalar dependencias Python:
   ```
   pip install supabase python-dotenv
   ```
2. Crear archivo `.env` en la carpeta `scripts/`:
   ```
   SUPABASE_URL=https://tuproyecto.supabase.co
   SUPABASE_KEY=tu-service-role-key
   ```
   > La `service_role key` está en Supabase → Settings → API → **service_role** (NO la anon key)
3. Ejecutar:
   ```
   cd scripts
   python importar_excel.py
   ```
4. Verificar en Supabase → Table Editor → `tareas_pap` → debe tener 264 filas

### PASO 4 — Crear usuario de acceso
1. Supabase → **Authentication** → Users → **Add user**
2. Email: el que quieras (ej: `gervasoni@ejercito.mil.ar`)
3. Password: contraseña segura
4. Clic en **Create user**

### PASO 5 — Deploy en Vercel
1. Ir a [vercel.com](https://vercel.com) → Sign up con GitHub (gratis)
2. Subir esta carpeta a un repo de GitHub (puede ser privado)
3. En Vercel → **Add New Project** → importar el repo
4. En **Environment Variables** agregar:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://tuproyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = tu-anon-key
   ```
   > Ambas están en Supabase → Settings → API
5. Clic en **Deploy**
6. En ~2 min tenés el link: `sac-pap-2026.vercel.app`

---

## Instalar como app en el celular
1. Abrir el link en **Chrome** (Android) o **Safari** (iPhone)
2. Chrome: menú (⋮) → "Agregar a pantalla de inicio"
3. Safari: ícono compartir → "Añadir a inicio"
4. Listo — aparece como app con ícono propio

## Notificaciones
- Una vez instalada como PWA, ir a **Configuración** en la app
- Tocar "Activar notificaciones"
- Aceptar el permiso del sistema

---

## Estructura del proyecto
```
sac-pap-2026/
├── src/app/
│   ├── page.tsx          → Login
│   ├── dashboard/        → Panel de Control
│   ├── hoy/             → Control de Hoy
│   ├── agenda/          → Lista completa
│   ├── tarea/[id]/      → Detalle + REDOAPE
│   └── config/          → Configuración
├── public/
│   ├── sw.js            → Service Worker (notificaciones)
│   └── manifest.json    → Config PWA
├── scripts/
│   ├── tareas.json      → Datos del PAP 2026 (264 tareas)
│   └── importar_excel.py → Importa a Supabase
└── schema.sql           → Tablas Supabase
```

---

## Lógica de estados
| Estado | Significado |
|--------|------------|
| 🔴 VENCIDA | Término PAP ya pasó |
| 🟠 HACER AHORA | Llegó el inicio de preparación |
| 🟡 PRÓXIMA | A menos de 7 días del inicio de prep. |
| 🟢 PROGRAMADA | Tiempo suficiente |
| ⚪ REQUIERE FECHA | PAP dice "a determinar" |
| ✅ FINALIZADA | 100% avance o fecha real cargada |
