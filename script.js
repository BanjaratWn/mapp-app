const sheetURL =
  "https://docs.google.com/spreadsheets/d/1QUwjnXh1z_MN9wIw9IAo1rgew332gRQ-S5NRWJDp0VI/gviz/tq?tqx=out:json"; // แก้ไข URL เพื่อให้ดึงข้อมูลในรูปแบบ JSON ได้ง่ายขึ้น

// ---------- สร้างแผนที่ ----------
const map = L.map("map").setView([13.7563, 100.5018], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

let markers = [];

// ---------- ฟังก์ชันกำหนดไอคอน ----------
function getIcon(type) {
  type = (type || "").trim();

  switch (type) {
    case "โรงเรียน":
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/1000/1000787.png", // Icon โรงเรียน
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    case "โรงพยาบาล":
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/3233/3233510.png", // Icon โรงพยาบาล
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    case "วัด":
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/963/963965.png", // Icon วัด (ตัวอย่าง)
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    default:
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png", // Icon ทั่วไป (default)
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
  }
}

// ---------- โหลดข้อมูลจาก Google Sheet ----------
async function loadData() {
  const res = await fetch(sheetURL);
  const text = await res.text();
  // ตัดส่วนที่ไม่ใช่ JSON ออก และแปลงเป็น Object
  const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const json = JSON.parse(jsonString);
  const rows = json.table.rows;

  return rows.map((r) => {
    // ปรับการอ่านข้อมูลให้ตรงกับ Index ของ Column ใน Google Sheet ที่ให้มา
    return {
      name: r.c[1]?.v, // Column B: name
      type: r.c[2]?.v, // Column C: type
      lat: parseFloat(r.c[3]?.v), // Column D: lat
      lng: parseFloat(r.c[4]?.v), // Column E: lng
    };
  }).filter(item => item.name && item.type && !isNaN(item.lat) && !isNaN(item.lng)); // กรองข้อมูลที่ไม่สมบูรณ์ออก
}


// ---------- แสดงหมุดบนแผนที่ ----------
function renderMarkers(data, filterType = "ทั้งหมด") {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];

  data.forEach((p) => {
    if (!p.lat || !p.lng) return;

    const cleanType = (p.type || "").trim();

    if (filterType === "ทั้งหมด" || cleanType === filterType) {
      const marker = L.marker([p.lat, p.lng], {
        icon: getIcon(cleanType),
      }).addTo(map);

      const popupContent = `
        <b>ชื่อ:</b> ${p.name || "-"}<br>
        <b>ประเภท:</b> ${cleanType || "-"}
      `;

      marker.bindPopup(popupContent);
      markers.push(marker);
    }
  });
}

// ---------- เริ่มต้น ----------
async function init() {
  const data = await loadData();
  renderMarkers(data);

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderMarkers(data, btn.dataset.type);
    });
  });
}
init();