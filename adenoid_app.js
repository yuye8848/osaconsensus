// OSAConsensus adenoid severity explorer
var GS = {
  comp_h: {en: "Cell-type composition by severity grade (donor dots, bar = group mean)", zh: "按严重度等级的细胞组成（点为供体，柱为组均值）"},
  grad_h: {en: "Tissue-level severity gradient — top 40 genes by trend p (ALL are FDR-non-significant; nominal layer)", zh: "组织层严重度梯度——趋势 p 前 40 基因（全部 FDR 不显著；名义层）"},
  path_h: {en: "Program scores along severity (ssGSEA, Step 6 adenoid echo)", zh: "沿严重度的程序分数（ssGSEA，Step 6 腺样体回声）"},
  ct: {en: "Cell type", zh: "细胞型"}, gene: {en: "Gene", zh: "基因"},
  trend: {en: "Trend logFC / step", zh: "趋势 logFC / 步"}, sv: {en: "Severe vs Control logFC", zh: "重度对对照 logFC"},
  prog: {en: "Program", zh: "程序"}, eff: {en: "Effect per severity step", zh: "每严重度步效应"}, fdr: {en: "FDR (trend)", zh: "FDR（趋势）"},
  ssgsea_note: {en: "Score-level (ssGSEA relative enrichment) statement — see the Methods page, item H15.", zh: "分数层面（ssGSEA 相对富集）陈述——见方法页 H15 项。"},
  order: {en: "Severity grades: Control → Mild → Moderate → Severe (23 donors: 4 / 7 / 6 / 6). No composition shift survives multiple-testing correction (min FDR 0.302, Step 4).", zh: "严重度等级：对照 → 轻度 → 中度 → 重度（23 名供体：4 / 7 / 6 / 6）。无组成移位通过多重校正（最小 FDR 0.302，Step 4）。"}
};
var LANG = "en", DATA = null, FID = null;
var ORDER = ["Control", "Mild", "Moderate", "Severe"];
function t(k) { return (GS[k] && GS[k][LANG]) || k; }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function fmt(v, nd) { return (v === null || v === undefined || v === "") ? "—" : (isNaN(Number(v)) ? esc(v) : Number(v).toFixed(nd == null ? 3 : nd)); }

function chart() {
  var ct = document.getElementById("adeCt").value;
  var groups = {};
  DATA.composition.forEach(function (r) {
    if (r.celltype !== ct) return;
    var g = r.group;
    (groups[g] = groups[g] || []).push(Number(r.proportion));
  });
  var labels = ORDER.filter(function (g) { return groups[g]; });
  Object.keys(groups).forEach(function (g) { if (labels.indexOf(g) < 0) labels.push(g); });
  var all = [];
  labels.forEach(function (l) { all = all.concat(groups[l]); });
  var mx = Math.max.apply(null, all) * 1.15 || 1;
  var W = 640, H = 250, padL = 44, padB = 30, padT = 10, bw = 54;
  function Y(v) { return padT + (mx - v) / mx * (H - padT - padB); }
  var s = '<svg width="100%" viewBox="0 0 ' + W + " " + H + '" role="img">';
  s += '<text x="4" y="' + (Y(mx / 1.15) + 4) + '" font-size="11">' + (mx / 1.15).toFixed(2) + "</text>";
  labels.forEach(function (l, gi) {
    var cx = padL + (gi + 0.5) * ((W - padL - 10) / labels.length);
    var vals = groups[l], mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(mean) + '" width="' + bw + '" height="' + (Y(0) - Y(mean)) + '" fill="#2b7ea8" fill-opacity="0.45"/>';
    vals.forEach(function (v, i) { s += '<circle cx="' + (cx + ((i * 29) % 37) - 18) + '" cy="' + Y(v) + '" r="3.2" fill="#17557a" fill-opacity="0.75"/>'; });
    s += '<text x="' + cx + '" y="' + (H - 8) + '" font-size="12" text-anchor="middle">' + esc(l) + " (n=" + vals.length + ")</text>";
  });
  document.getElementById("adeComp").innerHTML = s + "</svg>" + '<p class="small">' + t("order") + "</p>";
}
function render() {
  if (!DATA) return;
  document.getElementById("adeCompH").textContent = t("comp_h");
  document.getElementById("adeGradH").textContent = t("grad_h");
  document.getElementById("adePathH").textContent = t("path_h");
  document.getElementById("adeCtL").textContent = t("ct");
  var h = "<tr><th>" + t("gene") + "</th><th>" + t("trend") + "</th><th>p</th><th>FDR</th><th>" + t("sv") + "</th></tr>";
  DATA.gradient_top.forEach(function (r) {
    h += "<tr><td>" + esc(r.gene) + "</td><td>" + fmt(r.logFC) + "</td><td>" + fmt(r.p, 5) + "</td><td>" + fmt(r.fdr, 4) + "</td><td>" + fmt(r.sv) + "</td></tr>";
  });
  document.getElementById("adeGrad").innerHTML = h;
  if (FID && FID.adenoid) {
    var ph = "<tr><th>" + t("prog") + "</th><th>" + t("eff") + "</th><th>p</th><th>" + t("fdr") + "</th><th>" + t("sv") + "</th></tr>";
    FID.adenoid.forEach(function (r) {
      ph += "<tr><td>" + esc(r.program) + "</td><td>" + fmt(r.effect_trend_per_step) + "</td><td>" + fmt(r.p_trend, 4) + "</td><td>" + fmt(r.FDR_trend, 4) + "</td><td>" + fmt(r.effect_Sev_vs_Ctrl) + "</td></tr>";
    });
    document.getElementById("adePath").innerHTML = ph + '<tr><td colspan="5" class="small">' + t("ssgsea_note") + "</td></tr>";
  }
  chart();
}
window.OC_langChanged = function (l) { LANG = l; render(); };
document.addEventListener("DOMContentLoaded", function () {
  Promise.all([
    fetch("data/adenoid.json").then(function (r) { return r.json(); }),
    fetch("data/fidelity.json").then(function (r) { return r.json(); })
  ]).then(function (ds) {
    DATA = ds[0]; FID = ds[1];
    var cts = {};
    DATA.composition.forEach(function (r) { cts[r.celltype] = 1; });
    var sel = document.getElementById("adeCt");
    Object.keys(cts).sort().forEach(function (c) { var o = document.createElement("option"); o.value = c; o.textContent = c; sel.appendChild(o); });
    if (cts["T_CD4"]) sel.value = "T_CD4";
    sel.addEventListener("change", chart);
    render();
  });
});
