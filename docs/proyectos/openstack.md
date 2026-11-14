---
description: >-
  Cloud privado IaaS con OpenStack en un solo nodo, desplegado con
  Kolla-Ansible sobre una VM anidada en ESXi.
proyecto:
  resumen: >-
    Nube privada IaaS en un solo nodo: ~30 servicios en contenedores con
    Kolla-Ansible sobre una VM anidada en ESXi, y una instancia con su IP
    privada y su IP flotante.
  icono: material/cloud-cog-outline
  contexto: Lab personal
  estado: En curso
  fechas: oct 2026
  categorias: [Cloud, Infraestructura]
  stack: [OpenStack, Kolla-Ansible, Ansible, Docker, Debian 12, VMware ESXi, KVM, Neutron, Keystone, Nova, Glance, Horizon]
---

# Cloud privado IaaS con OpenStack

Despliegue de un IaaS privado completo con OpenStack sobre una máquina virtual anidada, usando Kolla-Ansible: identidad, cómputo, red, imágenes y panel web, con una instancia corriendo y el modelo de IP flotante reproducido de principio a fin.

!!! note "Contexto"
    Laboratorio propio, montado en una tarde. La idea venía de lejos: en el CFGS de ASIR, un profesor desplegó un OpenStack que usábamos como cloud privado, y se me quedó la espina de montarlo yo. Corre sobre el mismo HP Z1 (i7-9700, 32 GB) que uso para el resto de labs, con ESXi por debajo. Es un entorno de aprendizaje, no un servicio en producción.

* * *

## Qué resuelve

OpenStack es el software con el que se montan nubes privadas tipo IaaS: pides una VM, una red o un disco por autoservicio y la plataforma los crea sola, con proyectos, usuarios y cuotas separados. Es, a grandes rasgos, lo que hay por debajo de un proveedor como Jotelulu o AWS.

El objetivo no era solo "instalarlo", sino **entender cada pieza**:

- **Desplegar el stack completo** (identidad, cómputo, red, imágenes, orquestación y panel) en un solo nodo.
- **Reproducir el modelo de un proveedor cloud**: lanzar una instancia, darle una IP privada y una IP flotante, y entender el NAT entre ambas.
- **Ver dónde está el límite del lab** frente a un proveedor real (IPs públicas, HA, seguridad), que es tan importante como hacerlo funcionar.

* * *

## Arquitectura

Todo el OpenStack corre dentro de una única VM Debian 12, anidada en el ESXi del HP Z1. La virtualización anidada es lo que permite que las instancias de la nube usen KVM real en lugar de emulación.

