// OSAConsensus gene query app
var GS = {
  blood: {en: "Human blood cohorts (Step 3)", zh: "人类血液队列（Step 3）"},
  fat: {en: "Human adipose cohorts (Step 3)", zh: "人类脂肪队列（Step 3）"},
  xs: {en: "Cross-species animal responses — program-set genes (Step 6)", zh: "跨物种动物响应 — 程序集基因（Step 6）"},
  ade: {en: "Adenoid severity gradient (Step 4)", zh: "腺样体严重度梯度（Step 4）"},
  pbmc: {en: "PBMC cell-type effects, GSE214865 (Step 4)", zh: "PBMC 细胞型效应，GSE214865（Step 4）"},
  cohort: {en: "Cohort / contrast", zh: "队列 / 对比"}, tissue: {en: "Tissue", zh: "组织"},
  set: {en: "Program set", zh: "程序集"}, tg: {en: "Ortholog", zh: "同源基因"}, map: {en: "Mapping", zh: "映射"},
  dir: {en: "Set direction", zh: "集合方向"}, conc: {en: "Concordant", zh: "一致"},
  ct: {en: "Cell type", zh: "细胞型"}, trend: {en: "Trend logFC / severity step", zh: "趋势 logFC / 严重度步"},
  sv: {en: "Severe vs Control logFC", zh: "重度对对照 logFC"},
  notfound: {en: "Gene not found in any table of this resource.", zh: "该基因不在本资源任何表中。"},
  none: {en: "Not measured / not in this table.", zh: "未测得 / 不在此表。"},
  xs_note: {en: "Cross-species rows exist only for program-set genes. “Concordant” is relative to the human set direction.", zh: "跨物种行仅覆盖程序集基因。“一致”是相对于人类集合方向。"},
  pbmc_note: {en: "Donor-level pseudobulk; in Step 4 no cell type had any FDR-significant gene — descriptive values.", zh: "供体层拟bulk；Step 4 中所有细胞型均无 FDR 显著基因——描述性数值。"},
  fat_warn: {en: "Warning: the GSE135917 column comes from a globally shifted contrast (Step 7 F-06) — interpret with the global-shift warning.", zh: "警告：GSE135917 列来自全局平移的对比（Step 7 F-06）——须结合全局平移警告解读。"},
  saliva: {en: "GSE237281 saliva (registry layer)", zh: "GSE237281 唾液（登记层）"}
};
var LANG = "en", INDEX = null, LAST = null;
function t(k) { return (GS[k] && GS[k][LANG]) || k; }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function fmt(v, nd) { return (v === null || v === undefined) ? "—" : Number(v).toFixed(nd == null ? 3 : nd); }
function shardOf(sym) { var c = sym.toUpperCase().charAt(0); return /[A-Z]/.test(c) ? c : "0"; }

