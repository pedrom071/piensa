# Agenda P!ensa

Agendamiento de entrevistas y reuniones de Fundación P!ensa.

- **Página pública** (este sitio, en GitHub Pages): la gente elige día y hora, y el panel del jurado se usa para sumarse a las entrevistas.
  - Reservar: `https://pedrom071.github.io/piensa/agenda/?e=CODIGO`
  - Panel del jurado: `https://pedrom071.github.io/piensa/agenda/?e=CODIGO&modo=jurado&k=CLAVE`
- **Creador**: `https://pedrom071.github.io/piensa/agenda/admin.html`. Ahí se crean y editan agendas con vista previa, se ven las reservas y se copian los links.
- **Motor**: Google Apps Script sobre una planilla de Google y Google Calendar (carpeta `apps-script/`). Guarda los datos, crea los eventos con invitación y envía los correos. Los datos de las personas quedan en la planilla, no en GitHub.

## Actualizar el motor (cuando cambie `apps-script/Codigo.gs`)

1. Abre la planilla → **Extensiones → Apps Script**.
2. Reemplaza todo el contenido de `Código.gs` por el de `apps-script/Codigo.gs` y guarda.
3. En el editor, elige la función **`autorizar`** en el menú de funciones y presiona **Ejecutar**. Acepta los permisos (la primera vez pide Google Drive, para guardar los logos que subes desde el creador).
4. **Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión → Implementar**. Así la dirección de la app no cambia.
5. Recarga la planilla y usa **Agenda P!ensa → Abrir el creador** para obtener tu link con clave.

## Seguridad

- `admin.html` se puede abrir, pero sin la clave de administración solo muestra la pantalla para entrar. Cada acción del creador se verifica en Apps Script con esa clave.
- La clave queda guardada en el navegador donde abriste el link del creador. "Salir" la borra de ese navegador; "Cambiar clave" crea una nueva y deja sin efecto la anterior en todos lados.
- El link del jurado solo abre el panel del jurado de esa agenda. La página de reserva no muestra nombres de nadie.
- Este repositorio no guarda datos ni claves: las reservas están en la planilla y la clave en las propiedades del script.

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html`, `js/publico.js` | Página pública: reservar, panel del jurado y cancelar |
| `admin.html`, `js/creador.js`, `css/creador.css` | Creador |
| `js/logos.js` | Editor de logos: quitar fondo, recortar márgenes, versión blanca |
| `js/vista.js`, `css/agenda.css` | Pantallas de la agenda (también se usan en la vista previa del creador) |
| `js/comun.js` | Utilidades y conexión con el motor |
| `js/config.js` | Dirección de la app de Apps Script |
| `apps-script/` | Código del motor, para pegar en Apps Script |

Si algún día creas una implementación nueva de Apps Script (con otra dirección), cambia la línea `api` de `js/config.js`.
