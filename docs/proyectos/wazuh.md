---
description: >-
  Lab de purple team: ataques desde Kali a un dominio Active Directory aislado
  y su detección en Wazuh con Sysmon y Suricata.
proyecto:
  resumen: >-
    Lab de ataque y detección sobre un dominio Active Directory aislado: desde
    Kali lanzo las técnicas y Wazuh las caza correlacionando Sysmon en los
    endpoints con las alertas de red de un Suricata en pfSense. Con decoder y
    reglas propios.
  icono: material/radar
  contexto: Lab personal
  estado: En curso
  fechas: oct–nov 2026
  categorias: [Seguridad, Infraestructura]
  stack: [Wazuh, Suricata, pfSense, Sysmon, Active Directory, Kali Linux, VMware ESXi, Windows Server 2019, nmap]
---

# Lab de purple team con Wazuh

Un dominio de Active Directory que monto para atacarlo y para detectarlo. Desde
una Kali lanzo técnicas contra el controlador de dominio y, al otro lado, un
Wazuh recoge la telemetría de los Windows (Sysmon) y las alertas de red de un
Suricata en pfSense. Cada ejercicio sigue el mismo guion: lanzo la técnica, miro
qué deja en el SIEM (o qué no deja) y escribo o ajusto la regla que la caza.

!!! note "Contexto"
    Laboratorio propio, en marcha desde octubre de 2026, sobre el mismo HP Z1
    (i7-9700, 32 GB) con VMware ESXi que uso para el resto de labs. Todo
    on-premise y en una red aislada. Es un entorno de práctica para el lado de
    detección (SOC) y para el máster de ciberseguridad, no un servicio real. En
    el trabajo opero un Wazuh distribuido en dos nodos; este es su hermano
    pequeño.

---

## Qué resuelve

En el trabajo veo la defensa, pero casi nunca el ataque que la pone a prueba.
Aquí hago las dos cosas: lanzo la técnica, miro si Wazuh se entera y, si no se
entera, escribo la regla hasta que lo haga. A eso le llamo *purple team*.

Lo que busco es poder decir algo más que "sé usar Wazuh": qué técnicas dejan
rastro, cuáles pasan sin hacer ruido y qué regla escribí para verlas. Para el
puesto al que quiero llegar, un SOC, eso pesa más que cualquier despliegue.

---

## Arquitectura

Todo corre en el ESXi del HP Z1. Lo que más me importaba al diseñarlo era que la
red del lab estuviera **aislada**: quiero lanzar técnicas de verdad sin que nada
toque mi red de casa.

