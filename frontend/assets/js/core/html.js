export function ringSVG(pct){
  var r = 24;
  var c = 2 * Math.PI * r;
  var dash = c * Math.max(0, Math.min(100, pct)) / 100;
  return '<svg viewBox="0 0 56 56" width="52" height="52" aria-hidden="true">' +
    '<circle cx="28" cy="28" r="' + r + '" class="ring-track"/>' +
    '<circle cx="28" cy="28" r="' + r + '" class="ring-fill" style="stroke-dasharray:' + dash + ' ' + c + '"/>' +
    '<text x="28" y="32" text-anchor="middle" class="ring-label">' + pct + '%</text>' +
    '</svg>';
}

export function esc(s){
  return String(s).replace(/[&<>"']/g, function(m){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
  });
}
