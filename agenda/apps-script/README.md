# Agenda P!ensa · motor (Apps Script)

Herramienta de agendamiento sobre Google Sheets + Google Calendar, gratis y sin servidores.

> **Versión con sitio y creador:** la página pública y el creador viven en GitHub Pages (carpeta `agenda/` del repo `pedrom071/piensa`) y usan este código como motor a través de su API. Si ya tenías instalada la versión anterior, solo actualiza el código: pega el nuevo `Codigo.gs`, ejecuta la función `autorizar` desde el editor y publica una nueva versión de la implementación existente (Implementar → Gestionar implementaciones → lápiz → Nueva versión). El link de la app no cambia y la página antigua sigue funcionando.

- Una **planilla** es el panel de control: cada fila de la hoja `Instancias` es una agenda (concurso, programa, evento) con sus horarios, duración, logos, colores y preguntas.
- Una **página pública** muestra solo los horarios libres. Al reservar se crea el evento en tu Google Calendar (con link de Google Meet si corresponde) y le llega la invitación a la persona.
- Un **panel de jurado** (link con clave) permite que cada jurado se sume o salga de las entrevistas. Si se suma a un horario que todavía nadie tomó, queda invitado automáticamente cuando alguien lo reserve.
- La persona recibe un correo de confirmación con la marca de la instancia y un link para cancelar o cambiar su horario.

Archivos:

| Archivo | Qué es |
|---|---|
| `Codigo.gs` | Toda la lógica (cupos, reservas, Calendar, correos, menú de la planilla) |
| `Pagina.html` | La página pública (reserva, panel de jurado, cancelación) |
| `appsscript.json` | Configuración: zona horaria de Chile, servicio de Calendar y permisos de la app web |

---

## Instalación (una sola vez, ~15 minutos)

### 1. Crea la planilla con la cuenta correcta

Abre Google Drive **con la cuenta cuyo Calendar quieres usar**. Las invitaciones salen de esa cuenta y los eventos quedan en su calendario. Crea una planilla nueva, por ejemplo "Agenda P!ensa".

> Si usas la cuenta de P!ensa (Google Workspace) y en el paso 5 no aparece la opción **"Cualquier usuario"**, el administrador del dominio la tiene bloqueada. En ese caso usa tu cuenta personal de Gmail y pon tu correo de P!ensa en la columna `responder_a`: las respuestas te llegarán ahí.

### 2. Pega el código

1. En la planilla: **Extensiones → Apps Script**.
2. En el editor, abre `Código.gs`, borra todo y pega el contenido de `Codigo.gs`.
3. Botón **+** junto a "Archivos" → **HTML** → nómbralo exactamente `Pagina` (sin `.html`) y pega el contenido de `Pagina.html`.
4. Ícono de engranaje (**Configuración del proyecto**) → marca **"Mostrar el archivo de manifiesto appsscript.json en el editor"**. Vuelve al editor, abre `appsscript.json`, borra todo y pega el contenido de `appsscript.json`.
5. Guarda (Ctrl/Cmd + S).

> Alternativa al paso 4: en el editor, **Servicios +** → **Google Calendar API** → Agregar. El manifiesto igual conviene pegarlo para que la zona horaria quede en Chile.

### 3. Crea las hojas

1. Vuelve a la planilla y recárgala. Aparece el menú **Agenda P!ensa**.
2. **Agenda P!ensa → Crear o reparar hojas**.
3. Google pedirá permisos. Si aparece "Google no verificó esta app", es normal en scripts propios: **Configuración avanzada → Ir a … (no seguro) → Permitir**.

Quedan creadas las hojas y la instancia de ejemplo `jlp2026`, con los horarios de las entrevistas de Jóvenes Líderes (18, 19 y 20 de noviembre).

### 4. Ajusta la instancia

En la hoja `Instancias` revisa sobre todo:

- `color_principal` y `color_acento`: vienen con colores provisionales. Cambia esos valores por los códigos de color exactos de P!ensa o del programa (formato `#RRGGBB`).
- `logo_piensa`, `logo_programa`, `logo_aliado`: vienen con los logos de jovenesliderespiensa.cl. Puedes usar imágenes de Drive (compartidas como "Cualquier persona con el enlace"). Usa PNG o JPG: los SVG no se ven en los correos.
- `descripcion`, `mensaje_confirmacion`, `campos_extra`, `modalidad`.

Cada encabezado tiene una nota con su explicación (pasa el mouse por la celda).

### 5. Publica la app web