<figure class="pf-diagram" markdown="0">
<div class="pf-diagram__scroll">
<svg viewBox="0 0 820 476" role="img" aria-labelledby="pf-lab-title pf-lab-desc">
<title id="pf-lab-title">Arquitectura del lab de purple team</title>
<desc id="pf-lab-desc">Red del lab 10.10.10.0/24 aislada en un vSwitch sin uplink dentro de ESXi. pfSense es el único puente con la red de casa. Kali ataca a DC01 y PC01; los Windows mandan Sysmon y eventos a Wazuh por 1514/TCP y pfSense manda las alertas de Suricata por syslog 514/UDP.</desc>
<defs>
<marker id="pf-arr-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-red"/></marker>
<marker id="pf-arr-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-cyan"/></marker>
<marker id="pf-arr-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-amber"/></marker>
<marker id="pf-arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-muted"/></marker>
</defs>
<rect x="16" y="300" width="196" height="130" rx="8" class="pf-d-zone pf-d-zone--home"/>
<text x="30" y="322" class="pf-d-zone-label">casa · 192.168.1.0/24</text>
<rect x="240" y="20" width="564" height="430" rx="10" class="pf-d-zone pf-d-zone--esxi"/>
<text x="256" y="42" class="pf-d-zone-label">HP Z1 · ESXi · vSwitch1, sin uplink físico</text>
<text x="256" y="60" class="pf-d-zone-sub">10.10.10.0/24 · aislada</text>
<path d="M120,375 H232" class="pf-d-edge pf-d-edge--muted" marker-end="url(#pf-arr-muted)"/>
<text x="176" y="365" class="pf-d-edge-label" text-anchor="middle">RDP / HTTPS</text>
<path d="M378,120 H536" class="pf-d-edge pf-d-edge--attack" marker-end="url(#pf-arr-red)"/>
<text x="457" y="110" class="pf-d-edge-label pf-d-red" text-anchor="middle">ataca</text>
<path d="M375,131 L540,247" class="pf-d-edge pf-d-edge--attack pf-d-edge--dashed" marker-end="url(#pf-arr-red)"/>
<path d="M574,134 L684,242" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<path d="M578,260 H676" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<text x="627" y="250" class="pf-d-edge-label pf-d-cyan" text-anchor="middle">1514/TCP</text>
<text x="640" y="172" class="pf-d-edge-label pf-d-cyan">Sysmon + eventos</text>
<path d="M272,375 H700 V284" class="pf-d-edge pf-d-edge--network" marker-end="url(#pf-arr-amber)"/>
<text x="486" y="365" class="pf-d-edge-label pf-d-amber" text-anchor="middle">alertas de Suricata · syslog 514/UDP</text>
<circle r="3.5" class="pf-d-packet pf-d-fill-red"><animateMotion dur="3.2s" repeatCount="indefinite" path="M378,120 H536" keyPoints="0;1;1" keyTimes="0;.45;1" calcMode="linear"/></circle>
<circle r="3.5" class="pf-d-packet pf-d-fill-cyan"><animateMotion dur="3.2s" repeatCount="indefinite" path="M574,134 L684,242" keyPoints="0;0;1;1" keyTimes="0;.45;.8;1" calcMode="linear"/></circle>
<circle r="3.5" class="pf-d-packet pf-d-fill-amber"><animateMotion dur="3.2s" begin="1.1s" repeatCount="indefinite" path="M272,375 H700 V284" keyPoints="0;1;1" keyTimes="0;.6;1" calcMode="linear"/></circle>
<g class="pf-d-node"><circle cx="100" cy="375" r="16" class="pf-d-halo pf-d-fill-muted"/><circle cx="100" cy="375" r="6" class="pf-d-core pf-d-stroke-muted"/>
<text x="100" y="404" text-anchor="middle" class="pf-d-name">mi PC</text></g>
<g class="pf-d-node"><circle cx="254" cy="375" r="18" class="pf-d-halo pf-d-fill-amber"/><rect x="246" y="367" width="16" height="16" transform="rotate(45 254 375)" class="pf-d-core pf-d-stroke-amber"/>
<text x="262" y="410" text-anchor="start" class="pf-d-name">pfsense · .1</text>
<text x="262" y="426" text-anchor="start" class="pf-d-role">gateway + Suricata (IDS)</text></g>
<g class="pf-d-node"><circle cx="360" cy="120" r="18" class="pf-d-halo pf-d-fill-red"/><circle cx="360" cy="120" r="7" class="pf-d-core pf-d-stroke-red"/>
<text x="360" y="96" text-anchor="middle" class="pf-d-name">kali · .18</text>
<text x="360" y="152" text-anchor="middle" class="pf-d-role">atacante</text></g>
<g class="pf-d-node"><circle cx="560" cy="120" r="18" class="pf-d-halo pf-d-fill-cyan"/><circle cx="560" cy="120" r="7" class="pf-d-core pf-d-stroke-cyan"/>
<text x="560" y="94" text-anchor="middle" class="pf-d-name">dc01 · .10</text>
<text x="588" y="124" class="pf-d-role">Server 2019 · AD DS + DNS</text></g>
<g class="pf-d-node"><circle cx="560" cy="260" r="18" class="pf-d-halo pf-d-fill-cyan"/><circle cx="560" cy="260" r="7" class="pf-d-core pf-d-stroke-cyan"/>
<text x="550" y="295" text-anchor="middle" class="pf-d-name">pc01 · .17</text>
<text x="550" y="313" text-anchor="middle" class="pf-d-role">Windows 10 · víctima</text></g>
<g class="pf-d-node"><circle cx="700" cy="260" r="20" class="pf-d-halo pf-d-fill-cyan"/><circle cx="700" cy="260" r="11" class="pf-d-ring pf-d-stroke-cyan"/><circle cx="700" cy="260" r="5" class="pf-d-fill-cyan"/>
<text x="700" y="226" text-anchor="middle" class="pf-d-name">wazuh · .16</text>
<text x="716" y="296" class="pf-d-role">SIEM</text>
<text x="716" y="313" class="pf-d-role">all-in-one</text></g>
<text x="262" y="190" class="pf-d-note">fuera de HOME_NET,</text>
<text x="262" y="208" class="pf-d-note">a propósito</text>
<text x="30" y="468" class="pf-d-note">lab → casa: bloqueado (y comprobado)</text>
<text x="690" y="334" text-anchor="end" class="pf-d-note">con 32 GB no da</text>
<text x="690" y="351" text-anchor="end" class="pf-d-note">para dos nodos</text>
</svg>
</div>
<figcaption>Kali ataca en rojo, los Windows hablan con Wazuh en azul y Suricata, en ámbar. Todo lo que sale de la caja grande pasa por pfSense.</figcaption>
</figure>

