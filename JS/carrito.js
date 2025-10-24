// Elementos del DOM que usa el carrito en la página.
const listaCarrito = document.getElementById('carrito-lista');
const mensajeVacio = document.getElementById('carrito-vacio');
const totalElemento = document.getElementById('carrito-total');
const botonComprar = document.querySelector('.carrito__comprar');
const checkoutSeccion = document.getElementById('carrito-checkout');
const checkoutForm = document.getElementById('carrito-form');
const medioPagoSelect = document.getElementById('medio-pago');
const totalResumen = document.getElementById('carrito-total-resumen');
const descuentoElemento = document.getElementById('carrito-descuento');
const descuentoValor = document.getElementById('carrito-descuento-valor');
const cuponDescuentoElemento = document.getElementById('carrito-cupon-descuento');
const cuponDescuentoValor = document.getElementById('carrito-cupon-descuento-valor');
const cuponInput = document.getElementById('carrito-cupon');
const cuponBoton = document.getElementById('carrito-cupon-aplicar');
const cuponMensaje = document.getElementById('carrito-cupon-mensaje');
const mensajeConfirmacion = document.getElementById('carrito-confirmacion');
const carritoSeccion = document.getElementById('seccion-carrito');
const carritoBurbuja = document.querySelector('.carrito-burbuja');
const botonCerrarConfirmacion = document.getElementById('carrito-confirmacion-cerrar');

// Claves para guardar la compra y el cupón
const STORAGE_KEY = 'rinaaccs_carrito';
const CUPON_CODIGO = 'RINASUMMER10';
const CUPON_STORAGE_KEY = 'rinaaccs_cupon_expiracion';
let carrito = [];
let catalogo = {};
let cuponActivo = false;

// Muestra un mensaje toast para confirmar acciones del carrito.
function mostrarToastCarrito(mensaje, tipo = 'agregado') {
  if (typeof Toastify !== 'function') {
    return;
  }

  const estilosPorTipo = {
    agregado: {
      background: 'linear-gradient(135deg, #b8928b, #d0bab4)'
    },
    eliminado: {
      background: 'linear-gradient(135deg, #c77c78, #b8928b)'
    }
  };

  const estiloBase = {
    color: '#f8f3f2',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  };

  const estilo = Object.assign({}, estiloBase, estilosPorTipo[tipo] || {});

  Toastify({
    text: mensaje,
    gravity: 'bottom',
    position: 'right',
    duration: 3000,
    close: true,
    stopOnFocus: true,
    style: estilo
  }).showToast();
}

// Configura el carrito solo cuando los elementos existen.
if (listaCarrito && mensajeVacio && totalElemento && botonComprar) {
  suscribirseACatalogo();
  carrito = cargarCarrito();

  renderizarCarrito();
  prepararBotonBurbuja();
  prepararModalConfirmacion();
  prepararEventosDeCompra();
  prepararCupon();
}

function suscribirseACatalogo() {
  if (typeof catalogoDatos === 'object' && catalogoDatos !== null) {
    catalogo = catalogoDatos;
  }

  document.addEventListener('catalogoCargado', function (evento) {
    const productos = evento?.detail?.productos;

    if (productos && typeof productos === 'object') {
      catalogo = productos;
      renderizarCarrito();
    }
  });
}

