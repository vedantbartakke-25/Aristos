/**
 * Generate a sample Soil Health Card PDF for testing.
 * Mimics the format of Indian government-issued Soil Health Cards.
 *
 * Usage: node scripts/generate-soil-card.mjs
 * Output: public/sample-soil-health-card.pdf
 */

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "..", "public", "sample-soil-health-card.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 40, bottom: 40, left: 50, right: 50 },
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// ── Colors ──
const green = "#2E7D32";
const darkGreen = "#1B5E20";
const orange = "#E65100";
const headerBg = "#E8F5E9";
const tableBorder = "#4CAF50";
const lightGray = "#F5F5F5";

// ── Helper: draw a filled rectangle ──
function drawRect(x, y, w, h, color) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

// ── Helper: draw table row ──
function drawTableRow(x, y, cols, widths, opts = {}) {
  const { bold, bg, fontSize: fs2, color: textColor } = opts;
  const rowHeight = 28;

  if (bg) drawRect(x, y, widths.reduce((a, b) => a + b, 0), rowHeight, bg);

  cols.forEach((text, i) => {
    const colX = x + widths.slice(0, i).reduce((a, b) => a + b, 0);
    doc
      .save()
      .rect(colX, y, widths[i], rowHeight)
      .stroke(tableBorder);

    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fs2 || 10)
      .fillColor(textColor || "#333")
      .text(text, colX + 6, y + 8, { width: widths[i] - 12, align: "left" });
    doc.restore();
  });

  return y + rowHeight;
}

// ════════════════════════════════════════════════════
// PAGE HEADER - Green banner
// ════════════════════════════════════════════════════

drawRect(0, 0, 595, 70, green);

doc
  .font("Helvetica-Bold")
  .fontSize(18)
  .fillColor("#FFFFFF")
  .text("SOIL HEALTH CARD", 50, 15, { width: 495, align: "center" });

doc
  .font("Helvetica")
  .fontSize(10)
  .fillColor("#E8F5E9")
  .text("Government of India - Ministry of Agriculture & Farmers Welfare", 50, 40, {
    width: 495,
    align: "center",
  });

// ════════════════════════════════════════════════════
// SUB-HEADER
// ════════════════════════════════════════════════════

drawRect(50, 85, 495, 25, headerBg);
doc
  .font("Helvetica-Bold")
  .fontSize(11)
  .fillColor(darkGreen)
  .text("Soil Health Card Report", 50, 91, { width: 495, align: "center" });

// ════════════════════════════════════════════════════
// FARMER DETAILS
// ════════════════════════════════════════════════════

let y = 130;

doc.font("Helvetica-Bold").fontSize(12).fillColor(darkGreen).text("Farmer Details", 50, y);
y += 20;

const detailsLeft = [
  ["Card Number", "SHC-2026-MH-047821"],
  ["Farmer Name", "Shri Vedant Bartakke"],
  ["Village", "Sinnar"],
  ["Taluka", "Sinnar"],
];

const detailsRight = [
  ["Date of Issue", "15-03-2026"],
  ["State", "Maharashtra"],
  ["District", "Nashik"],
  ["Survey No.", "142/A"],
];

detailsLeft.forEach(([label, value], i) => {
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#555").text(label + ":", 55, y + i * 18);
  doc.font("Helvetica").fontSize(9).fillColor("#333").text(value, 160, y + i * 18);
});

detailsRight.forEach(([label, value], i) => {
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#555").text(label + ":", 320, y + i * 18);
  doc.font("Helvetica").fontSize(9).fillColor("#333").text(value, 420, y + i * 18);
});

y += 85;

// ── Divider ──
doc.save().moveTo(50, y).lineTo(545, y).strokeColor("#CCCCCC").lineWidth(0.5).stroke().restore();
y += 15;

// ════════════════════════════════════════════════════
// SOIL SAMPLE DETAILS
// ════════════════════════════════════════════════════

doc.font("Helvetica-Bold").fontSize(12).fillColor(darkGreen).text("Soil Sample Information", 50, y);
y += 22;

const sampleCols = ["Parameter", "Value"];
const sampleWidths = [245, 250];

y = drawTableRow(50, y, sampleCols, sampleWidths, { bold: true, bg: headerBg, color: darkGreen });
y = drawTableRow(50, y, ["Sample Collection Date", "10-02-2026"], sampleWidths, { bg: lightGray });
y = drawTableRow(50, y, ["Sample Number", "NSK-SIN-2026-0478"], sampleWidths);
y = drawTableRow(50, y, ["Soil Type", "Black Cotton Soil (Vertisol)"], sampleWidths, { bg: lightGray });
y = drawTableRow(50, y, ["Testing Laboratory", "District Soil Testing Lab, Nashik"], sampleWidths);
y = drawTableRow(50, y, ["Depth of Sample", "0-15 cm"], sampleWidths, { bg: lightGray });

y += 20;

// ════════════════════════════════════════════════════
// SOIL NUTRIENT ANALYSIS - THE KEY SECTION
// ════════════════════════════════════════════════════

