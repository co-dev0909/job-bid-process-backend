const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const path = require('path');
const dotenv = require("dotenv");
const libre = require('libreoffice-convert');
const { uploadFileToDrive, findOrCreateDriveFolder } = require('./uploadToDrive');
dotenv.config();


const formatSkills = (skillsArray) => {
  return skillsArray.map((entry) => {
    const category = Object.keys(entry)[0];
    const skillsString = entry[category];
    return {
      category,
      skillsLine: skillsString // already comma-separated string
    };
  });
};

const convertToPDF = async (inputPath, outputPath) => {
  const docxBuf = fs.readFileSync(inputPath);
  try {
    const pdfBuf = await new Promise((resolve, reject) => {
      const maybePromise = libre.convert(docxBuf, '.pdf', undefined, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });

      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then(resolve).catch(reject);
      }
    });
    fs.writeFileSync(outputPath, pdfBuf);
    return true;
  } catch (err) {
    const message = (err && err.message) || "";
    if (message.includes("Could not find soffice binary")) {
      console.warn("PDF conversion skipped: LibreOffice (soffice) not found. DOCX is still generated.");
      return false;
    }

    console.error("Error converting DOCX to PDF:", err);
    return false;
  }
};

const generateResumeDoc = async (data, companyName, name, jobTitle, template, uploadToDrive = false) => {
  if (!data || !Array.isArray(data.skills)) {
    throw new Error("Invalid resume data: expected a JSON object with a skills array.");
  }

  const formattedSkills = formatSkills(data.skills);
  const filePath = path.resolve(__dirname, `../templates/resume/${template}.docx`);
  if (!fs.existsSync(filePath)) throw new Error(`Template file not found: ${filePath}`);
  const templateFile = fs.readFileSync(filePath, 'binary');

  // Create a new PizZip instance and load the docx template
  const zip = new PizZip(templateFile);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  // Prepare data for template
  const templateData = {
    name: data.contact.name,
    location: data.contact.location,
    email: data.contact.email,
    phone: data.contact.phone,
    linkedin: data.contact.linkedin,
    summary: data.summary,
    skills: formattedSkills,
    experiences: data.experiences,
    projects: data.projects,
    educations: data.educations,
    certificates: data.certificates
  };

  try {
    doc.render(templateData);
  } catch (error) {
    console.error("Error rendering template:", error);
    throw error;
  }

  // Generate DOCX buffer
  const output = doc.getZip().generate({ type: 'nodebuffer' });

  // Create directory for saving
  const dirPath = path.resolve(__dirname, `../generated-resumes/${name}/${companyName}/${jobTitle}`);
  fs.mkdirSync(dirPath, { recursive: true });

  // Save DOCX
  const fileName = `${name}.docx`;
  const outputFilePath = path.join(dirPath, fileName);
  fs.writeFileSync(outputFilePath, output);

  // Convert to PDF
  const pdfFilePath = outputFilePath.replace(/\.docx$/, '.pdf');
  const pdfGenerated = await convertToPDF(outputFilePath, pdfFilePath);

  // Initialize result object
  const result = {
    docxURL: `/resumes/${name}/${companyName}/${jobTitle}/${fileName}`,
    pdfURL: pdfGenerated
      ? `/resumes/${name}/${companyName}/${jobTitle}/${path.basename(pdfFilePath)}`
      : null
  };

  // Upload DOCX to Google Drive if enabled.
  if (uploadToDrive) {
    try {
      const nameFolder = await findOrCreateDriveFolder(name);
      const companyFolder = await findOrCreateDriveFolder(companyName, nameFolder.folderId);
      const jobFolder = await findOrCreateDriveFolder(jobTitle, companyFolder.folderId);

      const docxUploadResult = await uploadFileToDrive(
        outputFilePath,
        fileName,
        jobFolder.folderId
      );

      result.driveLinks = {
        docxLink: docxUploadResult.webViewLink,
        docxDownloadLink: docxUploadResult.publicDownloadLink,
      };

      console.log(`Resume DOCX uploaded to Google Drive: ${jobFolder.folderLink}`);

      // Keep local storage tidy once Drive has the canonical copy.
      fs.unlinkSync(outputFilePath);
      if (pdfGenerated && fs.existsSync(pdfFilePath)) {
        fs.unlinkSync(pdfFilePath);
      }
    } catch (error) {
      console.error("Error uploading DOCX to Google Drive:", error);
      throw error;
    }
  }

  // Return both local URLs and Google Drive links (if applicable)
  return result;
};

module.exports = generateResumeDoc;
