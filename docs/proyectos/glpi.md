---
proyecto:
  resumen: >-
    Plataforma de inventario para una veintena de organizaciones cliente y
    unos 600 endpoints. Despliegue por GPO e Intune.
  icono: material/database-search
  contexto: Trabajo
  estado: Completado
  fechas: 2025–2026
  categorias: [Infraestructura]
  stack: [GLPI 11, MariaDB, Apache, Let's Encrypt, GPO, Intune]
---

# Inventario de activos multi-tenant con GLPI

Diseño y despliegue de una plataforma de inventario de activos IT para una veintena
de organizaciones cliente y unos 600 endpoints, sustituyendo el mantenimiento manual
en hojas de cálculo.

!!! info "Contexto"
    Proyecto realizado en un proveedor de servicios gestionados (MSP) que da soporte
    a clientes de distintos sectores. Los nombres de cliente, dominios internos y
    direccionamiento se han omitido u ofuscado.

---

## La solución de negocio

Un MSP con una veintena de clientes bajo contrato de mantenimiento necesita responder
a preguntas que parecen triviales y no lo son cuando el dato vive en hojas de cálculo
mantenidas a mano: cuántos equipos tiene realmente cada cliente, cuáles se quedan sin
soporte el año que viene, qué máquina tiene asignada una persona concreta, o qué
equipos llevan meses sin conectarse.

La plataforma resuelve eso con un inventario que se actualiza solo. Cada endpoint
reporta su propio hardware, software y estado, y el dato aterriza en la entidad del
cliente al que pertenece. A partir de ahí:

- **Renovaciones y presupuestos** con datos reales de parque, no estimaciones.
- **Obsolescencia** detectable por antigüedad y por versión de sistema operativo.
- **Trazabilidad de asignación**: quién tiene qué equipo, y en qué estado está.
- **Aislamiento entre clientes**: cada entidad ve su propio parque y nada más.

El alcance se acotó deliberadamente a inventario. El ticketing ya estaba resuelto con
otra herramienta y meter ambas cosas en el mismo sistema habría convertido un proyecto
de tres meses en uno de un año.

---

## Arquitectura

<figure class="pf-diagram" markdown="0">
<div class="pf-diagram__scroll">
<svg viewBox="0 0 820 430" role="img" aria-labelledby="pf-glpi-title pf-glpi-desc">
<title id="pf-glpi-title">Arquitectura del inventario con GLPI</title>
<desc id="pf-glpi-desc">Los equipos de unos veinte clientes, en dominio y fuera de dominio, mandan su inventario XML a un Apache con TLS de Let's Encrypt delante de GLPI 11 y MariaDB, en una VM Debian 12 en cloud. GLPI coloca cada equipo en la entidad de su cliente mediante reglas de asignación.</desc>
<defs>
<marker id="pf-arr-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-red"/></marker>
<marker id="pf-arr-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-cyan"/></marker>
<marker id="pf-arr-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-amber"/></marker>
<marker id="pf-arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-muted"/></marker>
</defs>
<rect x="16" y="20" width="250" height="390" rx="8" class="pf-d-zone pf-d-zone--home"/>
<text x="30" y="42" class="pf-d-zone-label">parque de clientes</text>
<text x="30" y="60" class="pf-d-zone-sub">~20 orgs · ~600 endpoints</text>
<rect x="370" y="20" width="434" height="330" rx="10" class="pf-d-zone pf-d-zone--esxi"/>
<text x="384" y="42" class="pf-d-zone-label">VM Debian 12 · cloud</text>
<text x="384" y="60" class="pf-d-zone-sub">solo el equipo técnico</text>
<path d="M250,124 L420,164" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<path d="M250,210 L419,172" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<path d="M250,296 L421,182" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<text x="306" y="104" text-anchor="middle" class="pf-d-edge-label pf-d-cyan">inventario XML</text>
<path d="M458,170 H570" class="pf-d-edge pf-d-edge--muted" marker-end="url(#pf-arr-muted)"/>
<path d="M608,170 H718" class="pf-d-edge pf-d-edge--muted" marker-end="url(#pf-arr-muted)"/>
<path d="M590,188 V260" class="pf-d-edge pf-d-edge--network" marker-end="url(#pf-arr-amber)"/>
<text x="602" y="230" class="pf-d-edge-label pf-d-amber">reglas de asignación</text>
<circle r="3.5" class="pf-d-packet pf-d-fill-cyan"><animateMotion dur="3.4s" repeatCount="indefinite" path="M250,124 L420,164" keyPoints="0;1;1" keyTimes="0;.35;1" calcMode="linear"/></circle>
<circle r="3.5" class="pf-d-packet pf-d-fill-cyan"><animateMotion dur="3.4s" begin="1.2s" repeatCount="indefinite" path="M250,296 L421,182" keyPoints="0;1;1" keyTimes="0;.35;1" calcMode="linear"/></circle>
<circle r="3.5" class="pf-d-packet pf-d-fill-amber"><animateMotion dur="3.4s" repeatCount="indefinite" path="M590,188 V260" keyPoints="0;0;1;1" keyTimes="0;.45;.75;1" calcMode="linear"/></circle>
<g class="pf-d-node"><circle cx="232" cy="120" r="16" class="pf-d-halo pf-d-fill-cyan"/><circle cx="232" cy="120" r="6" class="pf-d-core pf-d-stroke-cyan"/>
<text x="208" y="116" text-anchor="end" class="pf-d-name">cliente A</text>
<text x="208" y="134" text-anchor="end" class="pf-d-role">dominio · GPO</text></g>
<g class="pf-d-node"><circle cx="232" cy="210" r="16" class="pf-d-halo pf-d-fill-cyan"/><circle cx="232" cy="210" r="6" class="pf-d-core pf-d-stroke-cyan"/>
<text x="208" y="206" text-anchor="end" class="pf-d-name">cliente B</text>
<text x="208" y="224" text-anchor="end" class="pf-d-role">Intune</text></g>
<g class="pf-d-node"><circle cx="232" cy="300" r="16" class="pf-d-halo pf-d-fill-muted"/><circle cx="232" cy="300" r="6" class="pf-d-core pf-d-stroke-muted"/>
<text x="208" y="296" text-anchor="end" class="pf-d-name">fuera de dominio</text>
<text x="208" y="314" text-anchor="end" class="pf-d-role">TAG en el registro</text></g>
<g class="pf-d-node"><circle cx="440" cy="170" r="18" class="pf-d-halo pf-d-fill-cyan"/><circle cx="440" cy="170" r="7" class="pf-d-core pf-d-stroke-cyan"/>
<text x="440" y="120" text-anchor="middle" class="pf-d-name">apache + tls</text>
<text x="440" y="138" text-anchor="middle" class="pf-d-role">Let's Encrypt</text></g>
<g class="pf-d-node"><circle cx="590" cy="170" r="20" class="pf-d-halo pf-d-fill-cyan"/><circle cx="590" cy="170" r="11" class="pf-d-ring pf-d-stroke-cyan"/><circle cx="590" cy="170" r="5" class="pf-d-fill-cyan"/>
<text x="590" y="120" text-anchor="middle" class="pf-d-name">glpi 11</text>
<text x="590" y="138" text-anchor="middle" class="pf-d-role">inventario</text></g>
<g class="pf-d-node"><circle cx="740" cy="170" r="18" class="pf-d-halo pf-d-fill-cyan"/><path d="M730,162 v16 a10,4 0 0 0 20,0 v-16" class="pf-d-core pf-d-stroke-cyan"/><ellipse cx="740" cy="162" rx="10" ry="4" class="pf-d-core pf-d-stroke-cyan"/>
<text x="740" y="120" text-anchor="middle" class="pf-d-name">mariadb</text>
<text x="740" y="138" text-anchor="middle" class="pf-d-role">backend</text></g>
<g class="pf-d-node"><circle cx="590" cy="280" r="16" class="pf-d-halo pf-d-fill-amber"/><rect x="583" y="273" width="14" height="14" rx="2" class="pf-d-core pf-d-stroke-amber"/>
<text x="612" y="276" class="pf-d-name">entidades</text>
<text x="612" y="294" class="pf-d-role">una por cliente</text></g>
<text x="612" y="330" class="pf-d-note">cada uno ve lo suyo</text>
<text x="30" y="360" class="pf-d-note">el TAG solo no asigna:</text>
<text x="30" y="378" class="pf-d-note">hacen falta reglas</text>
<text x="384" y="390" class="pf-d-note">puerto no estándar: lo que</text>
<text x="384" y="408" class="pf-d-note">más guerra dio con los proxies</text>
</svg>
</div>
<figcaption>Cada equipo manda su inventario solo y GLPI lo coloca en su cliente sin que nadie lo mueva a mano.</figcaption>
</figure>

**Servidor.** GLPI 11 sobre una máquina virtual Debian 12 en un proveedor
cloud (Plenit, antes Jotelulu), con Apache como frontal y MariaDB como backend.
El certificado de Let's Encrypt, emitido por desafío DNS-01, sustituyó a uno
autofirmado: con él, los agentes validan la cadena de confianza completa sin
excepciones ni opciones para saltarse la verificación SSL.

**Publicación.** El servicio se publica en un puerto no estándar. Esta decisión, que
parecía menor, resultó ser el punto más conflictivo del proyecto: los clientes cuyo
tráfico sale por un proxy corporativo o por una solución SASE no siempre tienen
permitidos puertos distintos del 443 hacia destinos externos, y el agente falla en
silencio. En despliegues nuevos conviene resolver el NAT al 443 antes de tocar
ningún endpoint.

**Multi-tenancy.** GLPI organiza los datos en entidades. Cada cliente es una entidad,
y los técnicos ven el conjunto mientras que cada contexto de cliente queda separado.
El acceso está limitado al equipo técnico; la integración con LDAP y el SSO se
aplazaron conscientemente por ser tres personas.

---

## Asignación automática a entidades

Es la pieza que hace que el sistema escale: si cada equipo nuevo hubiera que moverlo
a mano a su cliente, el inventario automático no valdría de nada.

**Equipos en dominio.** Las reglas de asignación se basan en la pertenencia al dominio
de Active Directory. El equipo reporta su dominio en el inventario y GLPI lo encamina
a la entidad correspondiente.

**Equipos fuera de dominio.** Para máquinas de reserva o equipos sueltos que no están
unidos a ningún dominio, la identificación se hace por TAG, escrito en el registro de
Windows:

```powershell
Set-ItemProperty -Path 'HKLM:\SOFTWARE\GLPI-Agent' -Name 'tag' -Value 'CLIENTE_X'
Restart-Service 'GLPI-Agent'
```

Un matiz importante que descubrí probando: el TAG identifica el contexto en el XML de
inventario, pero **no asigna la entidad por sí solo**. Hacen falta reglas explícitas en
*Administración > Reglas > Reglas de asignación a una entidad* que lo consuman. Sin
ellas, el TAG viaja hasta el servidor y no hace nada.

---

## Despliegue del agente

Tres vías según el tipo de equipo, todas sobre GLPI Agent 1.18 x64.

=== "GPO"

    Despliegue principal, para clientes con Active Directory. Desde los
    controladores de dominio de cada cliente se aplica una directiva que, 30
    minutos después del inicio de sesión, ejecuta un script de PowerShell
    desde SYSVOL. El script instala el MSI del agente con la etiqueta de
    inventario de ese cliente y lanza el primer inventario. Es idempotente:
    si el agente ya está bien configurado, no reinstala nada. Cada cliente
    tiene su propia directiva y su propia etiqueta.

=== "Intune"

    Para los clientes gestionados desde Intune. El MSI y el script se
    empaquetan juntos como `.intunewin` con IntuneWinAppUtil y se publican
    como aplicación Win32. La regla de detección apunta a
    `HKLM\SOFTWARE\GLPI-Agent`, valor `server`: comprueba que el agente
    está configurado, no solo instalado.

=== "Manual"

    Para equipos sueltos, pruebas o máquinas que no encajan en ninguna de las dos
    anteriores. Un script de PowerShell propio instala el MSI, escribe la
    configuración y fuerza un inventario inmediato para validar el resultado sin
    esperar al ciclo normal del agente.

En el despliegue por Intune, el código de retorno **1618** está configurado como
reintento. Ese código significa que otro instalador tiene tomado el mutex de Windows
Installer, típicamente Windows Update. A escala de cientos de equipos aparece sí o sí,
y si no se trata como reintento se interpreta como fallo de despliegue.

---

## Con qué me peleé

**La configuración no está donde la documentación sugiere.** En GLPI Agent 1.18 sobre
Windows, los valores de servidor y TAG viven en el registro
(`HKLM:\SOFTWARE\GLPI-Agent`), no en `agent.cfg`. Editar el fichero no produce ningún
efecto. Cualquier corrección pasa por `Set-ItemProperty` y reinicio del servicio.

**Forzar un inventario.** La forma fiable no es invocar el ejecutable del agente, sino
el endpoint HTTP que el propio agente expone en local:

```powershell
Invoke-RestMethod 'http://localhost:62354/now'
```

Esto acortó los ciclos de prueba de horas a segundos.

**Cambiar un TAG no reescribe el pasado.** Si una máquina ya se importó en la entidad
equivocada, corregir el TAG arregla los inventarios futuros pero no reevalúa las reglas
sobre el registro ya existente. Hay que transferir el activo a mano o purgarlo. Lección:
validar las reglas de asignación contra un grupo pequeño antes de soltar el despliegue
masivo.

**El agente pisa lo que escribes a mano.** El inventario sobrescribe campos como el
usuario asignado en cada sincronización. La solución es el bloqueo de campos en GLPI,
que marca ciertos valores como gestionados manualmente y los protege del agente.

**Definir el catálogo de estados antes, no después.** Establecer los estados posibles
(en stock, cedido temporal, en uso, retirado) antes del despliegue masivo evita una
limpieza retroactiva sobre cientos de registros.

**Hairpin NAT.** Verificar la publicación con `curl` desde el propio servidor da
resultados engañosos. La comprobación válida se hace desde una máquina externa o desde
la red del cliente.

**Detalle de PowerShell.** `$args` es una variable automática reservada; usarla como
nombre para los parámetros del MSI provoca comportamientos difíciles de diagnosticar.

---

## Estado y siguientes pasos

La plataforma está en producción con el parque inventariado y las entidades asignadas
automáticamente. La hoja de ruta inmediata, por orden de prioridad:

1. **Copias de seguridad de la base de datos.**
2. **Ajuste de rendimiento**: OPcache al 100% de uso con 128 MB, a subir a 256 MB;
   revisión de `innodb_buffer_pool_size` en MariaDB.
3. **Inyección de datos históricos por número de serie** desde las hojas de cálculo
   originales, mediante el plugin Data Injection.
4. **Cuadros de mando e informes de obsolescencia por entidad.**

Aplazado de forma consciente: descubrimiento de red por SNMP, inventario de
hipervisores, LDAP por entidad, cumplimiento de licencias y despliegue del agente en
macOS a escala.