1. En el editor de Apps Script: **Implementar → Nueva implementación**.
2. Tipo (engranaje): **App web**.
3. **Ejecutar como: Yo**. **Quién tiene acceso: Cualquier usuario**.
4. **Implementar**, autoriza, y copia la URL que termina en `/exec`.
5. En la planilla: **Agenda P!ensa → Guardar URL de la app publicada** y pégala.

### 6. Obtén los links

**Agenda P!ensa → Ver links y cupos** muestra, para cada instancia:

- **Link para reservar**: el que envías a las personas (`…/exec?e=jlp2026`).
- **Panel de jurado**: el que envías a los jurados (`…/exec?e=jlp2026&modo=jurado&k=CLAVE`). No lo compartas con postulantes.

### 7. Prueba antes de enviar

Reserva un horario con otro correo tuyo y revisa que lleguen la invitación de Calendar y el correo de confirmación. Después cancela con el link del correo y confirma que el horario vuelve a aparecer libre.

### 8. (Opcional) Recordatorios

**Agenda P!ensa → Activar recordatorios automáticos**. Cada hora revisa las citas y envía un correo de recordatorio según la columna `recordatorio_horas` (24 en el ejemplo).

---

## Uso diario

**Nueva instancia (otro programa o evento):** copia una fila de `Instancias`, cambia el `id` (corto, sin espacios ni tildes, por ejemplo `epp2027`), los textos, colores y logos. Agrega sus bloques en `Horarios` con ese mismo `id`. El link es `…/exec?e=epp2027`.

**Cerrar una agenda:** desmarca `activa`.

**Solo pueden reservar personas convocadas:** pega sus correos en la hoja `Autorizados`, con el `id` de la instancia. Si una instancia no tiene correos ahí, cualquiera con el link puede reservar.

**Bloquear un horario a mano:** agrega una fila en `Reservas` con `instancia`, `bloque` (`2026-11-18 12:10`) y `estado` = `Bloqueado`.

**Jurados.** Tienes tres formas de sumarlos, y puedes combinarlas:

1. Cada jurado entra al panel, elige su nombre y se suma a entrevistas sueltas o a un bloque completo. Para que aparezcan en la lista, ponlos en la hoja `Jurados`; si no, pueden escribir su nombre y correo.
2. Desde la planilla: agrega filas en `Jurados por entrevista` y luego **Agenda P!ensa → Sincronizar jurados con Calendar**. Para alguien que estará en todas, usa `invitados_fijos` en `Instancias`.
3. Directo en Google Calendar, como cualquier evento. La herramienta no borra a quienes agregues ahí.

**Cancelaciones:** la persona cancela con el link de su correo. Se borra el evento, se avisa a los invitados y el horario queda libre. Si cancelas tú directo en Calendar, cambia también el `estado` a `Cancelada` en `Reservas` para liberar el horario.

**Cambiar el código después:** pega los cambios y luego **Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión → Implementar**. Así la URL no cambia. Si creas una implementación nueva, la URL cambia y tienes que volver a guardarla.

**Insertar en un sitio web:** la página se puede poner en un `<iframe>` con la URL de reserva (por ejemplo, en jovenesliderespiensa.cl).

---

## Cosas a tener en cuenta

- **Cupos del caso JLP 2026:** los horarios suman 12 h 30 min (no 13 h 30). En bloques de 20 minutos seguidos son **37 entrevistas**: 15 el miércoles, 15 el jueves y 7 el viernes. Si entrevistas a más de 37 personas, agrega bloques en `Horarios`. Si agregas una pausa (`pausa_min`), los cupos bajan; con 5 minutos quedan 28.
- **Dos correos por reserva:** la invitación de Google Calendar y la confirmación con la marca de la instancia, que trae el link para cancelar.
- **Cuando un jurado se suma a una entrevista ya agendada,** Google puede enviarle a la persona entrevistada un aviso de "invitación actualizada". Es normal.
- **Límite de correos:** una cuenta Gmail gratuita envía hasta unos 100 destinatarios al día por script; Google Workspace, unos 1.500. Cada reserva usa 1 o 2 (confirmación y aviso a `aviso_a`) y cada recordatorio 1.
- **El jurado no ve** los campos de teléfono, correo, RUT ni dirección de las personas; sí ve los demás (comuna, categoría). Tú ves todo en `Reservas`.
- **Horarios ocupados:** si `respetar_ocupado` está marcada, se ocultan los horarios que choquen con otros eventos "ocupado" de tu calendario. Si bloqueaste los días de entrevista con un evento propio, déjala desmarcada.
