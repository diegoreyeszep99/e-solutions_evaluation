# Integration Payment Service

This service validates integration access and prevents duplicate payment creation.

## Language

**Payment request**:
A request to create one payment. Retries represent the same payment only when both their identity and payment data match.
_Avoid_: Transaction, payment attempt

**Integration token**:
A short-lived credential that grants access exactly once before it expires.
_Avoid_: Session token, access token
