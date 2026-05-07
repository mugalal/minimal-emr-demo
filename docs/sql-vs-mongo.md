# SQL to MongoDB Mapping

## Goal

This document explains how the normalized PostgreSQL model was translated into the MongoDB document model.

## Mapping Table

| PostgreSQL | MongoDB | Modeling Choice | Reason |
| --- | --- | --- | --- |
| `patients` | `patients` collection | top-level collection | patient chart starts from the patient record |
| `allergies` | `patients.allergies` | embedded array | allergies are usually read with the patient summary |
| `doctors` | `doctors` collection | top-level collection | reusable provider directory |
| `emr_users` | `users` collection | top-level collection | supports audit references and application roles |
| `appointments` | `appointments` collection | top-level collection | scheduling remains a separate workflow |
| `encounters` | `encounters` collection | top-level collection | each encounter is a central clinical document |
| `diagnoses` | `encounters.diagnoses` | embedded array | diagnoses belong to a single visit |
| `medications` | `encounters.medications` | embedded array | encounter-driven prescriptions are read with the visit |
| `vitals` | `encounters.vitals` | embedded object | one vital snapshot belongs to one encounter |
| `lab_orders` | `lab_orders` collection | top-level collection | orders may be queried independently across patients |
| `lab_results` | `lab_orders.results` | embedded array | result rows belong to one lab order |
| `audit_logs` | `audit_logs` collection | top-level collection | append-only access pattern and independent filtering |

## Why the Models Differ

The relational version prioritizes integrity and reporting.

- each fact has one clear table
- foreign keys enforce relationships
- constraints protect data quality
- joins support reporting and analytics

The MongoDB version prioritizes read convenience.

- common chart views need fewer lookups
- visit data stays grouped together
- patient summary data stays compact
- documents align with application read patterns

## Example Translation

### PostgreSQL

One encounter may require data from multiple tables:

- `encounters`
- `diagnoses`
- `vitals`
- `medications`

### MongoDB

The same visit is returned from one `encounters` document containing:

- encounter metadata
- diagnoses array
- vitals object
- medications array

## Tradeoff Summary

| Concern | PostgreSQL Strength | MongoDB Strength |
| --- | --- | --- |
| Data integrity | strong constraints and foreign keys | validator-based but less relational |
| Reporting | strong joins and tabular reporting | possible, but often more aggregation-heavy |
| Read convenience | may require multiple joins | fewer reads for chart-style views |
| Schema flexibility | more explicit and strict | easier to reshape documents |

## Takeaway

The two models are intentionally different because they optimize for different concerns, even though they describe the same business domain.
