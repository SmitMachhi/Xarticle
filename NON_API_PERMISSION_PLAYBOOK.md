# Non-API Permission Playbook (X Platform)

This guide is a generic step-by-step process for requesting a separate written agreement that allows non-API access patterns.

It is an operational checklist, not legal advice.

## 1. Define the Request Scope Before Contacting X

Write a one-page scope summary with:

- Access method: non-API retrieval path (describe technically, no marketing language).
- Data classes: posts, threads, images, metadata, and any derived artifacts.
- Product surface: personal use, team/internal use, or public service.
- Geography: where the service is offered and where data is processed.
- Storage: retention windows, cache TTL, backup policy.
- Redistribution: what users can download/export and in what formats.
- Safety controls: abuse prevention, rate limits, takedown handling.

Do not contact policy teams until this scope is stable.

## 2. Build a Compliance Packet

Prepare documents you can attach to support tickets or legal review:

- Architecture diagram (request flow, storage locations, deletion path).
- Data lifecycle table (collect, transform, store, delete).
- Security baseline (auth model, secret handling, audit logs).
- Takedown SOP (intake channel, triage target, removal SLA).
- Incident SOP (abuse spikes, misuse response, legal escalation).

Keep this packet versioned so updates are trackable.

## 3. Open the Official Intake Channels

Start with official X entry points:

- Developer access onboarding: `https://docs.x.com/x-api/getting-started/getting-access`
- Policy support: `https://developer.x.com/en/support/twitter-api/policy`
- Enterprise request form: `https://docs.x.com/enterprise/forms/enterprise-api-interest`

Submit the same scope summary in each relevant channel to avoid conflicting narratives.

## 4. Ask for Explicit Written Authorization Language

Request written approval that explicitly confirms all of the following:

1. Non-API retrieval is permitted for your described use case.
2. Specific data types are permitted (list them).
3. Caching/storage/retention terms are permitted (with durations).
4. Export/redistribution permissions are permitted (formats and limits).
5. Public product usage is permitted (if applicable).
6. Commercial usage terms are permitted (if applicable).
7. Takedown/deletion obligations and SLA expectations are defined.
8. Any territorial/legal constraints are defined.

If any item is missing, treat approval as incomplete.

## 5. Use a Scope Matrix in Writing

Include a matrix in your request and ask X to approve line-by-line.

Example structure:

- Activity: retrieve content via non-API method.
- Data: post text, media URLs, author metadata.
- Storage: cached for N days.
- Output: downloadable JSON/Markdown/PDF.
- Audience: end users / internal analysts.
- Status: requested approval.

This reduces ambiguity during legal review.

## 6. Require Contract-Level Confirmation

Do not rely on informal responses alone.

Acceptable forms:

- Signed agreement/addendum.
- Order form + governing agreement that explicitly references non-API access.
- Written legal approval from an official X channel that clearly grants the requested scope.

Unsupported forms:

- Forum replies.
- Generic support acknowledgments.
- Silence/no response.

## 7. Negotiate Operational Terms Up Front

Before launch, settle these terms explicitly:

- Rate/volume caps and burst behavior.
- Monitoring/reporting obligations.
- Allowed automation behavior.
- Data deletion timelines.
- Suspension/remediation process.
- Change-notice expectations if platform rules change.

Capture these in the agreement or incorporated policy terms.

## 8. Add Internal Go/No-Go Gates

Set mandatory launch gates:

1. Written approval received.
2. Scope in approval matches your actual implementation.
3. Security/takedown controls implemented and tested.
4. Audit trail for retrieval, export, and deletion events enabled.
5. Incident owner and legal escalation owner assigned.

If any gate fails, do not launch.

## 9. Plan for Renewal and Drift

Create recurring checks:

- Quarterly legal/policy review.
- Monthly platform behavior review.
- Immediate review on policy updates or enforcement notices.

If your product scope changes, re-request approval before shipping changes.

## 10. Keep an Evidence Log

Maintain a single folder (or tracker) containing:

- Submitted forms and ticket IDs.
- All correspondence timestamps.
- Approved scope versions.
- Signed agreements and amendments.
- Internal compliance check records.

This is critical if enforcement or disputes occur later.

## Suggested Initial Outreach Template

Use this as a neutral starter:

```text
Subject: Request for written authorization for non-API content access use case

Hello X Policy/Legal Team,

We are requesting written authorization for a non-API access implementation.
Attached are:
- use case scope summary
- architecture/data lifecycle overview
- security and takedown controls
- requested permissions matrix

Please confirm in writing whether this use case is permitted, including:
1) retrieval method authorization
2) allowed data classes
3) storage/retention terms
4) redistribution/export permissions
5) operational limits and compliance obligations

If this requires a specific agreement or addendum, please provide the next steps.
Thank you.
```

## Practical Decision Rule

Proceed only when you have explicit written approval that covers your exact behavior.  
If approval is partial or ambiguous, treat the non-API path as not approved.
