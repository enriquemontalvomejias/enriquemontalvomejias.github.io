---
proyecto:
  resumen: >-
    Infraestructura en Proxmox segmentada en WAN, LAN y DMZ con pfSense y
    publicada con Cloudflare Tunnel. TFG junto a Álvaro García, calificado
    con un 9,15.
  icono: material/subway-variant
  contexto: TFG
  estado: Completado
  fechas: 2024–2025
  categorias: [Redes, Seguridad, Infraestructura]
  stack: [Proxmox VE, pfSense, Apache + PHP, MariaDB, Cloudflare Tunnel, Tailscale]
---

# MetroASIR: aplicación web sobre infraestructura segmentada

Aplicación web accesible sobre el Metro de Madrid, con cálculo de rutas óptimas y
filtro para personas con movilidad reducida, desplegada sobre una infraestructura
virtualizada y segmentada en tres zonas de red.

!!! info "Contexto"
    Trabajo de fin de ciclo del CFGS de Administración de Sistemas Informáticos en
    Red (IES Leonardo Da Vinci, curso 2024/2025), desarrollado junto a Álvaro García
    Ginarte y calificado con un 9,15. Unas 150 horas por persona, organizadas en
    Trello con reuniones semanales. La infraestructura era un entorno de laboratorio
    y ya no está en marcha.

---

## Qué resuelve

La información del Metro de Madrid está repartida entre la app oficial, Google Maps,
Moovit o Citymapper, y ninguna permite calcular una ruta que pase solo por
estaciones adaptadas. MetroASIR reúne mapas, horarios, tarifas y cálculo de
trayectos en una sola web, con la accesibilidad como eje:

- **Rutas óptimas** entre dos estaciones con el algoritmo de Dijkstra, a partir de
  los tiempos de trayecto guardados en la base de datos.
- **Filtro de accesibilidad**: al activarlo, los desplegables de origen y destino
  muestran solo estaciones adaptadas, y el cálculo descarta las que no lo son.
- **Mensajes claros** cuando no existe una ruta accesible, indicando si falla el
  origen, el destino o ambos.

La versión inicial trabaja con los datos de la línea 4.

---

## Arquitectura