| Host | IP | Rol | Qué aporta al SIEM |
|---|---|---|---|
| pfSense | 10.10.10.1 | Firewall/gateway + Suricata (IDS) | Alertas de red por syslog |
| DC01 | 10.10.10.10 | Windows Server 2019 · AD DS + DNS (`kiceland.lab`) | Sysmon + eventos de Windows |
| PC01 | 10.10.10.17 | Windows 10 · cliente víctima, unido al dominio | Sysmon + eventos de Windows |
| Wazuh | 10.10.10.16 | Ubuntu 24.04 · SIEM all-in-one (4.14) | Es el SIEM |
| Kali | 10.10.10.18 | Atacante | Nada, a propósito |

La red del lab cuelga de un vSwitch **sin salida física**. El único puente al
exterior es pfSense, y una regla de firewall impide que el lab alcance mi red de
casa. Lo comprobé: desde el lab llego al dominio y a internet, pero no a casa.

---

## Decisiones de diseño

**All-in-one, no distribuido.** Para un host y un puñado de VMs, un solo Wazuh
(manager, indexer y dashboard en la misma máquina) va sobrado. En producción
tiene sentido separar el indexer, que es lo que más RAM y disco consume, y así lo
tengo en el trabajo. En el lab solo me quitaría la RAM que necesito para el resto
de VMs, que con 32 GB es lo que primero se acaba.

**Red aislada detrás de pfSense.** La LAN no tiene uplink físico y el único
camino al exterior pasa por el firewall. Gracias a eso puedo lanzar ataques
reales sin miedo a la red de casa.

**Telemetría en dos capas.** En los Windows, Sysmon (con la configuración de
SwiftOnSecurity) más el agente de Wazuh. En la red, Suricata en pfSense. Cada
capa ve cosas que la otra no ve, y buena parte de lo que aprendo sale de ahí: de
pillar a una de las dos mirando hacia otro lado.

**Suricata en modo IDS.** Solo alerta, no bloquea. En un lab quiero ver pasar
todo el tráfico que estoy estudiando, no cortarlo.

**Windows en español.** Parece un detalle y no lo es: el grupo de
administradores se llama `Admins. del dominio`, no "Domain Admins", y algún
nombre de campo cambia. Mejor tenerlo en cuenta antes de escribir una regla que
no salta por culpa del idioma.

---

## Enseñar a Wazuh a leer Suricata

Esta fue la parte que más guerra dio. pfSense manda las alertas de Suricata por
syslog (facility `LOCAL1`) y Wazuh las escucha en un segundo bloque `<remote>`,
aparte del de los agentes:

```xml
<remote>
  <connection>syslog</connection>
  <port>514</port>
  <protocol>udp</protocol>
  <allowed-ips>10.10.10.1</allowed-ips>
</remote>
```

Hasta ahí, fácil. El problema es lo que llega. Por syslog no sale el EVE JSON de
Suricata, sale su formato *fast*, una línea de texto plano que Wazuh no entiende
de serie. Así llega una alerta real:

``` { .text .pf-logline }
Nov  8 11:51:36 suricata[5592]: [1:2221034:1] SURICATA HTTP Request unrecognized authorization method [Classification: Generic Protocol Command Decode] [Priority: 3] {TCP} 10.10.10.18:38616 -> 10.10.10.10:5357
```

