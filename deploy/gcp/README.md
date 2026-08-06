# GCP deploy examples (prep only)

These files are **stubs**. They do not provision resources or change Vercel.

| File | Use |
|------|-----|
| [`../cloudbuild.yaml`](../../cloudbuild.yaml) | Cloud Build: Docker build → Artifact Registry → `gcloud run deploy` |
| [`cloud-run-service.yaml`](./cloud-run-service.yaml) | Example Cloud Run service shape |

Full checklist, cutover, and cost notes: [`docs/GCP-MIGRATION.md`](../../docs/GCP-MIGRATION.md).

When ready: create a GCP project and enable APIs first, then build the image from the root `Dockerfile`.
