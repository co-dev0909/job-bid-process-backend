const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");
const generateResumeJsonWithDeepSeek = require("../services/generateResumeJsonWithDeepSeek");
const generateResumeDoc = require("../services/generateResumeDoc");
const { sanitizeString } = require("../utils/utils");

const createPendingApplication = async ({
  jobLink,
  jobTitle,
  companyName,
  jobDescription,
  profileId,
  userId,
}) => {
  return Application.create({
    job_title: jobTitle,
    company: companyName,
    job_url: jobLink,
    description: jobDescription,
    status: "Pending",
    profile: profileId,
    user: userId,
  });
};

const createJob = async (req, res) => {
  try {
    const { jobLink, jobTitle, companyName, jobDescription, profileId } = req.body;
    // Check for duplicate
    const existingJobLink = await Application.findOne({
      job_url: jobLink,
      profile: profileId,
    });

    const existingJobTitle = await Application.findOne({
      job_title: jobTitle,
      company: companyName,
      profile: profileId,
    });

    const existingJob = existingJobLink || existingJobTitle;

    if (existingJob) {
      return res.status(400).json({
        success: false,
        message: `A job with this ${existingJobLink ? "link" : "title"} already exists for this profile.`,
      });
    }

    // Create new job (don’t spread req.body directly)
    const newJob = await Job.create({
      jobLink,
      jobTitle,
      companyName,
      jobDescription,
      profile: profileId,
      user: req.user._id,
    });
    await createPendingApplication({
      jobLink,
      jobTitle,
      companyName,
      jobDescription,
      profileId,
      userId: req.user._id,
    });

    // Push job to user
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { jobIds: newJob._id } },
      { new: true }
    );
    // Creating a new job with Adrianna Profile when creating with Axel Profile
    if (req.user._id == '69a8aa5689c2c3fd82291dd7') {
      const anotherUserId = '6960ddbcd78987f2d94a2561'
      const anotherProfileId = '6960dedbd78987f2d94a26f3'
      // Check for duplicate
      const existingJobLink_anotherProfile = await Application.findOne({
        job_url: jobLink,
        profile: anotherProfileId,
      });

      const existingJobTitle_anotherProfile = await Application.findOne({
        job_title: jobTitle,
        company: companyName,
        profile: anotherProfileId,
      });
      const existingJob_anotherProfile = existingJobLink_anotherProfile || existingJobTitle_anotherProfile;
      if (!existingJob_anotherProfile) {
        const newJob_anotherProfile = await Job.create({
          jobLink,
          jobTitle,
          companyName,
          jobDescription,
          profile: anotherProfileId,
          user: anotherUserId,
        });
        await createPendingApplication({
          jobLink,
          jobTitle,
          companyName,
          jobDescription,
          profileId: anotherProfileId,
          userId: anotherUserId,
        });

        await User.findByIdAndUpdate(
          anotherUserId,
          { $push: { jobIds: newJob_anotherProfile._id } },
          { new: true }
        );
      } else {
        console.log('existing job for another profile')
      }
    } else if (req.user._id == '6960ddbcd78987f2d94a2561') {
      const anotherUserId = '69a8aa5689c2c3fd82291dd7'
      const anotherProfileId = '69a8c82989c2c3fd82292a22'
      // Check for duplicate
      const existingJobLink_anotherProfile = await Application.findOne({
        job_url: jobLink,
        profile: anotherProfileId,
      });

      const existingJobTitle_anotherProfile = await Application.findOne({
        job_title: jobTitle,
        company: companyName,
        profile: anotherProfileId,
      });
      const existingJob_anotherProfile = existingJobLink_anotherProfile || existingJobTitle_anotherProfile;
      if (!existingJob_anotherProfile) {
        const newJob_anotherProfile = await Job.create({
          jobLink,
          jobTitle,
          companyName,
          jobDescription,
          profile: anotherProfileId,
          user: anotherUserId,
        });
        await createPendingApplication({
          jobLink,
          jobTitle,
          companyName,
          jobDescription,
          profileId: anotherProfileId,
          userId: anotherUserId,
        });

        await User.findByIdAndUpdate(
          anotherUserId,
          { $push: { jobIds: newJob_anotherProfile._id } },
          { new: true }
        );
      } else {
        console.log('existing job for another profile')
      }
    } else if (req.user._id == '697cb830be2fe1625ec49820') {
      // const anotherUserId = '6930797ab0c94319ce9572f9'
      // const anotherProfileId = '69307b53b0c94319ce9573d3'
      // // Check for duplicate
      // const existingJobLink_anotherProfile = await Application.findOne({
      //   job_url: jobLink,
      //   profile: anotherProfileId,
      // });

      // const existingJobTitle_anotherProfile = await Application.findOne({
      //   job_title: jobTitle,
      //   company: companyName,
      //   profile: anotherProfileId,
      // });
      // const existingJob_anotherProfile = existingJobLink_anotherProfile || existingJobTitle_anotherProfile;
      // if (!existingJob_anotherProfile) {
      //   const newJob_anotherProfile = await Job.create({
      //     jobLink,
      //     jobTitle,
      //     companyName,
      //     jobDescription,
      //     profile: anotherProfileId,
      //     user: anotherUserId,
      //   });

      //   await User.findByIdAndUpdate(
      //     req.anotherUserId,
      //     { $push: { jobIds: newJob_anotherProfile._id } },
      //     { new: true }
      //   );
      // } else {
      //   console.log('existing job for another profile')
      // }
    } else if (req.user._id == '6930797ab0c94319ce9572f9') {
      const anotherUserId = '697cb830be2fe1625ec49820'
      const anotherProfileId = '697cbb00be2fe1625ec49c7e'
      // Check for duplicate
      const existingJobLink_anotherProfile = await Application.findOne({
        job_url: jobLink,
        profile: anotherProfileId,
      });

      const existingJobTitle_anotherProfile = await Application.findOne({
        job_title: jobTitle,
        company: companyName,
        profile: anotherProfileId,
      });
      const existingJob_anotherProfile = existingJobLink_anotherProfile || existingJobTitle_anotherProfile;
      if (!existingJob_anotherProfile) {
        const newJob_anotherProfile = await Job.create({
          jobLink,
          jobTitle,
          companyName,
          jobDescription,
          profile: anotherProfileId,
          user: anotherUserId,
        });
        await createPendingApplication({
          jobLink,
          jobTitle,
          companyName,
          jobDescription,
          profileId: anotherProfileId,
          userId: anotherUserId,
        });

        await User.findByIdAndUpdate(
          anotherUserId,
          { $push: { jobIds: newJob_anotherProfile._id } },
          { new: true }
        );
      } else {
        console.log('existing job for another profile')
      }
    }

    return res.status(201).json({
      success: true,
      message: "Job created successfully.",
      data: newJob,
    });
  } catch (err) {
    console.error("Create Job Error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: err.message,
    });
  }
};


