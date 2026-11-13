// OSAConsensus CPAP & recovery browser
var GS = {
  sum_h: {en: "Program-score reversal summary by design (Step 3, with Step 7 permutation update below)", zh: "逐设计的程序分数逆转汇总（Step 3，附 Step 7 置换更新）"},
  plot_h: {en: "Per-sample program scores", zh: "逐样本程序分数"},
  rec_h: {en: "CPAP vs animal recovery arms — asymmetric comparison (Step 6)", zh: "CPAP 与动物恢复臂——不对称对照（Step 6）"},
  design: {en: "Design", zh: "设计"}, set: {en: "Set", zh: "集合"}, type: {en: "Type", zh: "类型"}, n: {en: "n", zh: "n"},
  dz: {en: "Effect (dz)", zh: "效应（dz）"}, side: {en: "Side", zh: "侧"}, metric: {en: "Metric", zh: "指标"},
  value: {en: "Value", zh: "值"}, note: {en: "Note", zh: "备注"}, dataset: {en: "Dataset", zh: "数据集"},
  cohort: {en: "Cohort", zh: "队列"}, score_set: {en: "Program set", zh: "程序集"},
  perm_note: {en: "Step 7 update (10,000× gene-set permutation) supersedes the pooled Stouffer p-values: P283 pooled p = 0.149 (not significant); NOM18 pooled p = 0.043 (nominal, driven by the single GSE283703 design). Per-design permutation: only GSE283703 long CPAP is significant for P283 (p = 0.0135). Negative dz = reversal direction in within-subject designs.", zh: "Step 7 更新（10,000 次基因集置换）取代合并 Stouffer p 值：P283 合并 p = 0.149（不显著）；NOM18 合并 p = 0.043（名义，由 GSE283703 单设计驱动）。逐设计置换：P283 仅 GSE283703 长期 CPAP 显著（p = 0.0135）。受试者内设计中 dz 为负 = 逆转方向。"},
  stage_note: {en: "GSE283703 stage scores are the single program score as computed in Step 3 (donor stages Base / Short / Long CPAP).", zh: "GSE283703 分期分数为 Step 3 计算的单一程序分数（供体分期 Base / Short / Long CPAP）。"}
};
var LANG = "en", DATA = null;
var TYPE_ZH = {within_subject_paired: "受试者内配对", between_group_NOT_paired: "组间（非配对）", within_subject_paired_donoravg: "受试者内配对（供体平均）", combined_directional_Stouffer: "合并方向性 Stouffer", longitudinal_vs_healthy: "纵向对健康", longitudinal_gene_trajectory: "纵向基因轨迹", recovery_arm_single_timepoint: "恢复臂单时点", recovery_arm_residual_vs_never_exposed: "恢复臂残留对从未暴露"};
var SIDE_ZH = {human_CPAP: "人类 CPAP", animal_recovery: "动物恢复"};
var GROUP_ZH = {Pre: "前", Post: "后", "pre-CPAP": "CPAP 前", "post-CPAP": "CPAP 后", Normal: "正常", Untreated: "未治疗", NaiveOSA: "未治 OSA", CPAP: "CPAP", Snore: "鼾症", Base: "基线", Short: "短期", Long: "长期"};
var TRAJ_ZH = {non_reversing: "不逆转", partial_nominal_reversal: "部分名义逆转", late_reversal: "晚期逆转", early_reversal: "早期逆转"};
function zhLabel(map, v) { return LANG === "zh" ? (map[v] || v) : v; }
function metricTxt(v) { if (LANG !== "zh") return v; if (v === "program_score_change_dz") return "程序分数变化 dz"; if (v === "FDR_genes_remaining_longCPAP_vs_healthy_transcriptomewide") return "长期 CPAP 后对健康（全转录组）残留 FDR 基因数"; if (v === "fraction_recovery_logFC_opposite_to_exposure") return "恢复 logFC 与暴露反向的比例"; if (v === "fraction_still_nominally_changed_same_direction_after_recovery") return "恢复后仍名义同向变化的比例"; if (v.indexOf("trajectory_class:") === 0) return "轨迹类别：" + (TRAJ_ZH[v.slice(17)] || v.slice(17)); return v; }
function t(k) { return (GS[k] && GS[k][LANG]) || k; }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function fmt(v, nd) { return (v === null || v === undefined || v === "") ? "—" : (isNaN(Number(v)) ? esc(v) : Number(v).toFixed(nd == null ? 3 : nd)); }

