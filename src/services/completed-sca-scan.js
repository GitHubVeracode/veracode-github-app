const { updateChecksForCompletedSastScan } = require('../services/check-services/update-checks-with-artifact');

async function updateChecksForCompletedSCAScan (run, context) {
  const scaScanConfig = {
    artifactName: 'Veracode Agent Based SCA Results',
    findingFileName: null,
    resultsUrlFileName: 'scaResults.txt',
    title: 'Veracode Software Composition Analysis',
    getAnnotations: function(json) {
      return [];
    }
  }
  await updateChecksForCompletedSastScan(run, context, scaScanConfig);
}

module.exports = {
  updateChecksForCompletedSCAScan,
}