function loadIndex() {
  if (INDEX) return Promise.resolve(INDEX);
  return fetch("data/gene_index.json").then(function (r) { return r.json(); }).then(function (d) { INDEX = d; return d; });
}
function acShow() {
  var inp = document.getElementById("geneInput"), list = document.getElementById("acList");
  var q = inp.value.trim().toUpperCase();
  if (q.length < 2) { list.style.display = "none"; return; }
  loadIndex().then(function (idx) {
    var hits = idx.filter(function (g) { return g.toUpperCase().indexOf(q) === 0; }).slice(0, 12);
    if (!hits.length) { list.style.display = "none"; return; }
    list.innerHTML = hits.map(function (g) { return "<div>" + esc(g) + "</div>"; }).join("");
    list.style.display = "block";
    Array.prototype.forEach.call(list.children, function (el) {
      el.addEventListener("click", function () { inp.value = el.textContent; list.style.display = "none"; query(); });
    });
  });
}
function query() {
  document.getElementById("acList").style.display = "none";
  var sym = document.getElementById("geneInput").value.trim();
  if (!sym) return;
  var key = sym.toUpperCase();
  fetch("data/gene/" + shardOf(key) + ".json").then(function (r) { return r.json(); }).then(function (d) {
    var rec = d[key];
    LAST = { sym: sym, rec: rec };
    render();
  }).catch(function () { document.getElementById("geneOut").innerHTML = "<p>" + t("notfound") + "</p>"; });
}
function sec(title, inner) { return inner ? "<h2>" + title + "</h2>" + inner : ""; }
function render() {
  if (!LAST) return;
  var rec = LAST.rec, out = document.getElementById("geneOut");
  if (!rec) { out.innerHTML = "<h2>" + esc(LAST.sym) + "</h2><p>" + t("notfound") + "</p>"; return; }
  var h = "<h2>" + esc(rec.sym) + "</h2>";
  if (rec.blood) {
    var b = rec.blood;
    h += sec(t("blood"), '<div class="tblwrap"><table><tr><th>' + t("cohort") + "</th><th>logFC</th><th>FDR / p</th></tr>" +
      "<tr><td>GSE75097 OSA vs snoring</td><td>" + fmt(b.g75097.logFC) + "</td><td>" + fmt(b.g75097.fdr, 4) + "</td></tr>" +
      "<tr><td>GSE283703 OSA vs healthy</td><td>" + fmt(b.g283703.logFC) + "</td><td>" + fmt(b.g283703.fdr, 4) + "</td></tr>" +
      "<tr><td>" + t("saliva") + "</td><td>" + fmt(b.saliva.logFC) + "</td><td>p " + fmt(b.saliva.p, 4) + "</td></tr></table></div>");
  }
  if (rec.fat) {
    var f = rec.fat;
    h += sec(t("fat"), '<div class="tblwrap"><table><tr><th>' + t("cohort") + "</th><th>logFC</th><th>FDR</th></tr>" +
      "<tr><td>GSE38792 visceral fat OSA vs control</td><td>" + fmt(f.g38792.logFC) + "</td><td>" + fmt(f.g38792.fdr, 4) + "</td></tr>" +
      "<tr><td>GSE135917 subcutaneous fat OSA vs normal (sex-adj)</td><td>" + fmt(f.g135917.logFC) + "</td><td>" + fmt(f.g135917.fdr, 4) + "</td></tr></table></div>" +
      '<div class="warn">' + t("fat_warn") + "</div>");
  }
  if (rec.xs && rec.xs.length) {
    var rows = rec.xs.map(function (r) {
      return "<tr><td>" + esc(r.set || "—") + "</td><td>" + esc(r.cohort) + "</td><td>" + esc(r.tissue) + "</td><td>" +
        esc(r.sp) + " " + esc(r.tg || "") + "</td><td>" + esc(r.mc) + "</td><td>" + esc(r.dir || "") + "</td><td>" +
        fmt(r.logFC) + "</td><td>" + fmt(r.fdr, 4) + "</td><td>" + esc(r.conc || "") + "</td></tr>";
    }).join("");
    h += sec(t("xs"), '<p class="small">' + t("xs_note") + '</p><div class="tblwrap"><table><tr><th>' + t("set") + "</th><th>" +
      t("cohort") + "</th><th>" + t("tissue") + "</th><th>" + t("tg") + "</th><th>" + t("map") + "</th><th>" + t("dir") +
      "</th><th>logFC</th><th>FDR</th><th>" + t("conc") + "</th></tr>" + rows + "</table></div>");
  }
  if (rec.adenoid) {
    var a = rec.adenoid, rows2 = "";
    if (a.tissue) rows2 += "<tr><td>TISSUE (all)</td><td>" + fmt(a.tissue.logFC) + "</td><td>" + fmt(a.tissue.p, 4) + "</td><td>" + fmt(a.tissue.fdr, 4) + "</td><td>" + fmt(a.tissue.sv) + "</td></tr>";
    (a.cells || []).forEach(function (c) {
      rows2 += "<tr><td>" + esc(c.ct) + "</td><td>" + fmt(c.logFC) + "</td><td>" + fmt(c.p, 4) + "</td><td>" + fmt(c.fdr, 4) + "</td><td>" + fmt(c.sv) + "</td></tr>";
    });
    h += sec(t("ade"), '<div class="tblwrap"><table><tr><th>' + t("ct") + "</th><th>" + t("trend") + "</th><th>p</th><th>FDR</th><th>" + t("sv") + "</th></tr>" + rows2 + "</table></div>");
  }
  if (rec.pbmc && rec.pbmc.length) {
    var rows3 = rec.pbmc.map(function (r) { return "<tr><td>" + esc(r.ct) + "</td><td>" + fmt(r.logFC) + "</td><td>" + fmt(r.fdr, 4) + "</td></tr>"; }).join("");
    h += sec(t("pbmc"), '<p class="small">' + t("pbmc_note") + '</p><div class="tblwrap"><table><tr><th>' + t("ct") + "</th><th>logFC</th><th>FDR</th></tr>" + rows3 + "</table></div>");
  }
  if (!rec.blood && !rec.fat && !rec.xs && !rec.adenoid && !rec.pbmc) h += "<p>" + t("none") + "</p>";
  out.innerHTML = h;
}
window.OC_langChanged = function (l) { LANG = l; if (LAST) render(); };
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("geneInput").addEventListener("input", acShow);
  document.getElementById("geneInput").addEventListener("blur", function () {
    setTimeout(function () { document.getElementById("acList").style.display = "none"; }, 200);
  });
  document.getElementById("geneInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") query();
    if (e.key === "Escape") document.getElementById("acList").style.display = "none";
  });
  document.getElementById("geneGo").addEventListener("click", query);
  document.addEventListener("click", function (e) { if (!e.target.closest(".autocomplete")) document.getElementById("acList").style.display = "none"; });
});
