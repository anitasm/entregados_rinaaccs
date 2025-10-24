// El array que estaba acá ahora está en fomato json, en el archivo catalogo.json
const listaPulseras = document.getElementById("pulseras");
const listaCollares = document.getElementById("collares");

const inventarioProductos = [];

// Catalogo remoto de productos.
const URL_CATALOGO = "../json/catalogo.json";
const RETARDO_CARGA = 300; // Simula retardo de red en ms, que se inicializa más abajo.

// Card reutilizable que se abre cuando se pide más información.
const cardProducto = crearCardProducto();

// Se inicia la carga del catálogo.
inicializarProductos();
function inicializarProductos() {
  if (!listaPulseras || !listaCollares) {
    return;
  }

  // Simula retardo y luego trae y publica los productos.
  setTimeout(() => {
    cargarCatalogo()
      .then((catalogo) => {
        poblarCatalogo(catalogo);
        compartirCatalogoConCarrito(catalogo);
      })
      .catch((error) => {
        console.error("No fue posible obtener el catálogo", error);
        mostrarMensajeDeError();
      });
  }, RETARDO_CARGA);
}

// Descarga el archivo JSON del catálogo y lo valida.
async function cargarCatalogo() {
  const respuesta = await fetch(URL_CATALOGO, { cache: "no-cache" });

  if (!respuesta.ok) {
    throw new Error("Respuesta inesperada del servidor: " + respuesta.status);
  }

  const datos = await respuesta.json();
  return normalizarCatalogo(datos);
}

// Asegura que el objeto de productos siempre tenga los arreglos esperados.
function normalizarCatalogo(datos) {
  const resultado = {
    pulseras: Array.isArray(datos?.pulseras) ? datos.pulseras : [],
    collares: Array.isArray(datos?.collares) ? datos.collares : []
  };

  return resultado;
}

// Limpia las listas y crea las tarjetas visibles para cada producto.
function poblarCatalogo(catalogo) {
  limpiarLista(listaPulseras);
  limpiarLista(listaCollares);
  inventarioProductos.length = 0;

  for (let i = 0; i < catalogo.pulseras.length; i++) {
    crearTarjetaProducto(catalogo.pulseras[i], listaPulseras);
  }

  for (let j = 0; j < catalogo.collares.length; j++) {
    crearTarjetaProducto(catalogo.collares[j], listaCollares);
  }
}

// Quita los elementos previos de la lista.
function limpiarLista(lista) {
  if (lista) {
    lista.innerHTML = "";
  }
}

// Arma un índice por id de los productos.
function compartirCatalogoConCarrito(catalogo) {
  const mapa = {};

  for (let i = 0; i < catalogo.pulseras.length; i++) {
    mapa[catalogo.pulseras[i].id] = catalogo.pulseras[i];
  }

  for (let j = 0; j < catalogo.collares.length; j++) {
    mapa[catalogo.collares[j].id] = catalogo.collares[j];
  }

  let catalogoDatos = mapa;

  const evento = new CustomEvent("catalogoCargado", {
    detail: {
      productos: mapa
    }
  });

  document.dispatchEvent(evento);
}

// Muestra una alerta visual si la carga falla.
function mostrarMensajeDeError() {
  const mensaje = document.createElement("li");
  mensaje.className = "producto__mensaje-error";
  mensaje.textContent = "No pudimos cargar los productos. Por favor, recargá la página.";

  if (listaPulseras) {
    listaPulseras.appendChild(mensaje.cloneNode(true));
  }

  if (listaCollares) {
    listaCollares.appendChild(mensaje);
  }
}

