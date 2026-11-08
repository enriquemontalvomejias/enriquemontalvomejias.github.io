---
proyecto:
  resumen: >-
    AD local sincronizado con Entra ID, MFA obligatorio y unión al dominio
    en remoto con Tailscale.
  icono: material/account-sync
  contexto: Lab personal
  estado: Completado
  fechas: abr–may 2026
  categorias: [Identidad, Cloud]
  stack: [Windows Server 2025, Active Directory, Entra Connect, MFA, Tailscale, Proxmox]
---

# Laboratorio de identidad híbrida

Active Directory local sincronizado con Microsoft Entra ID, MFA obligatorio y
unión al dominio desde fuera de la red mediante Tailscale. Montado a coste cero
sobre un portátil doméstico.

!!! info "Contexto"
    Laboratorio personal montado entre abril y mayo de 2026 para practicar la
    arquitectura de identidad que uso a diario con clientes. Los nombres de
    dominio, tenant, equipos y usuarios, y las direcciones de Tailscale, se han
    omitido.

---

## Objetivo

Reproducir el escenario de identidad más habitual en la empresa mediana: un
directorio local como fuente de verdad, sincronizado con Entra ID, con MFA
obligatorio en la nube y equipos que se unen al dominio aunque no estén en la
oficina. Todo sin coste, que resultó ser parte del reto.

---

## Arquitectura