// Conecta la burbuja flotante con la sección del carrito.
function prepararBotonBurbuja() {
  if (!carritoBurbuja || !carritoSeccion) {
    return;
  }

  carritoBurbuja.addEventListener('click', function () {
    carritoSeccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// Activa el flujo de compra y el formulario de checkout.
function prepararEventosDeCompra() {
  botonComprar.addEventListener('click', function () {
    if (!checkoutSeccion || carrito.length === 0) {
      return;
    }

    checkoutSeccion.hidden = false;

    ocultarModalConfirmacion();

    actualizarTotales();

    if (typeof checkoutSeccion.scrollIntoView === 'function') {
      checkoutSeccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  if (medioPagoSelect) {
    medioPagoSelect.addEventListener('change', actualizarTotales);
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function (evento) {
      evento.preventDefault();

      if (carrito.length === 0) {
        return;
      }

      vaciarCarrito();
      mostrarModalConfirmacion();
    });
  }
}

// Habilita los eventos necesarios para aplicar un cupón manualmente.
function prepararCupon() {
  if (!cuponInput || !cuponBoton) {
    return;
  }

  cuponBoton.addEventListener('click', aplicarCupon);

  cuponInput.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      aplicarCupon();
    }
  });
}

// Valida el código ingresado y activa el descuento si corresponde.
function aplicarCupon() {
  if (!cuponInput) {
    return;
  }

  const codigo = cuponInput.value.trim();

  if (!estaCuponVigente()) {
    cuponActivo = false;
    mostrarMensajeCupon('cupón expirado', 'error');
    actualizarTotales();
    return;
  }

  if (codigo.toUpperCase() !== CUPON_CODIGO) {
    cuponActivo = false;
    mostrarMensajeCupon('cupón no válido', 'error');
    actualizarTotales();
    return;
  }

  cuponActivo = true;
  mostrarMensajeCupon('Cupón aplicado: 10% de descuento.', 'exito');
  actualizarTotales();
}

// Informa al usuario si el cupón fue aceptado o rechazado.
function mostrarMensajeCupon(texto, tipo) {
  if (!cuponMensaje) {
    return;
  }

  cuponMensaje.textContent = texto;
  cuponMensaje.hidden = false;
  cuponMensaje.classList.remove('carrito__cupon-mensaje--error', 'carrito__cupon-mensaje--exito');

  if (tipo === 'error') {
    cuponMensaje.classList.add('carrito__cupon-mensaje--error');
  } else if (tipo === 'exito') {
    cuponMensaje.classList.add('carrito__cupon-mensaje--exito');
  }
}

// Oculta cualquier mensaje previo relacionado al cupón.
function ocultarMensajeCupon() {
  if (!cuponMensaje) {
    return;
  }

  cuponMensaje.hidden = true;
  cuponMensaje.textContent = '';
  cuponMensaje.classList.remove('carrito__cupon-mensaje--error', 'carrito__cupon-mensaje--exito');
}

// Actualiza la sección del resumen con el descuento del cupón.
function actualizarVisualizacionCupon(descuento) {
  if (!cuponDescuentoElemento || !cuponDescuentoValor) {
    return;
  }

  if (descuento > 0) {
    cuponDescuentoElemento.hidden = false;
    cuponDescuentoValor.textContent = descuento.toFixed(2);
  } else {
    cuponDescuentoElemento.hidden = true;
    cuponDescuentoValor.textContent = '0';
  }
}

// Calcula el monto a descontar según el cupón vigente.
function calcularDescuentoCupon(totalActual) {
  if (!cuponActivo) {
    return 0;
  }

  if (!estaCuponVigente()) {
    cuponActivo = false;
    mostrarMensajeCupon('cupón expirado', 'error');
    return 0;
  }

  if (totalActual <= 0) {
    return 0;
  }

  return totalActual * 0.1;
}

// Confirma que el cupón todavía no expiró en la sesión.
function estaCuponVigente() {
  if (typeof luxon === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }

  return obtenerExpiracionCupon() !== null;
}

// Obtiene y valida la fecha límite almacenada para el cupón.
function obtenerExpiracionCupon() {
  const valor = sessionStorage.getItem(CUPON_STORAGE_KEY);

  if (!valor) {
    return null;
  }

  let fecha = null;

  try {
    fecha = luxon.DateTime.fromISO(valor);
  } catch (error) {
    sessionStorage.removeItem(CUPON_STORAGE_KEY);
    return null;
  }

  if (!fecha || !fecha.isValid) {
    sessionStorage.removeItem(CUPON_STORAGE_KEY);
    return null;
  }

  if (fecha <= luxon.DateTime.now()) {
    sessionStorage.removeItem(CUPON_STORAGE_KEY);
    return null;
  }

  return fecha;
}

// Configura el modal que agradece la compra y permite cerrarlo.
function prepararModalConfirmacion() {
  if (!mensajeConfirmacion) {
    return;
  }

  mensajeConfirmacion.addEventListener('click', function (evento) {
    if (evento.target === mensajeConfirmacion) {
      ocultarModalConfirmacion();
    }
  });

  if (botonCerrarConfirmacion) {
    botonCerrarConfirmacion.addEventListener('click', ocultarModalConfirmacion);
  }

  document.addEventListener('keydown', manejarEscapeConfirmacion);
}

// Cierra el mensaje de confirmación al presionar Escape.
function manejarEscapeConfirmacion(evento) {
  if (evento.key === 'Escape' && mensajeConfirmacion && !mensajeConfirmacion.hidden) {
    ocultarModalConfirmacion();
  }
}

// Mensaje emergente después de apretar finalizar compra.
function mostrarModalConfirmacion() {
  if (!mensajeConfirmacion) {
    return;
  }

  if (checkoutSeccion) {
    checkoutSeccion.hidden = false;
  }

  mensajeConfirmacion.hidden = false;
  document.body.classList.add('carrito__modal-activo');

  if (botonCerrarConfirmacion) {
    botonCerrarConfirmacion.focus();
  }
}

// Oculta el modal y restablece el estado de la página.
function ocultarModalConfirmacion() {
  if (!mensajeConfirmacion) {
    return;
  }

  mensajeConfirmacion.hidden = true;
  document.body.classList.remove('carrito__modal-activo');

  if (checkoutSeccion && carrito.length === 0) {
    checkoutSeccion.hidden = true;
  }
}

// Recupera el carrito guardado en localStorage
function cargarCarrito() {
  const datosGuardados = localStorage.getItem(STORAGE_KEY);

  if (!datosGuardados) {
    return [];
  }

  try {
    const datos = JSON.parse(datosGuardados);
    if (Array.isArray(datos)) {
      return datos;
    }
  } catch (error) {
    return [];
  }

  return [];
}

// Almacena el contenido del carrito en localStorage.
function guardarCarrito() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
}

// Limpia el carrito
function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  cuponActivo = false;
  actualizarVisualizacionCupon(0);
  ocultarMensajeCupon();
  renderizarCarrito();
}