<figure class="pf-diagram" markdown="0">
<div class="pf-diagram__scroll">
<svg viewBox="0 0 820 462" role="img" aria-labelledby="pf-os-title pf-os-desc">
<title id="pf-os-title">Arquitectura del cloud privado con OpenStack</title>
<desc id="pf-os-desc">En el HP Z1 con VMware ESXi 9.1 corre una única VM Debian 12 con OpenStack all-in-one desplegado por Kolla-Ansible en unos 30 contenedores Docker: Horizon, Keystone, Glance, Nova y Neutron. Nova y Neutron levantan una instancia CirrOS con IP privada 10.0.0.x e IP flotante 10.0.2.x. Accedo desde mi PC por HTTPS y SSH.</desc>
<defs>
<marker id="pf-arr-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-red"/></marker>
<marker id="pf-arr-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-cyan"/></marker>
<marker id="pf-arr-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-amber"/></marker>
<marker id="pf-arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-muted"/></marker>
</defs>
<rect x="190" y="20" width="614" height="410" rx="10" class="pf-d-zone pf-d-zone--esxi"/>
<text x="206" y="42" class="pf-d-zone-label">HP Z1 · VMware ESXi 9.1</text>
<rect x="210" y="62" width="574" height="348" rx="8" class="pf-d-zone pf-d-zone--inner"/>
<text x="224" y="84" class="pf-d-zone-label">VM Debian 12 · OpenStack all-in-one</text>
<text x="224" y="102" class="pf-d-zone-sub">6 vCPU · 24 GB de RAM</text>
<rect x="240" y="150" width="520" height="130" rx="8" class="pf-d-zone pf-d-zone--home"/>
<text x="254" y="170" class="pf-d-zone-sub">servicios</text>
<path d="M108,225 H270" class="pf-d-edge pf-d-edge--muted" marker-end="url(#pf-arr-muted)"/>
<text x="180" y="215" text-anchor="middle" class="pf-d-edge-label">HTTPS / SSH</text>
<path d="M720,121 V148" class="pf-d-edge pf-d-edge--muted pf-d-edge--dashed" marker-end="url(#pf-arr-muted)"/>
<path d="M607,244 L634,331" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<path d="M708,244 L652,332" class="pf-d-edge pf-d-edge--network" marker-end="url(#pf-arr-amber)"/>
<text x="690" y="300" class="pf-d-edge-label pf-d-amber">IP flotante</text>
<circle r="3.5" class="pf-d-packet pf-d-fill-cyan"><animateMotion dur="3.4s" repeatCount="indefinite" path="M108,225 H270" keyPoints="0;1;1" keyTimes="0;.35;1" calcMode="linear"/></circle>
<circle r="3.5" class="pf-d-packet pf-d-fill-cyan"><animateMotion dur="3.4s" begin="1.2s" repeatCount="indefinite" path="M607,244 L634,331" keyPoints="0;1;1" keyTimes="0;.3;1" calcMode="linear"/></circle>
<g class="pf-d-node"><circle cx="90" cy="225" r="16" class="pf-d-halo pf-d-fill-muted"/><circle cx="90" cy="225" r="6" class="pf-d-core pf-d-stroke-muted"/>
<text x="90" y="260" text-anchor="middle" class="pf-d-name">mi PC</text>
<text x="90" y="276" text-anchor="middle" class="pf-d-role">navegador + SSH</text></g>
<g class="pf-d-node"><circle cx="720" cy="112" r="16" class="pf-d-halo pf-d-fill-muted"/><rect x="713" y="105" width="14" height="14" rx="2" class="pf-d-core pf-d-stroke-muted"/>
<text x="698" y="108" text-anchor="end" class="pf-d-name">kolla-ansible</text>
<text x="698" y="126" text-anchor="end" class="pf-d-role">~30 contenedores docker</text></g>
<g class="pf-d-node"><circle cx="290" cy="225" r="18" class="pf-d-halo pf-d-fill-cyan"/><circle cx="290" cy="225" r="7" class="pf-d-core pf-d-stroke-cyan"/>
<text x="290" y="198" text-anchor="middle" class="pf-d-name">horizon</text>
<text x="290" y="262" text-anchor="middle" class="pf-d-role">panel web</text></g>
<g class="pf-d-node"><circle cx="395" cy="225" r="18" class="pf-d-halo pf-d-fill-cyan"/><circle cx="395" cy="225" r="7" class="pf-d-core pf-d-stroke-cyan"/>
<text x="395" y="198" text-anchor="middle" class="pf-d-name">keystone</text>
<text x="395" y="262" text-anchor="middle" class="pf-d-role">identidad</text></g>
<g class="pf-d-node"><circle cx="500" cy="225" r="18" class="pf-d-halo pf-d-fill-cyan"/><circle cx="500" cy="225" r="7" class="pf-d-core pf-d-stroke-cyan"/>
<text x="500" y="198" text-anchor="middle" class="pf-d-name">glance</text>
<text x="500" y="262" text-anchor="middle" class="pf-d-role">imágenes</text></g>
<g class="pf-d-node"><circle cx="605" cy="225" r="18" class="pf-d-halo pf-d-fill-cyan"/><circle cx="605" cy="225" r="7" class="pf-d-core pf-d-stroke-cyan"/>
<text x="605" y="198" text-anchor="middle" class="pf-d-name">nova</text>
<text x="605" y="262" text-anchor="middle" class="pf-d-role">cómputo · KVM</text></g>
<g class="pf-d-node"><circle cx="710" cy="225" r="18" class="pf-d-halo pf-d-fill-amber"/><circle cx="710" cy="225" r="7" class="pf-d-core pf-d-stroke-amber"/>
<text x="710" y="198" text-anchor="middle" class="pf-d-name">neutron</text>
<text x="710" y="262" text-anchor="middle" class="pf-d-role">red</text></g>
<g class="pf-d-node"><circle cx="642" cy="350" r="20" class="pf-d-halo pf-d-fill-cyan"/><circle cx="642" cy="350" r="11" class="pf-d-ring pf-d-stroke-cyan"/><circle cx="642" cy="350" r="5" class="pf-d-fill-cyan"/>
<text x="616" y="346" text-anchor="end" class="pf-d-name">instancia cirros</text>
<text x="616" y="364" text-anchor="end" class="pf-d-role">privada 10.0.0.x</text>
<text x="616" y="380" text-anchor="end" class="pf-d-role">flotante 10.0.2.x</text></g>
<text x="232" y="310" class="pf-d-note">~13 GB de RAM solo</text>
<text x="232" y="328" class="pf-d-note">para estar encendido</text>
<text x="232" y="372" class="pf-d-note">la flotante parece pública,</text>
<text x="232" y="390" class="pf-d-note">pero no lo es</text>
<text x="206" y="448" class="pf-d-note">montado en una tarde, con la espina del ciclo clavada</text>
</svg>
</div>
<figcaption>Todo OpenStack vive dentro de una sola VM. Las instancias corren con KVM de verdad gracias a la virtualización anidada.</figcaption>
</figure>

| Interfaz / red        | Valor              | Función                                                      |
|-----------------------|--------------------|--------------------------------------------------------------|
| Gestión (`ens192`)    | 192.168.1.190      | APIs, acceso a Horizon y salida a internet de la VM          |
| Externa (`ens224`)    | sin IP             | Red externa de Neutron: aquí viven las IPs flotantes         |
| VIP interna           | 192.168.1.250      | IP virtual del balanceador (HAProxy + keepalived), = Horizon |
| Red interna de la VM  | 10.0.0.0/24        | `demo-net`: IP privada de las instancias                     |
| Red flotante          | 10.0.2.0/24        | `public1`: IP flotante (la "pública" dentro del lab)         |

