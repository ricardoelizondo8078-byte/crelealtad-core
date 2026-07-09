# MVP 1.0 Technical Implementation Plan

## Objective

Deliver a functional MVP for the Documentation, Verification, and Disbursement modules using a modular architecture based on React Native, NestJS, PostgreSQL, and document storage compatible with S3.

## Scope included in MVP 1.0

### Documentation module
- Login
- Module menu
- Mis expedientes
- Crear grupo nuevo
- Iniciar renovación
- Expediente detail
- Solicitantes list
- Solicitud capture
- Document capture
- Send to verification

### Verification module
- Received expedientes
- Review solicitantes
- Approve
- Return with observations
- Reject

### Disbursement module
- Authorized expedientes
- Validate 80% condition when applicable
- Register disbursement

## Scope excluded from MVP 1.0

- Cobranza
- Mora
- Convenios
- Advanced reports
- OCR
- AI
- Executive dashboards

## Technical architecture

### Frontend
- React Native application for mobile-first workflows
- TypeScript throughout the UI layer
- Shared component library for module screens
- Navigation structure for three main modules: Documentación, Verificación, Desembolsos

### Backend
- NestJS API application
- Modular backend structure by domain area
- Authentication and authorization layer
- Workflow service layer for state transitions and module handoff
- File upload service for documents

### Data and storage
- PostgreSQL as the system of record
- Document storage compatible with S3
- Environment-based configuration for local and deployment environments

## Delivery approach

### Phase 1 — Foundation
Goal: establish the application shell and shared technical infrastructure.

#### Deliverables
- Mobile app bootstrap
- API bootstrap
- Shared configuration and environment handling
- Authentication skeleton
- Navigation shell for the three modules
- Shared design-system components for the MVP screens
- Logging and error handling baseline

#### Key technical tasks
- Create app shell and navigation structure
- Create API module structure for authentication, documents, expedientes, verification, and disbursement
- Create shared models and DTOs for the first set of requests and responses
- Configure environment variables and deployment-ready settings
- Create base repository and service patterns for the backend

### Phase 2 — Documentation module
Goal: implement the documentation journey end to end for the first set of screens.

#### Deliverables
- Login flow
- Documentation module landing screen
- Module menu and navigation entries
- Mis expedientes list screen
- Crear grupo nuevo entry flow
- Iniciar renovación entry flow
- Expediente detail screen
- Solicitantes list screen
- Solicitud capture screen
- Document capture screen
- Send-to-verification workflow entry

#### Key technical tasks
- Build mobile screens for each documentation step
- Create backend endpoints for expedientes, solicitantes, solicitudes, and document metadata
- Implement document upload handling and metadata persistence
- Create shared state and form handling for multi-step flows
- Implement screen-to-screen navigation and module handoff

### Phase 3 — Verification module
Goal: enable the operational review flow for expedientes received from documentation.

#### Deliverables
- Received expedientes list
- Solicitante review screen
- Approve action
- Return with observations action
- Reject action

#### Key technical tasks
- Build verification inbox screens
- Expose backend endpoints for review queues and review actions
- Implement status transition handling for review outcomes
- Create review note and observation handling
- Connect review actions to the shared workflow layer

### Phase 4 — Disbursement module
Goal: support authorized expediente handling and disbursement registration.

#### Deliverables
- Authorized expedientes list
- 80% condition validation step when applicable
- Disbursement registration flow

#### Key technical tasks
- Build disbursement screens for authorized expedientes
- Implement backend endpoints for authorized queue and disbursement registration
- Add conditional workflow checks for the 80% condition
- Create disbursement status handling and audit trail entry points

### Phase 5 — Hardening and release readiness
Goal: prepare the MVP for initial usage and review.

#### Deliverables
- Error handling and validation coverage for the primary flows
- Basic observability and logging
- Configuration for staging and production readiness
- Manual QA checklist for the MVP journeys
- Release notes for MVP 1.0

## Recommended module breakdown

### Mobile application
- app shell
- authentication screens
- documentation module screens
- verification module screens
- disbursement module screens
- shared UI components
- navigation and route configuration

### Backend application
- auth module
- users and roles module
- expediente module
- solicitante module
- document module
- workflow module
- verification module
- disbursement module
- shared infrastructure module

## Data concerns for MVP 1.0

The MVP should include the following persisted concepts at minimum:
- Expedientes
- Solicitantes
- Documentos
- Grupos
- Créditos
- Desembolsos
- Pagos
- Users and roles
- Workflow status and review notes

## Integration concerns

- File uploads for document capture
- Authentication and role-based routing
- Workflow handoff between Documentation, Verification, and Disbursement
- Basic audit trail for status changes and review actions

## Definition of done for MVP 1.0

The MVP is ready when:
- The Documentation flow can be completed from entry to send to verification
- The Verification flow can approve, return with observations, or reject
- The Disbursement flow can register a disbursement for an authorized expediente
- The core user journeys work end to end in a test environment
- The main modules are navigable and consistent with the approved UI patterns
- No out-of-scope modules are included in the first release
