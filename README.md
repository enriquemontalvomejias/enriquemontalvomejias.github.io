# enriquemontalvomejias.github.io

Portfolio técnico de **Enrique Montalvo Mejías**, consultor de sistemas y ciberseguridad.

**https://enriquemontalvomejias.github.io/**

Writeups de proyectos reales y laboratorios: la arquitectura, las decisiones y lo que se rompió por el camino.

## Proyectos

- [Inventario multi-tenant con GLPI](https://enriquemontalvomejias.github.io/proyectos/glpi/)
- [Laboratorio de identidad híbrida](https://enriquemontalvomejias.github.io/proyectos/lab-ad/)
- [SIEM distribuido con Wazuh](https://enriquemontalvomejias.github.io/proyectos/wazuh/)
- [MetroASIR (TFG)](https://enriquemontalvomejias.github.io/proyectos/metroasir/)

## Cómo está hecho

[MkDocs](https://www.mkdocs.org/) con [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/). Cada push a `main` lo compila y publica GitHub Actions en la rama `gh-pages`.

Encima de Material hay plantillas propias para que se vea como un portfolio y no como documentación:

| Fichero | Qué hace |
|---|---|
| `overrides/home.html` | Portada: topología de red animada, terminal, cifras y proyectos filtrables. El texto vive en el front matter de `docs/index.md`. |
| `overrides/pagina.html` | Trayectoria, Formación y Rumbo, a ancho completo. |
| `overrides/main.html` | Cabecera y pie propios, y el formato de los writeups (stack, índice y siguiente proyecto). |
| `docs/stylesheets/extra.css` | Todo el sistema visual. |
| `docs/javascripts/portfolio.js` | La interacción, sin dependencias. Respeta `prefers-reduced-motion`. |
| `docs/assets/fonts/` | IBM Plex servida desde la propia web, sin llamadas a Google Fonts. |

### Añadir un proyecto

1. Crea `docs/proyectos/<nombre>.md` con este bloque al principio:

    ```yaml
    ---
    proyecto:
      resumen: Una o dos frases para la portada.
      icono: material/cloud-outline     # cualquier icono de Material
      contexto: Lab personal            # Trabajo, Lab personal, TFG...
      estado: En curso                  # o Completado
      fechas: oct 2026
      categorias: [Cloud, Infraestructura]
      stack: [OpenStack, Kolla-Ansible, Docker]
    ---
    ```

2. Añádelo al `nav` de `mkdocs.yml`, dentro de `Proyectos`.

Sale solo en la portada (con su filtro), en la terminal (`ls`, `cat`, `open`) y en el enlace de "Siguiente proyecto" de los demás writeups.

Para verlo en local: `pip install mkdocs-material` y `mkdocs serve`.

### Miniaturas para compartir

Al compartir un enlace en LinkedIn, WhatsApp o similares sale una miniatura. `scripts/miniaturas.py` genera la general y una por proyecto (título, estado, resumen y stack) a partir del front matter, y el workflow de despliegue la ejecuta antes de publicar. Al añadir un proyecto, su miniatura aparece sola.

Para verlas en local: `pip install pillow` y `python scripts/miniaturas.py`, que las deja en `docs/og/` (ignorada por Git).