<figure class="pf-diagram" markdown="0">
<div class="pf-diagram__scroll">
<svg viewBox="0 0 820 470" role="img" aria-labelledby="pf-metro-title pf-metro-desc">
<title id="pf-metro-title">Arquitectura de MetroASIR</title>
<desc id="pf-metro-desc">El usuario entra por HTTPS a Cloudflare, que llega al servidor web de la DMZ (172.16.12.0/24) por un túnel saliente de cloudflared, sin puertos abiertos. Todo corre en Proxmox VE en un portátil. El servidor web consulta MariaDB en la LAN (10.20.30.0/24) por el puerto 3306 a través de pfSense, que solo lo permite desde la IP del servidor web. El equipo de trabajo administra el host por VPN con Tailscale.</desc>
<defs>
<marker id="pf-arr-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-red"/></marker>
<marker id="pf-arr-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-cyan"/></marker>
<marker id="pf-arr-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-amber"/></marker>
<marker id="pf-arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-muted"/></marker>
</defs>
<rect x="300" y="20" width="504" height="410" rx="10" class="pf-d-zone pf-d-zone--esxi"/>
<text x="316" y="42" class="pf-d-zone-label">portátil · Proxmox VE</text>
<rect x="320" y="60" width="220" height="190" rx="8" class="pf-d-zone pf-d-zone--inner"/>
<text x="334" y="82" class="pf-d-zone-label">DMZ · 172.16.12.0/24</text>
<rect x="570" y="270" width="214" height="140" rx="8" class="pf-d-zone pf-d-zone--inner"/>
<text x="584" y="292" class="pf-d-zone-label">LAN · 10.20.30.0/24</text>
<path d="M78,100 H200" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<text x="139" y="90" text-anchor="middle" class="pf-d-edge-label pf-d-cyan">HTTPS</text>
<path d="M412,146 L242,105" class="pf-d-edge pf-d-edge--network" marker-end="url(#pf-arr-amber)"/>
<text x="330" y="110" text-anchor="middle" class="pf-d-edge-label pf-d-amber">túnel saliente</text>
<path d="M448,150 H660" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<text x="600" y="172" text-anchor="middle" class="pf-d-edge-label pf-d-cyan">MySQL 3306</text>
<path d="M680,170 V316" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<text x="668" y="216" text-anchor="end" class="pf-d-edge-label">solo desde</text>
<text x="668" y="232" text-anchor="end" class="pf-d-edge-label">la IP del web</text>
<path d="M108,340 H410" class="pf-d-edge pf-d-edge--muted pf-d-edge--dashed" marker-end="url(#pf-arr-muted)"/>
<text x="260" y="330" text-anchor="middle" class="pf-d-edge-label">VPN · Tailscale</text>
<circle r="3.5" class="pf-d-packet pf-d-fill-cyan"><animateMotion dur="3.6s" repeatCount="indefinite" path="M78,100 H200" keyPoints="0;1;1" keyTimes="0;.25;1" calcMode="linear"/></circle>
<circle r="3.5" class="pf-d-packet pf-d-fill-cyan"><animateMotion dur="3.6s" repeatCount="indefinite" path="M448,150 H680 V316" keyPoints="0;0;1;1" keyTimes="0;.35;.85;1" calcMode="linear"/></circle>
<g class="pf-d-node"><circle cx="60" cy="100" r="16" class="pf-d-halo pf-d-fill-muted"/><circle cx="60" cy="100" r="6" class="pf-d-core pf-d-stroke-muted"/>
<text x="60" y="135" text-anchor="middle" class="pf-d-name">usuario</text></g>
<g class="pf-d-node"><circle cx="220" cy="100" r="20" class="pf-d-halo pf-d-fill-amber"/><circle cx="220" cy="100" r="9" class="pf-d-core pf-d-cloud pf-d-stroke-amber"/>
<text x="220" y="135" text-anchor="middle" class="pf-d-name">cloudflare</text>
<text x="220" y="151" text-anchor="middle" class="pf-d-role">DNS + túnel</text></g>
<g class="pf-d-node"><circle cx="430" cy="150" r="18" class="pf-d-halo pf-d-fill-cyan"/><circle cx="430" cy="150" r="7" class="pf-d-core pf-d-stroke-cyan"/>
<text x="430" y="185" text-anchor="middle" class="pf-d-name">servidor web</text>
<text x="430" y="203" text-anchor="middle" class="pf-d-role">apache + php</text>
<text x="430" y="219" text-anchor="middle" class="pf-d-role">cloudflared</text></g>
<g class="pf-d-node"><circle cx="680" cy="150" r="18" class="pf-d-halo pf-d-fill-amber"/><rect x="672" y="142" width="16" height="16" transform="rotate(45 680 150)" class="pf-d-core pf-d-stroke-amber"/>
<text x="680" y="112" text-anchor="middle" class="pf-d-name">pfsense</text>
<text x="680" y="128" text-anchor="middle" class="pf-d-role">router y firewall</text></g>
<g class="pf-d-node"><circle cx="680" cy="340" r="18" class="pf-d-halo pf-d-fill-cyan"/><path d="M670,332 v16 a10,4 0 0 0 20,0 v-16" class="pf-d-core pf-d-stroke-cyan"/><ellipse cx="680" cy="332" rx="10" ry="4" class="pf-d-core pf-d-stroke-cyan"/>
<text x="680" y="375" text-anchor="middle" class="pf-d-name">mariadb</text>
<text x="680" y="391" text-anchor="middle" class="pf-d-role">sin exposición</text></g>
<g class="pf-d-node"><circle cx="430" cy="340" r="18" class="pf-d-halo pf-d-fill-muted"/><circle cx="430" cy="340" r="7" class="pf-d-core pf-d-stroke-muted"/>
<text x="430" y="375" text-anchor="middle" class="pf-d-name">host proxmox</text>
<text x="430" y="391" text-anchor="middle" class="pf-d-role">+ tailscale</text></g>
<g class="pf-d-node"><circle cx="90" cy="340" r="16" class="pf-d-halo pf-d-fill-muted"/><circle cx="90" cy="340" r="6" class="pf-d-core pf-d-stroke-muted"/>
<text x="90" y="375" text-anchor="middle" class="pf-d-name">equipo de trabajo</text>
<text x="90" y="391" text-anchor="middle" class="pf-d-role">+ tailscale</text></g>
<text x="130" y="200" class="pf-d-note">sin abrir puertos,</text>
<text x="130" y="218" class="pf-d-note">y tras CG-NAT</text>
<text x="20" y="424" class="pf-d-note">los dos, cada uno</text>
<text x="20" y="442" class="pf-d-note">desde su casa</text>
<text x="316" y="456" class="pf-d-note">arranque en orden: pfSense, base de datos y web</text>
</svg>
</div>
<figcaption>Lo único que se publica es la web, y sale por un túnel, no por un puerto abierto. La base de datos solo contesta al servidor web.</figcaption>
</figure>

| Zona | Rango | Función |
|---|---|---|
| WAN | 192.168.1.0/24 | Red de casa, salida a internet y administración |
| DMZ (OPT1) | 172.16.12.0/24 | Servidor web público: Apache, PHP y túnel de Cloudflare |
| LAN (GREEN) | 10.20.30.0/24 | Servidor de base de datos, sin exposición al exterior |

Todo corre sobre Proxmox VE 8.4 en un portátil con un i5 de 12.ª generación y
16 GB de RAM: una máquina virtual con pfSense y dos con Debian 12.

---

## Decisiones de diseño