function crearCardProducto() {
  const overlay = document.createElement("div");
  overlay.id = "card-producto";
  overlay.className = "card-producto";

  const contenido = document.createElement("div");
  contenido.className = "card-producto__contenido";

  const botonCerrar = document.createElement("button");
  botonCerrar.type = "button";
  botonCerrar.textContent = "✕";
  botonCerrar.setAttribute("aria-label", "Cerrar");
  botonCerrar.className = "card-producto__cerrar";

  const contenedorImagen = document.createElement("div");
  contenedorImagen.className = "card-producto__media";

  const imagen = document.createElement("img");
  imagen.alt = "";
  imagen.className = "card-producto__imagen";

  contenedorImagen.appendChild(imagen);

  const contenedorTexto = document.createElement("div");
  contenedorTexto.className = "card-producto__detalle";

  const titulo = document.createElement("h3");
  titulo.className = "card-producto__titulo";

  const descripcion = document.createElement("p");
  descripcion.className = "card-producto__descripcion";

  const precio = document.createElement("p");
  precio.className = "card-producto__precio";

  const botonCarrito = document.createElement("button");
  botonCarrito.type = "button";
  botonCarrito.textContent = "Agregar al carrito";
  botonCarrito.className = "card-producto__boton";

  contenedorTexto.appendChild(titulo);
  contenedorTexto.appendChild(descripcion);
  contenedorTexto.appendChild(precio);
  contenedorTexto.appendChild(botonCarrito);

  contenido.appendChild(botonCerrar);
  contenido.appendChild(contenedorImagen);
  contenido.appendChild(contenedorTexto);

  overlay.appendChild(contenido);

  botonCerrar.addEventListener("click", function () {
    overlay.classList.remove("is-active");
  });

 // Cierra el contenido si se hace clic fuera del contenido.
  overlay.addEventListener("click", function (evento) {
    if (evento.target === overlay) {
      overlay.classList.remove("is-active");
    }
  });

  document.body.appendChild(overlay);

  return {
    overlay: overlay,
    imagen: imagen,
    titulo: titulo,
    descripcion: descripcion,
    precio: precio,
    botonCarrito: botonCarrito
  };
}

// Completa y muestra el modal o la tarjeta con la información extendida.
function mostrarCardProducto(producto) {
  cardProducto.imagen.src = producto.imagen;
  cardProducto.imagen.alt = producto.nombre + " ampliado";
  cardProducto.titulo.textContent = producto.nombre;
  cardProducto.descripcion.textContent =
    producto.descripcionDetallada || "Espacio para información detallada del producto.";
  cardProducto.precio.textContent = "Precio: $" + producto.precio;
  cardProducto.botonCarrito.textContent = "Agregar al carrito";
  cardProducto.botonCarrito.onclick = function () {
    agregarProductoAlCarrito(producto.id);
    cardProducto.overlay.classList.remove("is-active");
  };
  cardProducto.overlay.classList.add("is-active");
}

// Construye cada item del catálogo con imagen, datos y acciones.
function crearTarjetaProducto(producto, listaDestino) {
  if (!listaDestino) {
    return;
  }

  inventarioProductos.push({
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio
  });

  const item = document.createElement("li");
  item.id = producto.id;

  const imagen = document.createElement("img");
  imagen.src = producto.imagen;
  imagen.alt = producto.nombre;

  const titulo = document.createElement("h4");
  titulo.textContent = producto.nombre;

  const descripcion = document.createElement("p");
  descripcion.textContent = producto.descripcionCorta;

  const precio = document.createElement("p");
  precio.textContent = "Precio: $" + producto.precio;

  const botonInfo = document.createElement("button");
  botonInfo.type = "button";
  botonInfo.textContent = "Más información";
  botonInfo.className = "boton-producto boton-producto--info";

  botonInfo.addEventListener("click", function () {
    mostrarCardProducto(producto);
  });

  const botonAgregar = document.createElement("button");
  botonAgregar.type = "button";
  botonAgregar.textContent = "Agregar al carrito";
  botonAgregar.className = "boton-producto boton-producto--carrito";

  botonAgregar.addEventListener("click", function () {
    agregarProductoAlCarrito(producto.id);
  });

  item.appendChild(imagen);
  item.appendChild(titulo);
  item.appendChild(descripcion);
  item.appendChild(precio);
  item.appendChild(botonInfo);
  item.appendChild(botonAgregar);

  listaDestino.appendChild(item);
}

// for (let i = 0; i < datosPulseras.length; i++) {
//   crearTarjetaProducto(datosPulseras[i], listaPulseras);
// }

// for (let j = 0; j < datosCollares.length; j++) {
//   crearTarjetaProducto(datosCollares[j], listaCollares);
// }