Fíjate en lo que falta entre la hora y `suricata[5592]:`: el nombre de la
máquina. pfSense manda la línea **sin hostname**, así que el pre-decoder de Wazuh
toma `suricata[5592]:` como si fuera el hostname. Lo vi en la fase 1 de
`wazuh-logtest`:

```text
**Phase 1: Completed pre-decoding.
        full event: 'Nov  8 11:51:36 suricata[5592]: [1:2221034:1] SURICATA HTTP ...'
        timestamp: 'Nov  8 11:51:36'
        hostname: 'suricata[5592]:'
```

Sin `program_name`, cualquier decoder que se apoye en él no casa nunca. Así que
escribí uno que reconoce la alerta **por su contenido** (el `[gid:sid:rev]`, la
prioridad y el protocolo) y saca los campos que me interesan:

```xml
<decoder name="suricata-fast">
  <prematch type="pcre2">\[\d+:\d+:\d+\] .+ \[Priority: \d+\] \{\w+\}</prematch>
</decoder>

<decoder name="suricata-fast-alert">
  <parent>suricata-fast</parent>
  <regex type="pcre2">\[(\d+:\d+:\d+)\] (.+?) (?:\[Classification: ([^\]]+)\] )?\[Priority: (\d+)\] \{(\w+)\} ([\d.]+):?(\d*) -> ([\d.]+):?(\d*)</regex>
  <order>sid, signature, classification, priority, protocol, srcip, srcport, dstip, dstport</order>
</decoder>
```

Encima, unas reglas que traducen la **prioridad de Suricata a nivel de Wazuh**,
para que lo importante no se pierda entre el ruido del IDS:

```xml
<group name="suricata,ids,pfsense,">

  <rule id="100200" level="3">
    <decoded_as>suricata-fast</decoded_as>
    <field name="sid">\.+</field>
    <description>Suricata: $(signature)</description>
  </rule>

  <rule id="100201" level="7">
    <if_sid>100200</if_sid>
    <field name="priority">^2$</field>
    <description>Suricata (prioridad 2): $(signature)</description>
  </rule>

  <rule id="100202" level="10">
    <if_sid>100200</if_sid>
    <field name="priority">^1$</field>
    <description>Suricata (prioridad 1): $(signature)</description>
  </rule>

</group>
```

Fui validando cada cambio con `wazuh-logtest`, que enseña las tres fases de una
línea de log (pre-decoding, decoding y reglas). Empecé con un
`No decoder matched` y terminé con la alerta decodificada, con su IP de origen,
su firma y su prioridad, y apareciendo en el panel.

---

## El primer caso: reconocimiento

Para estrenar la cadena empecé por lo más básico: un `nmap` desde Kali contra el
controlador de dominio. Me sirvió para ver qué aporta cada capa:

- **El endpoint no se entera del escaneo.** Un `nmap -sS` no deja nada en el DC,
  porque escanear puertos no toca nada que el endpoint registre. Solo cuando nmap
  abre sesiones de verdad (los scripts SMB de `-sC`) aparecen inicios de sesión
  en el DC (eventos 4624 y 4634).
- **La red sí lo ve.** Suricata detectaba el escaneo, pero al principio solo con
  anomalías de protocolo genéricas, ninguna firma de escaneo. Las
  `ICMPv4 unknown code` que me desconcertaban venían del `-O`: son los pings con
  código ICMP 9 que usa nmap para adivinar el sistema operativo.
- **Afinar hasta la firma correcta.** Me faltaban dos cosas. La primera, cargar
  la categoría de reglas de escaneo (`emerging-scan`) en la interfaz; no estaba
  marcada. La segunda, sacar a Kali del HOME_NET de Suricata, porque las firmas
  de escaneo miran el tráfico "de fuera hacia lo mío" y Kali contaba como "de
  dentro". Arregladas las dos, salta **ET SCAN NMAP OS Detection Probe** y mi
  regla la sube a nivel 7 en Wazuh.

