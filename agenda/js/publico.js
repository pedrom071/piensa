/* Agenda P!ensa — arranque de la página pública según el link:
   ?e=jlp2026                       → reservar
   ?e=jlp2026&modo=jurado&k=CLAVE   → panel del jurado
   ?cancelar=TOKEN                  → cancelar una hora */
(function () {
  'use strict';
  var AP = window.AP;
  var raiz = document.getElementById('app');
  var q = new URLSearchParams(location.search);
  var e = q.get('e') || '';

  function fallo(err, instancia) {
    var msg = AP.codigoError(err).mensaje;
    document.title = 'Agenda P!ensa';
    AP.vista.error(raiz, msg, instancia);
  }

  AP.vista.cargando(raiz);

  if (q.get('cancelar')) {
    AP.api('cancelacion', { token: q.get('cancelar') }).then(function (d) {
      document.title = 'Cancelar hora · ' + d.instancia.titulo;
      AP.vista.cancelar(raiz, d);
    }).catch(fallo);
  } else if (e && q.get('modo') === 'jurado') {
    AP.api('jurado', { e: e, k: q.get('k') || '' }).then(function (d) {
      document.title = 'Jurado · ' + d.instancia.titulo;
      AP.vista.jurado(raiz, d, { k: q.get('k') || '' });
    }).catch(fallo);
  } else if (e) {
    AP.api('reserva', { e: e }).then(function (d) {
      document.title = d.instancia.titulo;
      AP.vista.reserva(raiz, d);
    }).catch(fallo);
  } else {
    AP.vista.error(raiz, 'Este link está incompleto. Revisa que lo hayas copiado entero.', { titulo: 'Agenda P!ensa' });
  }
})();
