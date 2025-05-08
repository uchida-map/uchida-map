// script.js
const map = L.map('map').setView([35.6812, 139.7671], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const STORAGE_KEY = 'uchida_photos';
let allPhotos = loadFromStorage();

function convertToDecimal(coord, ref) {
  const d = coord[0].numerator / coord[0].denominator;
  const m = coord[1].numerator / coord[1].denominator;
  const s = coord[2].numerator / coord[2].denominator;
  const dec = d + m / 60 + s / 3600;
  return (ref === 'S' || ref === 'W') ? -dec : dec;
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allPhotos));
}

function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function addImageToPage(photoData) {
  const { base64, lat, lng, memo } = photoData;
  const marker = L.marker([lat, lng]).addTo(map);
  const popupContent = () => `<img src="${base64}" width="150"><br><p>${photoData.memo}</p>`;
  marker.bindPopup(popupContent());

  const imageList = document.getElementById('imageList');
  const item = document.createElement('div');
  item.className = 'imageItem';
  item.innerHTML = `
    <img src="${base64}">
    <textarea placeholder="メモを書く">${memo}</textarea>
    <button class="delete">削除</button>
  `;
  item.querySelector('textarea').addEventListener('input', (e) => {
    photoData.memo = e.target.value;
    saveToStorage();
    marker.setPopupContent(popupContent());
  });

  item.querySelector('img').addEventListener('click', () => {
    map.setView([lat, lng], 15);
    marker.openPopup();
  });

  item.querySelector('.delete').addEventListener('click', () => {
    allPhotos = allPhotos.filter(photo => photo.base64 !== base64);
    saveToStorage();
    imageList.removeChild(item);
    map.removeLayer(marker);
  });

  imageList.appendChild(item);
}

document.getElementById('fileInput').addEventListener('change', function (e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const base64 = event.target.result;
      const img = new Image();
      img.onload = function () {
        EXIF.getData(img, function () {
          const lat = EXIF.getTag(this, 'GPSLatitude');
          const lng = EXIF.getTag(this, 'GPSLongitude');
          const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
          const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');

          if (lat && lng && latRef && lngRef) {
            const latitude = convertToDecimal(lat, latRef);
            const longitude = convertToDecimal(lng, lngRef);

            const newPhoto = {
              base64: base64,
              lat: latitude,
              lng: longitude,
              memo: ''
            };

            addImageToPage(newPhoto);
            allPhotos.push(newPhoto);
            saveToStorage();
          } else {
            alert(`位置情報が含まれていない画像: ${file.name}`);
          }
        });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  });
});

allPhotos.forEach(photo => addImageToPage(photo));
