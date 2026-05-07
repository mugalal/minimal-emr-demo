# Architecture Notes

## Goal

This project demonstrates how the same healthcare domain can be modeled in both a relational database and a document database while preserving the same core business meaning.

## Runtime Application Architecture

The repository now includes a real application layer in addition to the database assets.

- the frontend is a browser-based clinical workspace
- the backend is an Express API that aggregates patient chart data
- Supabase / PostgreSQL is the live runtime store for the app
- MongoDB remains a parallel implementation for document modeling and query comparison

This keeps the project meaningful on GitHub because it is no longer just a schema submission. It becomes a full-stack demo built on top of the database design.

## Domain Scope

The system is intentionally minimal, but it still reflects common EMR concepts:

- patients
- doctors
- appointments
- encounters
- diagnoses
- medications
- allergies
- vitals
- lab orders and lab results
- application users
- audit logs

## Why PostgreSQL Is Normalized

The PostgreSQL version is designed as the structured system of record.

Reasons for normalization:

- avoids duplicated clinical facts
- preserves clear foreign key relationships
- supports reporting and joins cleanly
- enforces integrity with constraints and unique keys
- better represents traditional EMR back-office data design

Examples:

- `appointments` and `encounters` are separate because scheduling and clinical documentation are different workflows
- `lab_orders` and `lab_results` are separate because one order can produce multiple result rows
- `vitals` are isolated to keep encounter documentation structured and queryable

## Why MongoDB Uses Embedding

The MongoDB version is designed around read-friendly clinical views.

Embedding choices:

- allergies are embedded in `patients` because they are commonly read together
- diagnoses, vitals, and medications are embedded in `encounters` because they describe a single visit
- lab results are embedded in `lab_orders` because they belong to one diagnostic request

This keeps common patient-chart queries simple and better reflects document-oriented access patterns.

## Main Tradeoff

The central tradeoff is structure versus read convenience.

- PostgreSQL is better for strict relationships, consistency, and relational reporting
- MongoDB is better for packaging patient data into fewer reads for chart-style workflows

The project intentionally includes both to show that the same business domain can require different storage strategies depending on access patterns.

## Query Strategy

The included query files focus on reviewer-friendly, realistic outputs rather than abstract examples.

Examples include:

- timeline views
- active medication lists
- abnormal lab result filtering
- scheduled appointments
- diagnosis summaries by doctor
- audit activity

## Frontend Role

The frontend is not meant to be a full product UI. It exists to prove that the relational data model can power a simple chart-like interface with:

- patient switching
- summary cards
- encounter timeline
- medications
- lab results
- scheduled appointments

## Portfolio Value

This project is strong for GitHub because it demonstrates several useful engineering skills together:

- schema design
- data modeling tradeoffs
- SQL and Mongo query writing
- hosted database setup
- basic frontend data consumption
- documentation quality
