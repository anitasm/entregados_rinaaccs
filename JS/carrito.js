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
const mensajeConfirmacion = document.getElementById('carrito-confirmacion');
const carritoSeccion = document.getElementById('seccion-carrito');
const carritoBurbuja = document.querySelector('.carrito-burbuja');
const STORAGE_KEY = 'rinaaccs_carrito';
let carrito = [];
let catalogo = {};

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

if (listaCarrito && mensajeVacio && totalElemento && botonComprar) {
  suscribirseACatalogo();
  carrito = cargarCarrito();

  renderizarCarrito();
  prepararBotonBurbuja();
  prepararEventosDeCompra();
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


function prepararBotonBurbuja() {
  if (!carritoBurbuja || !carritoSeccion) {
    return;
  }

  carritoBurbuja.addEventListener('click', function () {
    carritoSeccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function prepararEventosDeCompra() {
  botonComprar.addEventListener('click', function () {
    if (!checkoutSeccion || carrito.length === 0) {
      return;
    }

    checkoutSeccion.hidden = false;

    if (mensajeConfirmacion) {
      mensajeConfirmacion.hidden = true;
    }

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

      if (mensajeConfirmacion) {
        mensajeConfirmacion.hidden = false;
      }

      checkoutForm.reset();
      actualizarTotales();
    });
  }
}


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

function guardarCarrito() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
}

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

function actualizarTotales() {
  const total = calcularTotal();
  totalElemento.textContent = total;

  if (!totalResumen) {
    return;
  }

  let descuento = 0;

  if (medioPagoSelect && medioPagoSelect.value === 'transferencia') {
    descuento = total * 0.15;
  }

  if (descuentoElemento && descuentoValor) {
    if (descuento > 0) {
      descuentoElemento.hidden = false;
      descuentoValor.textContent = descuento.toFixed(2);
    } else {
      descuentoElemento.hidden = true;
      descuentoValor.textContent = '0';
    }
  }

  let totalConDescuento = total;

  if (descuento > 0) {
    totalConDescuento = total - descuento;

    if (totalConDescuento < 0) {
      totalConDescuento = 0;
    }
  }

  totalResumen.textContent = totalConDescuento.toFixed(2);
}

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