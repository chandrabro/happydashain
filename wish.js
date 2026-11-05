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

// Builds the outline of the photo frame. shape: circle | square | rounded | hexagon | diamond | heart | star
// d = width/height of the frame box, (cx, cy) = its centre. Old templates without a shape use "circle".
function shapePath(ctx, shape, cx, cy, d) {
  var r = d / 2, i, a, x, y;
  ctx.beginPath();
  if (shape === "square") {
    ctx.rect(cx - r, cy - r, d, d);
  } else if (shape === "rounded") {
    var k = d * 0.18, l = cx - r, t = cy - r, rr = cx + r, b = cy + r;
    ctx.moveTo(l + k, t);
    ctx.arcTo(rr, t, rr, b, k);
    ctx.arcTo(rr, b, l, b, k);
    ctx.arcTo(l, b, l, t, k);
    ctx.arcTo(l, t, rr, t, k);
  } else if (shape === "hexagon" || shape === "diamond" || shape === "star") {
    var n = shape === "hexagon" ? 6 : shape === "diamond" ? 4 : 10;
    for (i = 0; i < n; i++) {
      var rad = r;
      if (shape === "star") rad = i % 2 === 0 ? r : r * 0.45;
      a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      if (shape === "hexagon") a += Math.PI / 6;
      x = cx + rad * Math.cos(a);
      y = cy + rad * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  } else if (shape === "heart") {
    var top = cy - r * 0.55;
    ctx.moveTo(cx, cy + r);
    ctx.bezierCurveTo(cx - r * 1.35, cy + r * 0.1, cx - r * 0.95, top - r * 0.45, cx, top + r * 0.2);
    ctx.bezierCurveTo(cx + r * 0.95, top - r * 0.45, cx + r * 1.35, cy + r * 0.1, cx, cy + r);
  } else {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
  ctx.closePath();
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
      shapePath(ctx, t.photo_shape, cx, cy, d);
      ctx.clip();
      var s = Math.max(d / p.width, d / p.height);
      ctx.drawImage(p, cx - (p.width * s) / 2, cy - (p.height * s) / 2, p.width * s, p.height * s);
      ctx.restore();
      shapePath(ctx, t.photo_shape, cx, cy, d);
      ctx.lineWidth = d * 0.025;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#ffd700";
      ctx.stroke();
    } else if (opts.placeholder) {
      shapePath(ctx, t.photo_shape, cx, cy, d);
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
