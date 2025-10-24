(function () {
  const CUPON = 'RINASUMMER10';
  const COUNTDOWN_MINUTES = 20;
  const STORAGE_KEY = 'rinaaccs_cupon_expiracion';
  let countdownInterval = null;
  let countdownElement = null;

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof luxon === 'undefined' || typeof Swal === 'undefined') {
      return;
    }

    const expiration = obtenerExpiracion();

    if (expiration) {
      mostrarPanelCuentaRegresiva(expiration);
      iniciarActualizacion(expiration);
      return;
    }

    lanzarInvitacionNewsletter();
  });

  function obtenerExpiracion() {
    const valor = sessionStorage.getItem(STORAGE_KEY);

    if (!valor) {
      return null;
    }

    const fecha = luxon.DateTime.fromISO(valor);

    if (!fecha.isValid || fecha <= luxon.DateTime.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return fecha;
  }

  function lanzarInvitacionNewsletter() {
    Swal.fire({
      title: 'Únete a nuestro newsletter y accede a un beneficio!!',
      html: crearContenidoNewsletter(),
      focusConfirm: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: 'Aceptar',
      preConfirm: validarCorreo
    }).then(function (resultado) {
      if (resultado.isConfirmed) {
        mostrarCupon();
      }
    });
  }

  function crearContenidoNewsletter() {
    return (
      '<label for="swal-input-email" class="swal2-label">Dejanos tu email</label>' +
      '<input id="swal-input-email" class="swal2-input" type="email" placeholder="tuemail@ejemplo.com" autocomplete="email">'
    );
  }

  function validarCorreo() {
    const input = document.getElementById('swal-input-email');

    if (!input) {
      return false;
    }

    const correo = input.value.trim();

    if (!correo) {
      Swal.showValidationMessage('Por favor, ingresá tu correo electrónico.');
      return false;
    }

    const patron = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(\.[\w-]+)+$/;

    if (!patron.test(correo)) {
      Swal.showValidationMessage('Ingresá un correo electrónico válido.');
      return false;
    }

    return correo;
  }

  function mostrarCupon() {
    Swal.fire({
      title: '¡Gracias por sumarte!',
      html:
        '<p class="swal2-cupon"><strong>CUPON: ' +
        CUPON +
        '</strong></p>' +
        '<p class="swal2-cupon__detalle">Tienes 20 minutos para utilizar el cupón en tu carrito!! Apresúrate!!</p>',
      confirmButtonText: 'Cerrar',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(function (resultado) {
      if (resultado.isConfirmed) {
        iniciarCuentaRegresiva();
      }
    });
  }

  function iniciarCuentaRegresiva() {
    const expiracion = luxon.DateTime.now().plus({ minutes: COUNTDOWN_MINUTES });
    sessionStorage.setItem(STORAGE_KEY, expiracion.toISO());

    mostrarPanelCuentaRegresiva(expiracion);
    iniciarActualizacion(expiracion);

    if (typeof Toastify === 'function') {
      Toastify({
        text: 'Cupón ' + CUPON + ' activado. ¡Aprovechalo!',
        duration: 5000,
        gravity: 'top',
        position: 'right',
        close: true,
        style: {
          background: 'linear-gradient(135deg, #b8928b, #d0bab4)',
          color: '#f8f3f2'
        }
      }).showToast();
    }
  }

  function mostrarPanelCuentaRegresiva(expiracion) {
    if (!countdownElement) {
      countdownElement = crearPanelCuentaRegresiva();
      document.body.appendChild(countdownElement);
    }

    countdownElement.hidden = false;
    countdownElement.setAttribute('aria-hidden', 'false');
    countdownElement.querySelector('.cupon-countdown__cupon').textContent = CUPON;

    actualizarCuentaRegresiva(expiracion);
  }

  function crearPanelCuentaRegresiva() {
    const panel = document.createElement('div');
    panel.className = 'cupon-countdown';
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');

    const titulo = document.createElement('p');
    titulo.className = 'cupon-countdown__titulo';
    titulo.innerHTML = 'Cupón <span class="cupon-countdown__cupon"></span>';

    const tiempo = document.createElement('p');
    tiempo.className = 'cupon-countdown__tiempo';
    tiempo.innerHTML = 'Tiempo restante: <span class="cupon-countdown__timer">--:--</span>';
    panel.appendChild(titulo);
    panel.appendChild(tiempo);

    return panel;
  }

  function iniciarActualizacion(expiracion) {
    detenerActualizacion();

    countdownInterval = setInterval(function () {
      actualizarCuentaRegresiva(expiracion);
    }, 1000);
  }

  function actualizarCuentaRegresiva(expiracion) {
    if (!countdownElement) {
      return;
    }

    const marcador = countdownElement.querySelector('.cupon-countdown__timer');
    const ahora = luxon.DateTime.now();

    if (!marcador) {
      return;
    }

    if (ahora >= expiracion) {
      marcador.textContent = '00:00';
      finalizarCuentaRegresiva();
      return;
    }

    const diferencia = expiracion.diff(ahora, ['minutes', 'seconds']).toObject();
    const minutos = Math.max(0, Math.floor(diferencia.minutes || 0));
    const segundos = Math.max(0, Math.floor(diferencia.seconds || 0));

    marcador.textContent = formatearTiempo(minutos) + ':' + formatearTiempo(segundos);
  }

  function formatearTiempo(valor) {
    return String(valor).padStart(2, '0');
  }

  function finalizarCuentaRegresiva() {
    detenerActualizacion();
    sessionStorage.removeItem(STORAGE_KEY);

    if (!countdownElement) {
      return;
    }

    countdownElement.classList.add('cupon-countdown--finalizado');
    const mensaje = document.createElement('p');
    mensaje.className = 'cupon-countdown__mensaje-final';
    mensaje.textContent = 'El cupón RINASUMMER10 ha expirado.';

    const previo = countdownElement.querySelector('.cupon-countdown__mensaje-final');
    if (!previo) {
      countdownElement.appendChild(mensaje);
    }

    setTimeout(function () {
      ocultarPanelCuentaRegresiva();
    }, 5000);
  }

  function ocultarPanelCuentaRegresiva() {
    detenerActualizacion();

    if (countdownElement) {
      countdownElement.remove();
      countdownElement = null;
    }
  }

  function detenerActualizacion() {
    if (countdownInterval !== null) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }
})();