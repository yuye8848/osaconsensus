// OSAConsensus gene-set scorer — hypergeometric enrichment + binomial direction concordance, fully client-side.
var GS = {
  panel: {en: "Panel", zh: "面板"}, tier: {en: "Tier", zh: "层级"}, size: {en: "Panel size", zh: "面板大小"},
  overlap: {en: "Overlap", zh: "重叠"}, hp: {en: "Hypergeometric p", zh: "超几何 p"},
  conc: {en: "Direction concordance", zh: "方向一致性"}, bp: {en: "Binomial p (one-sided)", zh: "二项 p（单侧）"},
  hits: {en: "Hit genes (click row to expand)", zh: "命中基因（点击行展开）"},
  nuser: {en: "genes parsed from your list", zh: "从你的清单解析到的基因"},
  nodir: {en: "no directions given", zh: "未提供方向"},
  match_note: {en: "Symbols are matched case-insensitively within each panel's own species. This is NOT ortholog mapping — for ortholog-resolved per-gene records use the Gene query page. Panels marked with a warning carry Step 7 adjudications that limit how a score may be read.", zh: "符号在各面板自身物种内不区分大小写匹配。这不是同源映射——同源解析的逐基因记录请用单基因查询页。带警告的面板附有 Step 7 裁定，限定其分数的解读方式。"},
  empty: {en: "Paste a gene list first.", zh: "请先粘贴基因清单。"},
  species: {en: "Species", zh: "物种"}, universe: {en: "Background", zh: "背景"}
};
var LANG = "en", PANELS = null;
function t(k) { return (GS[k] && GS[k][LANG]) || k; }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function tierTxt(key) { var d = window.OC_I18N && window.OC_I18N["tier_" + key]; return d ? d[LANG] : key; }
function warnTxt(key) { var d = window.OC_I18N && window.OC_I18N[key]; return d ? d[LANG] : ""; }

// log-gamma (Lanczos) + hypergeometric survival function
function lgamma(z) {
  var c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1; var x = c[0], i;
  for (i = 1; i < 9; i++) x += c[i] / (z + i);
  var tt = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(tt) - tt + Math.log(x);
}
function lchoose(n, k) { if (k < 0 || k > n) return -Infinity; return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1); }
function hyperP(N, K, n, k) { // P(X >= k)
  if (k <= 0) return 1;
  var s = 0, i;
  for (i = k; i <= Math.min(K, n); i++) s += Math.exp(lchoose(K, i) + lchoose(N - K, n - i) - lchoose(N, n));
  return Math.min(1, s);
}
function binomP(c, m) { // P(X >= c), p=0.5
  if (m === 0) return null;
  var s = 0, i;
  for (i = c; i <= m; i++) s += Math.exp(lchoose(m, i)) * Math.pow(0.5, m);
  return Math.min(1, s);
}
function fmtP(p) { if (p === null || p === undefined) return "—"; if (p < 0.001) return p.toExponential(2); return p.toFixed(4); }