doc.font("Helvetica-Bold").fontSize(12).fillColor(darkGreen).text("Soil Nutrient Analysis Results", 50, y);
y += 22;

const nutrientCols = ["Parameter", "Value", "Unit", "Status"];
const nutrientWidths = [150, 100, 100, 145];

y = drawTableRow(50, y, nutrientCols, nutrientWidths, { bold: true, bg: headerBg, color: darkGreen });

// Primary Nutrients (N, P, K) - these are what our parser looks for
y = drawTableRow(50, y, ["Nitrogen (N)", "58.4", "kg/ha", "Medium"], nutrientWidths, { bg: lightGray });
y = drawTableRow(50, y, ["Phosphorus (P)", "42.7", "kg/ha", "Medium"], nutrientWidths);
y = drawTableRow(50, y, ["Potassium (K)", "196.5", "kg/ha", "High"], nutrientWidths, { bg: lightGray });

y += 5;

// Secondary Nutrients
y = drawTableRow(50, y, ["Organic Carbon (OC)", "0.62", "%", "Medium"], nutrientWidths);
y = drawTableRow(50, y, ["Sulphur (S)", "12.8", "mg/kg", "Medium"], nutrientWidths, { bg: lightGray });

y += 5;

// Physical Properties - includes pH
y = drawTableRow(50, y, ["pH", "6.8", "--", "Normal"], nutrientWidths);
y = drawTableRow(50, y, ["Electrical Conductivity (EC)", "0.38", "dS/m", "Normal"], nutrientWidths, { bg: lightGray });

y += 5;

// Micronutrients
y = drawTableRow(50, y, ["Zinc (Zn)", "0.82", "mg/kg", "Sufficient"], nutrientWidths);
y = drawTableRow(50, y, ["Iron (Fe)", "6.45", "mg/kg", "Sufficient"], nutrientWidths, { bg: lightGray });
y = drawTableRow(50, y, ["Manganese (Mn)", "4.20", "mg/kg", "Sufficient"], nutrientWidths);
y = drawTableRow(50, y, ["Copper (Cu)", "1.15", "mg/kg", "Sufficient"], nutrientWidths, { bg: lightGray });
y = drawTableRow(50, y, ["Boron (B)", "0.58", "mg/kg", "Sufficient"], nutrientWidths);

y += 25;

// ════════════════════════════════════════════════════
// RECOMMENDATIONS
// ════════════════════════════════════════════════════

doc.font("Helvetica-Bold").fontSize(12).fillColor(darkGreen).text("Fertilizer Recommendations", 50, y);
y += 20;

doc
  .font("Helvetica")
  .fontSize(9)
  .fillColor("#444")
  .text(
    "Based on the soil analysis, the following fertilizer doses are recommended for optimal crop yield:",
    55,
    y,
    { width: 480 }
  );
y += 25;

const recCols = ["Crop", "Nitrogen", "Phosphorus", "Potassium"];
const recWidths = [130, 120, 120, 125];

y = drawTableRow(50, y, recCols, recWidths, { bold: true, bg: headerBg, color: darkGreen });
y = drawTableRow(50, y, ["Soybean", "25 kg/ha Urea", "150 kg/ha SSP", "25 kg/ha MOP"], recWidths, { bg: lightGray });
y = drawTableRow(50, y, ["Wheat", "130 kg/ha Urea", "125 kg/ha SSP", "35 kg/ha MOP"], recWidths);
y = drawTableRow(50, y, ["Maize", "175 kg/ha Urea", "100 kg/ha SSP", "40 kg/ha MOP"], recWidths, { bg: lightGray });

y += 30;

// ════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════

// Divider
doc.save().moveTo(50, y).lineTo(545, y).strokeColor("#CCCCCC").lineWidth(0.5).stroke().restore();
y += 12;

doc
  .font("Helvetica-Bold")
  .fontSize(8)
  .fillColor("#888")
  .text("Note: This is a computer-generated Soil Health Card. Values are based on laboratory analysis.", 50, y, {
    width: 495,
    align: "center",
  });

y += 15;

doc
  .font("Helvetica")
  .fontSize(8)
  .fillColor("#AAA")
  .text("Issued under the Soil Health Card Scheme, Department of Agriculture, Govt. of India", 50, y, {
    width: 495,
    align: "center",
  });

// ── Bottom green bar ──
drawRect(0, 800, 595, 42, green);
doc
  .font("Helvetica")
  .fontSize(8)
  .fillColor("#E8F5E9")
  .text("www.soilhealth.dac.gov.in  |  Helpline: 1800-180-1551  |  Soil Health Card Scheme", 50, 815, {
    width: 495,
    align: "center",
  });

// ── Finalize ──
doc.end();

stream.on("finish", () => {
  console.log(`Sample Soil Health Card PDF generated at:`);
  console.log(`  ${outputPath}`);
  console.log();
  console.log(`Embedded soil values for parser testing:`);
  console.log(`  Nitrogen (N)   : 58.4 kg/ha`);
  console.log(`  Phosphorus (P) : 42.7 kg/ha`);
  console.log(`  Potassium (K)  : 196.5 kg/ha`);
  console.log(`  pH             : 6.8`);
});
