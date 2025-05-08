// Leaflet地図の初期化
const map = L.map('map').setView([35.6812, 139.7671], 5);  // 初期位置とズーム設定

// OpenStreetMapのタイルレイヤーを地図に追加
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// IndexedDBの初期化とデータの保存
function initDB() {
  const request = indexedDB.open("photoApp", 1);

  request.onupgradeneeded = function(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("photos")) {
      const objectStore = db.createObjectStore("photos", { keyPath: "id", autoIncrement: true });
      objectStore.createIndex("photo", "photo", { unique: false });
    }
  };

  request.onsuccess = function(event) {
    const db = event.target.result;
    console.log("DB opened successfully!");
  };

  request.onerror = function(event) {
    console.error("Error opening database", event.target.error);
  };
}

// 写真のデータをIndexedDBに保存
function savePhotoToDB(photoData) {
  const request = indexedDB.open("photoApp", 1);

  request.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction("photos", "readwrite");
    const objectStore = transaction.objectStore("photos");
    const addRequest = objectStore.add(photoData);

    addRequest.onsuccess = function() {
      console.log("Photo saved to IndexedDB");
    };

    addRequest.onerror = function() {
      console.error("Error saving photo to IndexedDB");
    };
  };

  request.onerror = function(event) {
    console.error("Error opening database", event.target.error);
  };
}

// IndexedDBから写真を読み込んで表示
function loadImagesFromIndexedDB() {
  const request = indexedDB.open("photoApp", 1);

  request.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction("photos", "readonly");
    const objectStore = transaction.objectStore("photos");
    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function() {
      const photos = getAllRequest.result;
      displayImages(photos);
    };

    getAllRequest.onerror = function() {
      console.error("Error loading photos from IndexedDB");
    };
  };
}

// 写真を表示する関数
function displayImages(photos) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";  // 既存の画像をクリア

  photos.forEach(photo => {
    const imgElement = document.createElement("img");
    imgElement.src = photo.photo;  // 写真のURLを設定
    gallery.appendChild(imgElement);

    const marker = L.marker([photo.lat, photo.lng]).addTo(map);
    marker.bindPopup(`<img src="${photo.photo}" width="150"><p>${photo.memo}</p>`);
  });
}

// ページが読み込まれたときにデータを読み込む
window.addEventListener("load", function() {
  initDB();
  loadImagesFromIndexedDB();
});

// 写真をアップロードしたときの処理
document.getElementById("fileInput").addEventListener("change", function(event) {
  const files = event.target.files;
  if (files.length === 0) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Image = e.target.result;

    // EXIF情報から位置情報を抽出
    const img = new Image();
    img.onload = function() {
      EXIF.getData(img, function() {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lng = EXIF.getTag(this, "GPSLongitude");

        const photoData = {
          photo: base64Image,
          lat: lat ? convertToDecimal(lat) : 0,
          lng: lng ? convertToDecimal(lng) : 0,
          memo: ""
        };

        savePhotoToDB(photoData);  // IndexedDBに保存
        loadImagesFromIndexedDB();  // 画像を表示
      });
    };
    img.src = base64Image;
  };
  reader.readAsDataURL(files[0]);  // 最初の写真を読み込む
});

// 度分秒を10進数に変換する関数
function convertToDecimal(coord) {
  const d = coord[0].numerator / coord[0].denominator;
  const m = coord[1].numerator / coord[1].denominator;
  const s = coord[2].numerator / coord[2].denominator;
  return d + m / 60 + s / 3600;
}