// Suma una unidad del producto indicado y muestra el mensaje de toast.
function agregarProductoAlCarrito(idProducto) {
  const producto = catalogo[idProducto];

  if (!producto) {
    return;
  }

  let encontrado = false;

  for (let i = 0; i < carrito.length; i++) {
    if (carrito[i].id === idProducto) {
      carrito[i].cantidad = carrito[i].cantidad + 1;
      encontrado = true;
    }
  }

  if (!encontrado) {
    carrito.push({ id: idProducto, cantidad: 1 });
  }

  guardarCarrito();
  renderizarCarrito();
  mostrarToastCarrito(producto.nombre + ' agregado al carrito', 'agregado');
}

// Quita una unidad, no todos los productos de una y avisa al usuario
function eliminarProductoDelCarrito(idProducto) {
  const producto = catalogo[idProducto];
  let seElimino = false;
  let quedanUnidades = false;

  for (let i = 0; i < carrito.length; i++) {
    if (carrito[i].id !== idProducto) {
      continue;
    }

    if (carrito[i].cantidad > 1) {
      carrito[i].cantidad = carrito[i].cantidad - 1;
      quedanUnidades = true;
    } else {
      carrito.splice(i, 1);
    }

    seElimino = true;
    break;
  }

  if (!seElimino) {
    return;
  }

  guardarCarrito();
  renderizarCarrito();

  if (producto && producto.nombre) {
    if (quedanUnidades) {
      mostrarToastCarrito('Una unidad de ' + producto.nombre + ' eliminada del carrito', 'eliminado');
    } else {
      mostrarToastCarrito(producto.nombre + ' eliminado del carrito', 'eliminado');
    }
  } else if (quedanUnidades) {
    mostrarToastCarrito('Una unidad del producto eliminada del carrito', 'eliminado');
  } else {
    mostrarToastCarrito('Producto eliminado del carrito', 'eliminado');
  }
}