La VM se dimensionó con 6 vCPU, 24 GB de RAM y 120 GB de disco. En reposo, OpenStack consume unos 13 GB de RAM solo en mantener sus contenedores vivos.

* * *

## Decisiones de diseño

**Kolla-Ansible, no Sunbeam ni DevStack.** De las tres vías para montar OpenStack, elegí Kolla-Ansible: despliega cada servicio en un contenedor Docker usando Ansible, soporta Debian 12 de forma oficial y, al configurar la red y los servicios a mano, se entiende mucho mejor qué hace cada pieza. Sunbeam (de Canonical) era la vía rápida pero es un snap atado a Ubuntu; DevStack está pensado para desarrollar OpenStack, no para tener un entorno estable.

**Anidado sobre ESXi, no sobre el metal.** Como ya administro VMware en el trabajo y el HP Z1 tenía ESXi, monté OpenStack en una VM anidada en lugar de dedicar la máquina. Reproduce un escenario realista (empresas migrando desde VMware) y me deja el host para otros labs. El coste es activar la virtualización anidada y tener cuidado con la red.

**Las dos interfaces de red.** OpenStack necesita dos: una de gestión con IP, y una "externa" **sin IP**, que es la que Neutron usa para las IPs flotantes. Olvidar que la segunda va sin dirección es el error clásico.

**El port group de la red externa, en modo promiscuo.** En el vSwitch de ESXi, la red externa necesita modo promiscuo, cambios de MAC y transmisiones falsificadas en "Aceptar". Es justo lo contrario de lo seguro en producción, pero obligatorio en el lab: las instancias usan MACs que el vSwitch no conoce, y sin esto descarta su tráfico y las IPs flotantes no funcionan aunque todo parezca bien.

**Entorno virtual de Python para Kolla.** Instalé Ansible y Kolla-Ansible en un `venv`, no en el Python del sistema, para no pisar los paquetes de Debian. A cambio, algunas dependencias que el bootstrap instala a nivel de sistema hubo que añadirlas al venv a mano.

* * *

## Con qué me peleé

**Dependencias que faltaban en el venv.** Los `prechecks` fueron destapando una a una librerías que no estaban en el entorno virtual: primero el SDK de Docker para Python (`pip install docker`), después `dbus-python`, que no instala solo con pip porque necesita librerías de compilación del sistema (`libdbus-1-dev`, `libglib2.0-dev`, `pkg-config`). Relanzar los prechecks tras cada arreglo es el flujo correcto: no pasar al deploy hasta tener `failed=0`.

**sudo no estaba instalado.** Al poner contraseña de root durante la instalación de Debian, sudo no se instala y el usuario no queda en el grupo. Hubo que instalarlo y añadir el usuario (`usermod -aG sudo`) antes de que Kolla pudiera trabajar.

**El `-i ./all-in-one` en todos los comandos.** El `post-deploy` falló por buscar el inventario en una ruta por defecto que no existe. Kolla necesita que le pases el inventario con `-i` en cada comando, no solo en el deploy.

**La VM no sale a internet, y es correcto.** La instancia arranca y tiene su IP interna, pero no tiene salida a internet. No es un fallo: la red externa (`public1`) vive en un port group aislado del ESXi, sin un router real hacia mi LAN. Para que saliera habría que enrutar esa red hacia casa, que para el lab ni hace falta ni conviene.

* * *

## Qué cambiaría hoy

- **La IP de gestión, fija.** `ens192` coge IP por DHCP (acabó en .190). Si el router se la cambia, rompe el despliegue, porque la VIP y las APIs dependen de ella. En un montaje serio iría con IP estática desde el principio.
- **Trabajar con usuario, no como root.** Monté buena parte como root por rapidez. Lo correcto es el usuario normal con sudo; el `venv` quedó en `/opt` para que cualquier usuario lo active.
- **Salida a internet de las instancias.** El siguiente paso natural es enrutar la red externa para que las VMs salgan de verdad, que es donde se aprende el networking de Neutron en serio.
- **Multi-tenant.** Separar dos proyectos como si fueran dos clientes (usuario, cuota, red y router propios) y demostrar el aislamiento entre ellos. Es lo que convierte "monté OpenStack" en "monté un proveedor cloud en pequeño".

!!! warning "Dónde está el límite"
    La IP flotante del lab (10.0.2.x) se comporta como una pública, pero no lo es: es una dirección privada y aislada. En un proveedor real, esa flotante saldría de un bloque de IPs públicas enrutables, con el mismo mecanismo de NAT que aquí. La diferencia con un Jotelulu no es el software, es el bloque de IPs públicas, la alta disponibilidad, la seguridad endurecida y la operación 24/7. El lab reproduce el **mecanismo**, no el servicio.