function parseInput() {
  var txt = document.getElementById("scoInput").value;
  var map = {}; // UPPER -> dir (+1/-1/0)
  txt.split(/\r?\n/).forEach(function (line) {
    var parts = line.trim().split(/[\s,\t;]+/).filter(Boolean);
    if (!parts.length) return;
    var sym = parts[0].toUpperCase(), dir = 0;
    if (parts.length > 1) {
      var v = parts[1].toLowerCase();
      if (v === "+" || v === "up" || v === "upregulated") dir = 1;
      else if (v === "-" || v === "−" || v === "down" || v === "downregulated") dir = -1;
      else { var f = parseFloat(v); if (!isNaN(f)) dir = f > 0 ? 1 : (f < 0 ? -1 : 0); }
    }
    map[sym] = dir;
  });
  return map;
}
function run() {
  if (!PANELS) return;
  var user = parseInput(), syms = Object.keys(user);
  var out = document.getElementById("scoOut");
  if (!syms.length) { out.innerHTML = "<p>" + t("empty") + "</p>"; return; }
  var results = PANELS.map(function (p) {
    var pdir = {};
    p.up.forEach(function (g) { pdir[g.toUpperCase()] = 1; });
    p.down.forEach(function (g) { pdir[g.toUpperCase()] = -1; });
    var K = p.up.length + p.down.length, N = p.universe;
    var hits = syms.filter(function (s) { return pdir[s] !== undefined; });
    var n = Math.min(syms.length, N);
    var hp = hyperP(N, K, n, hits.length);
    var m = 0, c = 0;
    hits.forEach(function (s) { if (user[s] !== 0) { m++; if (user[s] === pdir[s]) c++; } });
    return { p: p, K: K, hits: hits, hp: hp, m: m, c: c, bp: m >= 3 ? binomP(c, m) : null, pdir: pdir };
  }).sort(function (a, b) { return a.hp - b.hp; });
  var anyDir = syms.some(function (s) { return user[s] !== 0; });
  var h = '<p class="small">' + syms.length + " " + t("nuser") + (anyDir ? "" : " (" + t("nodir") + ")") + ". " + t("match_note") + "</p>";
  h += '<div class="tblwrap"><table><tr><th>' + t("panel") + "</th><th>" + t("tier") + "</th><th>" + t("species") + "</th><th>" +
       t("size") + "</th><th>" + t("universe") + "</th><th>" + t("overlap") + "</th><th>" + t("hp") + "</th><th>" +
       t("conc") + "</th><th>" + t("bp") + "</th></tr>";
  results.forEach(function (r, i) {
    var name = LANG === "zh" ? r.p.name_zh : r.p.name_en;
    h += '<tr class="scorow" data-i="' + i + '" style="cursor:pointer"><td>' + esc(name) + (r.p.warn ? ' <span class="tier tier-revoked">⚠</span>' : "") +
      '</td><td><span class="tier tier-' + r.p.tier + '">' + esc(tierTxt(r.p.tier)) + "</span></td><td>" + esc(r.p.species) +
      "</td><td>" + r.K + "</td><td>" + r.p.universe + "</td><td>" + r.hits.length + "</td><td>" + fmtP(r.hp) + "</td><td>" +
      (r.m ? (r.c + "/" + r.m + " = " + (r.c / r.m).toFixed(3)) : "—") + "</td><td>" + fmtP(r.bp) + "</td></tr>";
    var hitTxt = r.hits.map(function (s) {
      var d = r.pdir[s];
      return s + " (" + (d > 0 ? "↑" : "↓") + (user[s] !== 0 ? (user[s] === d ? " ✓" : " ✗") : "") + ")";
    }).join(", ");
    var warn = r.p.warn ? '<div class="warn">' + esc(warnTxt(r.p.warn)) + "</div>" : "";
    h += '<tr class="hitrow" data-i="' + i + '" style="display:none"><td colspan="9">' + warn + '<span class="small">' + t("hits") + ":</span> " + esc(hitTxt || "—") + "</td></tr>";
  });
  h += "</table></div>";
  out.innerHTML = h;
  Array.prototype.forEach.call(out.querySelectorAll(".scorow"), function (row) {
    row.addEventListener("click", function () {
      var tr = out.querySelector('.hitrow[data-i="' + row.getAttribute("data-i") + '"]');
      tr.style.display = tr.style.display === "none" ? "" : "none";
    });
  });
}
function loadExample() {
  if (!PANELS) return;
  var p = PANELS.filter(function (x) { return x.id === "P283"; })[0];
  var lines = p.up.map(function (g) { return g + "\t1"; }).concat(p.down.map(function (g) { return g + "\t-1"; }));
  document.getElementById("scoInput").value = lines.join("\n");
}
window.OC_langChanged = function (l) { LANG = l; };
document.addEventListener("DOMContentLoaded", function () {
  fetch("data/panels.json").then(function (r) { return r.json(); }).then(function (d) { PANELS = d; });
  document.getElementById("scoRun").addEventListener("click", run);
  document.getElementById("scoEx").addEventListener("click", loadExample);
});
