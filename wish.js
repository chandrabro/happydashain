// Shared drawing code (used by index.html and admin.html).
// All positions/sizes in a template are fractions (0..1) of the image width/height,
// so one template works at any resolution.

var FONT = '"Noto Sans Devanagari", "Poppins", system-ui, sans-serif';
var imageCache = {};

function loadImage(src) {
  if (!imageCache[src]) {
    imageCache[src] = new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }
  return imageCache[src];
}

function loadPhotoFile(file) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function wrapLines(ctx, text, maxWidth) {
  var lines = [];
  String(text).split("\n").forEach(function (para) {
    var words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(""); return; }
    var line = words[0];
    for (var i = 1; i < words.length; i++) {
      var test = line + " " + words[i];
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else { lines.push(line); line = words[i]; }
    }
    lines.push(line);
  });
  return lines;
}

function drawText(ctx, text, x, y, sizePx, color, maxWidth, wrap) {
  if (!text || !text.trim()) return;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = sizePx * 0.12;
  ctx.shadowOffsetY = sizePx * 0.04;

  var size = sizePx;
  ctx.font = "700 " + size + "px " + FONT;
  if (!wrap) {
    while (size > 10 && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = "700 " + size + "px " + FONT;
    }
    ctx.fillText(text, x, y);
  } else {
    var lines = wrapLines(ctx, text, maxWidth);
    while (size > 14 && lines.length * size * 1.35 > sizePx * 8) {
      size -= 2;
      ctx.font = "700 " + size + "px " + FONT;
      lines = wrapLines(ctx, text, maxWidth);
    }
    var lh = size * 1.35;
    var startY = y - ((lines.length - 1) * lh) / 2;
    lines.forEach(function (l, i) { ctx.fillText(l, x, startY + i * lh); });
  }
  ctx.shadowColor = "transparent";
}

// t.src (if set) overrides t.image, used by the admin preview for local files.
async function drawWish(canvas, t, opts) {
  opts = opts || {};
  var name = opts.name || "", post = opts.post || "";
  var bg = await loadImage(t.src || t.image);
  var W = bg.naturalWidth, H = bg.naturalHeight;
  canvas.width = W;
  canvas.height = H;
  var ctx = canvas.getContext("2d");

  try {
    await Promise.all([
      document.fonts.load('700 40px "Noto Sans Devanagari"', name + post),
      document.fonts.load('700 40px "Poppins"', name + post),
    ]);
  } catch (e) {}

  ctx.drawImage(bg, 0, 0, W, H);
  var maxW = t.max_width * W;

  if (t.photo_enabled) {
    var d = t.photo_size * W, cx = t.photo_x * W, cy = t.photo_y * H;
    if (opts.photo) {
      var p = opts.photo;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      var s = Math.max(d / p.width, d / p.height);
      ctx.drawImage(p, cx - (p.width * s) / 2, cy - (p.height * s) / 2, p.width * s, p.height * s);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
      ctx.lineWidth = d * 0.025;
      ctx.strokeStyle = "#ffd700";
      ctx.stroke();
    } else if (opts.placeholder) {
      ctx.beginPath();
      ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fill();
      ctx.lineWidth = d * 0.02;
      ctx.strokeStyle = "#ffd700";
      ctx.setLineDash([d * 0.05, d * 0.04]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#333";
      ctx.font = "600 " + d * 0.14 + "px " + FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Photo", cx, cy);
    }
  }

  drawText(ctx, name, t.name_x * W, t.name_y * H, t.name_size * W, t.name_color, maxW, false);
  // "post_*" fields hold the designation text (key names kept so old templates.json files still work)
  drawText(ctx, post, t.post_x * W, t.post_y * H, t.post_size * W, t.post_color, maxW, true);
}
