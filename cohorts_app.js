// OSAConsensus cohorts page app
var GS = {
  acc: {en: "Accession", zh: "编号"}, layer: {en: "Layer", zh: "分层"}, species: {en: "Species", zh: "物种"},
  tissue: {en: "Tissue", zh: "组织"}, modality: {en: "Modality", zh: "数据类型"}, n: {en: "Samples (GSM verified)", zh: "样本（GSM 核验）"},
  form: {en: "Data form", zh: "数据形式"}, protocol: {en: "CIH protocol (mined)", zh: "CIH 协议（挖掘）"},
  notes: {en: "Notes", zh: "备注"}, heldout: {en: "Step 7 held-out validation set (now used)", zh: "Step 7 留出验证集（已使用）"},
  ext: {en: "EXTERNAL ATLAS", zh: "外部图谱"},
  adenoid_row: {en: "Adenoid (paediatric OSA, severity grades)", zh: "腺样体（儿童 OSA，严重度分级）"},
  adenoid_notes: {en: "External single-cell atlas, not a GEO series. 23 donors; 238,500 cells deposited, 238,093 annotated (Step 4). Expression matrices only; TCR/BCR not verified and not used.", zh: "外部单细胞图谱，非 GEO 系列。23 名供体；沉积 238,500 细胞，注释 238,093（Step 4）。仅表达矩阵；TCR/BCR 未核验、未使用。"},
  fio2: {en: "FiO₂ nadir", zh: "FiO₂ 谷底"}, cyc: {en: "Cycle", zh: "循环"}, hrs: {en: "Daily", zh: "每日"}, dur: {en: "Duration", zh: "总时长"}, rec: {en: "Recovery arm", zh: "恢复臂"},
  count: {en: "series shown", zh: "显示系列数"}
};
var LANG = "en", DATA = [];
function t(k) { return (GS[k] && GS[k][LANG]) || k; }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

function render() {
  var lf = document.getElementById("fLayer").value, sf = document.getElementById("fSpecies").value,
      q = document.getElementById("fSearch").value.toUpperCase();
  var rows = DATA.filter(function (r) {
    if (lf && r.layer !== lf) return false;
    if (sf && r.species !== sf) return false;
    if (q && (r.accession + " " + r.tissue + " " + r.notes + " " + r.modality).toUpperCase().indexOf(q) < 0) return false;
    return true;
  });
  var h = "<tr><th>" + [t("acc"), t("layer"), t("species"), t("tissue"), t("modality"), t("n"), t("form"), t("protocol"), t("notes")].join("</th><th>") + "</th></tr>";
  rows.forEach(function (r) {
    var proto = "";
    if (r.fio2 || r.cycle || r.hours || r.duration || r.recovery) {
      proto = [r.fio2 && (t("fio2") + " " + r.fio2), r.cycle && (t("cyc") + " " + r.cycle),
               r.hours && (t("hrs") + " " + r.hours), r.duration && (t("dur") + " " + r.duration),
               r.recovery && (t("rec") + ": " + r.recovery)].filter(Boolean).join("; ");
    }
    var acc = r.ext ? esc(r.accession) :
      '<a href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + r.accession + '" target="_blank" rel="noopener">' + r.accession + "</a>";
    var badge = r.heldout ? ' <span class="tier tier-fdr_single">' + t("heldout") + "</span>" : "";
    h += "<tr><td>" + acc + badge + "</td><td>" + esc(r.layer) + "</td><td>" + esc(r.species) + "</td><td>" +
         esc(r.tissue) + "</td><td>" + esc(r.modality) + "</td><td>" + esc(r.n_gsm) + "</td><td>" + esc(r.form) +
         "</td><td>" + esc(proto) + "</td><td title=\"" + esc(r.notes) + "\">" + esc(r.notes.slice(0, 180)) + "…</td></tr>";
  });
  document.getElementById("cohTable").innerHTML = h + '<tr><td colspan="9" class="small">' + rows.length + " " + t("count") + "</td></tr>";
}
function init() {
  fetch("data/cohorts.json").then(function (r) { return r.json(); }).then(function (d) {
    DATA = d;
    DATA.push({accession: "Zenodo 16744164", layer: "human_EXTERNAL", species: "Homo sapiens",
               tissue: t("adenoid_row"), modality: "Single-cell RNA-seq (processed matrices)", n_gsm: "23 donors",
               form: "external atlas", notes: t("adenoid_notes"), ext: true, fio2: "", cycle: "", hours: "", duration: "", recovery: ""});
    var layers = {}, species = {};
    DATA.forEach(function (r) { layers[r.layer] = 1; species[r.species] = 1; });
    var fl = document.getElementById("fLayer"), fs = document.getElementById("fSpecies");
    Object.keys(layers).sort().forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = k; fl.appendChild(o); });
    Object.keys(species).sort().forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = k; fs.appendChild(o); });
    ["fLayer", "fSpecies", "fSearch"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", render);
      document.getElementById(id).addEventListener("change", render);
    });
    render();
  });
}
window.OC_langChanged = function (l) { LANG = l; if (DATA.length) { init_ext(); render(); } };
function init_ext() { // refresh bilingual row text on language switch
  DATA.forEach(function (r) { if (r.ext) { r.tissue = t("adenoid_row"); r.notes = t("adenoid_notes"); } });
}
document.addEventListener("DOMContentLoaded", init);
