const sheetURL =
  "https://docs.google.com/spreadsheets/d/14zHbCIhkZ0G12ms4J4NvPI3h1m2ONbR5GykCfrGMvq8/gviz/tq?tqx=out:json";

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
    case "ติดบ้าน":
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/619/619032.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    case "ติดเตียง":
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/3470/3470248.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    case "พิการ":
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/11993/11993670.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    default:
      return L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
  }
}

// ---------- โหลดข้อมูลจาก Google Sheet ----------
async function loadData() {
  const res = await fetch(sheetURL);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));
  const rows = json.table.rows;

  return rows.map((r) => {
    const caretakerRaw = r.c[5]?.v || "";

    // ✅ regex ครอบคลุมทุกแบบ: 0812345678 / 08-12345678 / 081-234-5678 / 08 1234 5678
    const phoneMatch = caretakerRaw.match(/0\d(?:[- ]?\d){8,9}/);
    const phone = phoneMatch ? phoneMatch[0] : "";
    const caretaker = caretakerRaw.replace(phone, "").trim();

    return {
      Timestamp: r.c[0]?.v,
      PatientName: r.c[1]?.v,
      HouseNumber: r.c[2]?.v,
      Soi: r.c[3]?.v,
      Type: r.c[4]?.v,
      Caretaker: caretaker,
      Details: r.c[6]?.v,
      Latitude: parseFloat(r.c[7]?.v),
      Longitude: parseFloat(r.c[8]?.v),
      Phone: phone,
    };
  });
}

// ---------- แสดงหมุดบนแผนที่ ----------
function renderMarkers(data, filterType = "ทั้งหมด") {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];

  data.forEach((p) => {
    if (!p.Latitude || !p.Longitude) return;

    const cleanType = (p.Type || "").trim();

    if (filterType === "ทั้งหมด" || cleanType === filterType) {
      const marker = L.marker([p.Latitude, p.Longitude], {
        icon: getIcon(cleanType),
      }).addTo(map);

      // ✅ เพิ่มเบอร์โทรพร้อมลิงก์โทรออกได้
      let phoneLink = "-";
      if (p.Phone) {
        const cleanPhone = p.Phone.replace(/[-\s]/g, "");
        phoneLink = `<a href="tel:${cleanPhone}" style="color:blue;">📞 โทร (${p.Phone})</a>`;
      }

      const popupContent = `
        <b>ชื่อ:</b> ${p.PatientName || "-"}<br>
        <b>ประเภท:</b> ${cleanType || "-"}<br>
        <b>ที่อยู่:</b> ${p.HouseNumber || ""} ${p.Soi || ""}<br>
        <b>ผู้ดูแล:</b> ${p.Caretaker || "-"}<br>
        <b>รายละเอียด:</b> ${p.Details || "-"}<br>
        <b>โทร:</b> ${phoneLink}
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