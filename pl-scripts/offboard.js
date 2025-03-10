require('dotenv').config();
const Bottleneck = require('bottleneck');
const { removeUsersFromTeam } = require('../github');
const { removeStudentFromCohort } = require('../learn');
const { removeGroupMember } = require('../googleGroups');
const {
  loadGoogleSpreadsheet,
} = require('../googleSheets');
const {
  DOC_ID_PULSE,
  GITHUB_STUDENT_TEAM,
  LEARN_COHORT_ID,
} = require('../constants');

const rateLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500,
});
const removeStudentFromCohortRL = rateLimiter.wrap(removeStudentFromCohort);
const removeGroupMemberRL = rateLimiter.wrap(removeGroupMember);
const updateRow = (row, col, newVal) => {
  row[col] = newVal;
  return row.save();
};
const updateRowRL = rateLimiter.wrap(updateRow);

const getStudentGoogleGroup = (student) => {
  const week = Number(student.deadlineGroup[1]);
  if (student.campus.startsWith('RPT')) {
    if (week <= 2) {
      return `seip-rpt-w${week}@galvanize.com`;
    }
    return `seip.rptw${week}@galvanize.com`;
  }
  return `seipw${week}@galvanize.com`;
};

async function getStudentsToSeparate() {
  const doc = await loadGoogleSpreadsheet(DOC_ID_PULSE);
  const sheet = doc.sheetsByTitle['Separation Tracker'];
  const rows = await sheet.getRows();
  return rows.filter((student) => student.separationType !== 'TBD');
}

function updateStudentOffboardingProgress(students, col) {
  return Promise.all(students.map((student) => updateRowRL(student, col, 'Done')));
}

(async () => {
  console.info('Retrieving list of students to separate...');
  const students = await getStudentsToSeparate();
  console.info(`Offboarding ${students.length} students...`);

  const studentsToRemoveFromGitHub = students.filter(
    (student) => !student.githubTeam && student.githubHandle);
  console.info(`Removing ${studentsToRemoveFromGitHub.length} students from GitHub team...`);
  console.log(
    await removeUsersFromTeam(studentsToRemoveFromGitHub.map((student) => student.githubHandle), GITHUB_STUDENT_TEAM),
  );
  await updateStudentOffboardingProgress(studentsToRemoveFromGitHub, 'githubTeam');

  const studentsToRemoveFromLearn = students.filter(
    (student) => !student.learnCohort && student.email);
  console.info(`Removing ${studentsToRemoveFromLearn.length} students from Learn cohort...`);
  console.log(
    await Promise.all(
      studentsToRemoveFromLearn.map((student) => removeStudentFromCohortRL(LEARN_COHORT_ID, student.email)),
    ),
  );
  await updateStudentOffboardingProgress(studentsToRemoveFromLearn, 'learnCohort');
    
  const studentsToRemoveFromGoogleGroups = students.filter(
    (student) => !student.googleGroup && student.email);
  console.info(`Removing ${studentsToRemoveFromGoogleGroups.length} students from Google Groups...`);
  console.log(
    await Promise.all(
      studentsToRemoveFromGoogleGroups.map((student) => removeGroupMemberRL(
        getStudentGoogleGroup(student), student.email,
      )),
    ),
  );
  await updateStudentOffboardingProgress(studentsToRemoveFromGoogleGroups, 'googleGroup');
  await Promise.all(studentsToRemoveFromGoogleGroups.map((student) => updateRowRL(student, 'googleGroup', 'Done')));
})();