<figure class="pf-diagram" markdown="0">
<div class="pf-diagram__scroll">
<svg viewBox="0 0 820 440" role="img" aria-labelledby="pf-ad-title pf-ad-desc">
<title id="pf-ad-title">Arquitectura del lab de identidad híbrida</title>
<desc id="pf-ad-desc">Un portátil con Proxmox VE aloja una VM con Windows Server 2025 como controlador de dominio, con AD DS y DNS, Entra Connect con Password Hash Sync y Tailscale como subnet router. Entra Connect sincroniza con Microsoft Entra ID cada 30 minutos. Un cliente Windows fuera de la red entra por un túnel WireGuard de Tailscale y llega al DC por Kerberos, LDAP, SMB, RPC y DNS.</desc>
<defs>
<marker id="pf-arr-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-red"/></marker>
<marker id="pf-arr-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-cyan"/></marker>
<marker id="pf-arr-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-amber"/></marker>
<marker id="pf-arr-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-d-fill-muted"/></marker>
</defs>
<rect x="16" y="250" width="200" height="140" rx="8" class="pf-d-zone pf-d-zone--home"/>
<text x="30" y="272" class="pf-d-zone-label">fuera de la red</text>
<rect x="250" y="20" width="340" height="400" rx="10" class="pf-d-zone pf-d-zone--esxi"/>
<text x="266" y="42" class="pf-d-zone-label">portátil · Proxmox VE</text>
<text x="266" y="60" class="pf-d-zone-sub">i5 · 16 GB de RAM</text>
<rect x="270" y="76" width="300" height="324" rx="8" class="pf-d-zone pf-d-zone--inner"/>
<text x="284" y="98" class="pf-d-zone-label">VM · Windows Server 2025 · DC</text>
<path d="M358,180 H470" class="pf-d-edge pf-d-edge--muted" marker-end="url(#pf-arr-muted)"/>
<path d="M508,180 H706" class="pf-d-edge pf-d-edge--telemetry" marker-end="url(#pf-arr-cyan)"/>
<text x="609" y="170" text-anchor="middle" class="pf-d-edge-label pf-d-cyan">sincroniza cada 30 min</text>
<path d="M118,320 H320" class="pf-d-edge pf-d-edge--network" marker-end="url(#pf-arr-amber)"/>
<text x="219" y="310" text-anchor="middle" class="pf-d-edge-label pf-d-amber">túnel WireGuard</text>
<path d="M340,302 V202" class="pf-d-edge pf-d-edge--network" marker-end="url(#pf-arr-amber)"/>
<text x="352" y="246" class="pf-d-edge-label">Kerberos · LDAP</text>
<text x="352" y="262" class="pf-d-edge-label">SMB · RPC · DNS</text>
<circle r="3.5" class="pf-d-packet pf-d-fill-amber"><animateMotion dur="3.4s" repeatCount="indefinite" path="M118,320 H340 V202" keyPoints="0;1;1" keyTimes="0;.6;1" calcMode="linear"/></circle>
<circle r="3.5" class="pf-d-packet pf-d-fill-cyan"><animateMotion dur="3.4s" begin="1.4s" repeatCount="indefinite" path="M508,180 H706" keyPoints="0;1;1" keyTimes="0;.4;1" calcMode="linear"/></circle>
<g class="pf-d-node"><circle cx="100" cy="320" r="16" class="pf-d-halo pf-d-fill-muted"/><circle cx="100" cy="320" r="6" class="pf-d-core pf-d-stroke-muted"/>
<text x="100" y="355" text-anchor="middle" class="pf-d-name">cliente windows</text>
<text x="100" y="372" text-anchor="middle" class="pf-d-role">+ tailscale</text></g>
<g class="pf-d-node"><circle cx="340" cy="180" r="20" class="pf-d-halo pf-d-fill-cyan"/><circle cx="340" cy="180" r="11" class="pf-d-ring pf-d-stroke-cyan"/><circle cx="340" cy="180" r="5" class="pf-d-fill-cyan"/>
<text x="340" y="134" text-anchor="middle" class="pf-d-name">ad ds + dns</text>
<text x="340" y="150" text-anchor="middle" class="pf-d-role">fuente de verdad</text></g>
<g class="pf-d-node"><circle cx="490" cy="180" r="18" class="pf-d-halo pf-d-fill-cyan"/><circle cx="490" cy="180" r="7" class="pf-d-core pf-d-stroke-cyan"/>
<text x="490" y="134" text-anchor="middle" class="pf-d-name">entra connect</text>
<text x="490" y="150" text-anchor="middle" class="pf-d-role">password hash sync</text></g>
<g class="pf-d-node"><circle cx="340" cy="320" r="18" class="pf-d-halo pf-d-fill-amber"/><rect x="332" y="312" width="16" height="16" transform="rotate(45 340 320)" class="pf-d-core pf-d-stroke-amber"/>
<text x="340" y="355" text-anchor="middle" class="pf-d-name">tailscale</text>
<text x="340" y="372" text-anchor="middle" class="pf-d-role">subnet router</text></g>
<g class="pf-d-node"><circle cx="730" cy="180" r="20" class="pf-d-halo pf-d-fill-cyan"/><circle cx="730" cy="180" r="9" class="pf-d-core pf-d-cloud pf-d-stroke-cyan"/>
<text x="730" y="134" text-anchor="middle" class="pf-d-name">entra id</text>
<text x="730" y="216" text-anchor="middle" class="pf-d-role">tenant gratuito</text>
<text x="730" y="232" text-anchor="middle" class="pf-d-role">MFA por usuario</text></g>
<text x="384" y="300" class="pf-d-note">anunciar, aprobar</text>
<text x="384" y="318" class="pf-d-note">y aceptar la ruta:</text>
<text x="384" y="336" class="pf-d-note">si falta uno, no llega</text>
<text x="640" y="290" class="pf-d-note">sin P1, nada de acceso</text>
<text x="640" y="308" class="pf-d-note">condicional</text>
<text x="30" y="414" class="pf-d-note">sin abrir un solo</text>
<text x="30" y="432" class="pf-d-note">puerto en el router</text>
</svg>
</div>
<figcaption>El AD manda y Entra copia. El cliente remoto entra por Tailscale y se une al dominio como si estuviera en la oficina. Todo a coste cero.</figcaption>
</figure>

| Capa | Tecnología |
|---|---|
| Virtualización | Proxmox VE en un portátil (Intel i5 de 12.ª gen, 16 GB de RAM) |
| Controlador de dominio | VM con Windows Server 2025, AD DS y DNS |
| Sincronización | Microsoft Entra Connect Sync con Password Hash Sync |
| Identidad en la nube | Microsoft Entra ID, tenant gratuito |
| Acceso remoto | Tailscale, VPN mesh sobre WireGuard |
| Cliente | VM con Windows, unida al dominio desde fuera de la red |

---

## Active Directory

Windows Server 2025 promovido a controlador de un dominio nuevo. Los usuarios de
prueba se crean con contraseña inicial y cambio obligatorio en el primer inicio
de sesión. La política de contraseñas se aplica por GPO de dominio: longitud
mínima de 12 caracteres, complejidad y un historial de 24 contraseñas.

## Sincronización con Entra ID

Entra Connect Sync instalado en el propio controlador de dominio, con Password
Hash Sync por resiliencia: el inicio de sesión en la nube no depende de que el
DC local esté disponible. El ciclo de sincronización es el de por defecto, cada
30 minutos. Para no esperar:

