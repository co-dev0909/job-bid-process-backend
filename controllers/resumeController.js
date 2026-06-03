const generateResumeJsonWithDeepSeek = require("../services/generateResumeJsonWithDeepSeek");
const generateResumeDoc = require("../services/generateResumeDoc");
const { sanitizeString } = require('../utils/utils');

const generateResume = async (req, res) => {
  const profile = req.body.inputProfile;
  const jobDescription = req.body.jobDescription;
  const companyName = sanitizeString(req.body.companyName);
  const jobTitle = sanitizeString(req.body.jobTitle);
  const name = req.body.name;
  const template = profile.template;

  try {
    const improvedResumeJSON = await generateResumeJsonWithDeepSeek(profile, jobDescription);
    const generatedResumeURL = await generateResumeDoc(improvedResumeJSON, companyName, name, jobTitle, template);

    res.status(200).json({
      resumeURL: generatedResumeURL
    });
  } catch (err) {
    res.status(400).json({err});
  }
};

module.exports = {
  generateResume
};
