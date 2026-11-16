(function () {
  "use strict";

  var form = document.getElementById("form");
  var statusEl = document.getElementById("status");
  var btnPdf = document.getElementById("btn-pdf");
  var btnClear = document.getElementById("btn-clear");

  var BLUE = [29, 78, 216];
  var BLACK = [10, 15, 30];
  var GRAY = [91, 101, 119];

  function setError(name, msg) {
    var el = form.querySelector('.error[data-for="' + name + '"]');
    if (el) {
      el.textContent = msg || "";
      var field = el.closest(".field") || el.parentElement;
      if (field && field.classList) field.classList.toggle("invalid", !!msg);
    }
  }

  function normalizeInstagram(raw) {
    return raw.trim().replace(/^@+/, "").replace(/\s+/g, "");
  }

  function readData() {
    var temas = Array.prototype.map.call(
      form.querySelectorAll('input[name="temas"]:checked'),
      function (i) { return i.value; }
    );
    var outro = form.temaOutro.value.trim();
    if (outro) temas.push(outro + " (sugestão)");
    var formato = form.querySelector('input[name="formato"]:checked');
    var posts = form.posts.value;
    return {
      nome: form.nome.value.trim(),
      setor: form.setor.value.trim(),
      instagram: normalizeInstagram(form.instagram.value),
      temas: temas,
      formato: formato ? formato.value : "",
      posts: posts,
      postsLabel: posts ? form.posts.options[form.posts.selectedIndex].text : "",
      ciente: document.getElementById("ciente-check").checked
    };
  }

  function validate(d) {
    var ok = true;
    function check(cond, name, msg) {
      setError(name, cond ? "" : msg);
      if (!cond) ok = false;
    }
    check(d.nome.length >= 3, "nome", "Informe seu nome completo.");
    check(d.setor.length >= 2, "setor", "Informe o seu setor.");
    check(/^[A-Za-z0-9._]{1,30}$/.test(d.instagram), "instagram",
      "Informe um @ válido (letras, números, ponto e sublinhado).");
    check(d.temas.length > 0, "temas", "Escolha ao menos um tema de interesse.");
    check(!!d.formato, "formato", "Escolha um formato.");
    check(!!d.posts, "posts", "Selecione quantos posts por mês.");
    check(d.ciente, "ciente", "Confirme que está ciente das responsabilidades.");
    return ok;
  }

  function loadLogo() {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext("2d").drawImage(img, 0, 0);
          resolve({ data: c.toDataURL("image/png"), w: c.width, h: c.height });
        } catch (e) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = "logo.png";
    });
  }

  function buildPdf(d, logo) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var W = 210, M = 18, CW = W - M * 2;
    var y;

    // Cabeçalho preto com logo
    doc.setFillColor.apply(doc, BLACK);
    doc.rect(0, 0, W, 48, "F");
    doc.setFillColor.apply(doc, BLUE);
    doc.rect(0, 48, W, 2.2, "F");

    var textX = M;
    if (logo) {
      var lh = 34, lw = lh * logo.w / logo.h;
      doc.addImage(logo.data, "PNG", M, 7, lw, lh);
      textX = M + lw + 8;
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.text("Colabs LAPBE no Instagram", textX, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(190, 205, 245);
    doc.text("Candidatura de ligante para as férias", textX, 30);
    doc.setFontSize(9);
    doc.text("Liga Acadêmica de Psicologia Baseada em Evidências", textX, 37);

    y = 64;

    function section(title) {
      if (y > 262) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor.apply(doc, BLUE);
      doc.text(title.toUpperCase(), M, y);
      doc.setDrawColor.apply(doc, BLUE);
      doc.setLineWidth(0.5);
      doc.line(M, y + 2, M + CW, y + 2);
      y += 10;
    }

    function row(label, value) {
      var lines = doc.splitTextToSize(value || "—", CW - 52);
      var need = Math.max(lines.length * 5.6, 6) + 3;
      if (y + need > 282) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor.apply(doc, GRAY);
      doc.text(label, M, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11.5);
      doc.setTextColor.apply(doc, BLACK);
      doc.text(lines, M + 52, y);
      y += need;
    }

    section("Dados do ligante");
    row("Nome", d.nome);
    row("Setor", d.setor);
    row("Instagram", "@" + d.instagram);

    y += 4;
    section("Disponibilidade e interesses");
    row("Temas de interesse", d.temas.join("; "));
    row("Formato preferido", d.formato);
    row("Posts por mês", d.postsLabel);

    y += 4;
    section("Como funciona a colaboração");
    var rules = [
      "O ligante é responsável pela escrita dos roteiros.",
      "Os roteiros serão revisados pela diretoria.",
      "As artes e edições serão feitas pela diretoria e seguirão a identidade visual da liga (azul, branco e preto)."
    ];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor.apply(doc, BLACK);
    rules.forEach(function (r) {
      var lines = doc.splitTextToSize(r, CW - 8);
      if (y + lines.length * 5.6 > 282) { doc.addPage(); y = 20; }
      doc.setFillColor.apply(doc, BLUE);
      doc.circle(M + 1.5, y - 1.2, 1, "F");
      doc.text(lines, M + 6, y);
      y += lines.length * 5.6 + 2;
    });

    y += 4;
    if (y > 258) { doc.addPage(); y = 20; }
    doc.setFillColor(232, 239, 255);
    doc.roundedRect(M, y, CW, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, BLUE);
    doc.text("Ciente e de acordo com as responsabilidades acima.", M + 5, y + 8.7);

    // Rodapé com data
    var now = new Date();
    var data = now.toLocaleDateString("pt-BR") + " às " +
      now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    var pages = doc.getNumberOfPages();
    for (var p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor.apply(doc, GRAY);
      doc.text("Gerado em " + data, M, 290);
      doc.text("LAPBE · Página " + p + " de " + pages, W - M, 290, { align: "right" });
    }
    return doc;
  }

  function slug(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    statusEl.textContent = "";
    statusEl.className = "hint";
    var d = readData();
    if (!validate(d)) {
      var first = form.querySelector(".field.invalid, .notice .error:not(:empty)");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      statusEl.textContent = "Faltam alguns campos. Confira os avisos em vermelho.";
      return;
    }
    if (!window.jspdf) {
      statusEl.textContent = "Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente de novo.";
      return;
    }
    btnPdf.disabled = true;
    loadLogo().then(function (logo) {
      var doc = buildPdf(d, logo);
      doc.save("colab-lapbe-" + (slug(d.nome) || "ligante") + ".pdf");
      statusEl.textContent = "PDF gerado! Envie o arquivo para a diretoria da LAPBE.";
      statusEl.className = "hint ok";
    }).catch(function () {
      statusEl.textContent = "Algo deu errado ao gerar o PDF. Tente novamente.";
    }).then(function () { btnPdf.disabled = false; });
  });

  form.addEventListener("input", function (ev) {
    var n = ev.target.name === "ciente" ? "ciente" : ev.target.name;
    if (n) setError(n, "");
  });

  btnClear.addEventListener("click", function () {
    form.reset();
    form.querySelectorAll(".error").forEach(function (e) { e.textContent = ""; });
    form.querySelectorAll(".invalid").forEach(function (e) { e.classList.remove("invalid"); });
    statusEl.textContent = "";
  });
})();
