const map = L.map('map').setView([35.6812, 139.7671], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// IndexedDBの設定
const DB_NAME = 'uchida_map_db';
const DB_VERSION = 1;
const DB_STORE_NAME = 'photos';

// IndexedDBのオープンとデータストレージの準備
let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME, { keyPath: 'base64' });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event);
    };
  });
}

// 写真データをIndexedDBに保存
function saveToIndexedDB(photoData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(DB_STORE_NAME);
    const request = store.put(photoData);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event);
    };
  });
}

// IndexedDBから全ての写真データを取得
function getAllPhotosFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE_NAME, 'readonly');
    const store = transaction.objectStore(DB_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event);
    };
  });
}

// 写真を削除する
function deletePhotoFromIndexedDB(base64) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(DB_STORE_NAME);
    const request = store.delete(base64);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event);
    };
  });
}

// 写真をページに追加
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
    saveToIndexedDB(photoData).then(() => {
      marker.setPopupContent(popupContent());
    });
  });

  item.querySelector('img').addEventListener('click', () => {
    map.setView([lat, lng], 15);
    marker.openPopup();
  });

  item.querySelector('.delete').addEventListener('click', () => {
    deletePhotoFromIndexedDB(base64);
    imageList.removeChild(item);
    map.removeLayer(marker);
  });

  imageList.appendChild(item);
}

// 写真アップロード
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
            saveToIndexedDB(newPhoto);
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

// 初期化処理：IndexedDBから既存の写真を読み込んで表示
openDatabase().then(() => {
  getAllPhotosFromIndexedDB().then((photos) => {
    photos.forEach(photo => addImageToPage(photo));
  }).catch(err => {
    console.error("写真の取得に失敗しました", err);
  });
});
