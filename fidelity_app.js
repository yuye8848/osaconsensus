// OSAConsensus fidelity browser — pathway layer (Step 6). Ranking is positional only.
var GS = {
  rank_h: {en: "Fidelity ranking — positions only, no combination is permutation-significant", zh: "保真度排序——仅位置，无组合达置换显著"},
  mat_h: {en: "Pathway concordance matrix: animal cohort × program (effect vs human reference)", zh: "通路一致性矩阵：动物队列 × 程序（效应 vs 人类参照）"},
  combo: {en: "Combination (tissue × duration × background)", zh: "组合（组织 × 时长 × 背景）"},
  cohorts: {en: "Cohorts", zh: "队列"}, r: {en: "Profile r", zh: "画像 r"}, perm: {en: "Label-permutation p", zh: "标签置换 p"},
  sign: {en: "Signs agreeing", zh: "符号一致"}, human: {en: "Human chronic blood reference", zh: "人类慢性血液参照"},
  match: {en: "sign matches human", zh: "符号与人类一致"}, nomatch: {en: "sign opposite to human", zh: "符号与人类相反"},
  detail: {en: "Member cohorts of the selected combination", zh: "所选组合的成员队列"},
  ade: {en: "Adenoid tissue echo (Step 6, separate from the ranking): Circadian +0.324 per severity step (FDR 0.046), Hypoxia −0.395 per step — the human tissue layer echoes the same decoupling pattern descriptively.", zh: "腺样体组织回声（Step 6，与排序分开）：昼夜每严重度步 +0.324（FDR 0.046），低氧每步 −0.395——人类组织层以描述性方式呼应同一脱耦模式。"}
};
var LANG = "en", DATA = null;
var PROGS = ["Hypoxia", "Circadian", "Inflammation", "OxidativeStress"];
function t(k) { return (GS[k] && GS[k][LANG]) || k; }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function fmt(v, nd) { return (v === null || v === undefined || v === "") ? "—" : (isNaN(Number(v)) ? esc(v) : Number(v).toFixed(nd == null ? 3 : nd)); }
function cellBg(v) {
  if (v === null || v === undefined || isNaN(Number(v))) return "";
  var a = Math.min(1, Math.abs(Number(v)) / 1.2);
  return Number(v) >= 0 ? "background:rgba(176,42,42," + (0.12 + 0.5 * a) + ")" : "background:rgba(23,85,122," + (0.12 + 0.5 * a) + ")";
}
function render() {
  if (!DATA) return;
  document.getElementById("fidRankH").textContent = t("rank_h");
  document.getElementById("fidMatH").textContent = t("mat_h");
  var h = "<tr><th>#</th><th>" + t("combo") + "</th><th>" + t("cohorts") + "</th><th>" + t("r") + "</th><th>" + t("perm") + "</th><th>" + t("sign") + "</th>" +
          PROGS.map(function (p) { return "<th>" + p + "</th>"; }).join("") + "</tr>";
  DATA.ranking.forEach(function (r, i) {
    h += '<tr class="fidrow" data-i="' + i + '" style="cursor:pointer"><td>' + (i + 1) + "</td><td>" + esc(r.combo) + "</td><td>" + esc(r.cohorts) +
         "</td><td><b>" + fmt(r.profile_r) + "</b></td><td>" + fmt(r.perm_p) + "</td><td>" + esc(r.sign_agree) + "/4</td>" +
         PROGS.map(function (p) { return '<td style="' + cellBg(r[p]) + '">' + fmt(r[p], 2) + "</td>"; }).join("") + "</tr>";
  });
  document.getElementById("fidRank").innerHTML = h;
  // matrix
  var byCohort = {};
  DATA.matrix.forEach(function (r) { (byCohort[r.cohort] = byCohort[r.cohort] || {})[r.program] = r; });
  var mh = "<tr><th>" + t("cohorts") + "</th>" + PROGS.map(function (p) { return "<th>" + p + "</th>"; }).join("") + "</tr>";
  mh += '<tr><td><b>' + t("human") + "</b></td>" + PROGS.map(function (p) {
    return '<td style="' + cellBg(DATA.human_profile[p]) + '"><b>' + fmt(DATA.human_profile[p], 2) + "</b></td>";
  }).join("") + "</tr>";
  Object.keys(byCohort).sort().forEach(function (c) {
    mh += "<tr><td>" + esc(c) + " <span class='small'>" + esc(byCohort[c][PROGS[0]].tissue || "") + "</span></td>" + PROGS.map(function (p) {
      var r = byCohort[c][p];
      if (!r) return "<td>—</td>";
      var mark = (r.sign_match === true || r.sign_match === "TRUE") ? " ✓" : " ✗";
      return '<td style="' + cellBg(r.animal_effect) + '" title="' + (mark === " ✓" ? t("match") : t("nomatch")) + '">' + fmt(r.animal_effect, 2) + mark + "</td>";
    }).join("") + "</tr>";
  });
  document.getElementById("fidMat").innerHTML = mh;
  Array.prototype.forEach.call(document.querySelectorAll(".fidrow"), function (row) {
    row.addEventListener("click", function () {
      var r = DATA.ranking[Number(row.getAttribute("data-i"))];
      var wanted = String(r.cohorts).split(/[;,\s]+/).filter(Boolean);
      var rows = DATA.matrix.filter(function (m) { return wanted.indexOf(m.cohort) >= 0; });
      var dh = "<h3>" + t("detail") + ": " + esc(r.combo) + "</h3>";
      if (!rows.length) dh += '<p class="small">' + esc(r.cohorts) + "</p>";
      else {
        dh += '<div class="tblwrap"><table><tr><th>' + t("cohorts") + "</th>" + PROGS.map(function (p) { return "<th>" + p + "</th>"; }).join("") + "</tr>";
        var bc = {};
        rows.forEach(function (m) { (bc[m.cohort] = bc[m.cohort] || {})[m.program] = m; });
        Object.keys(bc).forEach(function (c) {
          dh += "<tr><td>" + esc(c) + "</td>" + PROGS.map(function (p) {
            var m = bc[c][p];
            return m ? '<td style="' + cellBg(m.animal_effect) + '">' + fmt(m.animal_effect, 2) + "</td>" : "<td>—</td>";
          }).join("") + "</tr>";
        });
        dh += "</table></div>";
      }
      dh += '<div class="warn">' + t("ade") + "</div>";
      document.getElementById("fidDetail").innerHTML = dh;
    });
  });
}
window.OC_langChanged = function (l) { LANG = l; render(); };
document.addEventListener("DOMContentLoaded", function () {
  fetch("data/fidelity.json").then(function (r) { return r.json(); }).then(function (d) { DATA = d; render(); });
});
