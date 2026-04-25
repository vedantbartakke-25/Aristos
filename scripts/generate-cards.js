import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const generatePDF = (filename, data) => {
  const doc = new PDFDocument({ margin: 50 });
  const filepath = path.join(process.cwd(), 'public', filename);
  
  doc.pipe(fs.createWriteStream(filepath));

  // --- Header ---
  doc.fontSize(22).font('Helvetica-Bold').text('Soil Health Card', { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(12).font('Helvetica').text('Government of India (Ministry of Agriculture)', { align: 'center' });
  doc.moveDown(1.5);

  // --- Divider ---
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // --- Farmer Details ---
  doc.fontSize(14).font('Helvetica-Bold').text('Farmer Details', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Farmer Name: ${data.farmer.name}`);
  doc.text(`Village: ${data.farmer.village}`);
  doc.text(`District: ${data.farmer.district}, State: ${data.farmer.state}`);
  doc.text(`Date of Issue: ${data.farmer.date}`);
  doc.text(`Soil Type: ${data.farmer.soilType}`);
  doc.moveDown(1);

  // --- Soil Sample Information ---
  doc.fontSize(14).font('Helvetica-Bold').text('Soil Sample Information', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Sample Number: ${data.sample.number}`);
  doc.text(`Depth: ${data.sample.depth}`);
  doc.text(`Testing Lab: ${data.sample.lab}`);
  doc.moveDown(1);

  // --- Soil Nutrient Analysis Table ---
  doc.fontSize(14).font('Helvetica-Bold').text('Soil Nutrient Analysis', { underline: true });
  doc.moveDown(0.5);
  
  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 250;
  const col3 = 400;

  // Table Header
  doc.font('Helvetica-Bold');
  doc.text('Parameter', col1, tableTop);
  doc.text('Value', col2, tableTop);
  doc.text('Status', col3, tableTop);
  
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Table Rows
  let y = tableTop + 25;
  doc.font('Helvetica');
  
  data.nutrients.forEach(nut => {
    doc.text(nut.param, col1, y);
    doc.text(nut.value, col2, y);
    doc.text(nut.status, col3, y);
    y += 20;
  });
  
  doc.moveTo(50, y).lineTo(550, y).stroke();
  doc.moveDown(2);

  // --- Recommendations ---
  // Reset X to default margin after absolute positioning in table
  doc.x = 50;
  doc.y = y + 20;
  
  doc.fontSize(14).font('Helvetica-Bold').text('Fertilizer / Crop Recommendation', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica');
  doc.text(`Recommended Crops: ${data.crops.join(', ')}`);
  
  doc.end();
  console.log(`Generated: ${filepath}`);
};

const scenarios = [
  {
    filename: 'Balanced_Soil_Health_Card.pdf',
    data: {
      farmer: { name: 'Rajesh Kumar', village: 'Rampur', district: 'Pune', state: 'Maharashtra', date: '2026-04-25', soilType: 'Black Soil' },
      sample: { number: 'SHC-2026-BAL-001', depth: '15 cm', lab: 'Regional Soil Testing Lab, Pune' },
      nutrients: [
        { param: 'Nitrogen (N)', value: '55 kg/ha', status: 'Medium' },
        { param: 'Phosphorus (P)', value: '45 kg/ha', status: 'Medium' },
        { param: 'Potassium (K)', value: '190 kg/ha', status: 'High' },
        { param: 'pH', value: '6.8', status: 'Neutral' },
        { param: 'Organic Carbon', value: '0.6%', status: 'Medium' }
      ],
      crops: ['Soybean', 'Wheat', 'Maize']
    }
  },
  {
    filename: 'Low_Fertility_Soil_Health_Card.pdf',
    data: {
      farmer: { name: 'Suresh Patil', village: 'Shivaji Nagar', district: 'Latur', state: 'Maharashtra', date: '2026-04-25', soilType: 'Red Soil' },
      sample: { number: 'SHC-2026-LOW-002', depth: '15 cm', lab: 'KVK Soil Lab, Latur' },
      nutrients: [
        { param: 'Nitrogen (N)', value: '25 kg/ha', status: 'Low' },
        { param: 'Phosphorus (P)', value: '20 kg/ha', status: 'Low' },
        { param: 'Potassium (K)', value: '115 kg/ha', status: 'Medium' },
        { param: 'pH', value: '5.5', status: 'Slightly acidic' },
        { param: 'Organic Carbon', value: '0.3%', status: 'Low' }
      ],
      crops: ['Millets', 'Pulses', 'Groundnut']
    }
  },
  {
    filename: 'High_Fertility_Soil_Health_Card.pdf',
    data: {
      farmer: { name: 'Anil Deshmukh', village: 'Wakad', district: 'Kolhapur', state: 'Maharashtra', date: '2026-04-25', soilType: 'Alluvial Soil' },
      sample: { number: 'SHC-2026-HIGH-003', depth: '15 cm', lab: 'State Agri Lab, Kolhapur' },
      nutrients: [
        { param: 'Nitrogen (N)', value: '90 kg/ha', status: 'High' },
        { param: 'Phosphorus (P)', value: '70 kg/ha', status: 'High' },
        { param: 'Potassium (K)', value: '240 kg/ha', status: 'High' },
        { param: 'pH', value: '7.2', status: 'Slightly alkaline' },
        { param: 'Organic Carbon', value: '0.9%', status: 'High' }
      ],
      crops: ['Rice', 'Sugarcane', 'Cotton']
    }
  }
];

scenarios.forEach(scenario => {
  generatePDF(scenario.filename, scenario.data);
});