function plot() {
  var acc = document.getElementById("cpapSel").value, set = document.getElementById("cpapSet").value;
  var el = document.getElementById("cpapPlot");
  var groups = {}; // group label -> [values]
  if (acc === "GSE283703") {
    DATA.stages283703.forEach(function (r) { (groups[r.stage] = groups[r.stage] || []).push(Number(r.score)); });
    el.innerHTML = dots(groups) + '<p class="small">' + t("stage_note") + "</p>";
    return;
  }
  var rows = DATA.samples[acc] || [];
  var gcol = rows.length ? (rows[0].time !== undefined ? "time" : (rows[0].arm !== undefined ? "arm" : "group")) : null;
  rows.forEach(function (r) { if (r[set] !== undefined && r[set] !== "") (groups[r[gcol]] = groups[r[gcol]] || []).push(Number(r[set])); });
  el.innerHTML = dots(groups);
}
function dots(groups) {
  var labels = Object.keys(groups);
  if (!labels.length) return "<p>—</p>";
  var all = [];
  labels.forEach(function (l) { all = all.concat(groups[l]); });
  var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
  if (mn === mx) { mn -= 1; mx += 1; }
  var W = Math.max(420, labels.length * 150), H = 260, padL = 46, padB = 30, padT = 12;
  function Y(v) { return padT + (mx - v) / (mx - mn) * (H - padT - padB); }
  var s = '<svg width="100%" viewBox="0 0 ' + W + " " + H + '" role="img">';
  s += '<line x1="' + padL + '" y1="' + Y(0) + '" x2="' + (W - 8) + '" y2="' + Y(0) + '" stroke="#bbb" stroke-dasharray="3 3"/>';
  s += '<text x="4" y="' + (Y(mx) + 4) + '" font-size="11">' + mx.toFixed(1) + '</text><text x="4" y="' + (Y(mn) + 4) + '" font-size="11">' + mn.toFixed(1) + "</text>";
  labels.forEach(function (l, gi) {
    var cx = padL + (gi + 0.5) * ((W - padL - 8) / labels.length);
    var vals = groups[l];
    vals.forEach(function (v, i) {
      var jx = cx + ((i * 37) % 41) - 20;
      s += '<circle cx="' + jx + '" cy="' + Y(v) + '" r="3.4" fill="#17557a" fill-opacity="0.65"/>';
    });
    var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    s += '<line x1="' + (cx - 26) + '" y1="' + Y(mean) + '" x2="' + (cx + 26) + '" y2="' + Y(mean) + '" stroke="#b02a2a" stroke-width="2.4"/>';
    s += '<text x="' + cx + '" y="' + (H - 8) + '" font-size="12" text-anchor="middle">' + esc(zhLabel(GROUP_ZH, l)) + " (n=" + vals.length + ")</text>";
  });
  return s + "</svg>";
}
function render() {
  if (!DATA) return;
  document.getElementById("cpapSumH").textContent = t("sum_h");
  document.getElementById("cpapPlotH").textContent = t("plot_h");
  document.getElementById("cpapRecH").textContent = t("rec_h");
  document.getElementById("cpapSelL").textContent = t("cohort");
  document.getElementById("cpapSetL").textContent = t("score_set");
  var h = "<tr><th>" + t("design") + "</th><th>" + t("set") + "</th><th>" + t("type") + "</th><th>" + t("n") + "</th><th>" + t("dz") + "</th><th>p</th></tr>";
  DATA.summary.forEach(function (r) {
    h += "<tr><td>" + esc(r.design) + "</td><td>" + esc(r.set) + "</td><td>" + esc(zhLabel(TYPE_ZH, r.type)) + "</td><td>" + (r.n_pairs === "" ? "n/a" : esc(r.n_pairs)) + "</td><td>" + fmt(r.effect_dz) + "</td><td>" + fmt(r.p_value, 4) + "</td></tr>";
  });
  document.getElementById("cpapSum").innerHTML = h;
  var rh = "<tr><th>" + t("side") + "</th><th>" + t("dataset") + "</th><th>" + t("set") + "</th><th>" + t("type") + "</th><th>" + t("n") + "</th><th>" + t("metric") + "</th><th>" + t("value") + "</th><th>p</th></tr>";
  DATA.recovery.forEach(function (r) {
    rh += "<tr><td>" + esc(zhLabel(SIDE_ZH, r.side)) + "</td><td>" + esc(r.dataset) + "</td><td>" + esc(r.set) + "</td><td>" + esc(zhLabel(TYPE_ZH, r.design_type)) + "</td><td>" + (r.n === "" ? "n/a" : esc(r.n)) + "</td><td>" + esc(metricTxt(r.metric)) + "</td><td>" + fmt(r.value) + "</td><td>" + fmt(r.p, 4) + "</td></tr>";
  });
  document.getElementById("cpapRec").innerHTML = rh + '<tr><td colspan="8"><div class="warn">' + t("perm_note") + "</div></td></tr>";
  plot();
}
window.OC_langChanged = function (l) { LANG = l; render(); };
document.addEventListener("DOMContentLoaded", function () {
  fetch("data/cpap.json").then(function (r) { return r.json(); }).then(function (d) {
    DATA = d;
    var sel = document.getElementById("cpapSel");
    Object.keys(d.samples).concat(["GSE283703"]).forEach(function (acc) {
      var o = document.createElement("option"); o.value = acc; o.textContent = acc; sel.appendChild(o);
    });
    sel.addEventListener("change", plot);
    document.getElementById("cpapSet").addEventListener("change", plot);
    render();
  });
});
