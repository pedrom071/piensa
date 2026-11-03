# Líderes del Mañana · plataforma

App web del programa Líderes del Mañana (Fundación P!ensa). Sirve para inscribir estudiantes, registrar asistencia, inscribirlos a visitas cívicas, seguir su avance hacia la graduación y aplicar las encuestas de entrada y salida.

Se usa desde el navegador y también se puede instalar en el celular ("Agregar a pantalla de inicio").

| Rol | Entra con | Puede |
|---|---|---|
| Equipo P!ensa (admin) | correo + clave | Todo: calendario, regla de graduación, colegios, profesores, asistencia, encuestas y descargas |
| Profesor/a | correo + clave | Inscribir a sus estudiantes (uno a uno o con planilla), crear sus cuentas, reemplazos y bajas, inscribirlos a visitas, ver su avance |
| Estudiante | RUT + clave | Ver su asistencia y lo que le falta para graduarse, responder encuestas |

**Probar sin datos reales:** abre la app agregando `?demo` a la dirección (por ejemplo `.../index.html?demo`). Usa datos ficticios que quedan solo en ese navegador.

## Cómo está hecha

- `app/`: la app (HTML, CSS y JavaScript, sin pasos de compilación). Se publica tal cual.
- `supabase/schema.sql`: la base de datos y sus **permisos**. Cada rol solo puede leer y escribir lo suyo; lo controla la base de datos, no la app.
- `supabase/seed_2027.sql`: año 2027, calendario tentativo y encuestas.
- `supabase/functions/cuentas/`: función que crea las cuentas de estudiantes y profesores con claves temporales, sin depender del correo.
- `app/plantillas/carga_estudiantes.xlsx`: plantilla para cargar estudiantes.
- `tests/`: pruebas de permisos y de la regla de graduación.

La regla de graduación está en dos lugares que calculan igual: `app/js/lib/reglas.js` (lo que muestra la app) y la vista `estado_graduacion` (para análisis en R, Python o Stata). Las pruebas verifican los mismos casos en ambos.

## Puesta en marcha (una sola vez)

### 1. Base de datos

1. En Supabase, abre **SQL Editor** > **New query**.
2. Pega el contenido de `supabase/schema.sql` y pulsa **Run**.
3. En otra consulta, pega `supabase/seed_2027.sql` y pulsa **Run**.

### 2. Primera cuenta de administración

1. **Authentication** > **Users** > **Add user** > **Create new user**: tu correo, una clave y marca **Auto Confirm User**.
2. En el SQL Editor, ejecuta `supabase/admin_inicial.sql` (revisa que el correo sea el tuyo).

### 3. Cerrar el registro libre

**Authentication** > **Sign In / Providers**: desactiva **Allow new users to sign up**. Las cuentas solo las crea la app.

### 4. Función de cuentas

1. **Edge Functions** > **Deploy a new function** > **Via Editor**.
2. Nombre: `cuentas`. Pega el contenido de `supabase/functions/cuentas/index.ts` y pulsa **Deploy**.
3. Opcional: en **Edge Functions** > **Secrets**, agrega `LDM_DOMINIO_ESTUDIANTES` solo si cambias `dominioEstudiantes` en `app/config.js`.

### 5. Publicar la app

Con GitHub Pages: **Settings** > **Pages** > **Source: GitHub Actions**. El archivo `.github/workflows/ldm-pages.yml` publica la carpeta `ldm/app` cada vez que cambia en la rama `main`.

GitHub Pages gratuito exige que el repositorio sea **público**. El código no contiene datos de estudiantes ni claves secretas: la clave de `app/config.js` es pública por diseño.

### 6. Dominio propio (opcional)

En **Settings** > **Pages** > **Custom domain**, escribe `ldm.fundacionpiensa.cl`. Quien administre el dominio debe crear un registro `CNAME` de `ldm` hacia `pedrom071.github.io`.

## Uso durante el año

1. **Colegios y profesores:** agrega los colegios (con RBD) y crea la cuenta de cada profesor. La clave temporal se muestra una sola vez.
2. **Estudiantes:** cada profesor los carga con la plantilla o uno a uno, y luego pulsa **Crear cuentas pendientes**. Entrega a cada estudiante su RUT y su clave temporal; al entrar, el estudiante crea su clave propia.
3. **Asistencia:** en **Asistencia**, elige la actividad y marca presentes y ausentes.
4. **Visitas:** los profesores inscriben a sus estudiantes; la app destaca a quienes la necesitan para graduarse.
5. **Encuestas:** ábrelas en **Encuestas y datos** cuando corresponda aplicarlas, y descarga las respuestas en CSV.
6. **Reemplazos:** en la ficha del estudiante, **Dar de baja o reemplazar**. La asistencia previa queda en el historial.

Si un estudiante olvida su clave, su profesor genera una nueva clave temporal desde su ficha.

## Pruebas

Con un Postgres 15+ local:

```bash
PGHOST=... PGPORT=... PGUSER=... bash tests/correr_pruebas.sh
```

Crea una base de prueba, carga el esquema, verifica los permisos de cada rol y la regla de graduación, y corre las pruebas de JavaScript (`node --test`).

## Datos personales

Casi todos los estudiantes son menores de edad. Por la Ley 21.719:
- se guarda solo lo necesario: RUT, nombre, curso y, si se quiere, correo;
- se registra si hay autorización firmada del apoderado;
- el profesor no ve las respuestas de las encuestas, solo si están respondidas;
- las descargas de respuestas usan el código del estudiante, no su nombre.
