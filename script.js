const sheetURL =
  "https://docs.google.com/spreadsheets/d/1AmeeLFrKQYjer_soHzYE5iLYjEpe3RIFb-oY1raxoAs/gviz/tq?tqx=out:json";

// ---------- สร้างแผนที่ ----------
// ใช้พิกัดจากข้อมูล (เช่น 13.69, 100.35) หรือพิกัดกลางของกรุงเทพฯ
const map = L.map("map").setView([13.694, 100.355], 14); // ปรับ view เริ่มต้น
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

let markers = [];

// ---------- ฟังก์ชันกำหนดไอคอน ----------
function getIcon(type) {
  type = (type || "").trim();

  switch (type) {
    case "จุดเสี่ยง":
    case "พื้นที่เสี่ยง":
    case "แหล่งมั่วสุม":
    case "เขตอันตราย":
    case "พื้นที่อันตราย":
    case "พื้นที่เปลี่ยว":
    case "บริเวณศาลสีแดง":
    case "(ขนดิน)": // เพิ่มเคสที่คล้ายกัน
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/4201/4201973.png", // Warning
        iconSize: [35, 35],
        iconAnchor: [17, 35],
      });
    case "สาธารณะ":
    case "ที่จ่ายไฟสาธารณะ":
    case "จุดรับส่งผู้โดยสารสาธารณะ":
    case "ท่อจ่ายน้ำสาธารณะ":
    case "พื้นที่อัตราที่สายไฟสาธารณะ":
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/2169/2169456.png", // Park bench
        iconSize: [35, 35],
        iconAnchor: [17, 35],
      });
    case "บริษัท":
    case "บริษัทรปอภ.":
    case "บริษัทฟอร์นิเจอร์(จุดเสี่ยง)":
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/9702/9702976.png", // Office
        iconSize: [35, 35],
        iconAnchor: [17, 35],
      });
    case "โรงงาน":
    case "โรงงานกระดาษ":
    case "โรงงานส่งออกต่างประเทศ":
    case "โรงงานเหล็ก":
    case "โรงงานแก๊ส":
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/1908/1908100.png", // Factory
        iconSize: [35, 35],
        iconAnchor: [17, 35],
      });
    case "โรงเรียน":
        return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/8074/8074788.png", // School
        iconSize: [35, 35],
        iconAnchor: [17, 35],
      });
    case "บ่อน้ำ":
        return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/7441/7441425.png", // Water
        iconSize: [35, 35],
        iconAnchor: [17, 35],
      });
    default:
      // ไอคอนเริ่มต้นสำหรับประเภทอื่นๆ
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/5726/5726678.png", // Generic pin
        iconSize: [25, 25],
        iconAnchor: [17, 35],
      });
  }
}

// ---------- โหลดข้อมูลจาก Google Sheet ----------
async function loadData() {
  const res = await fetch(sheetURL);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));
  const rows = json.table.rows;

  // ลบแถว header (แถวแรก) ออกจากข้อมูล
  rows.shift(); 

  return rows.map((r) => {
    // อ้างอิงคอลัมน์ตาม Sheet ใหม่:
    // A: Timestamp (0)
    // B: Latitude (1)
    // C: Longitude (2)
    // D: ResidentName (3)
    // E: HouseNumber (4)
    // F: Details (5) -> เราจะใช้เป็น Category
    
    // ตรวจสอบว่า r.c[1] และ r.c[2] ไม่ใช่ null ก่อน parseFloat
    const lat = r.c[1] ? parseFloat(r.c[1].v) : null;
    const lng = r.c[2] ? parseFloat(r.c[2].v) : null;

    return {
      Timestamp: r.c[0]?.v,
      Latitude: lat,
      Longitude: lng,
      ResidentName: r.c[3]?.v,
      HouseNumber: r.c[4]?.v,
      Category: r.c[5]?.v, // ใช้ 'Details' (คอลัมน์ F) เป็น Category
    };
  });
}

// ---------- แสดงหมุดบนแผนที่ ----------
function renderMarkers(data, filterType = "ทั้งหมด") {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];

  data.forEach((p) => {
    // ตรวจสอบว่ามีพิกัด Lat, Lng ที่ถูกต้องหรือไม่
    if (!p.Latitude || !p.Longitude || isNaN(p.Latitude) || isNaN(p.Longitude)) {
        console.warn("Invalid coordinates for:", p);
        return; // ข้ามข้อมูลแถวนี้ไปถ้าพิกัดไม่ถูกต้อง
    }

    const cleanCategory = (p.Category || "ไม่ระบุ").trim();

    if (filterType === "ทั้งหมด" || cleanCategory === filterType) {
      const marker = L.marker([p.Latitude, p.Longitude], {
        icon: getIcon(cleanCategory),
      }).addTo(map);

      const popupContent = `
        <b>สถานที่:</b> ${p.ResidentName || "-"}<br>
        <b>ประเภท:</b> ${cleanCategory}<br>
        <b>บ้านเลขที่:</b> ${p.HouseNumber || "-"}<br>
        <b>พิกัด:</b> ${p.Latitude.toFixed(6)}, ${p.Longitude.toFixed(6)}
      `;

      marker.bindPopup(popupContent);
      markers.push(marker);
    }
  });
}

// ---------- เริ่มต้น ----------
async function init() {
  try {
    const data = await loadData();
    // console.log(data); // ดูข้อมูลที่โหลดมาใน Console
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
  } catch (error) {
    console.error("ไม่สามารถโหลดข้อมูลจาก Google Sheet:", error);
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูลแผนที่");
  }
}

init();