const emr = db.getSiblingDB("minimal_emr");

print("\n1. Patient summary by MRN\n");
printjson(
  emr.patients.findOne(
    { mrn: "MRN-000001" },
    {
      _id: 1,
      mrn: 1,
      firstName: 1,
      lastName: 1,
      dateOfBirth: 1,
      sex: 1,
      allergies: 1,
    }
  )
);

print("\n2. Encounter timeline for MRN-000001\n");
const patient = emr.patients.findOne({ mrn: "MRN-000001" }, { _id: 1 });

if (patient) {
  printjson(
    emr.encounters
      .aggregate([
        { $match: { patientId: patient._id } },
        {
          $project: {
            encounterDate: 1,
            encounterType: 1,
            chiefComplaint: 1,
            diagnoses: "$diagnoses.name",
            medicationCount: { $size: "$medications" },
          },
        },
        { $sort: { encounterDate: -1 } },
      ])
      .toArray()
  );
}

print("\n3. Abnormal lab results with patient names\n");
printjson(
  emr.lab_orders
    .aggregate([
      { $unwind: "$results" },
      {
        $match: {
          "results.abnormalFlag": { $in: ["abnormal", "low", "high", "critical"] },
        },
      },
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },
      {
        $project: {
          testName: 1,
          resultName: "$results.resultName",
          resultValue: "$results.resultValue",
          unit: "$results.unit",
          abnormalFlag: "$results.abnormalFlag",
          resultedAt: "$results.resultedAt",
          patientMrn: "$patient.mrn",
          patientName: {
            $concat: ["$patient.firstName", " ", "$patient.lastName"],
          },
        },
      },
      { $sort: { resultedAt: -1 } },
    ])
    .toArray()
);

print("\n4. Scheduled appointments with doctor and patient names\n");
printjson(
  emr.appointments
    .aggregate([
      { $match: { status: "scheduled" } },
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$patient" },
      { $unwind: "$doctor" },
      {
        $project: {
          scheduledStart: 1,
          scheduledEnd: 1,
          status: 1,
          reason: 1,
          patientName: {
            $concat: ["$patient.firstName", " ", "$patient.lastName"],
          },
          doctorName: {
            $concat: ["Dr. ", "$doctor.firstName", " ", "$doctor.lastName"],
          },
        },
      },
      { $sort: { scheduledStart: 1 } },
    ])
    .toArray()
);

print("\n5. Diagnosis count by doctor\n");
printjson(
  emr.encounters
    .aggregate([
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $project: {
          doctorName: {
            $concat: ["Dr. ", "$doctor.firstName", " ", "$doctor.lastName"],
          },
          diagnosisCount: { $size: "$diagnoses" },
        },
      },
      {
        $group: {
          _id: "$doctorName",
          diagnosisCount: { $sum: "$diagnosisCount" },
          encounterCount: { $sum: 1 },
        },
      },
      { $sort: { diagnosisCount: -1, _id: 1 } },
    ])
    .toArray()
);