// Suma el precio total sin descuentos.
function calcularTotal() {
  let total = 0;

  for (let i = 0; i < carrito.length; i++) {
    const item = carrito[i];
    const producto = catalogo[item.id];

    if (!producto) {
      continue;
    }

    total = total + producto.precio * item.cantidad;
  }

  return total;
}

// Calculo de descuentos y actualización del total
function actualizarTotales() {
  const total = calcularTotal();
  totalElemento.textContent = total;

  if (!totalResumen) {
    return;
  }

  let totalConDescuento = total;

  const descuentoCupon = calcularDescuentoCupon(totalConDescuento);
  actualizarVisualizacionCupon(descuentoCupon);

  if (descuentoCupon > 0) {
    totalConDescuento = totalConDescuento - descuentoCupon;
  }

  let descuentoTransferencia = 0;

  if (medioPagoSelect && medioPagoSelect.value === 'transferencia') {
    descuentoTransferencia = totalConDescuento * 0.15;
  }

  if (descuentoElemento && descuentoValor) {
    if (descuentoTransferencia > 0) {
      descuentoElemento.hidden = false;
      descuentoValor.textContent = descuentoTransferencia.toFixed(2);
    } else {
      descuentoElemento.hidden = true;
      descuentoValor.textContent = '0';
    }
  }

  if (descuentoTransferencia > 0) {
    totalConDescuento = totalConDescuento - descuentoTransferencia;
  }

  if (totalConDescuento < 0) {
    totalConDescuento = 0;
  }

  totalResumen.textContent = totalConDescuento.toFixed(2);
}

// Actualiza el carrito
function renderizarCarrito() {
  listaCarrito.innerHTML = '';

  if (mensajeConfirmacion) {
    mensajeConfirmacion.hidden = true;
  }

  if (carrito.length === 0) {
    mensajeVacio.hidden = false;
    listaCarrito.hidden = true;
    totalElemento.textContent = '0';
    botonComprar.disabled = true;

    if (checkoutSeccion) {
      checkoutSeccion.hidden = true;
    }

    if (checkoutForm) {
      checkoutForm.reset();
    }

    actualizarTotales();
    return;
  }

  mensajeVacio.hidden = true;
  listaCarrito.hidden = false;

  for (let i = 0; i < carrito.length; i++) {
    const item = carrito[i];
    const producto = catalogo[item.id];

    if (!producto) {
      continue;
    }

    const elemento = document.createElement('li');
    elemento.className = 'carrito__item';

    const info = document.createElement('div');
    info.className = 'carrito__item-info';

    const nombre = document.createElement('span');
    nombre.className = 'carrito__item-nombre';
    nombre.textContent = producto.nombre;

    const cantidad = document.createElement('p');
    cantidad.className = 'carrito__item-cantidad';
    cantidad.textContent = 'Cantidad: ' + item.cantidad;

    const precio = document.createElement('p');
    precio.className = 'carrito__item-precio';
    precio.textContent = '$' + producto.precio * item.cantidad;

    info.appendChild(nombre);
    info.appendChild(cantidad);
    info.appendChild(precio);

    const eliminar = document.createElement('button');
    eliminar.type = 'button';
    eliminar.className = 'carrito__item-eliminar';
    eliminar.textContent = 'Eliminar';

    const idAEliminar = item.id;
    eliminar.addEventListener('click', function () {
      eliminarProductoDelCarrito(idAEliminar);
    });

    elemento.appendChild(info);
    elemento.appendChild(eliminar);

    listaCarrito.appendChild(elemento);
  }

  botonComprar.disabled = false;
  actualizarTotales();
}