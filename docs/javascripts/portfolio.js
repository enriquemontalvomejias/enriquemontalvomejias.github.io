/* ==========================================================================
   Portfolio · Enrique Montalvo Mejías
   Interacción de la web, sin dependencias:
   1. Cabecera y menú móvil
   2. Apariciones al hacer scroll y contadores
   3. Línea de tiempo y progreso de lectura
   4. Filtros de proyectos
   5. Terminal de la portada
   6. Topología de red animada
   7. Página 404
   Todo respeta prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reducedMotion() { return motionQuery.matches; }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* 1. Cabecera ─────────────────────────────────────────────────────────── */

  function initHeader() {
    var header = $(".pf-header");
    if (!header) return;

    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var toggle = $(".pf-nav__toggle", header);
    var menu = $("#pf-menu");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      header.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    var desktop = window.matchMedia("(min-width: 48em)");
    var onDesktop = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onDesktop);
  }

  /* 2. Apariciones y contadores ─────────────────────────────────────────── */

  function initReveal() {
    var els = $$("[data-reveal]");
    if (!els.length || reducedMotion() || !("IntersectionObserver" in window)) return;
    root.classList.add("pf-reveal-on");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var els = $$("[data-pf-count], .pf-pagina .stats strong");
    if (!els.length || reducedMotion() || !("IntersectionObserver" in window)) return;

    var targets = [];
    els.forEach(function (el) {
      var text = el.textContent.trim();
      var m = /^(\D{0,2}?)(\d+(?:,\d+)?)(.*)$/.exec(text);
      if (!m) return;
      var decimals = m[2].indexOf(",") > -1 ? m[2].split(",")[1].length : 0;
      var value = parseFloat(m[2].replace(",", "."));
      var fmt = new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      el.setAttribute("aria-label", text);
      el.textContent = m[1] + fmt.format(0) + m[3];
      el._pfCount = { pre: m[1], post: m[3], value: value, fmt: fmt, text: text };
      targets.push(el);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        animateCount(entry.target);
      });
    }, { threshold: 0.4 });
    targets.forEach(function (el) { io.observe(el); });

    function animateCount(el) {
      var c = el._pfCount;
      var start = performance.now();
      var dur = 1300;
      (function step(now) {
        var p = clamp((now - start) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = c.pre + c.fmt.format(c.value * eased) + c.post;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = c.text;
      })(start);
    }
  }

  /* 3. Línea de tiempo y progreso de lectura ────────────────────────────── */

  function initScrollEffects() {
    var timelines = $$(".md-typeset .timeline");
    var bar = $(".pf-progress span");
    if (!timelines.length && !bar) return;

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      timelines.forEach(function (tl) {
        var r = tl.getBoundingClientRect();
        var p = clamp((vh * 0.62 - r.top) / r.height, 0, 1);
        tl.style.setProperty("--pf-progress", p.toFixed(4));
        var items = tl._pfItems || (tl._pfItems = $$(".tl-item", tl));
        items.forEach(function (it) {
          it.classList.toggle("is-reached", it.offsetTop + 12 <= p * r.height);
        });
      });
      if (bar) {
        var max = root.scrollHeight - vh;
        bar.style.transform = "scaleX(" + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0) + ")";
      }
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* 4. Filtros de proyectos ─────────────────────────────────────────────── */

  function initFilters() {
    var box = $("[data-pf-filters]");
    if (!box) return;
    var items = $$(".pf-proj");
    var status = $("[data-pf-filter-status]");
    box.hidden = false;

    box.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn || btn.getAttribute("aria-pressed") === "true") return;
      var filter = btn.getAttribute("data-filter");

      $$("[data-filter]", box).forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });

      var shown = 0;
      items.forEach(function (it) {
        var tags = " " + (it.getAttribute("data-tags") || "") + " ";
        var show = filter === "*" || tags.indexOf(" " + filter + " ") > -1;
        if (show) {
          shown++;
          it.classList.add("is-visible");
          if (it.hidden) {
            it.hidden = false;
            if (!reducedMotion()) {
              it.classList.remove("is-entering");
              void it.offsetWidth;
              it.classList.add("is-entering");
            }
          }
        } else {
          it.hidden = true;
        }
      });

      if (status) {
        var label = btn.childNodes[0].textContent.trim();
        status.textContent = shown + (shown === 1 ? " proyecto" : " proyectos") +
          (filter === "*" ? "" : " de " + label);
      }
    });
  }

  /* 5. Terminal ─────────────────────────────────────────────────────────── */

  function initTerminal() {
    var term = $("[data-pf-terminal]");
    var dataEl = $("#pf-term-data");
    if (!term || !dataEl) return;

    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (err) { return; }

    var screen = $(".pf-term__screen", term);
    var form = $(".pf-term__form", term);
    var input = $(".pf-term__input", term);
    var hints = $(".pf-term__hints", term);
    form.hidden = false;
    hints.hidden = false;

    var projects = data.projects || [];
    var pages = data.pages || [];
    var social = {};
    (data.socialNames || []).forEach(function (name, i) {
      social[norm(name)] = data.social[i];
    });

    var history = [];
    var hIndex = 0;
    var introTimer = null;
    var userTookOver = false;

    function norm(s) {
      return String(s || "")
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/^\.?\/+/, "")
        .replace(/^(proyectos|paginas)\//, "")
        .replace(/\/+$/, "");
    }

    function node(tag, cls, text) {
      var n = doc.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }

    function print(parts) {
      var line = node("div", "pf-term__line");
      (Array.isArray(parts) ? parts : [parts]).forEach(function (p) {
        if (p == null || p === "") return;
        if (typeof p === "string") {
          line.appendChild(doc.createTextNode(p));
        } else if (p.href) {
          var a = node("a", p.cls || "", p.text);
          a.href = p.href;
          if (p.external) { a.target = "_blank"; a.rel = "noopener"; }
          line.appendChild(a);
        } else if (p.cmd) {
          var b = node("button", "pf-term__cmd", p.text);
          b.type = "button";
          b.setAttribute("data-cmd", p.cmd);
          line.appendChild(b);
        } else {
          line.appendChild(node("span", p.cls || "", p.text));
        }
      });
      screen.appendChild(line);
      while (screen.childNodes.length > 240) screen.removeChild(screen.firstChild);
      screen.scrollTop = screen.scrollHeight;
      return line;
    }

    function prompt(cmd) {
      print([
        { text: "kike@kiceland", cls: "t-green" },
        { text: ":", cls: "t-dim" },
        { text: "~", cls: "t-cyan" },
        { text: "$ ", cls: "t-dim" },
        cmd
      ]);
    }

    function pad(n) { return new Array(Math.max(0, n) + 1).join(" "); }
    function statusCls(s) {
      s = norm(s);
      return s === "completado" ? "t-green" : s === "en curso" ? "t-amber" : "t-dim";
    }
    function findProject(n) {
      n = norm(n);
      for (var i = 0; i < projects.length; i++) if (projects[i].slug === n) return projects[i];
      return null;
    }
    function findPage(n) {
      n = norm(n);
      for (var i = 0; i < pages.length; i++) if (pages[i].slug === n) return pages[i];
      return null;
    }
    function example() { return projects.length ? projects[0].slug : "rumbo"; }
    function error(text) { print({ text: text, cls: "t-red" }); }

    var commands = {
      help: function () {
        print({ text: "Comandos disponibles", cls: "t-bold" });
        [
          ["whoami", "quién soy"],
          ["ls", "proyectos y páginas"],
          ["cat <nombre>", "resumen de un proyecto o página"],
          ["open <nombre>", "abre un proyecto, una página, linkedin o github"],
          ["stack", "tecnologías con las que trabajo"],
          ["contacto", "dónde encontrarme"],
          ["history, clear", "historial y limpiar la pantalla"]
        ].forEach(function (r) {
          print(["  ", { text: r[0], cls: "t-cyan" }, pad(16 - r[0].length), r[1]]);
        });
        print({ text: "Tab autocompleta y las flechas recorren el historial.", cls: "t-dim" });
      },

      whoami: function () {
        (data.whoami || []).forEach(function (t, i) {
          print(i === 0 ? { text: t, cls: "t-bold" } : t);
        });
      },

      ls: function (args) {
        var what = norm(args[0]);
        if (what && what !== "proyectos" && what !== "paginas") {
          error("ls: no existe '" + args[0] + "'. Prueba ls proyectos o ls paginas.");
          return;
        }
        if (!what || what === "proyectos") {
          print({ text: "proyectos/", cls: "t-cyan" });
          var w = projects.reduce(function (m, p) { return Math.max(m, p.slug.length); }, 0) + 3;
          projects.forEach(function (p) {
            print([
              "  ",
              { cmd: "cat " + p.slug, text: p.slug },
              pad(w - p.slug.length),
              { text: (p.status || "").toLowerCase(), cls: statusCls(p.status) },
              { text: "  " + p.title, cls: "t-dim" }
            ]);
          });
        }
        if (!what || what === "paginas") {
          print({ text: "páginas/", cls: "t-cyan" });
          var parts = ["  "];
          pages.forEach(function (p) { parts.push({ cmd: "cat " + p.slug, text: p.slug }, "   "); });
          print(parts);
        }
      },

      cat: function (args) {
        if (!args[0]) { error("cat: falta el nombre. Prueba cat " + example() + "."); return; }
        var p = findProject(args[0]);
        if (p) {
          print({ text: p.title, cls: "t-bold" });
          print(p.summary);
          print([
            { text: "estado   ", cls: "t-dim" },
            { text: (p.status || "").toLowerCase(), cls: statusCls(p.status) },
            { text: "   contexto  ", cls: "t-dim" }, (p.context || "").toLowerCase(),
            p.dates ? { text: "   fechas  ", cls: "t-dim" } : null, p.dates || null
          ]);
          if (p.stack && p.stack.length) print([{ text: "stack    ", cls: "t-dim" }, p.stack.join(", ")]);
          print([{ text: "Leer el writeup: ", cls: "t-dim" }, { cmd: "open " + p.slug, text: "open " + p.slug }]);
          return;
        }
        var g = findPage(args[0]);
        if (g) {
          print({ text: g.title, cls: "t-bold" });
          print(g.summary);
          print([{ text: "Abrir la página: ", cls: "t-dim" }, { cmd: "open " + g.slug, text: "open " + g.slug }]);
          return;
        }
        if (social[norm(args[0])]) { commands.contacto(); return; }
        error("cat: " + args[0] + ": no existe. Escribe ls para ver qué hay.");
      },

      open: function (args) {
        var n = norm(args[0]);
        if (!n) { error("open: dime qué abrir. Por ejemplo, open " + example() + "."); return; }
        if (social[n]) {
          print([{ text: "Abriendo ", cls: "t-dim" }, n, { text: " en otra pestaña.", cls: "t-dim" }]);
          window.open(social[n], "_blank", "noopener");
          return;
        }
        var target = findProject(n) || findPage(n);
        if (!target && (n === "inicio" || n === "~" || n === "home")) target = { slug: "inicio", url: "./" };
        if (!target) { error("open: " + args[0] + ": no existe. Escribe ls para ver qué hay."); return; }
        print([{ text: "Abriendo ", cls: "t-dim" }, target.slug, { text: "...", cls: "t-dim" }]);
        setTimeout(function () { window.location.href = target.url; }, reducedMotion() ? 0 : 260);
      },

      stack: function () { print((data.stack || []).join("   ")); },

      contacto: function () {
        (data.socialNames || []).forEach(function (name, i) {
          var url = data.social[i];
          print([
            { text: name.toLowerCase() + pad(10 - name.length), cls: "t-dim" },
            { href: url, text: url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), external: true }
          ]);
        });
      },

      history: function () {
        if (!history.length) { print({ text: "El historial está vacío.", cls: "t-dim" }); return; }
        history.forEach(function (h, i) {
          var n = String(i + 1);
          print([{ text: pad(4 - n.length) + n + "  ", cls: "t-dim" }, h]);
        });
      },

      clear: function () { screen.textContent = ""; },

      pwd: function () { print("/home/kike"); },

      sudo: function () {
        print("kike no está en el fichero sudoers. Este incidente será notificado.");
        print({ text: "[wazuh] alerta: intento de escalada de privilegios desde el navegador. Revisando el log.", cls: "t-red" });
      },

      exit: function () {
        print([
          "No hay salida: esto es un portfolio. Prueba ",
          { cmd: "open linkedin", text: "open linkedin" },
          "."
        ]);
      }
    };

    var aliases = {
      cd: "open", ll: "ls", dir: "ls", "?": "help", ayuda: "help",
      contact: "contacto", contactar: "contacto", cls: "clear", su: "sudo", logout: "exit"
    };

    function exec(raw) {
      var line = raw.replace(/\s+/g, " ").trim();
      prompt(line);
      if (!line) return;
      history.push(line);
      hIndex = history.length;
      var parts = line.split(" ");
      var name = parts[0].toLowerCase();
      var args = parts.slice(1).filter(function (a) { return a.charAt(0) !== "-"; });
      var fn = commands[aliases[name] || name];
      if (name === "rm") {
        error("rm: sistema de ficheros de solo lectura. Es una web estática.");
      } else if (fn) {
        fn(args);
      } else {
        error(name + ": comando no encontrado. Escribe help para ver los comandos.");
      }
    }

    function completions(value) {
      var parts = value.replace(/^\s+/, "").split(/\s+/);
      if (parts.length <= 1) {
        return { prefix: "", word: parts[0], pool: Object.keys(commands), suffix: " " };
      }
      var cmd = aliases[parts[0].toLowerCase()] || parts[0].toLowerCase();
      var pool = [];
      if (cmd === "ls") pool = ["proyectos", "paginas"];
      if (cmd === "cat" || cmd === "open") {
        pool = projects.map(function (p) { return p.slug; })
          .concat(pages.map(function (p) { return p.slug; }));
        if (cmd === "open") pool = pool.concat(Object.keys(social));
      }
      return { prefix: parts.slice(0, -1).join(" ") + " ", word: parts[parts.length - 1], pool: pool, suffix: "" };
    }

    function complete() {
      var c = completions(input.value);
      var word = c.word.toLowerCase();
      var matches = c.pool.filter(function (x) { return x.indexOf(word) === 0; });
      if (matches.length === 1) {
        input.value = c.prefix + matches[0] + c.suffix;
      } else if (matches.length > 1) {
        var common = matches.reduce(function (a, b) {
          var i = 0;
          while (i < a.length && a[i] === b[i]) i++;
          return a.slice(0, i);
        });
        if (common.length > word.length) {
          input.value = c.prefix + common;
        } else {
          prompt(input.value);
          print({ text: matches.join("   "), cls: "t-dim" });
        }
      }
    }

    function cancelIntro() {
      userTookOver = true;
      if (introTimer) { clearInterval(introTimer); introTimer = null; input.value = ""; }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      cancelIntro();
      var v = input.value;
      input.value = "";
      exec(v);
    });

    input.addEventListener("keydown", function (e) {
      if (introTimer) cancelIntro();
      if (e.key === "Tab" && input.value.trim()) {
        e.preventDefault();
        complete();
      } else if (e.key === "ArrowUp") {
        if (!history.length) return;
        e.preventDefault();
        hIndex = Math.max(0, hIndex - 1);
        input.value = history[hIndex];
      } else if (e.key === "ArrowDown") {
        if (!history.length) return;
        e.preventDefault();
        hIndex = Math.min(history.length, hIndex + 1);
        input.value = history[hIndex] || "";
      } else if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        commands.clear();
      } else if (e.ctrlKey && (e.key === "c" || e.key === "C") && input.selectionStart === input.selectionEnd) {
        e.preventDefault();
        prompt(input.value + "^C");
        input.value = "";
      }
    });
    input.addEventListener("pointerdown", cancelIntro);

    term.addEventListener("click", function (e) {
      var cmdBtn = e.target.closest("[data-cmd]");
      if (cmdBtn) {
        cancelIntro();
        exec(cmdBtn.getAttribute("data-cmd"));
        return;
      }
      if (e.target.closest("a, input")) return;
      if (e.target.closest(".pf-term__window") && !String(window.getSelection())) {
        input.focus({ preventScroll: true });
      }
    });

    function intro() {
      if (userTookOver) return;
      var cmd = "whoami";
      var after = function () {
        print({ text: "Escribe help para ver qué más puedes hacer.", cls: "t-dim" });
      };
      if (reducedMotion()) { exec(cmd); after(); return; }
      var i = 0;
      introTimer = setInterval(function () {
        input.value = cmd.slice(0, ++i);
        if (i >= cmd.length) {
          clearInterval(introTimer);
          introTimer = null;
          setTimeout(function () {
            if (userTookOver) return;
            input.value = "";
            exec(cmd);
            after();
          }, 380);
        }
      }, 90);
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          io.disconnect();
          setTimeout(intro, reducedMotion() ? 0 : 1100);
        }
      }, { threshold: 0.35 });
      io.observe(term);
    } else {
      intro();
    }
  }

  /* 6. Topología de red ───────────────────────────────────────────────────
     Un diagrama de red con los equipos de mis labs. Por los enlaces viaja
     tráfico normal y, cada pocos segundos, un ataque desde kali que genera
     un evento en dc01 y una alerta en wazuh: ataque, log, detección. */

  function initTopology() {
    var canvas = $("[data-pf-topology]");
    if (!canvas || !canvas.getContext) return;

    var hero = canvas.parentElement;
    var ctx = canvas.getContext("2d");
    var RGB = {
      line: "141,157,181", text: "230,236,244", cyan: "56,189,248",
      amber: "242,184,75", red: "255,122,107", ink: "14,23,38"
    };

    // [id, etiqueta, x, y, tipo] en coordenadas relativas al hero
    // La historia del ataque va por la franja inferior y el resto de la red
    // por la superior, para que el texto y la terminal no la tapen.
    var MAJOR = [
      ["kali", "kali", 0.035, 0.84, "attacker"],
      ["internet", "internet", 0.12, 0.95, "cloud"],
      ["pfsense", "pfsense", 0.28, 0.87, "fw"],
      ["dc01", "dc01", 0.5, 0.95, "host"],
      ["pc01", "pc01", 0.71, 0.92, "host"],
      ["wazuh", "wazuh", 0.935, 0.86, "siem"],
      ["web", "web · dmz", 0.3, 0.07, "host"],
      ["glpi", "glpi", 0.57, 0.1, "host"],
      ["entra", "entra id", 0.8, 0.055, "cloud"]
    ];
    var LINKS = [
      ["kali", "internet"], ["internet", "pfsense"], ["pfsense", "web"], ["pfsense", "dc01"],
      ["dc01", "pc01"], ["dc01", "glpi"], ["glpi", "entra"], ["dc01", "wazuh"],
      ["pc01", "wazuh"], ["web", "glpi"], ["entra", "wazuh"]
    ];
    var ATTACK = ["kali", "internet", "pfsense", "dc01"];

    var nodes = [];
    var byId = {};
    var edges = [];
    var packets = [];
    var alert = null;
    var W = 0, H = 0, dpr = 1, compact = false;
    var running = false, onScreen = true, raf = 0;
    var last = 0, clock = 0, nextAmbient = 0.6, nextAttack = 1.8;
    var pointer = null;

    function build() {
      nodes = [];
      byId = {};
      edges = [];
      var seed = 11;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

      MAJOR.forEach(function (m) {
        var n = { id: m[0], label: m[1], x: m[2], y: m[3], kind: m[4], ph: rnd() * 6.28, amp: 3 + rnd() * 3 };
        nodes.push(n);
        byId[n.id] = n;
      });
      LINKS.forEach(function (l) { edges.push({ a: byId[l[0]], b: byId[l[1]] }); });

      // Endpoints con agente: cuelgan de glpi, dc01 y wazuh
      var hubs = ["glpi", "dc01", "glpi", "wazuh", "dc01", "glpi", "wazuh", "dc01", "glpi", "dc01"];
      var count = compact ? 5 : hubs.length;
      for (var i = 0; i < count; i++) {
        var hub = byId[hubs[i]];
        var ang = rnd() * Math.PI * 2;
        var r = 0.05 + rnd() * 0.06;
        var e = {
          id: "ep" + i, label: "", kind: "endpoint",
          x: clamp(hub.x + Math.cos(ang) * r * 0.75, 0.02, 0.98),
          y: clamp(hub.y + Math.sin(ang) * r * 1.6, 0.03, 0.97),
          ph: rnd() * 6.28, amp: 2 + rnd() * 3
        };
        nodes.push(e);
        edges.push({ a: e, b: hub, thin: true });
        if (hub.id !== "wazuh" && i % 3 === 0) edges.push({ a: e, b: byId.wazuh, thin: true });
      }
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var wasCompact = compact;
      compact = W < 720;
      if (!nodes.length || wasCompact !== compact) build();
      if (!running) draw(clock);
    }

    function pos(n, t) {
      return {
        x: n.x * W + Math.sin(t * 0.35 + n.ph) * n.amp,
        y: n.y * H + Math.cos(t * 0.28 + n.ph) * n.amp
      };
    }

    function spawnAmbient() {
      var e = edges[Math.floor(Math.random() * edges.length)];
      var flip = Math.random() < 0.5;
      packets.push({ path: flip ? [e.a, e.b] : [e.b, e.a], seg: 0, p: 0, speed: 60 + Math.random() * 50, color: RGB.cyan, r: 1.6 });
    }

    function spawnAttack() {
      packets.push({
        path: ATTACK.map(function (id) { return byId[id]; }), seg: 0, p: 0, speed: 230, color: RGB.red, r: 2.3,
        done: function () {
          packets.push({
            path: [byId.dc01, byId.wazuh], seg: 0, p: 0, speed: 260, color: RGB.amber, r: 2.1,
            done: function () { alert = { t: clock }; }
          });
        }
      });
    }

    function step(dt) {
      clock += dt;
      if (clock >= nextAmbient) {
        if (packets.length < (compact ? 6 : 12)) spawnAmbient();
        nextAmbient = clock + 0.45 + Math.random() * 0.5;
      }
      if (clock >= nextAttack) {
        spawnAttack();
        nextAttack = clock + 9;
      }
      for (var i = packets.length - 1; i >= 0; i--) {
        var k = packets[i];
        var a = pos(k.path[k.seg], clock), b = pos(k.path[k.seg + 1], clock);
        var len = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
        k.p += (k.speed * dt) / len;
        if (k.p >= 1) {
          k.seg++;
          k.p = 0;
          if (k.seg >= k.path.length - 1) {
            packets.splice(i, 1);
            if (k.done) k.done();
          }
        }
      }
      if (alert && clock - alert.t > 3) alert = null;
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var P = {};
      nodes.forEach(function (n) { P[n.id] = pos(n, t); });

      var alertAge = alert ? t - alert.t : -1;
      var attackHot = alert && alertAge < 1.6;

      // Enlaces
      edges.forEach(function (e) {
        var a = P[e.a.id], b = P[e.b.id];
        var alpha = e.thin ? 0.09 : 0.2;
        if (pointer) {
          var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          var d = Math.hypot(mx - pointer.x, my - pointer.y);
          if (d < 220) alpha += (1 - d / 220) * 0.22;
        }
        ctx.strokeStyle = "rgba(" + RGB.line + "," + alpha.toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // Ruta del ataque, resaltada mientras salta la alerta
      if (attackHot) {
        ctx.strokeStyle = "rgba(" + RGB.red + "," + (0.35 * (1 - alertAge / 1.6)).toFixed(3) + ")";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ATTACK.concat(["wazuh"]).forEach(function (id, i) {
          var p = P[id];
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }

      // El puntero se conecta a los nodos cercanos
      if (pointer) {
        nodes.forEach(function (n) {
          var p = P[n.id];
          var d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
          if (d < 150) {
            ctx.strokeStyle = "rgba(" + RGB.cyan + "," + ((1 - d / 150) * 0.35).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        });
      }

      // Paquetes
      packets.forEach(function (k) {
        var a = P[k.path[k.seg].id], b = P[k.path[k.seg + 1].id];
        var x = a.x + (b.x - a.x) * k.p, y = a.y + (b.y - a.y) * k.p;
        ctx.fillStyle = "rgba(" + k.color + ",.18)";
        ctx.beginPath();
        ctx.arc(x, y, k.r * 3.2, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = "rgba(" + k.color + ",.95)";
        ctx.beginPath();
        ctx.arc(x, y, k.r, 0, 6.283);
        ctx.fill();
      });

      // Nodos
      nodes.forEach(function (n) {
        var p = P[n.id];
        var near = pointer ? Math.hypot(p.x - pointer.x, p.y - pointer.y) < 150 : false;
        drawNode(n, p, near, n.id === "wazuh" && alert && alertAge < 2.4);
      });

      // Onda de la alerta en wazuh
      if (alert) {
        var w = P.wazuh;
        var k1 = clamp(alertAge / 1.4, 0, 1);
        ctx.strokeStyle = "rgba(" + RGB.red + "," + (0.7 * (1 - k1)).toFixed(3) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(w.x, w.y, 6 + k1 * 34, 0, 6.283);
        ctx.stroke();
        if (alertAge < 2.6) {
          var la = alertAge < 0.2 ? alertAge / 0.2 : alertAge > 2.1 ? (2.6 - alertAge) / 0.5 : 1;
          ctx.font = "500 11px 'IBM Plex Mono', ui-monospace, monospace";
          ctx.fillStyle = "rgba(" + RGB.red + "," + (0.9 * la).toFixed(3) + ")";
          ctx.textAlign = "right";
          ctx.fillText("alerta · 4625 inicio de sesión fallido", w.x - 12, w.y - 14);
          ctx.textAlign = "left";
        }
      }
    }

    function drawNode(n, p, near, alerting) {
      var c = alerting ? RGB.red : RGB.cyan;
      ctx.lineWidth = 1.3;
      if (n.kind === "endpoint") {
        ctx.fillStyle = "rgba(" + RGB.line + "," + (near ? 0.85 : 0.5) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, 6.283);
        ctx.fill();
        return;
      }
      ctx.fillStyle = "rgb(" + RGB.ink + ")";
      if (n.kind === "fw") {
        ctx.strokeStyle = "rgba(" + RGB.text + "," + (near ? 0.9 : 0.6) + ")";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 6);
        ctx.lineTo(p.x + 6, p.y);
        ctx.lineTo(p.x, p.y + 6);
        ctx.lineTo(p.x - 6, p.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (n.kind === "siem") {
        ctx.strokeStyle = "rgba(" + c + "," + (near || alerting ? 1 : 0.8) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, 6.283);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(" + c + ",.9)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, 6.283);
        ctx.fill();
      } else if (n.kind === "cloud") {
        ctx.strokeStyle = "rgba(" + RGB.line + "," + (near ? 0.9 : 0.6) + ")";
        ctx.setLineDash([2, 2.5]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, 6.283);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        var col = n.kind === "attacker" ? RGB.red : RGB.cyan;
        ctx.strokeStyle = "rgba(" + col + "," + (near ? 0.95 : 0.6) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.6, 0, 6.283);
        ctx.fill();
        ctx.stroke();
      }
      if (!compact && n.label) {
        ctx.font = "400 11px 'IBM Plex Mono', ui-monospace, monospace";
        ctx.fillStyle = "rgba(" + RGB.text + "," + (near ? 0.75 : 0.36) + ")";
        var right = n.x > 0.9;
        ctx.textAlign = right ? "right" : "left";
        ctx.fillText(n.label, p.x + (right ? -11 : 11), p.y + 4);
        ctx.textAlign = "left";
      }
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      step(dt);
      draw(clock);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reducedMotion() || !onScreen || doc.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener("resize", resize);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) start(); else stop();
      }).observe(hero);
    }
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) stop(); else start();
    });
    var onMotionChange = function () {
      if (reducedMotion()) { stop(); draw(clock); } else start();
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionChange);

    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (!running) draw(clock);
    });
    hero.addEventListener("pointerleave", function () {
      pointer = null;
      if (!running) draw(clock);
    });

    start();
  }

  /* 7. Página 404 ───────────────────────────────────────────────────────── */

  function init404() {
    var el = $("[data-pf-path]");
    if (el) el.textContent = decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g, "") || "/";
  }

  /* Arranque ────────────────────────────────────────────────────────────── */

  [initHeader, initReveal, initCounters, initScrollEffects, initFilters, initTerminal, initTopology, init404]
    .forEach(function (fn) {
      try { fn(); } catch (err) { if (window.console) console.error("[portfolio]", err); }
    });
})();
