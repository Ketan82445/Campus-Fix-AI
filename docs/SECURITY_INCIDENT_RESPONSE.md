# Security Incident Response Plan

This document outlines the standard operating procedures for detecting, responding to, and recovering from security incidents within the CampusFix AI platform.

## 1. Incident Classification

Incidents are classified into three severity levels:
* **Low**: Minor anomalies, isolated spam, or non-sensitive data exposure (e.g., non-PII metadata).
* **Medium**: Unauthorized access to a single user account, localized service disruption, or rate limit abuse.
* **High/Critical**: System-wide compromise, database breach, unauthorized administrative access, active mass data exfiltration, or severe disruption of core services.

## 2. Response Phases

### Phase 1: Identification & Triage
* **Monitoring**: Continuously monitor server logs (Morgan), application errors (Sentry/LogRocket if implemented), and database health.
* **Alerting**: Any automated alerts regarding rapid failure spikes (e.g., 500 errors) or database connection timeouts should trigger immediate review.
* **Triage**: Determine the severity of the incident. If High/Critical, immediately activate the Incident Response Team (IRT).

### Phase 2: Containment
The immediate goal is to stop the bleeding without destroying forensic evidence.
* **API Lockdown**: If a specific endpoint is being exploited (e.g., file uploads), temporarily disable the route in the Express router and deploy.
* **Database Isolation**: In the event of a database breach, rotate all database credentials (Prisma connection strings) immediately.
* **Authentication Reset**: If JWT secrets are suspected to be compromised, rotate the `JWT_SECRET` in the environment variables and restart the backend service. This will forcefully invalidate all active user sessions, requiring everyone to log in again.
* **Network Blocking**: Block malicious IP ranges attempting DDoS or brute-force attacks via firewall rules (e.g., Cloudflare, Render IP blocking).

### Phase 3: Eradication
Remove the threat from the environment.
* **Patching**: Identify the root cause vulnerability (e.g., missing IDOR check) and deploy a hotfix.
* **Asset Cleanup**: Delete malicious files from the Supabase bucket.
* **Account Remediation**: Suspend or delete compromised user accounts.

### Phase 4: Recovery
Restore normal operations.
* **Service Restoration**: Re-enable any disabled endpoints once patched.
* **Database Restoration**: If data integrity was compromised, restore the database from the last known good backup. Verify backup integrity before restoration.
* **Monitoring Elevation**: Increase logging verbosity and closely monitor the affected systems for 48 hours to ensure the threat does not return.

### Phase 5: Lessons Learned
Within 72 hours of incident resolution, conduct a blameless post-mortem.
* **Documentation**: Update this response plan and `SECURITY_AUDIT.md` with the new vulnerability.
* **Testing**: Add automated test cases to `backend/scripts/security-audit.ts` to ensure the vulnerability is never reintroduced.

## 3. Key Contacts
* **System Administrator / DevOps**: [Contact Info]
* **Lead Backend Engineer**: [Contact Info]
* **Security Officer**: [Contact Info]