**Segmentación en tres zonas.** pfSense separa la red de casa (WAN), la zona
pública (DMZ) y la interna (LAN). El servidor web es lo único que se publica, y la
base de datos solo acepta conexiones al puerto 3306 desde la IP del servidor web,
con una regla de firewall específica.

**Base de datos mínima.** Debian 12 en modo consola, sin entorno gráfico, para
reducir consumo y superficie de ataque. La aplicación usa un usuario propio con
permisos limitados en lugar del administrador.

**Publicación con Cloudflare Tunnel.** El dominio se delegó a los DNS de Cloudflare
y `cloudflared` corre como servicio en el servidor web. El túnel sale desde dentro
hacia Cloudflare, así que el sitio se publica con HTTPS sin abrir puertos en el
router ni gestionar certificados. Además, funciona aunque la conexión esté detrás
de CG-NAT.

**Acceso remoto con Tailscale.** VPN mesh sobre WireGuard instalada en el host de
Proxmox. Permitió que los dos trabajáramos sobre la misma infraestructura desde
casa, de nuevo sin abrir ningún puerto.

**Copias de seguridad.** Copias diarias programadas desde Proxmox de las tres
máquinas, en modo snapshot para no pararlas y con compresión zstd, a un disco
externo montado de forma permanente por UUID en `/etc/fstab`.

**Arranque ordenado.** Proxmox enciende primero pfSense (sin él no hay red),
después la base de datos y por último el servidor web, que depende de ella.

---

## La aplicación

Modelo cliente-servidor: el frontend en HTML, CSS y JavaScript habla con una API
en PHP mediante `fetch()`, con respuestas JSON y sin recargar la página.

| Fichero | Función |
|---|---|
| `conexion.php` | Conexión con MariaDB en la red LAN |
| `estaciones.php` | Lista de estaciones en JSON; con `?accesibles=si`, solo las adaptadas |
| `dijkstra.php` | Implementación del algoritmo de Dijkstra |
| `ruta_dijkstra.php` | Recibe origen, destino y filtro; construye el grafo y devuelve la ruta y el tiempo total |

Todas las consultas que llevan datos del usuario usan **consultas preparadas**, así
que la API no es vulnerable a inyección SQL.

---

## Con qué nos peleamos

**pfSense con una sola tarjeta de red.** La máquina virtual se crea con una
interfaz, y una segmentación WAN/LAN/DMZ necesita tres. Hubo que crear dos bridges
nuevos en Proxmox (`vmbr1` para la DMZ y `vmbr2` para la LAN) y conectar la máquina
a los tres con adaptadores virtio.

**La WAN bloqueaba redes privadas.** pfSense bloquea por defecto el tráfico de
rangos privados (RFC 1918) en la WAN, pensando en que la WAN sea internet. Aquí la
WAN era la red de casa, también privada, así que las zonas internas no salían hasta
desactivar ese bloqueo.

**Recursos justos.** Con 2 GB de RAM para el firewall, se eligió UFS en lugar de
ZFS al instalar pfSense. La monitorización de Proxmox sirvió para ajustar la
memoria de cada máquina a lo que de verdad necesitaba.

**Dos servicios en el mismo puerto.** Desde la red de casa, la interfaz web de
pfSense y el servidor web competían por el mismo puerto en la WAN. Se resolvió con
redirecciones de puertos distintas para cada uno.

**Un puerto 21 que no existía.** En un escaneo con Nmap desde Kali, el host de
Proxmox mostró el puerto 21 (FTP) abierto. `ss` y `lsof` confirmaron que no había
ningún servicio escuchando, y `nmap -sV` lo dejó en falso positivo, probablemente
por una respuesta ambigua del túnel VPN. Aun así se añadió una regla de denegación
explícita, y el puerto pasó a aparecer como filtrado. Lección: verificar antes de
dar un hallazgo por bueno, y cerrar igualmente lo que no tiene por qué responder.

---

## Qué cambiaría hoy

Mirándolo desde mi trabajo actual en seguridad:

- **Credenciales fuera del código.** La versión publicada en el repositorio lleva la
  contraseña de la base de datos escrita en el fichero de conexión y se conecta con
  el usuario administrador. Lo correcto es leerlas de variables de entorno, con un
  `.env` fuera del repositorio, y usar siempre el usuario limitado.
- **Mínimo privilegio de verdad.** El usuario de la aplicación tenía permisos de
  lectura y escritura, pero la aplicación solo consulta datos: bastaba con `SELECT`.
- **MariaDB escuchando solo donde debe.** Durante la configuración se puso
  `bind-address` en `0.0.0.0` de forma temporal. En producción iría fijado a la IP
  de la interfaz LAN.
- **Sin entorno gráfico en la DMZ.** El servidor web tenía XFCE por comodidad. En un
  servidor expuesto, cada paquete de más es superficie de ataque.

---

## Código

- [MetroASIR](https://github.com/enriquemontalvomejias/MetroASIR): versión original
  del TFG (API, base de datos y frontend).