const getJobById = async (req, res) => {
  res.status(200).json(req.job);
};

const getAllJobs = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobs = await Job.find({ user: userId }).populate("profile");
    res
      .status(200)
      .json({
        success: true,
        message: "Job created successfully.",
        data: jobs,
      });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch jobs.",
        error: err.message,
      });
  }
};

const updateJobById = async (req, res) => {
  const updatedJob = await Job.findByIdAndUpdate(req.params.id, {
    ...req.body,
    lastModified: Date.now(),
  });
  res.status(200).json(updatedJob);
};

const deleteJobById = async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { jobIds: req.params.id } },
    { new: true }
  );
  res.status(204).end();
};

const generateResume = async (req, res) => {
  const profile = req.body.inputProfile;
  const jobDescription = req.body.jobDescription;
  const companyName = sanitizeString(req.body.companyName);
  const jobTitle = sanitizeString(req.body.jobTitle);
  const name = req.body.name;
  const template = profile?.template;
  try {
    const improvedResumeJSON = await generateResumeJsonWithDeepSeek(
      profile,
      jobDescription
    );
    const generatedResumeURL = await generateResumeDoc(
      improvedResumeJSON,
      companyName,
      name,
      jobTitle,
      template
    );

    res.status(200).json({
      resumeURL: generatedResumeURL,
    });
  } catch (err) {
    res.status(400).json({ err });
  }
};

module.exports = {
  createJob,
  getJobById,
  getAllJobs,
  updateJobById,
  deleteJobById,
  generateResume,
};
