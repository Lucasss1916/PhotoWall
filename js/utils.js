export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function shadowColorHex(color) {
  if (!color) return '#000000';
  if (color.startsWith('#')) return color;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return '#' + [m[1], m[2], m[3]].map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
  return '#000000';
}

export function setupUploadZone(zoneId, inputId, onFiles) {
  const zone  = document.getElementById(zoneId);
  const input = document.getElementById(inputId);

  input.addEventListener('change', () => {
    if (input.files.length) onFiles(input.files);
    input.value = '';
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const files = e.dataTransfer?.files;
    if (files?.length) onFiles(files);
  });
}
