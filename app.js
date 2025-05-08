// 地図の設定
const map = L.map('map').setView([35.6812, 139.7671], 5); // 初期位置を東京に設定
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// 画像リストとローカルストレージのキー
const imageList = document.getElementById('imageList');
const STORAGE_KEY = "uchida_photos";

// 位置情報を変換する関数
function convertToDecimal(coord, ref) {
  const d = coord[0].numerator / coord[0].denominator;
  const m = coord[1].numerator / coord[1].denominator;
  const s = coord[2].numerator / coord[2].denominator;
  const dec = d + m / 60 + s / 3600;
  return (ref === 'S' || ref === 'W') ? -dec : dec;
}

// ローカルストレージに保存する関数
function saveToStorage(dataArray) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataArray));
}

// ローカルストレージからデータを読み込む関数
function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

// 画像をページに追加する関数
function addImageToPage(photoData, save = false) {
  const { base64, lat, lng, memo } = photoData;

  // 地図にマーカーを追加
  const marker = L.marker([lat, lng]).addTo(map);
  const popupContent = () => `<img src="${base64}" width="150"><br><p>${photoData.memo}</p>`;
  marker.bindPopup(popupContent());

  // 画像のリストアイテムを作成
  const item = document.createElement('div');
  item.className = 'imageItem';
  item.innerHTML = `
    <img src="${base64}">
    <textarea placeholder="ここにメモを書けます">${memo}</textarea>
    <button class="delete-btn">削除</button>
  `;

  // メモを保存するためのイベント
  const textarea = item.querySelector('textarea');
  textarea.addEventListener('input', () => {
    photoData.memo = textarea.value;
    saveToStorage(allPhotos);
    marker.setPopupContent(popupContent());
  });

  // 画像をクリックして地図にズームインするイベント
  item.querySelector('img').addEventListener('click', () => {
    map.setView([lat, lng], 15);
    marker.openPopup();
  });

  // 削除ボタンのイベント
  const deleteButton = item.querySelector('.delete-btn');
  deleteButton.addEventListener('click', () => {
    const index = allPhotos.findIndex(photo => photo.base64 === base64);
    if (index !== -1) {
      allPhotos.splice(index, 1);
      saveToStorage(allPhotos);
      item.remove();
      marker.remove();
    }
  });

  imageList.appendChild(item);

  // 新しい画像を保存する
  if (save) {
    allPhotos.push(photoData);
    saveToStorage(allPhotos);
  }
}

// すべての写真を保存している配列
let allPhotos = loadFromStorage();
allPhotos.forEach(photo => addImageToPage(photo));

// 画像アップロードイベント
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
          const lat = EXIF.getTag(this, "GPSLatitude");
          const lng = EXIF.getTag(this, "GPSLongitude");
          const latRef = EXIF.getTag(this, "GPSLatitudeRef");
          const lngRef = EXIF.getTag(this, "GPSLongitudeRef");

          if (lat && lng && latRef && lngRef) {
            const latitude = convertToDecimal(lat, latRef);
            const longitude = convertToDecimal(lng, lngRef);

            const newPhoto = {
              base64: base64,
              lat: latitude,
              lng: longitude,
              memo: ""
            };

            addImageToPage(newPhoto, true);
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
