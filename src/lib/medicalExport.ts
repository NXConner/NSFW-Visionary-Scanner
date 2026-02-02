import type { ScanEntry, DiaryEntry } from "@/contexts/DataContext";

// Enhanced HL7 FHIR R4 compatible export format
export const generateHL7FHIR = (scans: ScanEntry[], diaryEntries: DiaryEntry[]): string => {
  const bundleId = `bundle-${Date.now().toString(36)}`;
  const organizationId = "org-morphoscan-pro";

  const bundle = {
    resourceType: "Bundle",
    id: bundleId,
    meta: {
      lastUpdated: new Date().toISOString(),
      profile: ["http://hl7.org/fhir/StructureDefinition/Bundle"],
    },
    identifier: {
      system: "urn:morphoscan:bundle",
      value: bundleId,
    },
    type: "collection",
    timestamp: new Date().toISOString(),
    total: scans.length + diaryEntries.length + 2,
    entry: [
      // Organization resource
      {
        fullUrl: `urn:uuid:${organizationId}`,
        resource: {
          resourceType: "Organization",
          id: organizationId,
          meta: {
            profile: ["http://hl7.org/fhir/StructureDefinition/Organization"],
          },
          active: true,
          name: "MorphoScan Pro Self-Assessment",
          type: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/organization-type",
                  code: "other",
                  display: "Other",
                },
              ],
            },
          ],
        },
      },
      // Patient resource (anonymized)
      {
        resource: {
          resourceType: "Patient",
          id: "patient-self",
          meta: {
            profile: ["http://hl7.org/fhir/StructureDefinition/Patient"],
          },
          identifier: [
            {
              system: "urn:morphoscan:local",
              value: "self-assessment-patient",
            },
          ],
          active: true,
        },
      },
      // Observations from scans
      ...scans.map((scan, index) => ({
        resource: {
          resourceType: "Observation",
          id: `observation-scan-${index}`,
          meta: {
            profile: ["http://hl7.org/fhir/StructureDefinition/Observation"],
          },
          status: "final",
          category: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "exam",
                  display: "Exam",
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8302-2",
                display: "Body measurement",
              },
            ],
            text: `Morphology Scan - ${scan.scan_type.toUpperCase()}`,
          },
          subject: { reference: "Patient/patient-self" },
          effectiveDateTime: scan.created_at,
          component: [
            scan.length && {
              code: {
                coding: [{ system: "http://loinc.org", code: "8302-2", display: "Length" }],
                text: "Length",
              },
              valueQuantity: {
                value: scan.length,
                unit: "cm",
                system: "http://unitsofmeasure.org",
                code: "cm",
              },
            },
            scan.circumference && {
              code: {
                coding: [{ system: "http://loinc.org", code: "8281-8", display: "Circumference" }],
                text: "Circumference",
              },
              valueQuantity: {
                value: scan.circumference,
                unit: "cm",
                system: "http://unitsofmeasure.org",
                code: "cm",
              },
            },
            scan.curvature_angle && {
              code: {
                coding: [
                  {
                    system: "http://snomed.info/sct",
                    code: "246223004",
                    display: "Curvature angle",
                  },
                ],
                text: "Curvature Angle",
              },
              valueQuantity: {
                value: scan.curvature_angle,
                unit: "degrees",
                system: "http://unitsofmeasure.org",
                code: "deg",
              },
            },
            scan.curvature_direction && {
              code: {
                coding: [
                  { system: "http://snomed.info/sct", code: "246267002", display: "Direction" },
                ],
                text: "Curvature Direction",
              },
              valueString: scan.curvature_direction,
            },
          ].filter(Boolean),
          note: scan.notes ? [{ text: scan.notes }] : undefined,
        },
      })),
      // Diary entries as observations
      ...diaryEntries.map((entry, index) => ({
        resource: {
          resourceType: "Observation",
          id: `observation-diary-${index}`,
          meta: {
            profile: ["http://hl7.org/fhir/StructureDefinition/Observation"],
          },
          status: "final",
          category: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "vital-signs",
                  display: "Vital Signs",
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8302-2",
                display: "Body measurement",
              },
            ],
            text: "Health Diary Entry",
          },
          subject: { reference: "Patient/patient-self" },
          effectiveDateTime: entry.entry_date,
          component: [
            entry.length && {
              code: { text: "Length" },
              valueQuantity: { value: entry.length, unit: "cm" },
            },
            entry.circumference && {
              code: { text: "Circumference" },
              valueQuantity: { value: entry.circumference, unit: "cm" },
            },
            entry.curvature_angle && {
              code: { text: "Curvature Angle" },
              valueQuantity: { value: entry.curvature_angle, unit: "degrees" },
            },
            entry.pain_level !== null && {
              code: {
                coding: [
                  { system: "http://snomed.info/sct", code: "225908003", display: "Pain level" },
                ],
                text: "Pain Level",
              },
              valueQuantity: { value: entry.pain_level, unit: "/10" },
            },
          ].filter(Boolean),
          note: entry.notes ? [{ text: entry.notes }] : undefined,
        },
      })),
    ],
  };

  return JSON.stringify(bundle, null, 2);
};

// CDA (Clinical Document Architecture) export
export const generateCDA = (scans: ScanEntry[], diaryEntries: DiaryEntry[]): string => {
  const date = new Date().toISOString();
  const latestScan = scans[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <id root="2.16.840.1.113883.19.5" extension="${Date.now()}"/>
  <code code="34117-2" codeSystem="2.16.840.1.113883.6.1" displayName="History and physical note"/>
  <title>MorphoScan Health Assessment Report</title>
  <effectiveTime value="${date.replace(/[-:]/g, "").split(".")[0]}"/>
  <confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>
  <languageCode code="en-US"/>
  
  <component>
    <structuredBody>
      <component>
        <section>
          <title>Assessment Summary</title>
          <text>
            <paragraph>Report generated: ${new Date().toLocaleDateString()}</paragraph>
            <paragraph>Total scans recorded: ${scans.length}</paragraph>
            <paragraph>Diary entries: ${diaryEntries.length}</paragraph>
            ${
              latestScan
                ? `
            <paragraph>Latest measurements:</paragraph>
            <list>
              ${latestScan.length ? `<item>Length: ${latestScan.length} cm</item>` : ""}
              ${latestScan.circumference ? `<item>Circumference: ${latestScan.circumference} cm</item>` : ""}
              ${latestScan.curvature_angle ? `<item>Curvature: ${latestScan.curvature_angle}° ${latestScan.curvature_direction || ""}</item>` : ""}
            </list>`
                : ""
            }
          </text>
        </section>
      </component>
      
      <component>
        <section>
          <title>Scan History</title>
          <text>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Length</th>
                  <th>Circumference</th>
                  <th>Curvature</th>
                </tr>
              </thead>
              <tbody>
                ${scans
                  .slice(0, 20)
                  .map(
                    scan => `
                <tr>
                  <td>${new Date(scan.created_at).toLocaleDateString()}</td>
                  <td>${scan.scan_type.toUpperCase()}</td>
                  <td>${scan.length || "-"} cm</td>
                  <td>${scan.circumference || "-"} cm</td>
                  <td>${scan.curvature_angle || "-"}°</td>
                </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </text>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`;
};

export const downloadMedicalFormat = (content: string, filename: string, type: "json" | "xml") => {
  const mimeType = type === "json" ? "application/json" : "application/xml";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
