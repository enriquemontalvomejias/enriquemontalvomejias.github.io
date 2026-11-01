---
template: home.html

# ── Cabecera ────────────────────────────────────────────────────────────
hero:
  nombre: Enrique Montalvo Mejías
  lead: >-
    Consultor de sistemas y ciberseguridad en Vicmartin. He trabajado del rack
    al cloud, y documento cada paso: la arquitectura, las decisiones y lo que
    se rompió por el camino.
  stack: [Zscaler, Zero Trust, Entra ID, Active Directory, Wazuh, PowerShell]

# Lo que responde la terminal al escribir "whoami"
terminal:
  whoami:
    - Enrique Montalvo Mejías (kike)
    - Consultor de sistemas y ciberseguridad en Vicmartin, Madrid.
    - "Objetivo: seguridad operativa. Detección, análisis de alertas y respuesta."

# ── Cifras (el número se anima; admite "~" delante y decimales con coma) ──
cifras:
  - valor: "5"
    texto: entornos de trabajo distintos, del rack al cloud
  - valor: "~600"
    texto: endpoints inventariados con GLPI
  - valor: "~20"
    texto: organizaciones cliente en esa misma plataforma
  - valor: "9,15"
    texto: de nota en el TFG, MetroASIR

# ── Proyectos: salen solos de los writeups con "proyecto:" ──────────────
proyectos:
  intro: >-
    Writeups de proyectos reales y laboratorios: arquitectura, decisiones y lo
    que se rompió por el camino.

# ── En qué trabajo (el texto de abajo, fuera del front matter, va de intro) ─
areas:
  - titulo: Seguridad y acceso
    icono: material/shield-lock
    texto: >-
      Zscaler ZIA, ZPA, ZDX y Client Connector en varios tenants de cliente:
      segmentación Zero Trust, políticas de acceso e informes QBR. Sophos para
      endpoints y VPN.
  - titulo: Identidad
    icono: material/account-key
    texto: >-
      Microsoft Entra ID e híbrido con Active Directory. Accesos condicionales,
      grupos de seguridad, sincronización e Intune.
  - titulo: Infraestructura
    icono: material/server-network
    texto: >-
      Windows Server, VMware vSphere, Hyper-V y Proxmox. Cloud en Azure y AWS.
      Automatización con PowerShell y despliegue por GPO.
  - titulo: Detección
    icono: material/radar
    texto: >-
      Wazuh como SIEM/XDR en arquitectura distribuida de dos nodos. Auditoría
      de Active Directory con Purple Knight.

# ── Sigue leyendo (también alimenta "cat" y "open" en la terminal) ───────
seguir:
  - pagina: trayectoria.md
    texto: >-
      Cinco entornos distintos, del rack al cloud. Un perfil comodín con rumbo
      a la ciberseguridad.
  - pagina: formacion.md
    texto: ASIR, el máster en curso, certificaciones y los labs que monto por mi cuenta.
  - pagina: rumbo.md
    texto: Hacia dónde voy, con fechas y lo que ya está tachado.
---

Trabajo entre la infraestructura del día a día, en entornos on-premise, híbridos
y cloud, y la seguridad, que cada vez pesa más. Mi objetivo es la seguridad
operativa: detección, análisis de alertas y respuesta.
