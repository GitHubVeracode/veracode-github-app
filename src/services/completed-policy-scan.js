const { updateChecksForCompletedSastScan } = require('../services/check-services/update-checks-with-artifact');

async function updateChecksForCompletedPolicyScan(run, context) {
  const policyScanConfig = {
    artifactName: 'policy-flaws',
    findingFileName: 'policy_flaws.json',
    resultsUrlFileName: 'results_url.txt',
    title: 'Veracode Static Analysis',
    getAnnotations: function (json) {
      let annotations = []
      if (json && json._embedded && json._embedded.findings) {
        json._embedded.findings.forEach(finding => {
          const displayMessage = finding.description.replace(/\<span\>/g, '').replace(/\<\/span\> /g, '\n').replace(/\<\/span\>/g, '');
          const message = `Filename: ${finding.finding_details.file_path}\nLine: ${finding.finding_details.file_line_number}\nCWE: ${finding.finding_details.cwe.id} (${finding.finding_details.cwe.name})\n\n${displayMessage}`;
          annotations.push({
            path: `src/main/java/${finding.finding_details.file_path}`,
            start_line: finding.finding_details.file_line_number,
            end_line: finding.finding_details.file_line_number,
            annotation_level: "warning",
            title: finding.finding_details.cwe.name,
            'message': message
          });
        });
      }
      return annotations;
    }
  }
  await updateChecksForCompletedSastScan(run, context, policyScanConfig);
}

module.exports = {
  updateChecksForCompletedPolicyScan,
}