!!! note "La lección del punto ciego"
    HOME_NET no significa "de confianza". Suricata sigue inspeccionando todo;
    HOME_NET solo le dice qué es "lo mío", para que las firmas sepan en qué
    dirección mirar. La consecuencia es incómoda: si quien escanea es un equipo
    ya comprometido de la propia red, que es lo realista, el tráfico va de
    dentro hacia dentro y la mayoría de firmas de escaneo no saltan. Ese hueco
    lo tienen que tapar la telemetría de endpoint y las reglas internas, y eso
    es lo que quiero demostrar en las siguientes fases.

---

## Con qué me peleé

**pfSense no mandaba nada.** Lo primero que me encontré fue silencio absoluto:
`tcpdump` vacío en Wazuh. Un `logger` de prueba en pfSense no aparecía ni en su
propio log local, y al buscar el proceso, no había ningún syslogd. No había
arrancado bien al encender las VMs. Lo arranqué a mano desde Status → Services y
empezó a llegar todo.

**Las reglas en la carpeta equivocada.** Guardé las reglas en `decoders/` en vez
de en `rules/`. Wazuh carga como decoder todo lo que hay en esa carpeta, se
encuentra un `<rule>`, no lo entiende y el manager no arranca. El `journalctl`
lo decía claro: error de configuración en `etc/decoders`.

**El decoder que no casaba.** Es lo del hostname de arriba. La pista estaba en la
fase 1 del `wazuh-logtest` (`hostname: 'suricata[5592]:'`), y la solución fue el
`prematch` por contenido.

**pfSense se quedaba mudo al reiniciar Wazuh.** Este me costó entenderlo. En los
logs, la última línea de pfSense era de las 12:55:11 y el reinicio de
`wazuh-manager` de las 12:55:18. Después, nada. El syslogd de pfSense manda por
UDP y, si el destino deja de responder aunque sea un momento, lo descarta y no
vuelve a intentarlo. El proceso sigue vivo, pero ya no envía. Desde entonces,
cada vez que reinicio el manager, reinicio también el syslogd de pfSense.

**tcpdump no demuestra nada.** Mientras buscaba el fallo vi los paquetes llegar
con `tcpdump` y di por hecho que Wazuh los estaba procesando. No era así:
tcpdump captura **antes** de que el paquete llegue a la aplicación. La prueba
buena es de punta a punta: inyectar un mensaje en el origen con `logger` y
buscarlo en el log del destino.

---

## Qué cambiaría hoy

- **Syslog por TCP.** Con syslog-ng en pfSense en lugar del syslogd de serie, un
  reinicio de Wazuh no dejaría a pfSense mudo hasta que alguien se diera cuenta.
- **El orden de arranque en ESXi.** Wazuh debería arrancar antes que pfSense; si
  no, el syslogd empieza a enviar a un destino que todavía no escucha y se rinde.
- **La misma hora en todo.** pfSense está en UTC y Wazuh en hora de Madrid. Una
  hora de diferencia es justo lo que no quieres cuando cruzas una alerta de red
  con un evento de endpoint.
- **El snapshot, antes.** Habría hecho un snapshot limpio de todas las VMs en
  cuanto la cadena funcionó, antes de empezar a ensuciar nada.

---

## Lo que viene

La cadena está montada y el reconocimiento, cerrado. A partir de aquí el plan es
recorrer las fases de un ataque a Active Directory, cada una con su detección:

| Fase | Técnica | Qué debería cazarla |
|---|---|---|
| Enumeración | Usuarios, política de contraseñas y bloqueo | Volumen de consultas y accesos |
| Password spraying | Una contraseña contra muchas cuentas | 4625/4624 → mi **primera regla de correlación** |
| Kerberoasting / AS-REP | Pedir tickets para crackearlos offline | Eventos 4769 / 4768 |
| Movimiento lateral | Saltar de un equipo a otro (WinRM, WMI) | Logon tipo 3 + procesos en Sysmon |
| Volcado de credenciales | DCSync: replicar como si fueras un DC | Evento 4662 con el GUID de replicación |

Más adelante me interesan dos cosas. Una **regla de correlación** que agrupe
la ráfaga de alertas de un mismo escaneo en una sola de nivel alto. Y montar
**SOAR** encima (Shuffle + TheHive) para pasar de detectar a gestionar el caso,
que es como se trabaja en un SOC de verdad.
