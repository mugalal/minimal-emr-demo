# Security Notes

## Purpose

This repository is an educational and portfolio project. It is not intended for real clinical use.

## Data Privacy

- All included records are demo data only
- No real patient data or protected health information should be stored in this repository
- The project models healthcare concepts, but it is not HIPAA-compliant software

## Credential Handling

Do not publish any of the following:

- Supabase personal access tokens
- Supabase service role keys
- PostgreSQL connection strings with credentials
- MongoDB Atlas usernames with passwords
- `.env` files or secret config files

This repository is configured so that `.env` stays local and is not committed by default.

## Before Publishing Publicly

1. Rotate any credentials that were used during development
2. Confirm `.env` is not staged for commit
3. Confirm no secrets appear in screenshots, terminal history, or copied snippets
4. Make sure only fake data is present in the repository

## Recommended Practice

- keep local credentials in untracked files only
- use `config.example.js` or `.env.example` style files for documentation
- prefer temporary demo credentials that can be revoked after recording or submission

## Scope Warning

This project demonstrates data modeling and query design. It does not include:

- production authentication and authorization
- encryption and secret management strategy
- audit-grade healthcare security controls
- backup, retention, or disaster recovery policy