```powershell
# Sincronización delta: solo los cambios desde la última
Start-ADSyncSyncCycle -PolicyType Delta

# Sincronización completa
Start-ADSyncSyncCycle -PolicyType Initial
```

Tras la sincronización, los usuarios aparecen en Entra ID marcados como
sincronizados desde el entorno local. El AD sigue siendo la fuente de verdad:
los cambios se hacen allí, no en la nube.

## MFA obligatorio

!!! warning "Acceso condicional sin licencia"
    El acceso condicional requiere Microsoft Entra ID P1, que el tenant gratuito
    no incluye. En el laboratorio, el MFA se fuerza **por usuario** (estado
    *enforced*) en todos los usuarios sincronizados, con Microsoft Authenticator
    habilitado en la directiva de métodos de autenticación.

El diseño de referencia era la política que se usaría en producción con P1, y el
MFA por usuario sirvió para reproducir su efecto:

| Parámetro | Valor |
|---|---|
| Usuarios | Todos los usuarios sincronizados |
| Aplicaciones | Todas las aplicaciones en la nube |
| Ubicación | Cualquiera |
| Control | Requerir autenticación multifactor |

El MFA por usuario es el método heredado y Microsoft recomienda sustituirlo por
acceso condicional. Aquí cumple su función, pero con P1 sería lo primero que
migraría.

## Unión al dominio desde fuera de la red

Tailscale crea una VPN mesh sobre WireGuard sin abrir puertos en el router, y es
gratuito hasta 100 dispositivos. El controlador de dominio actúa como *subnet
router*: anuncia la red local para que los clientes remotos puedan alcanzarla.

=== "En el DC"

    ```powershell
    tailscale up --advertise-routes=192.168.1.0/24 --accept-dns=false
    tailscale status
    ```

=== "En la consola de Tailscale"

    Aprobar la ruta anunciada por el DC en la configuración de rutas de esa
    máquina. Hasta que se aprueba, la ruta está anunciada pero nadie la usa.

=== "En el cliente"

    ```powershell
    tailscale up --accept-routes
    Add-Computer -DomainName "lab.local" -Credential (Get-Credential) -Restart
    ```

Con el túnel levantado, la unión se hace igual que en la oficina, también desde
la interfaz gráfica. Kerberos, LDAP, SMB, RPC y DNS viajan por el túnel sin
mapear ningún puerto.

---

## Con qué me peleé

**Unir un equipo al dominio a través de la VPN.** No sabía que Tailscale permite
anunciar redes completas, y sin eso el cliente no llega. Aunque el DC tenga su
propia IP del tailnet, el DNS del dominio devuelve su IP de LAN, y es esa la que
el cliente intenta alcanzar para Kerberos y LDAP. La pieza que faltaba eran las
rutas de subred, que tienen tres partes y fallan si falta cualquiera: anunciarla
en el DC, aprobarla en la consola y aceptarla en el cliente.

**Hacerlo a coste cero.** La otra parte fue de licencias: averiguar qué incluye
cada nivel. Entra Connect y el MFA por usuario entran en el tenant gratuito; el
acceso condicional no. Tailscale y Proxmox, gratis. La lección se traslada
directamente a consultoría: antes de diseñar, mirar qué licencia tiene el
cliente, porque cambia la solución.

---

## Qué cambiaría en producción

Atajos aceptables en un laboratorio que no repetiría con un cliente:

- **Entra Connect en un servidor dedicado.** Microsoft lo soporta en un DC, pero
  el servidor de sincronización es un activo Tier 0 y conviene aislarlo.
- **Sufijo UPN enrutable.** Con un dominio `.local`, los usuarios llegan a Entra
  con el sufijo `onmicrosoft.com`. Lo correcto es añadir un sufijo UPN de un
  dominio verificado antes de sincronizar.
- **Acceso condicional en lugar de MFA por usuario**, y bloqueo de la
  autenticación heredada.
- **Rutas de Tailscale mínimas.** Anunciar solo la IP del DC en lugar de toda la
  /24 y limitar el acceso con ACLs del tailnet. Y desactivar la expiración de
  clave en el DC, para que el túnel no se corte cuando caduque.

---

## Siguientes pasos

- Integrar Zscaler para cerrar el modelo Zero Trust sobre la misma identidad.
- Desplegar AD DS en Azure y compararlo con el modelo híbrido.
- Autoservicio de restablecimiento de contraseña (SSPR) con escritura diferida
  al AD local, que también requiere P1.
- Sufijo UPN con un dominio propio verificado.

