const getPrompt = async (profile, jobDescription) => {
  const fullName = profile["fullName"] || "";
  const location = profile["location"] || "";
  const email = profile["email"] || "";
  const phone = profile["phone"] || "";
  const linkedin = profile["linkedin"] || "";
  const experiences = profile["experiences"] || [];
  const educations = profile["educations"] || [];

  const prompt = `
  You are a professional resume writer.
  Your task is to generate a **high-quality, tailored resume** in **json** based on the candidate's background and the job description provided to achieve the highest possible ATS match score, using ONLY job-relevant information.
  The resume must be **concise, impactful, and ATS-friendly**. It should highlight the candidate's relevant skills, experience, and achievements that align with the job description.
  The resume should be structured in a way that is easy to read and parse by Applicant Tracking Systems (ATS).
  👇 JOB DESCRIPTION:  
  "${jobDescription}"
  The resume must follow this exact structure (but except skills):

  ---

  {
    "contact": {
      "name": "${fullName}",
      "location": "${location}",
      "email": "${email}",
      "phone": "${phone}",
      "linkedin": "${linkedin}",
    },
    "summary": "Always generate a professional summary aligned with the job description, containing between 700 and 800 characters including spaces and line breaks, stating 9, or 9+ years of experience if unspecified, and highlighting relevant skills and achievements without using personal pronouns",
    "skills": [
      { "category1": "item1, item2,....." },
      { "category2": "item1, item2,....." },
      { "category3": "item1, item2,....." },
      { "category4": "item1, item2,....." },
      { "category5": "item1, item2,....." }
    ],
    "experiences": [
      ${experiences.map((experience) => {
    return `{
          "jobPosition": "${experience.jobTitle}",
          "workSetting": "${experience.workSetting}",
          "companyName": "${experience.companyName}",
          "companyLocation": "${experience.companyLocation}",
          "enterDate": "${experience.enterDate}",
          "endDate": "${experience.endDate}",
          "bullets": [
            {
              "content": "This is a sample sentence describing a task or achievement 1"
            },
            {
              "content": "This is a sample sentence describing a task or achievement 2"
            },
          ]
        }`;
  }).join(",")}
    ],
    "projects": [
        {
          "project_name": "This is a sample project name 1",
          "project_description": "This is a sample project description 1. This should contain about 180 words."
        },
        {
          "project_name": "This is a sample project name 2",
          "project_description": "This is a sample project description 2. This should contain about 180 words."
        }
      })}
    ],
    "certificates": [
        {
          "certificate_name": "This is a sample certificate name 1"
        },
        {
          "certificate_name": "This is a sample certificate name 2"
        },
        {
          "certificate_name": "This is a sample certificate name 3"
        },
        {
          "certificate_name": "This is a sample certificate name 4"
        }
      })}
    ],
    "educations": [
      ${educations.map((education) => {
    return `{
          "university_name": "${education.universityName}",
          "university_degree": "${education.universityDegree}",
          "university_location": "${education.universityLocation}",
          "university_from": "${education.enterDate}",
          "university_to": "${education.endDate}"
        }`
  }).join(",")}
    ]
  }

  ### 🧠 Resume Generation Instructions:
  - Tailor all resume content specifically to the provided job description using relevant skills, experiences, and keywords.
  - Use JSON format with the exact structure provided.
  - Do not use personal pronouns (e.g., "I", "me", "my").
  - Exclude any references or hobbies.
  - Create 5 to 6 skill sections with clear, Title Case names. Each section must include 3 to 10 relevant skill items. Do not use generic names like "Category1". You should leverage your technical skills to align closely with the job description.
  - Vary bullet counts per role: 10 for the most recent, 8 for the second most recent, then decrease by one for each earlier role, with a minimum of 5 bullets per role and company information. Each sentences should contain more than 55 words.
  - Don't mention the specific numbers, etc in the bullet points
  - Use the exact companyName, companyLocation, enterDate, endDate, and jobType from the provided Profile JSON data without any changes or substitutions.
  - Avoid managerial titles.
  - Do not copy or reuse any company or project names from the job description. Rewrite all content naturally and originally.
  - Never modify jobType, companyName, companyLocation, enterDate, or endDate.
  - Generate a complete and fully ATS-optimized resume following these rules.
  - If the job title involves I or II, etc, you should ignore them. For example when the job title is Software Engineer I, you should recognize it as Software Engineer.
  - Use the placeholder experience exactly as provided.
  - For each work experience entry, write detailed bullet points as single sentences over ${fullName === 'Akil Omari Batiste' ? '150' : '100'} characters; optionally include numbers or percentages to highlight achievements or improvements only when it fits naturally and boosts ATS score.

  ✅ Allowed Job Description Sections (use ONLY these or their equivalents):
     • Responsibilities / Role / Role Description / You Will
     • Requirements / Qualifications
     • Preferred Qualifications
     • Top Skills
     • Nice to Have / Bonus to Have
     • Key Activities
     • Key Success Metrics
     • Ideal Background & Expertise
     • Technologies
  ❌ Disallowed Job Description Content (DO NOT use or reference):
     • Company culture
     • Mission / Vision
     • About the company
     • Employer branding language
     • Values, DEI statements, or storytelling content
  If any JD content does not clearly define skills, responsibilities, tools, technologies, or measurable outcomes, ignore it completely.

  Interview-Only Evaluation Criteria Exclusion:
     • Some job description requirements describe how candidates will be evaluated in interviews, not resume content.
     • If a JD requirement refers to judgment, decision-making quality, prioritization ability, planning horizons (e.g., next 1–2 months), ambiguity management, ownership mentality, or “making good decisions,” treat it as interview-only evaluation criteria.
     • Do NOT reflect, paraphrase, or restate these requirements anywhere in the resume, including the Summary, Skills, or Experience sections.
     • These traits may only be implicitly demonstrated through concrete actions, delivered systems, deployed models, and measurable outcomes.
     • If a JD requirement cannot be proven through observable work or results, exclude it entirely from resume language.
  Evidence-Only Resume Rule
     • Every resume bullet must describe a concrete action taken, system built, model developed, or outcome delivered.
     • Abstract self-assessments (e.g., good judgment, strong prioritization, ownership mindset, decision quality) are prohibited unless demonstrated through tangible work outputs.
  =======================================================
  DON'T FORGET "Each sentences should contain more than 55 words regarding the each bullets in the experience fields from the first company to the last company."
  `;

  return { prompt, fullName };
};

module.exports = getPrompt;
